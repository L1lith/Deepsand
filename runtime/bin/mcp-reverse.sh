#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# mcp-reverse, started from a writable copy.
#
# mcp-reverse writes beside its own code. Its skills database is SQLite in WAL
# mode, so opening it read-only still needs `-shm`/`-wal` side files next to it;
# its signature store accepts new entries; and its decompile cache, chunk store,
# audit log, agent mesh and memory store all live under the install root. This
# sandbox has a read-only root filesystem, so a server left at
# /usr/local/share/mcp-reverse starts and then fails on the first tool that
# writes -- with an error about a database, not about the sandbox.
#
# So this launcher copies the image's tree into the per-project state volume
# once per image build and runs it from there. The copy is stamped with the
# build that produced it: a rebuild changes the stamp, and the next start
# replaces the old copy rather than running a server from a previous version.
#
# The state volume, not /tmp: the decompile cache, the memory store and the
# agent mesh are meant to outlive a container. `/tmp` is the fallback only for a
# host running this image by hand, where there is no state volume at all.
# ---------------------------------------------------------------------------
set -euo pipefail

image_root=/usr/local/share/mcp-reverse
node=/opt/node24/bin/node
stamp_name=.deepsand-build

if [ ! -x "$node" ] || [ ! -f "$image_root/dist/index.js" ]; then
  echo "mcp-reverse: the server is not installed in this image." >&2
  echo "mcp-reverse: enable the 'mcp-reverse' tool for this project and rebuild the sandbox image." >&2
  exit 1
fi

# The stamp is a file the image writes at build time. Asking the copy for its
# version would require the copy this is deciding whether to make.
stamp=$(cat "$image_root/$stamp_name" 2>/dev/null || echo unknown)

# The per-project state volume, which is where DeepCode's own session state
# lives and the one directory this sandbox may write to that outlives a
# container. The override is for the build's own check, which must not fill the
# image with a copy; it is deliberately *not* `DEEPSAND_STATE_DIR`, because that
# name already means the read-only state mount at /deepsand/state in the bridge.
state_root=${DEEPSAND_MCP_REVERSE_DIR:-/home/deepcode/.deepcode}
root="$state_root/mcp-reverse"
if ! mkdir -p "$root" 2>/dev/null; then
  root="${TMPDIR:-/tmp}/deepsand-mcp-reverse"
  mkdir -p "$root"
fi

if [ "$(cat "$root/$stamp_name" 2>/dev/null || true)" != "$stamp" ] || [ ! -f "$root/dist/index.js" ]; then
  staging="$root.new"
  rm -rf "$staging" "$root.old"
  mkdir -p "$staging"
  cp -a "$image_root/." "$staging/"
  printf '%s\n' "$stamp" > "$staging/$stamp_name"
  if [ -e "$root" ]; then
    mv "$root" "$root.old"
  fi
  mv "$staging" "$root"
  rm -rf "$root.old"
fi

# Set here rather than in the generated settings: the directory this script
# creates and the directory the server writes to have to be the same string,
# and only this script can create it. `MCP_TRANSPORT` is explicit because the
# default is HTTP-less stdio but an inherited value would make the server bind
# a port instead of speaking the protocol DeepCode speaks.
export MCP_TRANSPORT=stdio
export MCP_AUDIT_DIR="$root/.audit"
export MCP_AGENT_MESH_DIR="$root/.agent-mesh"
export MCP_MEMORY_DIR="$root/.memory"
mkdir -p "$MCP_AUDIT_DIR" "$MCP_AGENT_MESH_DIR" "$MCP_MEMORY_DIR"

exec "$node" "$root/dist/index.js" "$@"
