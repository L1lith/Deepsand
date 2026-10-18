---
name: deepsand-ffdec
description: Analyze, decompile and patch Shockwave Flash (SWF) files inside this Deepsand sandbox with FFDec. Use when a task touches a `.swf` (ActionScript classes, tags, symbols, bytecode, constants, or a patch to a SWF). The `ffdec` MCP tools are the primary interface; the JPEXS FFDec CLI is installed for bulk exports and SWF/XML conversion. Never on the host.
---

# FFDec in this sandbox

Two pieces are installed together when the `ffdec` tool is enabled:

- **ffdec-mcp**, the MCP server. Its tools appear as `mcp__ffdec__*` and are the
  normal way to inspect or edit a SWF.
- **The JPEXS Free Flash Decompiler CLI**, at `ffdec` on `PATH`. It is the upstream
  application, included for the exporters and converters the MCP server does not wrap.
  Do not download it: it is already here.

Both read and write local files. There is no network path for this tool, and a SWF is
data: never execute it, and never assume it is safe because it is old.

## Start with a session

`open_swf` **must** be called before any other operation. It takes an absolute path:

```
open_swf { "file_path": "/workspace/app.swf" }
```

Most other tools take an optional `file_path`; pass it when more than one SWF is open.
`list_sessions` shows what is open, `reload_swf` discards unsaved in-memory changes, and
`close_swf` frees the session. Close sessions you are finished with.

## Reading a SWF

Cheap to expensive, roughly:

1. `get_swf_info` — version, dimensions, frame rate, size.
2. `list_tags` — the internal structure, with tag indices.
3. `list_classes` — ActionScript 3 classes and scripts.
4. `list_symbols` — SymbolClass id-to-class mappings.
5. `list_scripts`, `list_methods`, `get_traits`, `get_class_hierarchy`,
   `get_dependencies`, `get_constant_pool`.
6. `get_tag_details` — one tag by index, when a tag is the thing you care about.
7. `decompile_class`, `decompile_script`, `get_bytecode`.
8. `search_source`, `search_pcode`, `find_class`, `find_methods`,
   `resolve_identifier`, `diff_classes`.

A class name is fully qualified (`com.example.Player`), not a path and not a file name.
If a name is not found, use `find_class` rather than guessing variants.

## Modifying: work on a copy

`save_swf` **overwrites the original when `output_path` is omitted**. Do not rely on
that. Copy the target first, open the copy, and save to the copy or to a new file:

```sh
cp /workspace/app.swf /workspace/app.patched.swf
```

Then call `open_swf` on `/workspace/app.patched.swf` and use `save_swf` with an explicit
`output_path`. The operator's original stays exactly as it was; say in your answer which
file you changed and which file is the untouched original.

The edit tools are `patch_class`, `patch_method`, `patch_bytecode`, `edit_constants`,
`rename_identifier`, `modify_symbol`, `modify_swf_header`, `modify_class_flags`,
`replace_superclass`, `inject_class`, `inject_abc_from_file`, `add_method`, `add_field`,
`add_interface`, `remove_trait`, `remove_tag` and `delete_class`. Prefer the smallest
edit that answers the question. After a patch, re-read the affected class or tag before
saving: a "success" from the patch tool is not evidence that the bytecode is valid.

The server keeps changes in memory until `save_swf`. Reopening the file with
`reload_swf` is the way to start over; it is not a save.

## The CLI, for what the MCP tools do not cover

The MCP surface is analysis, decompilation and in-place editing. The original FFDec also
has bulk exporters and format converters, which are often the right tool for "get me all
the images/sounds/scripts" or "turn this into XML". Use the bundled CLI:

```sh
ffdec -help                 # the command list
ffdec -help -export         # exporter types and formats
```

Examples, with output kept inside the workspace or another writable directory:

```sh
# Scripts, images and shapes into a new directory
ffdec -export script,image,shape /workspace/out /workspace/app.swf

# Every resource except FLA/XFL
ffdec -export all /workspace/out /workspace/app.swf

# Structured dumps and conversion
ffdec -dumpAS3 /workspace/app.swf
ffdec -dumpSWF /workspace/app.swf
ffdec -swf2xml /workspace/app.swf /workspace/app.xml
```

The CLI writes its preferences under `/tmp`, so it starts even though the root
filesystem is read-only. It does not need a display. Do not run the GUI.

If you need an operation neither the MCP tools nor `ffdec -help` offers, say so plainly;
the upstream JPEXS project is at https://github.com/jindrapetrik/jpexs-decompiler, and its
CLI is already installed here. Do not download another decompiler or try to install one.

## Paths and limits

- Use absolute paths under `/workspace` or a granted directory (`/grants/...`).
  A host path is not a path in this namespace.
- Write exports to `/workspace` only when the operator asked for them there; otherwise
  use `$HOME/.deepcode` or `/tmp` and tell them where the output is.
- The CLI can produce large output for a large SWF: export one item type at a time, and
  do not dump every resource just to answer a question about one class.
- The MCP server holds a session per file. Close it when done, especially before
  replacing the file on disk.

## What counts as evidence

- Decompiled ActionScript is **reconstructed source**. Names, comments and some control
  flow are the decompiler's choices; say "decompiled" rather than "the original source".
- P-code (`get_bytecode`, `search_pcode`) and tag dumps are closer to the file. Cite the
  class, method or tag index when a claim depends on them.
- A modification is only known to work when the saved file has been reopened and the
  changed class or tag reads back correctly. Do not report a patch as verified from the
  patch call alone.
