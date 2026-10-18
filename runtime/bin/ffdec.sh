#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# The JPEXS FFDec command-line decompiler.
#
# ffdec-mcp exposes the analysis and edit surface over MCP, but the upstream
# decompiler also has bulk exporters and format converters that the MCP server
# does not wrap: images, sounds, shapes, scripts, SWF/XML, tag dumps. This wrapper
# gives the agent those commands without asking it to download anything at run
# time, and it uses the Java 25 runtime the image keeps beside the tool rather
# than the system Java (which may be a different version, or absent).
#
# HOME points into the writable tmpfs: the root filesystem is read-only at run
# time, and FFDec writes preferences and logs under the user's home. Keeping that
# in /tmp means the CLI can start without touching the image or the project.
# ---------------------------------------------------------------------------
set -euo pipefail

java=/opt/java25/bin/java
jar=/usr/local/share/ffdec/ffdec-cli.jar

if [ ! -x "$java" ] || [ ! -f "$jar" ]; then
  echo "ffdec: the FFDec CLI is not installed in this image." >&2
  echo "ffdec: enable the 'ffdec' tool for this project and rebuild the sandbox image." >&2
  exit 1
fi

home="${TMPDIR:-/tmp}/ffdec-home"
mkdir -p "$home"

# FFDec writes `./logs` relative to its working directory. The container's default
# working directory is `/workspace`, which is the operator's project and may be
# read-only to the sandbox; run from the writable home instead. Every path the agent
# passes is absolute, so the working directory does not change what it can reach.
cd "$home"

# Jansi loads a native library from a temporary directory, and it has to be executable.
# /tmp is mounted noexec in this sandbox. The state volume at /home/deepcode/.deepcode
# is writable and executable, so use a subdirectory there; if it is not writable (a
# host running this image outside Deepsand), fall back to /tmp. The CLI still works
# without Jansi; it only loses coloured output.
jansi_tmp=/home/deepcode/.deepcode/ffdec-tmp
if ! mkdir -p "$jansi_tmp" 2>/dev/null; then
  jansi_tmp="$home/jansi"
  mkdir -p "$jansi_tmp"
fi

HOME="$home" exec "$java" \
  -Djansi.tmpdir="$jansi_tmp" \
  -Djava.awt.headless=true \
  -jar "$jar" "$@"
