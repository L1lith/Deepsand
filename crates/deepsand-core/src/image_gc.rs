//! Which of Deepsand's images may be deleted.
//!
//! Every runtime edit changes `runtime_revision`, and the image tag carries it; every tool
//! change produces a new tag too. So each build leaves the previous tag behind, and nothing
//! used to remove it. A machine that has run Deepsand for a week ends up with a dozen images of
//! three gigabytes apiece, almost all of them unusable -- the tag no longer matches what the app
//! derives, so running the project rebuilds anyway -- and none of them reachable from the UI.
//!
//! The rule here is deliberately conservative, because the action is destructive:
//!
//! * an image that is not Deepsand's is not considered at all;
//! * an image any container references -- ours or not, running or stopped -- is kept;
//! * the tag each project resolves to *right now* is kept, which is the "one per project";
//! * an image younger than [`IMAGE_GRACE_MS`] is kept, because a build may still be running;
//! * an image whose age cannot be read is kept, because unknown is not abandoned.
//!
//! Everything else is a superseded build, and it is removed by tag, never with `--force`. Docker
//! itself refuses to remove an image a container uses, but a sweep must not depend on that
//! refusal: an error the operator has to read is worse than a rule that never produces one.
//!
//! The decision is a pure function of what Docker reports, so it is testable without Docker --
//! and the tests are the security argument here, because a wrong answer removes gigabytes the
//! operator cannot get back without a rebuild.

use crate::model::{AppSettings, Project};

/// How long an image must have existed before a sweep may call it abandoned.
///
/// A build takes minutes, and a manual `npm run runtime:build` produces an image the app never
/// derives a tag for. An hour is long enough that nothing an operator started a moment ago can
/// be swept out from under them, and short enough that a superseded image does not accumulate.
pub const IMAGE_GRACE_MS: i64 = 60 * 60 * 1000;

/// The reference Docker gives an image that has no tag left.
pub const DANGLING_REFERENCE: &str = "<none>:<none>";

/// One image, as far as the cleanup cares.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ImageEntry {
    /// `repository:tag`, or [`DANGLING_REFERENCE`].
    pub reference: String,
    /// Docker's content id, `sha256:...`. The only identity a container reference can be
    /// matched against, since a container may name an image by a tag that has since moved.
    pub id: String,
    /// Docker's own size string, for the operator's report. Not used to decide anything.
    pub size: String,
    /// Creation time in milliseconds, or `None` when Docker's answer could not be read.
    pub created_ms: Option<i64>,
    /// Whether this image is Deepsand's: it carries one of our labels, or its reference is one
    /// this app derives. Decided by the gatherer, which is the only part that talks to Docker.
    pub ours: bool,
}

impl ImageEntry {
    pub fn is_dangling(&self) -> bool {
        self.reference == DANGLING_REFERENCE
    }
}

/// Why an image is being kept. A value rather than a sentence: the window and the headless
/// driver both render it, and neither should be the place this decision is explained.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Keep {
    /// Not Deepsand's. Never considered, never touched.
    NotOurs,
    /// A project resolves to this tag now.
    WantedByProject,
    /// The base tag: what `runtime/scripts/build-image.mjs` builds. Never run by a project --
    /// they all run a derived tag -- but it is a supported output of this repository and the
    /// thing an operator prebuilds, so it is not abandoned. Its layers are shared with every
    /// derived tag, so keeping it costs almost nothing.
    BaseBuild,
    /// A container references this image.
    UsedByContainer,
    /// Younger than the grace period: a build may still be using it.
    YoungerThanGrace,
    /// Docker did not say when it was made, so it is not safe to call abandoned.
    UnknownAge,
}

impl Keep {
    pub fn code(self) -> &'static str {
        match self {
            Keep::NotOurs => "not_ours",
            Keep::WantedByProject => "wanted_by_project",
            Keep::BaseBuild => "base_build",
            Keep::UsedByContainer => "used_by_container",
            Keep::YoungerThanGrace => "younger_than_grace",
            Keep::UnknownAge => "unknown_age",
        }
    }
}

/// What the sweep will do with one image.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Action {
    Remove,
    Keep(Keep),
}

/// One line of the plan.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Decision {
    pub reference: String,
    pub id: String,
    pub size: String,
    pub action: Action,
}

impl Decision {
    pub fn is_removal(&self) -> bool {
        self.action == Action::Remove
    }
}

/// What to do with each image, in the order Docker listed them (newest first).
///
/// `base` is the configured stem -- the tag `runtime/scripts/build-image.mjs` builds;
/// `wanted_tags` is the set of tags the app would name if it started every project right now;
/// `used_ids` is every image id a container in this daemon references, whoever made it.
pub fn plan(
    images: &[ImageEntry],
    base: &str,
    wanted_tags: &[String],
    used_ids: &[String],
    now_ms: i64,
    grace_ms: i64,
) -> Vec<Decision> {
    images
        .iter()
        .map(|image| {
            let action = decide(image, base, wanted_tags, used_ids, now_ms, grace_ms);
            Decision {
                reference: image.reference.clone(),
                id: image.id.clone(),
                size: image.size.clone(),
                action,
            }
        })
        .collect()
}

fn decide(
    image: &ImageEntry,
    base: &str,
    wanted_tags: &[String],
    used_ids: &[String],
    now_ms: i64,
    grace_ms: i64,
) -> Action {
    if !image.ours {
        return Action::Keep(Keep::NotOurs);
    }
    if image.reference == base {
        return Action::Keep(Keep::BaseBuild);
    }
    if wanted_tags.iter().any(|tag| tag == &image.reference) {
        return Action::Keep(Keep::WantedByProject);
    }
    if used_ids.iter().any(|id| id == &image.id) {
        return Action::Keep(Keep::UsedByContainer);
    }
    match image.created_ms {
        None => Action::Keep(Keep::UnknownAge),
        Some(created) if now_ms.saturating_sub(created) < grace_ms => Action::Keep(Keep::YoungerThanGrace),
        Some(_) => Action::Remove,
    }
}

/// What a sweep did. The plan is kept as well as the outcome, because the interesting part of a
/// refusal or a failure is *why* the sweep thought the image was spare.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Report {
    /// Every image, in Docker's order (newest first).
    pub decisions: Vec<Decision>,
    /// References (or ids, for dangling images) Docker actually removed.
    pub removed: Vec<String>,
    /// Ones the plan named but Docker refused. Not an error: a container may have taken the
    /// image between the listing and the removal, and the next sweep will see it.
    pub failed: Vec<String>,
}

impl Report {
    pub fn planned(&self) -> usize {
        self.decisions.iter().filter(|decision| decision.is_removal()).count()
    }

    pub fn kept(&self) -> usize {
        self.decisions.len() - self.planned()
    }
}

/// The tag each project would run right now, deduplicated.
///
/// This is [`crate::seccomp::project_image`], which is the only place a tag is derived --
/// deriving it here as well is how the app and the sweep would come to disagree, and the
/// disagreement would look like "my image was deleted while it was the one in use".
pub fn tags_in_use(app: &AppSettings, projects: &[Project]) -> Vec<String> {
    let mut tags: Vec<String> = Vec::new();
    for project in projects {
        let tag = crate::seccomp::project_image(&app.image, project.tools.as_deref());
        if !tags.contains(&tag) {
            tags.push(tag);
        }
    }
    tags
}

/// Whether a reference is one this app derives from `stem`.
///
/// The stem itself counts: `npm run runtime:build` builds under exactly that tag. The derived
/// form is `<stem>-t<16 hex>` with an optional `-r<16 hex>` revision, which is what
/// [`crate::tools::image_for`] and [`crate::seccomp::project_image`] produce. A tag that merely
/// starts with the stem (`0.1.0-notes`) is not ours, and matching too broadly here is how a
/// cleanup deletes somebody's hand-built image.
pub fn looks_like_ours(stem: &str, reference: &str) -> bool {
    if reference == stem {
        return true;
    }
    let Some(rest) = reference.strip_prefix(stem) else {
        return false;
    };
    let Some(rest) = rest.strip_prefix("-t") else {
        return false;
    };
    let (hash, revision) = match rest.split_once('-') {
        Some((hash, revision)) => (hash, Some(revision)),
        None => (rest, None),
    };
    if hash.len() != 16 || !hash.bytes().all(|b| b.is_ascii_hexdigit()) {
        return false;
    }
    match revision {
        None => true,
        Some(revision) => {
            revision.len() == 17
                && revision.starts_with('r')
                && revision[1..].bytes().all(|b| b.is_ascii_hexdigit())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const HOUR: i64 = 60 * 60 * 1000;
    const STEM: &str = "deepsand/runtime:0.1.0";
    const NOW: i64 = 1_800_000_000_000;

    fn image(reference: &str, id: &str, age_ms: i64) -> ImageEntry {
        ImageEntry {
            reference: reference.to_string(),
            id: id.to_string(),
            size: "2.9GB".to_string(),
            created_ms: Some(NOW - age_ms),
            ours: true,
        }
    }

    fn tags(tags: &[&str]) -> Vec<String> {
        tags.iter().map(|tag| tag.to_string()).collect()
    }

    /// A project with only the fields that matter here filled in; everything else takes the
    /// `#[serde(default)]` the stored shape already relies on.
    fn project(name: &str, tools: Option<&[&str]>) -> Project {
        let json = serde_json::json!({
            "id": name,
            "name": name,
            "slug": name.to_lowercase().replace(' ', "-"),
            "root_dir": format!("/tmp/{name}"),
            "created_at_ms": 0,
        });
        let mut parsed: Project = serde_json::from_value(json).expect("a project needs those five fields");
        parsed.tools = tools.map(|list| list.iter().map(|tool| tool.to_string()).collect());
        parsed
    }

    fn removed(decisions: &[Decision]) -> Vec<String> {
        decisions
            .iter()
            .filter(|decision| decision.is_removal())
            .map(|decision| decision.reference.clone())
            .collect()
    }

    /// The whole point: one image per project survives, its superseded builds go.
    #[test]
    fn a_project_keeps_the_tag_it_would_run_and_its_predecessors_go() {
        let current = format!("{STEM}-t0123456789abcdef-re714ae2a3f261844");
        let previous = format!("{STEM}-t0123456789abcdef-r708c47d8b82ea923");
        let older = format!("{STEM}-t0123456789abcdef-ra5b3190222cce712");
        let decisions = plan(
            &[
                image(&current, "sha256:aaa", HOUR),
                image(&previous, "sha256:bbb", 5 * HOUR),
                image(&older, "sha256:ccc", 30 * HOUR),
            ],
            STEM,
            &tags(&[&current]),
            &[],
            NOW,
            IMAGE_GRACE_MS,
        );
        assert_eq!(removed(&decisions), vec![previous, older]);
        assert_eq!(decisions[0].action, Action::Keep(Keep::WantedByProject));
    }

    /// A stopped container still owns its image. `docker rmi` would refuse, but the sweep must
    /// not depend on that refusal: an error the operator has to read is worse than a rule that
    /// never produces one.
    #[test]
    fn an_image_any_container_references_is_kept() {
        let superseded = format!("{STEM}-t0123456789abcdef-r708c47d8b82ea923");
        let unused = format!("{STEM}-t0123456789abcdef-ra5b3190222cce712");
        let decisions = plan(
            &[image(&superseded, "sha256:bbb", 30 * HOUR), image(&unused, "sha256:ddd", 30 * HOUR)],
            STEM,
            &[],
            &tags(&["sha256:bbb"]),
            NOW,
            IMAGE_GRACE_MS,
        );
        assert_eq!(removed(&decisions), vec![unused]);
        assert_eq!(decisions[0].action, Action::Keep(Keep::UsedByContainer));
    }

    /// A build that just finished has a tag no project derives yet (the operator changed the
    /// tools again). The grace period is what stops the sweep eating it.
    #[test]
    fn an_image_inside_its_grace_period_is_kept() {
        let fresh = format!("{STEM}-t0123456789abcdef-re714ae2a3f261844");
        let stale = format!("{STEM}-t0123456789abcdef-r708c47d8b82ea923");
        let decisions = plan(
            &[image(&fresh, "sha256:aaa", 60_000), image(&stale, "sha256:bbb", 2 * HOUR)],
            STEM,
            &[],
            &[],
            NOW,
            IMAGE_GRACE_MS,
        );
        assert_eq!(removed(&decisions), vec![stale]);
        assert_eq!(decisions[0].action, Action::Keep(Keep::YoungerThanGrace));
    }

    /// Nothing about somebody else's image is our business, however old it is.
    #[test]
    fn an_image_that_is_not_ours_is_never_removed() {
        let mut foreign = image("postgres:16", "sha256:ddd", 4000 * HOUR);
        foreign.ours = false;
        let decisions = plan(&[foreign], STEM, &[], &[], NOW, IMAGE_GRACE_MS);
        assert_eq!(decisions[0].action, Action::Keep(Keep::NotOurs));
        assert!(removed(&decisions).is_empty());
    }

    /// Docker could not say when it was made -- a daemon that answered `images` but not
    /// `inspect`, or a format this build does not understand. Unknown is not abandoned.
    #[test]
    fn an_image_whose_age_cannot_be_read_is_kept() {
        let mut unknown = image(&format!("{STEM}-t0123456789abcdef-r708c47d8b82ea923"), "sha256:eee", 0);
        unknown.created_ms = None;
        let decisions = plan(&[unknown], STEM, &[], &[], NOW, IMAGE_GRACE_MS);
        assert_eq!(decisions[0].action, Action::Keep(Keep::UnknownAge));
    }

    /// A dangling image has no tag to name it by, so it is removed by id. It is still subject to
    /// the same rule: ours, unused, and past the grace period.
    #[test]
    fn a_dangling_image_of_ours_is_removed_by_id() {
        let mut dangling = image(DANGLING_REFERENCE, "sha256:fff", 10 * HOUR);
        dangling.reference = DANGLING_REFERENCE.to_string();
        let decisions = plan(&[dangling], STEM, &[], &[], NOW, IMAGE_GRACE_MS);
        assert!(decisions[0].is_removal());
        assert_eq!(decisions[0].id, "sha256:fff");
    }

    /// Two projects with the same tools (or the same empty selection) share one image, so the
    /// keep set has to be a set.
    #[test]
    fn two_projects_with_the_same_tools_keep_one_tag() {
        let app = AppSettings::default();
        let wanted = tags_in_use(
            &app,
            &[project("DIY SSL GUI", Some(&["jq", "curl"])), project("WebSLC Website", Some(&["curl", "jq"]))],
        );
        assert_eq!(wanted.len(), 1, "{wanted:?}");
        assert_eq!(
            wanted[0],
            crate::seccomp::project_image(&app.image, Some(&["jq".to_string(), "curl".to_string()]))
        );
    }

    /// A project that predates the tool system resolves to the legacy selection, which is still
    /// a tag that has to be kept -- `None` is a meaning, not an absence.
    #[test]
    fn a_project_without_a_tool_choice_keeps_the_legacy_tag() {
        let app = AppSettings::default();
        let wanted = tags_in_use(&app, &[project("Old One", None)]);
        assert_eq!(wanted, vec![crate::seccomp::project_image(&app.image, None)]);
        assert_ne!(wanted[0], crate::seccomp::project_image(&app.image, Some(&[])));
    }

    /// The base tag is what `runtime/scripts/build-image.mjs` builds, and no project runs it.
    /// It is still not abandoned: prebuilding the runtime is a supported thing to do, and its
    /// layers are shared with every derived tag. Keeping it is also what makes the window's
    /// "image missing" badge answerable when the base image is the only one there.
    #[test]
    fn the_base_build_is_kept_with_no_project_running() {
        let decisions = plan(
            &[image(STEM, "sha256:aaa", 30 * HOUR), image(&format!("{STEM}-nothing-else"), "sha256:bbb", 30 * HOUR)],
            STEM,
            &[],
            &[],
            NOW,
            IMAGE_GRACE_MS,
        );
        assert_eq!(decisions[0].action, Action::Keep(Keep::BaseBuild));
        assert_eq!(decisions[0].action, Action::Keep(Keep::BaseBuild));
        assert_eq!(
            removed(&decisions),
            vec![format!("{STEM}-nothing-else")],
            "keeping the base tag must not keep an abandoned derived tag"
        );
    }

    /// The shape test that decides whether a hand-built image is ours. Matching too broadly here
    /// is how a cleanup deletes an operator's own tag.
    #[test]
    fn only_tags_this_app_derives_look_like_ours() {
        assert!(looks_like_ours(STEM, STEM));
        assert!(looks_like_ours(STEM, &format!("{STEM}-t0123456789abcdef")));
        assert!(looks_like_ours(STEM, &format!("{STEM}-t0123456789abcdef-re714ae2a3f261844")));
        for foreign in [
            format!("{STEM}-notes"),
            format!("{STEM}-t012345"),
            format!("{STEM}-t0123456789abcdef-notes"),
            format!("{STEM}-t0123456789abcdefx-re714ae2a3f261844"),
            "deepsand/runtime:0.1.1-t0123456789abcdef".to_string(),
            "deepsand/runtime2:0.1.0-t0123456789abcdef".to_string(),
            "postgres:16".to_string(),
        ] {
            assert!(!looks_like_ours(STEM, &foreign), "{foreign} was treated as ours");
        }
    }
}
