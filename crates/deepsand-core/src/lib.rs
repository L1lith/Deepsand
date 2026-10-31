//! Deepsand core.
//!
//! Everything the desktop app needs in order to run DeepCode inside a container
//! it cannot leave:
//!
//! * [`paths`] validates every host path before it can become a mount.
//! * [`policy`] turns a project plus its grants into an exact `docker run`
//!   argument vector, with no escape hatches.
//! * [`docker`] is a thin, argument-safe wrapper around the Docker CLI.
//! * [`store`] persists projects, grants and settings.
//! * [`broker`] watches the request spool and answers it, which is how the
//!   contained DeepCode asks for more permissions.
//! * [`proxy`] is the allowlisting egress proxy used by the `restricted`
//!   network mode.
//! * [`session`] owns the PTY that the terminal pane renders.
//! * [`seccomp`] proves the profile being applied is the profile the image carries.

pub mod allowlist;
pub mod attachments;
pub mod blocks;
pub mod cli;
pub mod broker;
pub mod covered;
pub mod credentials;
pub mod disk;
pub mod docker;
pub mod error;
pub mod git;
pub mod image_gc;
pub mod model;
pub mod models;
pub mod paths;
pub mod remote;
pub mod policy;
pub mod proxy;
pub mod runtime_files;
pub mod seccomp;
pub mod session;
pub mod secrets;
pub mod settings;
pub mod store;
pub mod toolcache;
pub mod tools;

pub use error::{Result, SandboxError};

use std::time::{SystemTime, UNIX_EPOCH};

/// Milliseconds since the Unix epoch. All timestamps in Deepsand use this so
/// the SolidJS frontend can format them with `new Date(ms)` directly.
pub fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

/// Format a millisecond timestamp as an RFC 3339 UTC string.
pub fn iso_from_ms(ms: i64) -> String {
    // Deliberately hand-rolled: the only requirement is a stable, sortable,
    // human-readable stamp for state snapshots and audit lines.
    let secs = ms.div_euclid(1000);
    let millis = ms.rem_euclid(1000);
    let days = secs.div_euclid(86_400);
    let rem = secs.rem_euclid(86_400);
    let (hour, minute, second) = (rem / 3600, (rem % 3600) / 60, rem % 60);

    // Days since 1970-01-01 -> civil date (Howard Hinnant's algorithm).
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = if m <= 2 { y + 1 } else { y };

    format!("{year:04}-{m:02}-{d:02}T{hour:02}:{minute:02}:{second:02}.{millis:03}Z")
}

/// Parse the UTC timestamp Docker prints into milliseconds since the epoch.
///
/// The inverse of [`iso_from_ms`], and it exists because `docker image inspect` reports
/// `.Created` as RFC 3339 while the image cleanup needs a number to compare against a grace
/// period. Anything finer than a millisecond is dropped.
///
/// It is deliberately strict: a timestamp it does not fully understand is `None`, and callers
/// treat "unknown age" as "do not touch". A lenient parse here decides what gets deleted, so a
/// wrong answer is worse than no answer.
pub fn ms_from_iso(text: &str) -> Option<i64> {
    let bytes = text.as_bytes();
    if bytes.len() < 19 {
        return None;
    }
    for (index, expected) in [(4, b'-'), (7, b'-'), (10, b'T'), (13, b':'), (16, b':')] {
        if bytes[index] != expected {
            return None;
        }
    }
    let digits = |from: usize, len: usize| -> Option<i64> {
        let slice = bytes.get(from..from + len)?;
        if !slice.iter().all(u8::is_ascii_digit) {
            return None;
        }
        std::str::from_utf8(slice).ok()?.parse::<i64>().ok()
    };
    let year = digits(0, 4)?;
    let month = digits(5, 2)?;
    let day = digits(8, 2)?;
    let hour = digits(11, 2)?;
    let minute = digits(14, 2)?;
    let second = digits(17, 2)?;
    if !(1..=12).contains(&month) || !(1..=31).contains(&day) || hour > 23 || minute > 59 || second > 60 {
        return None;
    }

    // Optional fraction, then `Z`. An offset other than UTC is refused rather than guessed at:
    // Docker always prints `Z`, and guessing would shift an age by whole hours.
    let mut index = 19;
    let mut millis = 0;
    if bytes.get(index) == Some(&b'.') {
        index += 1;
        let start = index;
        while index < bytes.len() && bytes[index].is_ascii_digit() {
            index += 1;
        }
        if index == start {
            return None;
        }
        // Take the first three digits and ignore the rest (nanoseconds).
        let fraction = std::str::from_utf8(&bytes[start..index]).ok()?;
        let padded = format!("{fraction:0<3}");
        millis = padded.get(0..3)?.parse::<i64>().ok()?;
    }
    if bytes.get(index) != Some(&b'Z') || index + 1 != bytes.len() {
        return None;
    }

    let days = days_from_civil(year, month, day);
    Some(days * 86_400_000 + (hour * 3600 + minute * 60 + second) * 1000 + millis)
}

/// Days since 1970-01-01 for a civil date (Howard Hinnant's algorithm, the inverse of the one
/// in [`iso_from_ms`]).
fn days_from_civil(year: i64, month: i64, day: i64) -> i64 {
    let year = if month <= 2 { year - 1 } else { year };
    let era = if year >= 0 { year } else { year - 399 } / 400;
    let year_of_era = year - era * 400;
    let day_of_year = (153 * (if month > 2 { month - 3 } else { month + 9 }) + 2) / 5 + day - 1;
    let day_of_era = year_of_era * 365 + year_of_era / 4 - year_of_era / 100 + day_of_year;
    era * 146_097 + day_of_era - 719_468
}

#[cfg(test)]
mod timestamp_tests {
    use super::{iso_from_ms, ms_from_iso};

    /// The one property that matters: a stamp this build writes is a stamp it can read back.
    #[test]
    fn a_stamp_round_trips_through_the_parser() {
        for ms in [0, 1_000, 1_700_000_000_123, 1_767_225_600_000, 1_800_000_000_001] {
            let text = iso_from_ms(ms);
            assert_eq!(ms_from_iso(&text), Some(ms), "{text}");
        }
    }

    /// Docker prints nine fractional digits; comparing nanosecond text lexicographically would
    /// have been the alternative, and this is why it is not one.
    #[test]
    fn docker_nanosecond_stamps_parse_to_milliseconds() {
        assert_eq!(ms_from_iso("2026-10-28T18:30:00.123456789Z"), ms_from_iso("2026-10-28T18:30:00.123Z"));
        assert_eq!(ms_from_iso("2026-10-28T18:30:00Z"), ms_from_iso("2026-10-28T18:30:00.000Z"));
    }

    /// A leap day is the case a hand-rolled civil-date conversion gets wrong.
    #[test]
    fn a_leap_day_is_parsed_as_a_real_day() {
        let leap = ms_from_iso("2024-02-29T00:00:00Z").expect("a leap day is a date");
        let after = ms_from_iso("2024-03-01T00:00:00Z").expect("the next day is a date");
        assert_eq!(after - leap, 86_400_000);
    }

    /// Anything this does not understand must be `None`: the caller keeps such an image.
    #[test]
    fn an_unparseable_stamp_is_refused_rather_than_guessed() {
        for text in [
            "",
            "2026-10-28",
            "2026-10-28T18:30:00+02:00",
            "2026-13-01T00:00:00Z",
            "2026-10-32T00:00:00Z",
            "2026-10-28T25:00:00Z",
            "2026-10-28T18:30:00.Z",
            "not a date at all",
        ] {
            assert_eq!(ms_from_iso(text), None, "{text:?} was accepted");
        }
    }
}
