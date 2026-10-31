---
name: deepsand-mcp-reverse
description: Reverse-engineer local binaries inside this Deepsand sandbox with mcp-reverse. Use when a task needs static analysis of a PE, ELF, Mach-O, DEX/APK, .NET, WASM or Unity/Unreal artifact: format and section layout, imports/exports, entropy and packer triage, strings and embedded indicators, YARA matching, disassembly, function diffing, or a search over a 4,200-entry RE knowledge base. The `mcp-reverse` MCP tools are the primary interface; the decompiler bridges to Ghidra, IDA, Binary Ninja, x64dbg and Frida need those tools running on the operator's machine and are not reachable from here.
---

# mcp-reverse in this sandbox

The server is installed in the image and started from a writable copy in this
project's state volume, so its database, caches and signature store work with a
read-only root filesystem. Its tools appear as `mcp__mcp-reverse__*`.

Do not run `npm install`, `npx` or anything that downloads. There is exactly one
copy of the server, it is already running, and a second one would be a different
version from the one this sandbox was built with.

## What runs here, and what does not

**Here**, in-process, on local files: every native parser (PE/COFF, ELF, Mach-O
including fat slices, DEX/APK, .NET metadata, WASM, ZIP and other containers,
Minidump, PDB, DWARF, Unity `global-metadata.dat`, Unreal `.pak`/`.uasset`/`.fname`),
entropy and packer triage, Rich Header and debug-directory recovery, imports and
exports, string extraction and XOR decryption, crypto-constant scanning, YARA
rules, an x86-64 and ARM64 disassembler and mini-emulator, ROP gadget search,
function-level binary diffing, and the SQLite skill library.

**Not here**: the decompiler bridges. `ghidra_*`, `ida_*`, `binja_*`, `x64dbg_*`,
`dnspy_*`, `ilspy_*`, `reclass_*_live`, `ce_*` and the Frida helpers talk to a
plugin running inside one of those applications over `localhost`. None of those
applications exist in this container, and nothing outside the container is
reachable. `bridge_health_all` says so. Treat a bridge call as unavailable rather
than retrying it, and do not offer to install the host half: installing it is the
operator's job on their own machine, and this sandbox cannot reach it anyway.

`smart_decompile` and `hub_consensus_call` pick a bridge automatically. With no
bridge running they have nothing to pick, so prefer the native tools and say
plainly that a decompiler would have to run on the host.

## Working order

Cheap to expensive, and stop as soon as the question is answered:

1. `analyze_binary` — one call for format, sections, entropy, imports, strings of
   interest, crypto constants and a security-mitigation summary.
2. The format-specific parser (`pe_*`, `elf_*`, `macho_*`, `dex_*`, `dotnet_*`,
   `apk_*`, `wasm_*`) for whatever `analyze_binary` flagged.
3. Targeted searches: `aob_scan`, `yara_scan`, `string_*`, `xref_*`, `disasm_*`.
4. The knowledge base when the question is "how is this technique usually
   done": `db_search` and `db_stats`, which read the shipped SQLite library
   (FTS5, instant). `bm25_search` indexes a loose `skills/` tree that this image
   does not carry, so it returns no hits here — use `db_search`.
5. `bindiff` / `compare_binaries` only when two builds are genuinely in hand.

## Paths and outputs

Every path is absolute, inside `/workspace` or a granted directory; a host path
such as `C:\Tools\target.exe` is not a path here and has to be dropped into the
workspace first. Read-only mounts mean an artifact may be visible and not
writable — write results to the workspace.

Some tools write working state (`sig_make`, the chunk store, `cache_*`): it goes
to this project's state volume, not into the project. If the operator asked for a
file, write it to a workspace path and say which one.

## Large answers

Results over roughly 16 KiB are stored and returned as a header plus a cursor.
Follow up with `chunk_fetch` rather than re-running the analysis, and use
`cache_stats` / `cache_clear` if the decompile cache is large.

## Scope

Analyse artifacts the operator owns or is authorized to examine. This sandbox
does not reach the operator's machine, so an answer cannot modify anything
outside `/workspace` and the granted directories; do not write code whose purpose
is to run inside somebody else's game or service.
