//! Debian packages a project asked for, and the only place their grammar is decided.
//!
//! A sandbox has no root and a read-only root filesystem, so `apt-get install` cannot run
//! inside it. The packages an agent needs are therefore added to the *image*: approved by
//! the operator, stored on the project, and installed by the build as root, beside the
//! tools. This module is the boundary between "a string the sandbox wrote" and "an argument
//! apt is given", so it is deliberately strict -- a name that does not match Debian's own
//! grammar is not a package, it is an instruction to apt, and apt's argument handling is
//! not something a contained process should be able to reach.

/// The most packages one project may carry, and the most one request may name.
///
/// A bound rather than a policy: the list is part of the image tag and of the build's
/// command line, and an unbounded list from a hostile spool would let a single request
/// grow the build indefinitely.
pub const MAX_PACKAGES: usize = 24;

/// The longest name Debian's own archive uses, with room to spare.
const MAX_NAME_LEN: usize = 64;

/// Whether `name` is a Debian binary package name.
///
/// Debian Policy 5.6.1: lowercase letters, digits, `+`, `-` and `.` only; at least two
/// characters; and it must start with an alphanumeric. Everything else -- a space, a `/`,
/// a leading `-`, an `=version` pin, a `:` architecture qualifier -- is refused rather
/// than passed through, because apt would read it as an option or as a different request.
pub fn is_valid(name: &str) -> bool {
    let bytes = name.as_bytes();
    if bytes.len() < 2 || bytes.len() > MAX_NAME_LEN {
        return false;
    }
    if !bytes[0].is_ascii_lowercase() && !bytes[0].is_ascii_digit() {
        return false;
    }
    bytes
        .iter()
        .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || matches!(byte, b'+' | b'-' | b'.'))
}

/// The list as it will be stored, tagged and built: valid names only, lowercased, sorted
/// and deduplicated, capped at [`MAX_PACKAGES`].
///
/// Lowercasing is not cosmetic. Debian names are lower case by policy, apt looks one up
/// case-sensitively, and a model that writes `JQ` means `jq` -- so the dialog shows the
/// name apt will actually use rather than a name that cannot resolve.
pub fn normalise(names: &[String]) -> Vec<String> {
    let mut cleaned: Vec<String> = names
        .iter()
        .map(|name| name.trim().to_ascii_lowercase())
        .filter(|name| is_valid(name))
        .collect();
    cleaned.sort();
    cleaned.dedup();
    cleaned.truncate(MAX_PACKAGES);
    cleaned
}

/// The names in `names` that cannot be installed, as written, for a refusal the operator
/// and the model can both read.
pub fn invalid(names: &[String]) -> Vec<String> {
    names
        .iter()
        .map(|name| name.trim().to_string())
        .filter(|name| !is_valid(&name.to_ascii_lowercase()))
        .collect()
}

/// The apt list the image build runs: what the tools need, plus what the project asked for.
///
/// One list, because there is one `apt-get install` (and one place apt can run: as root,
/// during the build). Sorted and deduplicated so a package that is both a tool's dependency
/// and the operator's request is named once, and so the build argument is stable.
pub fn with_tool_packages(tool_packages: &[String], project_packages: &[String]) -> Vec<String> {
    let mut all: Vec<String> = tool_packages.to_vec();
    all.extend(project_packages.iter().cloned());
    all.sort();
    all.dedup();
    all
}

/// The part a package list contributes to an image tag: `-p<hash>`, or nothing when the
/// list is empty.
///
/// Empty contributes nothing on purpose. Every project that never asked for a package has
/// an empty list, and appending a component for it would change every existing tag -- one
/// full rebuild per project for a feature they are not using.
pub fn tag_component(names: &[String]) -> String {
    let normalised = normalise(names);
    if normalised.is_empty() {
        return String::new();
    }
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for byte in normalised.join(",").bytes() {
        hash ^= u64::from(byte);
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    format!("-p{hash:08x}")
}

/// `a, b and c`, for one sentence rather than a joined blob.
pub fn list_phrase(names: &[String]) -> String {
    match names {
        [] => String::new(),
        [one] => one.clone(),
        [a, b] => format!("{a} and {b}"),
        _ => {
            let (last, rest) = names.split_last().expect("three or more, so not empty");
            format!("{} and {last}", rest.join(", "))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn names(list: &[&str]) -> Vec<String> {
        list.iter().map(|name| (*name).to_string()).collect()
    }

    #[test]
    fn the_debian_grammar_is_enforced_exactly() {
        for good in ["jq", "python3-pip", "libjq1", "g++", "gcc-12", "7zip", "a2ps"] {
            assert!(is_valid(good), "{good} is a real package name");
        }
        for bad in [
            "jq;rm -rf /",
            "-jq",
            "jq=1.6-2.1",
            "jq:amd64",
            "Jq",
            "j q",
            "jq/..",
            "",
            "j",
            "../../etc/passwd",
            "--option",
        ] {
            assert!(!is_valid(bad), "{bad:?} must not reach apt");
        }
    }

    #[test]
    fn normalising_drops_what_cannot_be_installed_and_orders_the_rest() {
        let cleaned = normalise(&names(&["JQ", "ripgrep", "jq", "not a package", "-x"]));
        assert_eq!(cleaned, ["jq", "ripgrep"], "lowercased, deduplicated, sorted");
        assert_eq!(invalid(&names(&["jq", "-x"])), ["-x"]);
    }

    #[test]
    fn an_empty_list_does_not_change_an_image_tag() {
        assert_eq!(tag_component(&[]), "");
        assert_eq!(tag_component(&names(&["not a package"])), "");
        // Order and case are the selection, not a different image.
        assert_eq!(
            tag_component(&names(&["jq", "ripgrep"])),
            tag_component(&names(&["Ripgrep", "jq"]))
        );
        assert_ne!(
            tag_component(&names(&["jq"])),
            tag_component(&names(&["jq", "ripgrep"]))
        );
    }

    #[test]
    fn the_build_installs_the_projects_packages_beside_the_tools_ones() {
        let apt = with_tool_packages(
            &names(&["git", "unzip"]),
            &names(&["graphviz", "unzip"]),
        );
        assert_eq!(
            apt,
            ["git", "graphviz", "unzip"],
            "one list, sorted, with a package both sides need named once"
        );
        // Nothing selected on either side is an empty argument, not a stray comma.
        assert!(with_tool_packages(&[], &[]).is_empty());
    }

    #[test]
    fn the_list_is_capped() {
        let many: Vec<String> = (0..100).map(|index| format!("pkg{index:03}")).collect();
        assert_eq!(normalise(&many).len(), MAX_PACKAGES);
    }
}
