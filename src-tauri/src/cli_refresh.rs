//! Bringing the contained DeepCode CLI up to date before a sandbox starts.
//!
//! The CLI lives in the image, and the sandbox cannot update it: the rootfs is read-only and the
//! update it offers from inside the terminal is an npm install it is not allowed to perform. So
//! the only moment a new CLI can be installed is while the image is being (re)built, and the only
//! moment this app can decide to do that is *before* it starts the sandbox.
//!
//! Three rules shape this file:
//!
//! * **One resolution per start, shared by every build it causes.** The version is resolved once,
//!   then given to whichever build runs -- the first build of a missing image, or the refresh of
//!   an existing one -- so the image that comes out matches the version that was compared.
//! * **A registry that cannot be reached changes nothing.** No version, no rebuild, no error. The
//!   sandbox starts on the image it has. A stale CLI is a nuisance; refusing to start is not.
//! * **The comparison is against the image's own label**, not against the settings that asked for
//!   the build. Those can have changed since, and a label is what the image actually carries.

use std::path::Path;
use std::time::{Duration, Instant};

use deepsand_core::cli;
use deepsand_core::docker::{builds_in_flight, Docker};
use tauri::Emitter as _;

use crate::state::AppState;

/// How long a rebuild is waited for before the start goes ahead on the old image.
///
/// One layer, with npm's cache mount behind it: seconds normally, a couple of minutes on a slow
/// line. The ceiling exists so a registry that stopped answering cannot hold a Run hostage --
/// past it the sandbox starts on the image it has, which is the same answer as an unreachable
/// registry.
const REFRESH_DEADLINE: Duration = Duration::from_secs(10 * 60);

/// How long npm gets to say what `latest` means.
///
/// Short on purpose: this runs in front of a Run the operator is watching, and the answer is
/// cached for `cli::CHECK_INTERVAL` once it arrives. A registry that cannot answer in five
/// seconds is a registry that will be asked again on the next start.
const RESOLVE_TIMEOUT: Duration = Duration::from_secs(5);

/// What a refresh attempt came to.
pub enum Refresh {
    /// The image now carries the version that was asked for.
    Done,
    /// The rebuild did not leave the image at that version; the reason is for the log.
    Failed(String),
    /// A newer start or a stop took over while this one was waiting.
    Superseded,
}

/// The version to build for, resolved from npm and cached like the tool check.
///
/// `None` means "nothing was learned": the registry could not be reached. Callers then build
/// with the Dockerfile's default and skip the refresh entirely.
pub async fn latest_version(data_dir: &Path) -> Option<String> {
    let cache = cli::cache_dir(data_dir);
    let now = deepsand_core::now_ms();
    if !cli::check_is_due(&cache, now) {
        return cli::read_latest(&cache);
    }
    let fetched = fetch_latest().await;
    match fetched {
        Some(version) => {
            // Recorded only now, when the registry actually answered. A check that reached
            // nothing is not a check, so the next start asks again instead of waiting out the
            // interval.
            cli::write_latest(&cache, &version);
            cli::mark_checked(&cache, now);
            Some(version)
        }
        None => {
            tracing::debug!(
                "the npm registry could not be reached; the CLI in the image will not be refreshed"
            );
            None
        }
    }
}

/// Whether `image` needs rebuilding for `version`, and what it says it has.
///
/// The second part of the answer is for the message: "from an older build" when the label is
/// missing, which is a different sentence from "from 1.2.3".
///
/// `None` also answers for an image that has already been rebuilt and still cannot say which CLI
/// it carries. That is a label that is missing or not expanded, and rebuilding it again on every
/// single start would turn one broken string into a permanent minute-long delay.
pub fn outdated(
    docker: &Docker,
    image: &str,
    version: &str,
    data_dir: &Path,
) -> Option<Option<String>> {
    let installed = docker.image_label(image, cli::CLI_VERSION_LABEL);
    if !cli::needs_refresh(installed.as_deref(), Some(version)) {
        return None;
    }
    if let Some(id) = docker.image_id(image) {
        if cli::is_unverifiable(&cli::cache_dir(data_dir), &id) {
            tracing::warn!(
                image,
                "this image still does not report which DeepCode CLI it has; not rebuilding it again"
            );
            return None;
        }
    }
    Some(installed)
}

/// Rebuild `image` for `version` and wait for that rebuild -- not for the tag to exist.
///
/// Waiting on `image_present` would be useless here: the tag already exists (it is the old
/// image), so the answer is "yes" from the first moment and the start would race the build.
/// `builds_in_flight` is the honest question, and it is what the build itself registers.
pub async fn refresh(
    app: &tauri::AppHandle,
    state: &AppState,
    docker: &Docker,
    project_id: &str,
    image: &str,
    version: &str,
    data_dir: &Path,
    attempt: u64,
    stop_before: u64,
) -> Refresh {
    // The id before the build: comparing it afterwards is how "the build produced a new image"
    // is told apart from "the build failed and the old image is still here". Only the first of
    // those means the image genuinely cannot report its version.
    let before = docker.image_id(image);
    if let Err(err) = crate::commands::build_runtime_image_impl(
        app,
        state,
        Some(project_id.to_string()),
        None,
        false,
        Some(version.to_string()),
    ) {
        // A synchronous failure means no build thread was started, so no `BUILD_DONE` will
        // arrive. The window opened its build panel on the "Updating the CLI" line above, and a
        // panel with nothing left to close it stays open for the rest of the session -- say so
        // here, the same way the first-build path does. A build that is already running is a
        // different case: its own `BUILD_DONE` is the one that reports the outcome.
        let still_building = state
            .building
            .lock()
            .unwrap_or_else(|p| p.into_inner())
            .contains(image);
        if !still_building {
            let _ = app.emit(
                crate::state::events::BUILD_DONE,
                serde_json::json!({ "ok": false, "detail": err.clone() }),
            );
        }
        return Refresh::Failed(err);
    }

    let deadline = Instant::now() + REFRESH_DEADLINE;
    loop {
        if state.start_epoch(project_id) != attempt || state.stop_epoch(project_id) != stop_before {
            return Refresh::Superseded;
        }
        if !builds_in_flight().iter().any(|tag| tag == image) {
            break;
        }
        if Instant::now() >= deadline {
            return Refresh::Failed(format!(
                "the build of {image} was still running after {} minutes, so the sandbox was \
                 started on the CLI it already had",
                REFRESH_DEADLINE.as_secs() / 60
            ));
        }
        tokio::time::sleep(Duration::from_millis(300)).await;
    }

    match outdated(docker, image, version, data_dir) {
        None => Refresh::Done,
        Some(installed) => {
            // If the tag moved, the build did happen and the new image still will not say what it
            // has. Record that against this image id so the next start does not rebuild the same
            // thing again -- one broken label must not cost a build per Run for ever.
            let after = docker.image_id(image);
            if after != before {
                if let Some(id) = &after {
                    cli::mark_unverifiable(&cli::cache_dir(data_dir), id);
                }
            }
            Refresh::Failed(format!(
                "the image was rebuilt but its CLI is still {}, not {version}",
                installed.unwrap_or_else(|| "unknown".to_string())
            ))
        }
    }
}

/// Ask npm what `latest` means for the CLI package.
///
/// Directly awaited rather than pushed onto the blocking pool: the start path is already
/// asynchronous, and the background build that also calls this runs on a plain thread where
/// `block_on` works. Nesting the two is how `block_on` inside `spawn_blocking` becomes a panic.
async fn fetch_latest() -> Option<String> {
    let client = reqwest::Client::builder()
        .timeout(RESOLVE_TIMEOUT)
        .build()
        .ok()?;
    let response = client.get(cli::metadata_url()).send().await.ok()?;
    if !response.status().is_success() {
        return None;
    }
    let body = response.text().await.ok()?;
    cli::parse_latest(&body)
}
