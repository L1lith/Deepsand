//! Docker Desktop's per-user host-file-sharing allowlist.
//!
//! On Windows with the Hyper-V backend, Docker Desktop records every host path used as a bind
//! mount in `FilesharingDirectories` inside `settings-store.json`, and never removes an entry
//! when the path disappears. Those dead entries are not Deepsand grants and not a security
//! boundary: they are Docker Desktop's own cache. They are still worth removing, because the
//! gRPC FUSE watcher walks this list and a large list makes the watcher's known hang more likely.
//!
//! This module is deliberately narrow. It reads the list, reports entries whose path no longer
//! exists, and can rewrite the file with **only those entries** removed. Every other key is
//! preserved, the original file is copied to a timestamped backup first, and the replacement is
//! written through a sibling temp file and rename. It never starts or stops Docker Desktop; the
//! caller does that around [`prune`], and must have stopped it before calling.

use serde_json::Value;
use std::io::Write as _;
use std::path::{Path, PathBuf};

use crate::{Result, SandboxError};

/// One entry in Docker Desktop's `FilesharingDirectories` list.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ShareEntry {
    /// The path exactly as Docker Desktop stored it.
    pub configured: String,
    /// Whether the path still exists on this machine.
    pub exists: bool,
}

/// What Docker Desktop's settings file currently says about host file sharing.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SharingReport {
    pub settings_path: PathBuf,
    pub shares: Vec<ShareEntry>,
}

impl SharingReport {
    pub fn configured_count(&self) -> usize {
        self.shares.len()
    }

    pub fn existing_count(&self) -> usize {
        self.shares.iter().filter(|share| share.exists).count()
    }

    pub fn missing_count(&self) -> usize {
        self.shares.iter().filter(|share| !share.exists).count()
    }

    pub fn missing(&self) -> impl Iterator<Item = &ShareEntry> {
        self.shares.iter().filter(|share| !share.exists)
    }
}

/// What a prune changed.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PruneOutcome {
    /// The copy of the original settings file, made before the rewrite.
    pub backup: PathBuf,
    /// The entries that were removed, in file order.
    pub removed: Vec<String>,
    /// The number of entries that remain.
    pub kept: usize,
}

/// The Docker Desktop settings file this platform uses.
///
/// Windows is the only platform where Docker Desktop exposes the Hyper-V host-file-sharing list
/// as a user-maintained `FilesharingDirectories` array. Refusing elsewhere is deliberate: editing
/// a file whose shape this build does not know is worse than saying the command is unsupported.
pub fn settings_path() -> Result<PathBuf> {
    if !cfg!(windows) {
        return Err(SandboxError::Other(anyhow::anyhow!(
            "Docker Desktop host file-sharing entries are only pruned on Windows"
        )));
    }
    directories::BaseDirs::new()
        .map(|bases| {
            bases
                .config_dir()
                .join("Docker")
                .join("settings-store.json")
        })
        .ok_or_else(|| {
            SandboxError::Other(anyhow::anyhow!(
                "could not resolve the Docker Desktop settings directory"
            ))
        })
}

/// Read the configured shares without changing anything.
pub fn read() -> Result<SharingReport> {
    read_from(&settings_path()?)
}

/// Read the shares from a specific settings file. Exposed for tests and for callers that already
/// resolved the path.
pub fn read_from(settings_path: &Path) -> Result<SharingReport> {
    let text = std::fs::read_to_string(settings_path).map_err(|err| {
        SandboxError::Other(anyhow::anyhow!(
            "could not read {}: {err}",
            settings_path.display()
        ))
    })?;
    let root: Value = serde_json::from_str(&text)?;
    let shares = shares_from(&root)?;
    Ok(SharingReport {
        settings_path: settings_path.to_path_buf(),
        shares,
    })
}

/// Remove only entries whose path no longer exists.
///
/// Returns `Ok(None)` when every configured path still exists, so a caller can avoid stopping
/// Docker Desktop for a no-op. The caller must have stopped Docker Desktop first; this function
/// does not check that, because it cannot do so portably.
pub fn prune(report: &SharingReport) -> Result<Option<PruneOutcome>> {
    prune_from(&report.settings_path, crate::now_ms())
}

/// Prune a specific settings file. The timestamp names the backup and is injectable so the
/// tests do not depend on the wall clock.
pub fn prune_from(settings_path: &Path, now_ms: i64) -> Result<Option<PruneOutcome>> {
    let original = std::fs::read(settings_path).map_err(|err| {
        SandboxError::Other(anyhow::anyhow!(
            "could not read {}: {err}",
            settings_path.display()
        ))
    })?;
    let mut root: Value = serde_json::from_slice(&original)?;

    let Some(configured) = root.get_mut("FilesharingDirectories") else {
        return Ok(None);
    };
    let Some(list) = configured.as_array_mut() else {
        return Err(SandboxError::Other(anyhow::anyhow!(
            "{}: FilesharingDirectories is not an array; refusing to edit a shape this build does not know",
            settings_path.display()
        )));
    };

    // Refuse a list with a non-string entry before touching the file. Docker Desktop writes
    // strings; a different shape means a version we do not understand.
    if list.iter().any(|entry| !entry.is_string()) {
        return Err(SandboxError::Other(anyhow::anyhow!(
            "{}: FilesharingDirectories contains a non-string entry; refusing to edit it",
            settings_path.display()
        )));
    }

    let mut removed = Vec::new();
    list.retain(|entry| {
        // The check above proved every entry is a string.
        let configured = entry.as_str().expect("checked above");
        if expand_home(configured).exists() {
            true
        } else {
            removed.push(configured.to_string());
            false
        }
    });

    if removed.is_empty() {
        return Ok(None);
    }

    let kept = list.len();
    let backup = backup_path(settings_path, now_ms)?;
    std::fs::copy(settings_path, &backup).map_err(|err| {
        SandboxError::Other(anyhow::anyhow!(
            "could not back up {} to {}: {err}",
            settings_path.display(),
            backup.display()
        ))
    })?;

    let mut bytes = serde_json::to_vec_pretty(&root)?;
    bytes.push(b'\n');
    write_bytes_atomically(settings_path, &bytes)?;

    Ok(Some(PruneOutcome {
        backup,
        removed,
        kept,
    }))
}

/// Put a backup back in place. Used when Docker Desktop does not come back after a prune.
pub fn restore(backup: &Path, settings_path: &Path) -> Result<()> {
    let bytes = std::fs::read(backup).map_err(|err| {
        SandboxError::Other(anyhow::anyhow!(
            "could not read the backup {}: {err}",
            backup.display()
        ))
    })?;
    write_bytes_atomically(settings_path, &bytes)
}

fn shares_from(root: &Value) -> Result<Vec<ShareEntry>> {
    let Some(value) = root.get("FilesharingDirectories") else {
        return Ok(Vec::new());
    };
    let list = value.as_array().ok_or_else(|| {
        SandboxError::Other(anyhow::anyhow!(
            "FilesharingDirectories is not an array; refusing to interpret it"
        ))
    })?;

    let mut shares = Vec::with_capacity(list.len());
    for entry in list {
        let configured = entry.as_str().ok_or_else(|| {
            SandboxError::Other(anyhow::anyhow!(
                "FilesharingDirectories contains a non-string entry; refusing to interpret it"
            ))
        })?;
        shares.push(ShareEntry {
            configured: configured.to_string(),
            exists: expand_home(configured).exists(),
        });
    }
    Ok(shares)
}

/// Docker Desktop writes absolute paths in the settings file. The settings API also uses a
/// `<HOME>` placeholder, so accept that spelling too in case a future version persists it.
fn expand_home(configured: &str) -> PathBuf {
    if let Some(rest) = configured.strip_prefix("<HOME>") {
        let home = directories::BaseDirs::new()
            .map(|bases| bases.home_dir().to_path_buf())
            .unwrap_or_else(|| PathBuf::from("."));
        return home.join(rest.trim_start_matches(['\\', '/']));
    }
    PathBuf::from(configured)
}

fn backup_path(settings_path: &Path, now_ms: i64) -> Result<PathBuf> {
    let name = settings_path
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| {
            SandboxError::Other(anyhow::anyhow!(
                "{} does not have a usable file name",
                settings_path.display()
            ))
        })?;

    let mut candidate = settings_path.with_file_name(format!("{name}.deepsand-backup-{now_ms}"));
    let mut suffix = 1;
    while candidate.exists() {
        candidate =
            settings_path.with_file_name(format!("{name}.deepsand-backup-{now_ms}-{suffix}"));
        suffix += 1;
    }
    Ok(candidate)
}

fn write_bytes_atomically(path: &Path, bytes: &[u8]) -> Result<()> {
    let name = path
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| {
            SandboxError::Other(anyhow::anyhow!(
                "{} does not have a usable file name",
                path.display()
            ))
        })?;
    let parent = path.parent().ok_or_else(|| {
        SandboxError::Other(anyhow::anyhow!(
            "{} does not have a parent directory",
            path.display()
        ))
    })?;
    let temporary = parent.join(format!(".{name}.deepsand-tmp"));

    {
        let mut file = std::fs::File::create(&temporary).map_err(|err| {
            SandboxError::Other(anyhow::anyhow!(
                "could not create {}: {err}",
                temporary.display()
            ))
        })?;
        file.write_all(bytes)?;
        file.sync_all()?;
    }

    if let Err(err) = std::fs::rename(&temporary, path) {
        let _ = std::fs::remove_file(&temporary);
        return Err(SandboxError::Other(anyhow::anyhow!(
            "could not replace {}: {err}",
            path.display()
        )));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "deepsand-docker-shares-{name}-{}",
            uuid::Uuid::new_v4()
        ));
        std::fs::create_dir_all(&dir).expect("create test directory");
        dir
    }

    fn write_settings(dir: &Path, shares: &[String]) -> PathBuf {
        let path = dir.join("settings-store.json");
        let document = json!({
            "FilesharingDirectories": shares,
            "SettingsVersion": 46,
            "SomethingElse": { "keep": true }
        });
        std::fs::write(&path, serde_json::to_vec_pretty(&document).unwrap()).unwrap();
        path
    }

    #[test]
    fn a_share_is_stale_only_when_its_path_is_gone() {
        let dir = temp_dir("missing");
        let existing_dir = dir.join("project");
        std::fs::create_dir_all(&existing_dir).unwrap();
        let existing_file = dir.join("AGENTS.md");
        std::fs::write(&existing_file, b"keep me").unwrap();
        let missing = dir.join("deleted-project");
        let settings = write_settings(
            &dir,
            &[
                existing_dir.to_string_lossy().into_owned(),
                existing_file.to_string_lossy().into_owned(),
                missing.to_string_lossy().into_owned(),
            ],
        );

        let report = read_from(&settings).unwrap();
        assert_eq!(report.configured_count(), 3);
        assert_eq!(report.existing_count(), 2);
        assert_eq!(report.missing_count(), 1);
        assert_eq!(
            report.missing().next().unwrap().configured,
            missing.to_string_lossy()
        );

        std::fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn pruning_removes_only_missing_shares_and_preserves_every_other_key() {
        let dir = temp_dir("prune");
        let existing = dir.join("project");
        std::fs::create_dir_all(&existing).unwrap();
        let missing = dir.join("deleted-project");
        let settings = write_settings(
            &dir,
            &[
                existing.to_string_lossy().into_owned(),
                missing.to_string_lossy().into_owned(),
            ],
        );
        let original = std::fs::read(&settings).unwrap();

        let outcome = prune_from(&settings, 1_000).unwrap().expect("a prune");
        assert_eq!(outcome.removed, vec![missing.to_string_lossy().to_string()]);
        assert_eq!(outcome.kept, 1);
        assert_eq!(std::fs::read(&outcome.backup).unwrap(), original);
        assert_eq!(
            outcome.backup.file_name().unwrap().to_string_lossy(),
            "settings-store.json.deepsand-backup-1000"
        );

        let rewritten: Value = serde_json::from_slice(&std::fs::read(&settings).unwrap()).unwrap();
        let shares = rewritten["FilesharingDirectories"].as_array().unwrap();
        assert_eq!(shares.len(), 1);
        assert_eq!(shares[0].as_str().unwrap(), existing.to_string_lossy());
        assert_eq!(rewritten["SettingsVersion"], json!(46));
        assert_eq!(rewritten["SomethingElse"]["keep"], json!(true));

        std::fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn a_prune_with_nothing_stale_writes_nothing() {
        let dir = temp_dir("noop");
        let existing = dir.join("project");
        std::fs::create_dir_all(&existing).unwrap();
        let settings = write_settings(&dir, &[existing.to_string_lossy().into_owned()]);
        let original = std::fs::read(&settings).unwrap();

        assert!(prune_from(&settings, 2_000).unwrap().is_none());
        assert_eq!(std::fs::read(&settings).unwrap(), original);
        let backups = std::fs::read_dir(&dir)
            .unwrap()
            .filter(|entry| {
                entry
                    .as_ref()
                    .map(|entry| {
                        entry
                            .file_name()
                            .to_string_lossy()
                            .contains(".deepsand-backup-")
                    })
                    .unwrap_or(false)
            })
            .count();
        assert_eq!(backups, 0);

        std::fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn a_non_string_share_entry_is_refused_without_touching_the_file() {
        let dir = temp_dir("shape");
        let settings = dir.join("settings-store.json");
        let document = json!({ "FilesharingDirectories": ["not-a-string", 7] });
        std::fs::write(&settings, serde_json::to_vec_pretty(&document).unwrap()).unwrap();
        let original = std::fs::read(&settings).unwrap();

        let err = read_from(&settings).unwrap_err().to_string();
        assert!(err.contains("non-string entry"), "{err}");
        assert!(prune_from(&settings, 3_000).is_err());
        assert_eq!(std::fs::read(&settings).unwrap(), original);

        std::fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn the_home_placeholder_is_expanded_before_the_existence_check() {
        let home = directories::BaseDirs::new()
            .unwrap()
            .home_dir()
            .to_path_buf();
        let expanded = expand_home("<HOME>\\Projects");
        assert!(expanded.starts_with(&home), "{}", expanded.display());
        assert!(expanded.ends_with("Projects"));
    }
}
