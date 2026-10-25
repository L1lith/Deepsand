//! Resources the operator refused permanently.
//!
//! "Don't ask again" has to mean something the host enforces, not something the model is
//! asked to remember. Telling the sandbox a refusal is final is a message to a process that
//! may be compromised; a block is a decision the host re-checks on every path that could
//! create access.
//!
//! # What a block covers
//!
//! * A blocked **path** covers itself and everything beneath it. A grant is a mount, so a
//!   path that is never mounted is unreachable whatever the agent does.
//! * A blocked **host** covers itself and every subdomain. `example.com` being blocked does
//!   not leave `api.example.com` reachable; the suffix comparison is on a dot boundary so
//!   `notexample.com` is a different host.
//!
//! # Where it is enforced
//!
//! The request path (`commands::auto_refusal`, before a dialog can appear), grant creation
//! (`Store::add_grant`, so no other caller can route around it), the network approval path,
//! and — where the project's network mode has an egress proxy — the proxy itself, through
//! the `!host` entries [`deny_entries`] produces. In `internet` and `full` mode the container
//! reaches destinations directly and there is no proxy to refuse them, so a host block there
//! stops the host ever being granted but cannot be described as network enforcement.

use crate::model::Project;
use crate::paths;
use std::net::IpAddr;
use std::path::Path;
use std::str::FromStr;

/// The canonical form of a host entry: lowercase, no port, no trailing dot, no leading `*.`.
///
/// Returns `None` for an entry whose host cannot be derived (`re:` patterns), which is
/// deliberately not blocked: guessing a hostname from a regular expression would block
/// something the operator never named.
pub fn host_of(entry: &str) -> Option<String> {
    let mut body = entry.trim();
    if let Some(rest) = body.strip_prefix('!') {
        body = rest.trim();
    }
    if body.starts_with("re:") || body.is_empty() {
        return None;
    }
    if let Some(rest) = body.strip_prefix("*.") {
        body = rest;
    }
    // A bracketed IPv6 literal, optionally with a port.
    let host = if let Some(rest) = body.strip_prefix('[') {
        rest.split(']').next()?.trim().to_string()
    } else {
        // One colon means host:port. More than one is an unbracketed IPv6 literal, which
        // has no port in this syntax.
        let colons = body.matches(':').count();
        if colons == 1 {
            let (host, port) = body.split_once(':')?;
            if port.chars().all(|c| c.is_ascii_digit()) {
                host.trim().to_string()
            } else {
                body.to_string()
            }
        } else {
            body.to_string()
        }
    };
    let host = host.trim().trim_end_matches('.').to_ascii_lowercase();
    if host.is_empty() || host.contains('/') || host.contains(char::is_whitespace) {
        return None;
    }
    Some(host)
}

/// Whether `candidate` is a blocked path, or inside one.
///
/// Both sides are canonical: entries are canonicalised when they are added, and the
/// candidate is canonicalised here, so a symlink cannot present itself as a different path.
pub fn blocked_path(blocked: &[String], candidate: &Path) -> Option<String> {
    let resolved = paths::canonicalize_lenient(candidate);
    for entry in blocked {
        // Entries are stored canonical, but a file can be edited by hand and a build can
        // move between platforms, so the comparison canonicalises both sides. The list is a
        // handful of entries, and being wrong here is a path that stays reachable.
        let root = paths::canonicalize_lenient(Path::new(entry));
        if resolved == root || paths::is_within(&root, &resolved) {
            return Some(entry.clone());
        }
    }
    None
}

/// Whether `host` is a blocked host or a subdomain of one.
pub fn blocked_host(blocked: &[String], host: &str) -> Option<String> {
    let Some(candidate) = host_of(host) else {
        // An entry we cannot read is compared literally, so an exact match still works.
        let literal = host.trim().trim_end_matches('.').to_ascii_lowercase();
        return blocked.iter().find(|entry| **entry == literal).cloned();
    };
    for entry in blocked {
        if candidate == *entry || candidate.ends_with(&format!(".{entry}")) {
            return Some(entry.clone());
        }
    }
    None
}

/// The allowlist entries that turn the host blocks into rules the proxy enforces.
///
/// `!host` covers the host itself and `!*.host` covers its subdomains, because a
/// `Subdomain` matcher deliberately does not match the bare domain. An address literal has
/// no subdomains, so only the exact deny is written.
pub fn deny_entries(blocked: &[String]) -> Vec<String> {
    let mut entries = Vec::new();
    for host in blocked {
        if IpAddr::from_str(host).is_ok() {
            entries.push(format!("!{host}"));
        } else {
            entries.push(format!("!{host}"));
            entries.push(format!("!*.{host}"));
        }
    }
    entries
}

/// Add a path block. Returns whether the stored list changed.
///
/// The list is kept minimal: a block inside one that is already stored changes nothing, and
/// a block that contains existing ones absorbs them.
pub fn add_path(project: &mut Project, path: &Path) -> bool {
    let resolved = paths::canonicalize_lenient(path);
    let entry = resolved.to_string_lossy().to_string();
    if entry.is_empty() {
        return false;
    }
    let canonical = |entry: &String| paths::canonicalize_lenient(Path::new(entry));
    if project
        .blocked_paths
        .iter()
        .any(|existing| resolved == canonical(existing) || paths::is_within(&canonical(existing), &resolved))
    {
        return false;
    }
    project
        .blocked_paths
        .retain(|existing| !paths::is_within(&resolved, &canonical(existing)));
    project.blocked_paths.push(entry);
    project.blocked_paths.sort();
    true
}

/// Add host blocks. Returns whether the stored list changed.
pub fn add_hosts(project: &mut Project, hosts: impl IntoIterator<Item = String>) -> bool {
    let mut changed = false;
    for host in hosts {
        let Some(host) = host_of(&host) else {
            continue;
        };
        if blocked_host(&project.blocked_hosts, &host).is_some() {
            continue;
        }
        // A new block that contains an existing one absorbs it: entries already covered are
        // subdomains of the new host, so the comparison has to be that way round or they
        // stay in the list forever.
        let suffix = format!(".{host}");
        project
            .blocked_hosts
            .retain(|existing| *existing != host && !existing.ends_with(&suffix));
        project.blocked_hosts.push(host);
        changed = true;
    }
    if changed {
        project.blocked_hosts.sort();
    }
    changed
}

#[cfg(test)]
mod block_tests {
    use super::*;
    use crate::model::Project;
    use std::path::PathBuf;

    /// The same minimal fixture the model tests use: every field but these four has a serde
    /// default, so this stays honest as the struct grows.
    fn project() -> Project {
        serde_json::from_str(
            r#"{"id":"p1","name":"n","slug":"s","root_dir":"/w","created_at_ms":0}"#,
        )
        .unwrap()
    }

    /// A real directory, because a path block is compared after canonicalisation and a
    /// made-up `/home/me` means something different on Windows.
    fn scratch(name: &str) -> PathBuf {
        let dir =
            std::env::temp_dir().join(format!("deepsand-blocks-{name}-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).expect("scratch dir");
        dir
    }

    #[test]
    fn a_blocked_path_covers_everything_below_it() {
        let root = scratch("below");
        let child = root.join("deploy").join("key");
        let mut project = project();
        assert!(add_path(&mut project, &root), "the block is stored");

        assert!(
            blocked_path(&project.blocked_paths, &root).is_some(),
            "the path itself is blocked"
        );
        assert!(
            blocked_path(&project.blocked_paths, &child).is_some(),
            "and everything beneath it, whether or not it exists yet"
        );
        let sibling = PathBuf::from(format!("{}-old", root.display()));
        assert!(
            blocked_path(&project.blocked_paths, &sibling).is_none(),
            "a sibling whose name merely starts the same must not be blocked"
        );
        assert!(
            blocked_path(&project.blocked_paths, root.parent().unwrap()).is_none(),
            "and the block must not cover the directory above it"
        );
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn a_lookalike_path_is_not_inside_a_blocked_one() {
        let root = scratch("lookalike");
        let blocked_root = root.join("app");
        std::fs::create_dir_all(&blocked_root).unwrap();
        let mut project = project();
        assert!(add_path(&mut project, &blocked_root));

        assert!(
            blocked_path(&project.blocked_paths, &root.join("application")).is_none(),
            "the separator is what makes it a subpath, not the string prefix"
        );
        assert!(
            blocked_path(&project.blocked_paths, &blocked_root.join("src")).is_some(),
            "a real child is still blocked"
        );
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn a_blocked_host_covers_its_subdomains_and_nothing_else() {
        let blocked = vec!["example.com".to_string()];
        assert!(blocked_host(&blocked, "example.com").is_some());
        assert!(blocked_host(&blocked, "api.example.com").is_some());
        assert!(blocked_host(&blocked, "API.Example.COM.").is_some());
        assert!(
            blocked_host(&blocked, "notexample.com").is_none(),
            "the dot boundary is what stops badexample.com matching example.com"
        );
        assert!(blocked_host(&blocked, "example.com.evil.test").is_none());
    }

    #[test]
    fn a_port_on_the_request_does_not_escape_the_block() {
        let blocked = vec!["example.com".to_string()];
        assert!(blocked_host(&blocked, "example.com:443").is_some());
        assert!(blocked_host(&blocked, "api.example.com:8080").is_some());
    }

    #[test]
    fn an_address_is_blocked_exactly_and_gets_no_wildcard() {
        let mut project = project();
        assert!(add_hosts(&mut project, ["10.0.0.7".to_string()]));
        assert!(blocked_host(&project.blocked_hosts, "10.0.0.7").is_some());
        assert!(blocked_host(&project.blocked_hosts, "10.0.0.70").is_none());
        assert_eq!(deny_entries(&project.blocked_hosts), vec!["!10.0.0.7"]);
    }

    #[test]
    fn a_host_block_becomes_a_deny_for_the_host_and_one_for_its_subdomains() {
        let blocked = vec!["example.com".to_string()];
        assert_eq!(
            deny_entries(&blocked),
            vec!["!example.com", "!*.example.com"],
            "`*.example.com` does not match `example.com`, so both rules are needed"
        );
    }

    #[test]
    fn a_wildcard_request_blocks_the_domain_and_its_subdomains() {
        let mut project = project();
        assert!(add_hosts(&mut project, ["*.example.com".to_string()]));
        assert_eq!(project.blocked_hosts, vec!["example.com".to_string()]);
        assert!(blocked_host(&project.blocked_hosts, "deep.api.example.com").is_some());
    }

    #[test]
    fn a_regular_expression_names_no_host_and_so_blocks_none() {
        let mut project = project();
        assert!(!add_hosts(&mut project, ["re:^.*\\.example\\.com$".to_string()]));
        assert!(
            project.blocked_hosts.is_empty(),
            "guessing a host out of a regex would block something the operator never named"
        );
    }

    #[test]
    fn adding_a_narrower_block_inside_an_existing_one_changes_nothing() {
        let root = scratch("narrower");
        let mut project = project();
        assert!(add_path(&mut project, &root));
        assert!(!add_path(&mut project, &root.join("deploy")));
        assert_eq!(project.blocked_paths.len(), 1, "the list stays minimal");
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn adding_a_wider_block_absorbs_the_narrower_ones() {
        let root = scratch("absorb");
        let wide = root.join("secrets");
        let narrow = wide.join("deploy");
        std::fs::create_dir_all(&narrow).unwrap();

        let mut project = project();
        assert!(add_path(&mut project, &narrow));
        assert!(add_hosts(&mut project, ["api.example.com".to_string()]));
        assert!(add_path(&mut project, &wide));
        assert!(add_hosts(&mut project, ["example.com".to_string()]));
        assert_eq!(project.blocked_paths, vec![wide.to_string_lossy().to_string()]);
        assert_eq!(project.blocked_hosts, vec!["example.com".to_string()]);
    }
}
