//! Where a file the operator dropped into the terminal lives inside the sandbox.
//!
//! Two answers, and the difference matters:
//!
//! * A file the sandbox can **already see** -- the workspace, or a directory the operator
//!   granted -- is *named*, not copied. The sandbox sees the original at its mount path, so
//!   copying it would leave a second copy somewhere nobody asked for, and a grant exists
//!   precisely so the original is reachable.
//! * A file from **anywhere else** is outside what the project is allowed to see. It has to
//!   be copied in, and where it is copied matters: putting it in the workspace would drop an
//!   arbitrary file into a git repository, and the next `git add -A` would commit it. It goes
//!   somewhere disposable instead (see `ATTACHMENT_DROP_DIR` in the app crate).
//!
//! The comparison is on canonical paths. A grant's `host_path` is stored canonical, and the
//! dropped path is canonicalised before it is compared, so `..` or a symlink cannot make a
//! file look like it is inside a directory it is not.

use crate::model::{Grant, Project};
use crate::paths;
use std::path::Path;

/// The path the sandbox sees for `canonical`, when it is inside the workspace or a grant.
pub fn in_sandbox_path(canonical: &Path, workspace_root: &Path, grants: &[Grant]) -> Option<String> {
    let canonical = paths::canonicalize_lenient(canonical);
    let workspace = paths::canonicalize_lenient(workspace_root);

    if paths::is_within(&workspace, &canonical) {
        if let Ok(relative) = canonical.strip_prefix(&workspace) {
            return Some(join_mount(Project::workspace_mount(), relative));
        }
    }

    for grant in grants {
        let root = paths::canonicalize_lenient(Path::new(&grant.host_path));
        if paths::is_within(&root, &canonical) {
            if let Ok(relative) = canonical.strip_prefix(&root) {
                return Some(join_mount(&grant.container_path, relative));
            }
        }
    }

    None
}

/// `mount` plus the relative tail, with forward slashes.
///
/// DeepCode runs on Linux, so a Windows path separator in what is typed into its prompt is a
/// character it would have to guess about. The tail is joined rather than string-concatenated
/// so a dropped path can never produce `//` or a trailing slash.
fn join_mount(mount: &str, relative: &Path) -> String {
    let mount = mount.trim_end_matches('/');
    let tail = relative.to_string_lossy().replace('\\', "/");
    if tail.is_empty() {
        mount.to_string()
    } else {
        format!("{mount}/{tail}")
    }
}

#[cfg(test)]
mod attachment_path_tests {
    use super::*;
    use crate::model::Grant;
    use std::path::PathBuf;

    fn scratch(name: &str) -> PathBuf {
        let dir = std::env::temp_dir()
            .join(format!("deepsand-attach-{name}-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).expect("scratch dir");
        dir
    }

    fn grant(host_path: &Path, container_path: &str) -> Grant {
        Grant {
            id: "g1".to_string(),
            project_id: "p1".to_string(),
            host_path: host_path.to_string_lossy().to_string(),
            container_path: container_path.to_string(),
            slug: "shared".to_string(),
            access: crate::model::Access::ReadOnly,
            label: "shared".to_string(),
            purpose: String::new(),
            source: crate::model::GrantSource::Request,
            created_at_ms: 0,
            expires_at_ms: None,
        }
    }

    #[test]
    fn a_file_in_the_workspace_is_named_at_the_workspace_mount() {
        let root = scratch("workspace");
        std::fs::create_dir_all(root.join("src")).unwrap();
        let file = root.join("src").join("main.rs");
        std::fs::write(&file, b"fn main() {}").unwrap();

        assert_eq!(
            in_sandbox_path(&file, &root, &[]).as_deref(),
            Some("/workspace/src/main.rs"),
            "the sandbox already sees this file, so it must be named where it sees it"
        );
    }

    /// The reported bug: a granted directory was copied instead of named, so a file the
    /// sandbox could already read arrived under a different path with a timestamp in front.
    #[test]
    fn a_file_in_a_granted_directory_is_named_at_its_grant_mount() {
        let root = scratch("grant");
        let shared = scratch("grant-shared");
        std::fs::create_dir_all(shared.join("theme")).unwrap();
        let file = shared.join("theme").join("colours.css");
        std::fs::write(&file, b"body{}").unwrap();
        let grants = vec![grant(&shared, "/grants/shared")];

        assert_eq!(
            in_sandbox_path(&file, &root, &grants).as_deref(),
            Some("/grants/shared/theme/colours.css"),
            "a granted directory is a place the sandbox can see, exactly like the workspace"
        );
    }

    #[test]
    fn the_mount_root_itself_has_no_trailing_separator() {
        let root = scratch("root");
        let shared = scratch("root-shared");
        let grants = vec![grant(&shared, "/grants/shared")];

        assert_eq!(in_sandbox_path(&shared, &root, &grants).as_deref(), Some("/grants/shared"));
        assert_eq!(in_sandbox_path(&root, &root, &[]).as_deref(), Some("/workspace"));
    }

    #[test]
    fn a_sibling_whose_name_shares_a_prefix_is_not_inside_the_grant() {
        // The workspace is somewhere else on purpose: this is a question about the grant,
        // and a directory inside the workspace would answer a different one.
        let root = scratch("lookalike-workspace");
        let parent = scratch("lookalike");
        let shared = parent.join("shared");
        let sibling = parent.join("shared-old");
        std::fs::create_dir_all(&shared).unwrap();
        std::fs::create_dir_all(&sibling).unwrap();
        let file = sibling.join("notes.txt");
        std::fs::write(&file, b"x").unwrap();
        let grants = vec![grant(&shared, "/grants/shared")];

        assert_eq!(
            in_sandbox_path(&file, &root, &grants),
            None,
            "the separator is what makes it inside, not the string prefix"
        );
    }

    #[test]
    fn a_file_outside_every_permitted_directory_has_no_sandbox_path() {
        let root = scratch("outside");
        let shared = scratch("outside-shared");
        let elsewhere = scratch("outside-elsewhere");
        let grants = vec![grant(&shared, "/grants/shared")];

        assert_eq!(in_sandbox_path(&elsewhere, &root, &grants), None);
    }

    #[test]
    fn a_grant_that_no_longer_exists_still_does_not_capture_its_children() {
        // A stale grant path canonicalises lexically; a file in a *different* directory must
        // still read as outside rather than matching a prefix by accident.
        let root = scratch("stale-workspace");
        let parent = scratch("stale");
        let gone = parent.join("gone");
        let file = parent.join("gone-elsewhere").join("x.txt");
        std::fs::create_dir_all(file.parent().unwrap()).unwrap();
        std::fs::write(&file, b"x").unwrap();
        let grants = vec![grant(&gone, "/grants/gone")];

        assert_eq!(in_sandbox_path(&file, &root, &grants), None);
    }
}
