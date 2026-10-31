#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Zero Breach Toolkit, with the indicator sets this image was built with.
#
# The toolkit is a Python CLI: there is nothing to start and nothing to watch.
# Two things make a wrapper worth having.
#
# First, `-X utf8` is not optional. Reports and evidence paths are UTF-8, and a
# sandbox whose locale is not UTF-8 would otherwise mangle both.
#
# Second, the indicator cache. `--update` is a separate network step, and the
# image runs it while it is being built, so the published sets live in the image
# and every scan searches them with no route to the publisher sources. Naming
# that cache here is what turns a scan from "29 sources not downloaded" -- which
# the tool reports as a gap, correctly -- into an actual check.
#
# `--update` is left alone. It writes, and the shipped cache is on a read-only
# image, so a caller who really means to refresh has to name a writable cache
# with --indicator-cache and have egress; neither is the default, and the skill
# that ships with this tool says so.
# ---------------------------------------------------------------------------
set -euo pipefail

root=/usr/local/share/zero-breach-toolkit
tool="$root/scan/zero-breach-toolkit.py"
python=/usr/bin/python3
cache="$root/indicators"

if [ ! -x "$python" ] || [ ! -f "$tool" ]; then
  echo "zero-breach: the toolkit is not installed in this image." >&2
  echo "zero-breach: enable the 'zero-breach' tool for this project and rebuild the sandbox image." >&2
  exit 1
fi

# A read-only root filesystem cannot hold the bytecode cache, and a failed write
# there is noise rather than information.
export PYTHONDONTWRITEBYTECODE=1

for arg in "$@"; do
  if [ "$arg" = "--update" ]; then
    exec "$python" -X utf8 "$tool" "$@"
  fi
done

# The shipped cache goes first and argparse keeps the last value, so a caller
# who names their own --indicator-cache still wins.
exec "$python" -X utf8 "$tool" --indicator-cache "$cache" "$@"
