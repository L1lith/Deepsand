//! Keeping the contained DeepCode CLI current.
//!
//! The CLI is installed into the image, and an image is rebuilt when the runtime revision or a
//! project's tool selection changes -- which can be weeks apart. The CLI does not move that
//! slowly: when it ships a new version it notices, and it says so *from inside the terminal*,
//! which is the worst place to hear it. The sandbox cannot install its own update (the rootfs
//! is read-only), so the prompt is an unanswerable question, and the operator who tries to
//! answer it is the one this module exists for.
//!
//! So the version is resolved on the host, compared with the label the image was built with,
//! and the image is rebuilt when they differ -- *before* the sandbox starts, not while it runs.
//!
//! Two things keep that cheap and safe:
//!
//! * **The check is cached, like the tool cache.** `CHECK_INTERVAL` bounds how often npm is
//!   asked, so a day of Runs is one request rather than one per Run. A verdict is stored only
//!   when the registry actually answered: a check that reached nothing is not a check, and the
//!   next Run asks again instead of waiting out the interval.
//! * **An unreachable registry is not an error.** The sandbox starts on the image it has. A
//!   stale CLI is a nuisance; a sandbox that refuses to start because npm was slow is worse.

use std::path::{Path, PathBuf};

/// The npm package the image installs.
pub const CLI_PACKAGE: &str = "@vegamo/deepcode-cli";

/// The label an image carries to say which version it was built with.
///
/// The host reads this rather than running `deepcode --version` in a container: that needs a
/// container to exist, and this question is asked before there is one.
pub const CLI_VERSION_LABEL: &str = "deepsand.deepcode.version";

/// How long a resolved "latest" is trusted before the registry is asked again.
///
/// Fifteen minutes rather than the tool cache's six hours: this is read on the path that starts
/// a sandbox, where being told about a release within the same working session is the point.
/// It is still one request per quarter hour at worst, not one per Run.
pub const CHECK_INTERVAL: std::time::Duration = std::time::Duration::from_secs(15 * 60);

/// Where the resolved version and its check time are cached.
///
/// Under `buildcache/`, beside the tool cache, because it is the same kind of thing: a fact
/// about the outside world that is expensive to ask for and cheap to remember.
pub fn cache_dir(data_dir: &Path) -> PathBuf {
    data_dir.join("buildcache").join("deepcode-cli")
}

/// Where to ask npm what `latest` means for this package.
///
/// The whole packument rather than the `/latest` shortcut the tool cache uses: that shortcut is
/// unambiguous for an unscoped name and not for a scoped one, and this package name contains a
/// slash. `dist-tags.latest` is the same answer either way.
pub fn metadata_url() -> String {
    match CLI_PACKAGE.split_once('/') {
        Some((scope, name)) => format!("https://registry.npmjs.org/{scope}%2F{name}"),
        // Not a scoped name: no separator to encode.
        None => format!("https://registry.npmjs.org/{CLI_PACKAGE}"),
    }
}

/// Read `dist-tags.latest` out of the packument.
pub fn parse_latest(json: &str) -> Option<String> {
    let parsed: serde_json::Value = serde_json::from_str(json).ok()?;
    let version = parsed.get("dist-tags")?.get("latest")?.as_str()?;
    known_version(Some(version))
}

/// A version, with the spellings that mean "unknown" removed.
///
/// `latest` is what the Dockerfile defaults to when no version was resolved, and it says
/// nothing about what was installed. `<no value>` is what Docker prints for a missing label.
/// Treating either as a version would compare "latest" against "1.2.3" and call it outdated --
/// which is true, but by accident, and it would rebuild on every start of an image whose label
/// was never written.
pub fn known_version(raw: Option<&str>) -> Option<String> {
    let value = raw?.trim();
    let value = value.strip_prefix('v').unwrap_or(value);
    if value.is_empty() || value == "latest" || value == "<no value>" {
        None
    } else {
        Some(value.to_string())
    }
}

/// Whether an image built with `installed` needs rebuilding for `latest`.
///
/// An image whose label cannot be read counts as out of date. It may well be current -- it was
/// built before the label existed, or by a path that passed no version -- but "probably fine" is
/// exactly how a stale CLI is never noticed, and a rebuild we did not need costs one cached
/// layer. The other direction is never taken: without a resolved latest there is nothing to
/// compare against, so nothing is rebuilt.
pub fn needs_refresh(installed: Option<&str>, latest: Option<&str>) -> bool {
    match (known_version(installed), known_version(latest)) {
        (Some(installed), Some(latest)) => installed != latest,
        (None, Some(_)) => true,
        (_, None) => false,
    }
}

/// The version the registry last told us about, if it is still worth trusting as a *fact*.
///
/// Staleness is a separate question (`check_is_due`): this answers "what did it say", and an
/// old answer is still the best one available when the registry cannot be reached.
pub fn read_latest(dir: &Path) -> Option<String> {
    let raw = std::fs::read_to_string(dir.join("latest")).ok()?;
    known_version(Some(raw.as_str()))
}

/// Record what the registry said. Written whole and re-read by `read_latest`, so a partial
/// write reads as unknown rather than as a version.
pub fn write_latest(dir: &Path, version: &str) {
    let _ = std::fs::create_dir_all(dir);
    let staged = dir.join("latest.tmp");
    if std::fs::write(&staged, format!("{version}\n")).is_ok() {
        let _ = std::fs::rename(&staged, dir.join("latest"));
    }
}

/// Whether the registry should be asked again.
pub fn check_is_due(dir: &Path, now_ms: i64) -> bool {
    match crate::toolcache::last_checked(dir, now_ms) {
        None => true,
        Some(age) => age >= CHECK_INTERVAL,
    }
}

/// Record that an image was rebuilt for a version and *still* would not report it.
///
/// This exists for one failure mode: a label that is not written (or written as a literal
/// `$DEEPCODE_CLI_VERSION`) would make every start believe the image is out of date, so every
/// start would rebuild it -- the cheapest possible way to waste a minute of somebody's time for
/// ever. One wasted build is enough to learn the lesson; the image id is what makes the lesson
/// expire, because a new build is a new question.
pub fn mark_unverifiable(dir: &Path, image_id: &str) {
    let _ = std::fs::create_dir_all(dir);
    let _ = std::fs::write(dir.join("unverifiable"), format!("{image_id}\n"));
}

/// Whether this exact image has already been rebuilt and still could not say its version.
pub fn is_unverifiable(dir: &Path, image_id: &str) -> bool {
    std::fs::read_to_string(dir.join("unverifiable"))
        .map(|raw| raw.trim() == image_id.trim() && !image_id.trim().is_empty())
        .unwrap_or(false)
}

/// Record that the registry answered.
///
/// Called only after an answer. A request that failed leaves the marker alone, so the next Run
/// tries again rather than waiting fifteen minutes to ask a question it never got to ask.
pub fn mark_checked(dir: &Path, now_ms: i64) {
    let _ = crate::toolcache::mark_checked(dir, now_ms);
}

#[cfg(test)]
mod cli_version_tests {
    use super::*;
    use std::time::Duration;

    fn scratch(name: &str) -> PathBuf {
        let dir = std::env::temp_dir()
            .join(format!("deepsand-cli-{name}-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).expect("scratch dir");
        dir
    }

    #[test]
    fn a_matching_version_needs_no_rebuild() {
        assert!(!needs_refresh(Some("1.2.3"), Some("1.2.3")));
        // The tag and the label disagree about the `v` far more often than about the version.
        assert!(!needs_refresh(Some("v1.2.3"), Some("1.2.3")));
        assert!(!needs_refresh(Some(" 1.2.3\n"), Some("1.2.3")));
    }

    #[test]
    fn a_newer_version_asks_for_a_rebuild() {
        assert!(needs_refresh(Some("1.2.3"), Some("1.2.4")));
        assert!(needs_refresh(Some("1.2.3"), Some("2.0.0")));
    }

    /// An image built before the label existed, or by a path that passed no version, says
    /// nothing usable -- and "says nothing" must mean "rebuild", not "assume current".
    #[test]
    fn a_label_that_says_nothing_counts_as_out_of_date() {
        assert!(needs_refresh(None, Some("1.2.3")));
        assert!(needs_refresh(Some(""), Some("1.2.3")));
        assert!(needs_refresh(Some("<no value>"), Some("1.2.3")));
        assert!(needs_refresh(Some("latest"), Some("1.2.3")));
    }

    /// The other direction: with no resolved latest there is nothing to compare, so a sandbox
    /// that cannot reach npm starts on the image it has rather than rebuilding to nowhere.
    #[test]
    fn without_a_resolved_latest_nothing_is_rebuilt() {
        assert!(!needs_refresh(Some("1.2.3"), None));
        assert!(!needs_refresh(Some("1.2.3"), Some("latest")));
        assert!(!needs_refresh(None, None));
    }

    #[test]
    fn the_check_is_cached_for_its_interval_and_no_longer() {
        let dir = scratch("interval");
        let now = 1_700_000_000_000i64;
        assert!(check_is_due(&dir, now), "never checked is due");

        mark_checked(&dir, now);
        assert!(!check_is_due(&dir, now));
        assert!(!check_is_due(&dir, now + 60_000));

        let just_short = now + CHECK_INTERVAL.as_millis() as i64 - 1;
        assert!(!check_is_due(&dir, just_short), "a second early is still cached");
        assert!(check_is_due(&dir, now + CHECK_INTERVAL.as_millis() as i64));
        assert!(
            CHECK_INTERVAL <= Duration::from_secs(60 * 60),
            "the CLI moves faster than the tool cache, so this must be tighter"
        );
    }

    #[test]
    fn the_resolved_version_survives_a_reload_and_reads_back_normalised() {
        let dir = scratch("store");
        assert_eq!(read_latest(&dir), None);
        write_latest(&dir, "v1.9.0");
        assert_eq!(read_latest(&dir).as_deref(), Some("1.9.0"));

        // A torn or nonsense file is unknown, not a version.
        std::fs::write(dir.join("latest"), "latest").unwrap();
        assert_eq!(read_latest(&dir), None);
    }

    /// A build that could not make the image report its version must not be repeated on every
    /// start. The record names one image, so a different build asks again.
    #[test]
    fn an_image_that_cannot_report_its_version_is_not_rebuilt_again() {
        let dir = scratch("unverifiable");
        let first = "sha256:111111111111";
        let second = "sha256:222222222222";

        assert!(!is_unverifiable(&dir, first), "nothing recorded yet");
        mark_unverifiable(&dir, first);
        assert!(is_unverifiable(&dir, first));
        assert!(
            !is_unverifiable(&dir, second),
            "a new build is a new question, and must be asked"
        );
        assert!(!is_unverifiable(&dir, ""), "an unknown id never matches");
    }

    /// The registry answers with a packument, and only `dist-tags.latest` is the release the
    /// image should be built from -- `versions` also holds every prerelease ever published,
    /// and a "newest" taken from there would pin a beta.
    #[test]
    fn the_latest_release_is_read_from_the_dist_tags() {
        let body = r#"{
            "name": "@vegamo/deepcode-cli",
            "dist-tags": { "latest": "1.4.2", "next": "2.0.0-beta.3" },
            "versions": { "1.4.2": {}, "2.0.0-beta.3": {} }
        }"#;
        assert_eq!(parse_latest(body).as_deref(), Some("1.4.2"));

        assert_eq!(parse_latest(r#"{"dist-tags":{"next":"2.0.0-beta.3"}}"#), None);
        assert_eq!(parse_latest("not json"), None);
        assert_eq!(parse_latest(r#"{"dist-tags":{"latest":"latest"}}"#), None);
    }

    #[test]
    fn the_registry_url_encodes_the_scope_separator() {
        let url = metadata_url();
        assert!(url.ends_with("/@vegamo%2Fdeepcode-cli"), "{url}");
        assert!(!url.contains("deepcode-cli/latest"), "the packument, not the tag shortcut");
    }

    /// The package this module asks about has to be the package the image installs, and the
    /// label it reads has to be the label the image writes. Both are strings in two places, and
    /// a drift in either is silent: the version check would compare against the wrong package
    /// (or read a label that is never set) and simply never refresh anything.
    #[test]
    fn the_checked_package_and_label_are_the_ones_the_image_carries() {
        let dockerfile = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../runtime/Dockerfile");
        let text = std::fs::read_to_string(&dockerfile)
            .unwrap_or_else(|err| panic!("could not read {}: {err}", dockerfile.display()));
        assert!(
            text.contains(CLI_PACKAGE),
            "the image must install the package this module asks npm about"
        );
        assert!(
            text.contains(CLI_VERSION_LABEL),
            "the image must write the label this module reads"
        );
        assert!(
            text.contains("DEEPCODE_CLI_VERSION"),
            "and the label must come from the build argument the host passes"
        );
    }
}
