//! Which Deepsand processes are alive, for deciding whether a container still has an owner.
//!
//! A container is not abandoned because *this* process has no session for it. `deepsandctl`
//! starts sandboxes, and so does a second instance pointed at its own data directory; both are
//! supported entry points, and neither registers a session here. Every plan therefore records
//! `deepsand.owner_pid` (see [`deepsand_core::docker::LABEL_OWNER`]), and the sweep asks this
//! module whether that process is still running before it considers removing anything.
//!
//! Liveness is a pid plus the executable name, not a heartbeat file: two instances with
//! different data directories would not see each other's files, while the process table is
//! shared by the whole machine. A pid that has been reused by an unrelated program is treated
//! as dead, so a crashed sandbox is still cleaned up.

use std::collections::HashSet;

use deepsand_core::docker::OwnerState;

/// The pids of every running Deepsand process: the desktop app, `deepsandctl`, a dev build.
///
/// `None` means the process list could not be read. A caller must treat that as "another
/// owner might still be alive": not being able to see a process is not evidence that it is
/// gone, and the wrong answer here deletes a running sandbox.
#[cfg(windows)]
pub fn running_deepsand_pids() -> Option<HashSet<u32>> {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    let mut command = std::process::Command::new("tasklist");
    command.args(["/FO", "CSV", "/NH"]);
    command.creation_flags(CREATE_NO_WINDOW);
    let output = command.output().ok()?;
    if !output.status.success() {
        return None;
    }
    Some(parse_tasklist(&String::from_utf8_lossy(&output.stdout)))
}

#[cfg(not(windows))]
pub fn running_deepsand_pids() -> Option<HashSet<u32>> {
    // `ps` is POSIX. `comm` is the executable name, and on macOS it can carry its directory,
    // which `is_deepsand` strips.
    let output = std::process::Command::new("ps")
        .args(["-eo", "pid=,comm="])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    Some(parse_ps(&String::from_utf8_lossy(&output.stdout)))
}

/// What the sweep should assume about one container's owner.
///
/// `this_pid` is passed rather than read from `std::process::id()` so the rule is a pure
/// function in a test.
pub fn state_of(
    owner_pid: Option<u32>,
    this_pid: u32,
    running: Option<&HashSet<u32>>,
) -> OwnerState {
    let Some(pid) = owner_pid else {
        return OwnerState::Unknown;
    };
    if pid == this_pid {
        return OwnerState::ThisProcess;
    }
    match running {
        None => OwnerState::AliveElsewhere,
        Some(pids) if pids.contains(&pid) => OwnerState::AliveElsewhere,
        Some(_) => OwnerState::Gone,
    }
}

/// Whether an executable name belongs to one of our processes.
///
/// The app is `deepsand-app`, the headless driver `deepsandctl`, and a test binary
/// `deepsand_app_lib-*`. All three start with the product name, and a pid that has been reused
/// by anything else must not count: that is what keeps a crashed container sweepable.
fn is_deepsand(name: &str) -> bool {
    let file = name.rsplit(['/', '\\']).next().unwrap_or(name);
    let stem = file.strip_suffix(".exe").unwrap_or(file);
    stem.to_ascii_lowercase().starts_with("deepsand")
}

/// `tasklist /FO CSV /NH` rows: `"deepsand-app.exe","17064","Console","1","123,456 K"`.
#[cfg(windows)]
fn parse_tasklist(text: &str) -> HashSet<u32> {
    text.lines()
        .filter_map(|line| {
            let mut parts = line.split("\",\"");
            let name = parts.next()?.trim_matches('"');
            let pid: u32 = parts.next()?.trim_matches('"').parse().ok()?;
            is_deepsand(name).then_some(pid)
        })
        .collect()
}

/// `ps -eo pid=,comm=` rows: ` 17064 deepsand-app`.
#[cfg(not(windows))]
fn parse_ps(text: &str) -> HashSet<u32> {
    text.lines()
        .filter_map(|line| {
            let mut parts = line.split_whitespace();
            let pid: u32 = parts.next()?.parse().ok()?;
            is_deepsand(parts.next()?).then_some(pid)
        })
        .collect()
}

#[cfg(test)]
mod owner_tests {
    use super::*;

    fn pids(list: &[u32]) -> HashSet<u32> {
        list.iter().copied().collect()
    }

    #[test]
    fn the_process_that_asked_owns_the_container_it_started() {
        assert_eq!(
            state_of(Some(500), 500, Some(&pids(&[500, 700]))),
            OwnerState::ThisProcess
        );
    }

    #[test]
    fn a_pid_that_is_still_in_the_process_list_is_alive_elsewhere() {
        assert_eq!(
            state_of(Some(700), 500, Some(&pids(&[500, 700]))),
            OwnerState::AliveElsewhere,
            "deepsandctl or a second instance is still using its sandbox"
        );
    }

    #[test]
    fn a_pid_that_is_not_in_the_process_list_is_gone() {
        assert_eq!(state_of(Some(700), 500, Some(&pids(&[500]))), OwnerState::Gone);
    }

    #[test]
    fn a_container_with_no_owner_label_is_unknown_rather_than_gone() {
        assert_eq!(state_of(None, 500, Some(&pids(&[500]))), OwnerState::Unknown);
    }

    /// The wrong answer here deletes somebody else's running sandbox, so an unreadable list
    /// has to mean "possibly alive" rather than "probably dead".
    #[test]
    fn an_unreadable_process_list_treats_every_other_owner_as_alive() {
        assert_eq!(
            state_of(Some(700), 500, None),
            OwnerState::AliveElsewhere
        );
    }

    /// The parser tests the shape of an answer; this one asks the machine. The test binary is
    /// named `deepsand_app_lib-*`, which is one of ours, so the list must contain it.
    #[test]
    fn the_real_process_list_contains_this_test_process() {
        let running = running_deepsand_pids().expect("the process list has to be readable");
        assert!(
            running.contains(&std::process::id()),
            "the sweep would treat every container as ownerless if it could not see the app: {running:?}"
        );
    }

    #[test]
    fn only_deepsand_executables_count_as_owners() {
        assert!(is_deepsand("deepsand-app.exe"));
        assert!(is_deepsand("deepsandctl"));
        assert!(is_deepsand("Deepsand-App.EXE"));
        assert!(is_deepsand(r"C:\Program Files\Deepsand\deepsand-app.exe"));
        assert!(is_deepsand("/usr/bin/deepsandctl"));
        assert!(
            !is_deepsand("node.exe"),
            "a reused pid running something else is a dead owner, not a live one"
        );
        assert!(!is_deepsand("docker.exe"));
        assert!(!is_deepsand(""));
    }

    #[cfg(windows)]
    #[test]
    fn tasklist_rows_are_read_and_strangers_are_ignored() {
        let text = "\"deepsand-app.exe\",\"17064\",\"Console\",\"1\",\"123,456 K\"\r\n\
                    \"node.exe\",\"4242\",\"Console\",\"1\",\"90,000 K\"\r\n\
                    \"deepsandctl.exe\",\"700\",\"Console\",\"1\",\"12,000 K\"\r\n";
        assert_eq!(parse_tasklist(text), pids(&[17064, 700]));
    }

    #[cfg(not(windows))]
    #[test]
    fn ps_rows_are_read_and_strangers_are_ignored() {
        let text = " 17064 deepsand-app\n 4242 node\n  700 deepsandctl\n";
        assert_eq!(parse_ps(text), pids(&[17064, 700]));
    }
}
