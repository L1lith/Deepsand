//! Why Docker Desktop's VM could not start, and whether this machine can supply its RAM.
//!
//! Docker Desktop's Hyper-V backend starts a VM whose memory is fixed in
//! `%APPDATA%\Docker\settings-store.json` (`MemoryMiB`, three gigabytes by default). Hyper-V
//! reserves that memory when the VM starts. When the host cannot supply it the engine fails
//! with
//!
//! ```text
//! Not enough memory in the system to start the virtual machine DockerDesktopVM
//! with ram size 3072 megabytes
//! ```
//!
//! and Docker Desktop closes. The window used to reduce that to "Docker Desktop is not
//! running. Start it and try again", which sends the operator to press Start again and watch
//! the identical failure. This module reads the two halves -- what the VM asks for, and what
//! the host has -- and the evidence Docker Desktop itself logged, so the app can say which one
//! is the problem. It never edits Docker Desktop's settings.

use std::path::{Path, PathBuf};

use crate::{Result, SandboxError};

/// Host memory, in mebibytes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct HostMemory {
    pub total_mb: u64,
    pub available_mb: u64,
    pub commit_limit_mb: u64,
    pub commit_used_mb: u64,
}

impl HostMemory {
    /// Commit charge still available: `CommitLimit - Committed_AS`, or the Windows pagefile
    /// equivalent.
    pub fn commit_available_mb(&self) -> u64 {
        self.commit_limit_mb.saturating_sub(self.commit_used_mb)
    }

    /// The headroom that actually decides whether a VM can start: whichever of physical memory
    /// and commit runs out first.
    pub fn headroom_mb(&self) -> u64 {
        self.available_mb.min(self.commit_available_mb())
    }
}

/// What Docker Desktop's settings say its VM will reserve.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DockerDesktopMemory {
    pub settings_path: PathBuf,
    /// `MemoryMiB`. `None` when the key is absent, which means Docker Desktop is using the WSL
    /// backend (or has never been configured) and this number is not the one that applies.
    pub vm_memory_mb: Option<u64>,
    pub swap_mb: Option<u64>,
    /// True when the Hyper-V backend is in use -- the one whose start failure names an explicit
    /// RAM size.
    pub hyperv: bool,
}

/// How much room a VM start needs beyond the VM's own RAM.
///
/// Hyper-V and the engine it starts need working memory of their own, and a VM that exactly
/// consumes the free RAM starts by pushing everything else into the pagefile. Half a gigabyte
/// is the smallest margin that is not a guess in the wrong direction.
pub const START_HEADROOM_MB: u64 = 512;

/// Whether the configured VM could start right now.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MemoryVerdict {
    /// The VM fits with room to spare.
    Plenty,
    /// It fits, but barely; another large application can turn this into `Insufficient`.
    Tight,
    /// There is not enough free memory for the VM itself.
    Insufficient,
    /// No configured VM size was found (WSL backend, non-Windows, or no settings file).
    Unknown,
}

pub fn verdict(host: &HostMemory, vm_memory_mb: Option<u64>) -> MemoryVerdict {
    let Some(vm) = vm_memory_mb else {
        return MemoryVerdict::Unknown;
    };
    let headroom = host.headroom_mb();
    if headroom <= vm {
        MemoryVerdict::Insufficient
    } else if headroom < vm.saturating_add(START_HEADROOM_MB) {
        MemoryVerdict::Tight
    } else {
        MemoryVerdict::Plenty
    }
}

/// The sentence Docker Desktop logs when Hyper-V cannot give the VM its memory.
pub const ENGINE_OUT_OF_MEMORY: &str =
    "Not enough memory in the system to start the virtual machine";

/// How much of a log is read. Docker's host log rotates around one megabyte, so this is the
/// most recent session or two; reading the whole file on a poll would be pointless work.
const LOG_TAIL_BYTES: u64 = 512 * 1024;

/// What Docker Desktop's last failed engine start said.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EngineMemoryFailure {
    /// The RAM the VM asked for, in MiB, when the line could be parsed.
    pub vm_memory_mb: Option<u64>,
    /// The log line's timestamp, when it carried one.
    pub at: Option<String>,
    pub log_path: PathBuf,
}

/// This machine's memory, as the operating system reports it.
pub fn host_memory() -> Option<HostMemory> {
    #[cfg(windows)]
    {
        use windows_sys::Win32::System::SystemInformation::{GlobalMemoryStatusEx, MEMORYSTATUSEX};
        let mut status = MEMORYSTATUSEX {
            dwLength: 0,
            dwMemoryLoad: 0,
            ullTotalPhys: 0,
            ullAvailPhys: 0,
            ullTotalPageFile: 0,
            ullAvailPageFile: 0,
            ullTotalVirtual: 0,
            ullAvailVirtual: 0,
            ullAvailExtendedVirtual: 0,
        };
        status.dwLength = std::mem::size_of::<MEMORYSTATUSEX>() as u32;
        // SAFETY: `status` is a MEMORYSTATUSEX with `dwLength` set to its own size, which is
        // the contract the call requires. It writes only into that struct.
        if unsafe { GlobalMemoryStatusEx(&mut status) } == 0 {
            return None;
        }
        const MB: u64 = 1024 * 1024;
        return Some(HostMemory {
            total_mb: status.ullTotalPhys / MB,
            available_mb: status.ullAvailPhys / MB,
            commit_limit_mb: status.ullTotalPageFile / MB,
            commit_used_mb: status
                .ullTotalPageFile
                .saturating_sub(status.ullAvailPageFile)
                / MB,
        });
    }
    #[cfg(target_os = "linux")]
    {
        let text = std::fs::read_to_string("/proc/meminfo").ok()?;
        return parse_proc_meminfo(&text);
    }
    #[allow(unreachable_code)]
    None
}

/// Docker Desktop's memory settings, read without changing anything.
pub fn docker_desktop_memory() -> Option<DockerDesktopMemory> {
    let path = crate::docker_shares::settings_path().ok()?;
    read_settings(&path).ok()
}

pub fn read_settings(settings_path: &Path) -> Result<DockerDesktopMemory> {
    let text = std::fs::read_to_string(settings_path).map_err(|err| {
        SandboxError::Other(anyhow::anyhow!(
            "could not read {}: {err}",
            settings_path.display()
        ))
    })?;
    let (vm_memory_mb, swap_mb, hyperv) = parse_settings(&text)?;
    Ok(DockerDesktopMemory {
        settings_path: settings_path.to_path_buf(),
        vm_memory_mb,
        swap_mb,
        hyperv,
    })
}

/// The three settings that decide whether the VM can start, from the settings document.
///
/// Split out so a test can state the rule without a Docker Desktop installation.
pub fn parse_settings(text: &str) -> Result<(Option<u64>, Option<u64>, bool)> {
    let root: serde_json::Value = serde_json::from_str(text)?;
    let vm = root.get("MemoryMiB").and_then(serde_json::Value::as_u64);
    let swap = root.get("SwapMiB").and_then(serde_json::Value::as_u64);
    // `WslEngineEnabled: false` is the Hyper-V backend. A missing key is treated as Hyper-V
    // because that is what older settings files that predate the flag used.
    let hyperv = !root
        .get("WslEngineEnabled")
        .and_then(serde_json::Value::as_bool)
        .unwrap_or(false);
    Ok((vm, swap, hyperv))
}

/// The directory Docker Desktop writes its host logs to.
pub fn docker_log_dir() -> Option<PathBuf> {
    if !cfg!(windows) {
        return None;
    }
    directories::BaseDirs::new().map(|bases| {
        bases
            .data_local_dir()
            .join("Docker")
            .join("log")
            .join("host")
    })
}

/// The most recent engine-start out-of-memory failure Docker Desktop logged, if any.
///
/// Both the backend log and the monitor log carry it. The backend log is asked first because it
/// is the one that also carries the timestamped error state.
pub fn engine_start_memory_failure() -> Option<EngineMemoryFailure> {
    let dir = docker_log_dir()?;
    for name in ["com.docker.backend.exe.log", "monitor.log"] {
        let path = dir.join(name);
        if let Some((vm_memory_mb, at)) = failure_in(&path) {
            return Some(EngineMemoryFailure {
                vm_memory_mb,
                at,
                log_path: path,
            });
        }
    }
    None
}

fn failure_in(path: &Path) -> Option<(Option<u64>, Option<String>)> {
    use std::io::{Read, Seek, SeekFrom};

    let mut file = std::fs::File::open(path).ok()?;
    let len = file.metadata().ok()?.len();
    file.seek(SeekFrom::Start(len.saturating_sub(LOG_TAIL_BYTES)))
        .ok()?;
    let mut text = String::new();
    file.take(LOG_TAIL_BYTES).read_to_string(&mut text).ok()?;
    parse_failure(&text)
}

/// Read the RAM size and time out of a log fragment that carries the failure.
///
/// Split out from the file reading so the rule can be tested against the exact lines Docker
/// Desktop wrote on this machine.
pub(crate) fn parse_failure(text: &str) -> Option<(Option<u64>, Option<String>)> {
    let at = text.rfind(ENGINE_OUT_OF_MEMORY)?;
    let line_start = text[..at].rfind('\n').map(|index| index + 1).unwrap_or(0);
    let line_end = text[at..]
        .find('\n')
        .map(|index| at + index)
        .unwrap_or(text.len());
    let line = &text[line_start..line_end];

    let vm = line
        .split("with ram size ")
        .nth(1)
        .and_then(|rest| rest.split_whitespace().next())
        .and_then(|digits| digits.parse::<u64>().ok());

    // The marker is usually on its own line, with the timestamp on the error line above it.
    let before = &text[line_start.saturating_sub(2048)..line_start];
    let at = before
        .lines()
        .rev()
        .take(4)
        .find_map(timestamp)
        .or_else(|| timestamp(line));
    Some((vm, at))
}

/// A leading `[YYYY-MM-DDTHH:MM:SS...` in a log line.
fn timestamp(line: &str) -> Option<String> {
    let rest = line.strip_prefix('[')?;
    let end = rest.find(']')?;
    let candidate = &rest[..end];
    let bytes = candidate.as_bytes();
    let looks_like_time = bytes.len() >= 19
        && bytes.get(4) == Some(&b'-')
        && bytes.get(7) == Some(&b'-')
        && bytes.get(10) == Some(&b'T');
    looks_like_time.then(|| candidate.to_string())
}

#[cfg(any(target_os = "linux", test))]
fn parse_proc_meminfo(text: &str) -> Option<HostMemory> {
    let mut total = None;
    let mut available = None;
    let mut commit_limit = None;
    let mut committed = None;
    for line in text.lines() {
        let Some((key, rest)) = line.split_once(':') else {
            continue;
        };
        let Some(kb) = rest
            .split_whitespace()
            .next()
            .and_then(|value| value.parse::<u64>().ok())
        else {
            continue;
        };
        match key.trim() {
            "MemTotal" => total = Some(kb),
            "MemAvailable" => available = Some(kb),
            "CommitLimit" => commit_limit = Some(kb),
            "Committed_AS" => committed = Some(kb),
            _ => {}
        }
    }
    Some(HostMemory {
        total_mb: total? / 1024,
        available_mb: available? / 1024,
        commit_limit_mb: commit_limit.unwrap_or(total?) / 1024,
        commit_used_mb: committed.unwrap_or(0) / 1024,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn host(total: u64, available: u64) -> HostMemory {
        HostMemory {
            total_mb: total,
            available_mb: available,
            commit_limit_mb: total * 2,
            commit_used_mb: 0,
        }
    }

    #[test]
    fn a_vm_that_needs_more_than_the_free_physical_memory_is_insufficient() {
        let report = host(16_300, 1_800);
        assert_eq!(verdict(&report, Some(3072)), MemoryVerdict::Insufficient);
    }

    #[test]
    fn a_vm_that_fits_without_a_margin_is_only_tight() {
        // Exactly the VM's size: the start still has nothing to run the rest of the machine on.
        assert_eq!(verdict(&host(16_300, 3_072), Some(3072)), MemoryVerdict::Insufficient);
        // Enough for the VM and a little, but not the margin.
        assert_eq!(verdict(&host(16_300, 3_200), Some(3072)), MemoryVerdict::Tight);
        assert_eq!(verdict(&host(16_300, 4_719), Some(3072)), MemoryVerdict::Plenty);
    }

    #[test]
    fn commit_charge_can_be_the_binding_limit_when_physical_memory_looks_fine() {
        let report = HostMemory {
            total_mb: 16_300,
            available_mb: 8_000,
            commit_limit_mb: 4_000,
            commit_used_mb: 3_000,
        };
        // 1 GB of commit is left; 8 GB of physical RAM does not help the VM start.
        assert_eq!(verdict(&report, Some(3072)), MemoryVerdict::Insufficient);
        assert_eq!(report.headroom_mb(), 1_000);
    }

    #[test]
    fn a_wsl_backend_has_no_vm_size_to_judge() {
        let text = r#"{"MemoryMiB": 3072, "WslEngineEnabled": true}"#;
        let (vm, _, hyperv) = parse_settings(text).unwrap();
        assert!(hyperv == false);
        assert_eq!(verdict(&host(16_300, 500), vm), MemoryVerdict::Insufficient);
        // The size is still read; the caller only has to know not to attach it to Hyper-V.
        assert_eq!(vm, Some(3072));
    }

    #[test]
    fn the_docker_desktop_settings_file_is_read_without_being_changed() {
        let text = r#"{"MemoryMiB": 3072, "SwapMiB": 1024, "WslEngineEnabled": false}"#;
        let (vm, swap, hyperv) = parse_settings(text).unwrap();
        assert_eq!((vm, swap, hyperv), (Some(3072), Some(1024), true));
    }

    /// The exact two lines Docker Desktop wrote on this machine at 2026-11-17T20:10.
    const OOM_LOG: &str = concat!(
        "[2026-11-17T20:10:15.824677600Z][com.docker.backend.exe.ipc] (64b2afd5) ",
        "737d2c65-ErrorReportAPI S->C Docker-Desktop/4.94.0 (Windows; x64; GUI) GET /error (0s): ",
        "{\"error\":\"starting engine: engine linux/hyperv failed to start: starting Hyper-V VM: ",
        "status code not OK but 500: Unhandled exception: job failed with message: ",
        "'DockerDesktopVM' failed to start. (Virtual machine ID BECC1636-76B4-4DFF-BB3E-2EB8179FA09F)",
        "\\n\\n",
        "Not enough memory in the system to start the virtual machine DockerDesktopVM ",
        "with ram size 3072 megabytes. (Virtual machine ID BECC1636-76B4-4DFF-BB3E-2EB8179FA09F)",
        "\\n\\n",
        "'DockerDesktopVM' could not initialize memory: Ran out of memory (0x8007000E). ",
        "(Virtual machine ID BECC1636-76B4-4DFF-BB3E-2EB8179FA09F)\"}\n",
    );

    #[test]
    fn the_engine_out_of_memory_line_yields_the_ram_size_and_the_time() {
        let (vm, at) = parse_failure(OOM_LOG).expect("the real failure must be recognised");
        assert_eq!(vm, Some(3072));
        assert_eq!(at.as_deref(), Some("2026-11-17T20:10:15.824677600Z"));
    }

    #[test]
    fn the_marker_on_its_own_line_uses_the_timestamp_above_it() {
        let text = concat!(
            "[2026-11-17T20:10:35.287265800Z][com.docker.backend.exe.state] overwriting desktop ",
            "state error: engine linux/hyperv failed to start\n\n",
            "Not enough memory in the system to start the virtual machine DockerDesktopVM ",
            "with ram size 3072 megabytes.\n",
        );
        let (vm, at) = parse_failure(text).unwrap();
        assert_eq!(vm, Some(3072));
        assert_eq!(at.as_deref(), Some("2026-11-17T20:10:35.287265800Z"));
    }

    #[test]
    fn an_engine_failure_that_is_not_about_memory_is_not_reported_as_one() {
        let text = "[2026-11-17T20:10:00Z] starting engine: failed to start: hypervisor missing\n";
        assert_eq!(parse_failure(text), None);
    }

    #[test]
    fn proc_meminfo_is_read_into_the_same_shape() {
        let text = "MemTotal:       16300100 kB\nMemAvailable:    4019000 kB\n\
                    CommitLimit:    43024000 kB\nCommitted_AS:   34527000 kB\n";
        let report = parse_proc_meminfo(text).unwrap();
        assert_eq!(report.total_mb, 15_918);
        assert_eq!(report.available_mb, 3_924);
        assert_eq!(report.commit_available_mb(), 8_298);
        assert_eq!(report.headroom_mb(), 3_924);
    }
}
