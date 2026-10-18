---
name: deepsand-dejared
description: Explore and decompile Java `.jar` archives inside this Deepsand sandbox with Dejared. Use when the task touches the inside of a JAR; when a third-party Java library ships without sources; when you need a class's metadata, method signatures or annotations; when you need a config embedded in a JAR (`application.yml`, `MANIFEST.MF`, `spring.factories`); or when following a stack trace into a dependency. Prefer these tools to `jar tf`, `unzip`, `javap` or running a decompiler by hand. For a Spring Boot fat-jar, WAR, EAR or AAR, unpack the nested classes first. Never on the host.
---

# Dejared in this sandbox

Dejared is installed in this image because the operator enabled the `dejared` tool
for this project. It runs here, inside the container, and reads archives that are
already mounted here. A host path is not a path in this namespace.

The MCP server is registered as `dejared`, so its tools appear as
`mcp__dejared__<tool_name>`. Its JAR is already in the image: do not run `npx
dejared-mcp`, do not download a JAR, and do not install Java or a decompiler. The
image carries a Java 17 runtime and one version of the decompiler JAR, and the tool is
rebuilt as a unit.

## Use the cheap tool first

| You would reach for | Use this instead |
| --- | --- |
| `jar tf some.jar` | `list_packages` / `list_classes` |
| `jar tf some.jar \| grep -v .class` | `list_resources` |
| `unzip -p some.jar application.yml` | `read_resource` |
| `jar tf some.jar \| grep -i Foo` | `search_class` |
| `strings some.jar \| grep http` | `search_string` |
| `javap -p com.foo.Bar` | `get_metadata` |
| `javap -p` over a package | `dump_package_metadata` |
| Running CFR/Vineflower/Procyon by hand | `decompile_class` |

Every call takes an **absolute path** to the archive. The tools are:

| Tool | Cost | Purpose |
| --- | --- | --- |
| `dejared_list_packages` | cheap | packages with class counts |
| `dejared_list_classes` | cheap | classes in a package; `recursive=true` for sub-packages |
| `dejared_list_resources` | cheap | non-class resources and sizes |
| `dejared_read_resource` | cheap | text resource from inside the archive |
| `dejared_search_class` | cheap | class-name search |
| `dejared_search_string` | cheap | string literals in bytecode |
| `dejared_get_metadata` | cheap | one class: hierarchy, annotations, fields, signatures (ASM, no decompilation) |
| `dejared_dump_package_metadata` | cheap | metadata for a batch of packages |
| `dejared_decompile_class` | expensive | Java source for one class (CFR by default) |

Metadata often answers the question without decompilation. When it does not, decompile
one class at a time. A whole JAR is not a decompilation request: start from a class the
metadata or a search result named.

## Workflows

**Explore** — map the archive before reading code:

`list_packages` → `list_classes` (`recursive=true` where useful) → `list_resources` →
`read_resource` for configs → `dump_package_metadata` for the packages that matter →
`decompile_class` only where a method body is actually needed.

**Hunt** — start from a name or a literal:

`search_class` or `search_string` → triage the matches → `get_metadata` on the
promising ones → `decompile_class` only for the class whose behavior is the question.

**Deep analysis** — one class:

`get_metadata` → `decompile_class` with CFR → cross-reference with `search_class` or
`dump_package_metadata` if needed.

## Decompiler engines

`decompile_class` accepts an engine. Start with **CFR** (the default). If the output is
broken — missing method bodies, `goto` statements, garbled lambdas — retry with
**Vineflower** (better for records, sealed classes and newer Java features) or
**Procyon** (some obfuscated or edge-case bytecode). Say which engine produced the
source you quote.

The server's own decompilation timeout is 30 seconds, and DeepCode caps one MCP call at
60 seconds. A class that does not decompile in that budget is a result to report, not a
reason to retry the whole archive in one call.

## Archive layouts

These tools resolve a class name to `<name with / instead of .>.class` at the **root** of
the archive. That is the ordinary JAR layout, and decompilation works there.

Some archives put their classes behind a container prefix. `list_packages` still shows
them, but `list_classes` and `decompile_class` take a Java package name and cannot use a
hyphenated prefix such as `BOOT-INF.classes`. Unpack first; `unzip` and `zip` are in this
image when Dejared is enabled.

- **Spring Boot fat-jar** — application classes are under `BOOT-INF/classes/`, and
  dependencies are plain JARs under `BOOT-INF/lib/`:

  ```bash
  mkdir -p /tmp/app && cd /tmp/app
  unzip -q /workspace/app.jar 'BOOT-INF/classes/*' -d /tmp/app
  (cd /tmp/app/BOOT-INF/classes && zip -qr /tmp/app-classes.jar .)
  ```

  Inspect `/tmp/app-classes.jar` with the tools. The JARs under `BOOT-INF/lib/` can be
  extracted and inspected directly; they already have classes at their root.

- **WAR/EAR** — classes are under `WEB-INF/classes/`, dependencies under
  `WEB-INF/lib/`. Extract `WEB-INF/classes` and repackage it the same way.
- **AAR** — classes are in the nested `classes.jar`:
  `unzip -p /workspace/library.aar classes.jar > /tmp/classes.jar`.

Extracting into `/tmp` is safe here: it is writable and no-exec, and it keeps the
operator's repository untouched. If a class is in one of these layouts, say which one and
unpack it; do not report the server as broken.

## What counts as evidence

- Decompiled Java is **reconstructed source**, not the source that was compiled.
  Variable names, comments and some control flow are the decompiler's choices.
- Name the archive, the class, the tool and the engine behind a claim. "`Foo` calls
  `bar` in `com.example.Foo`" is a finding; "the library probably does X" is not until
  the bytecode or metadata shows it.
- Keep the server's reported limitations. A class that is absent from a listing is not
  proof that it does not exist in a nested archive or in a shaded dependency.
- Reading a resource or a class does not execute the archive. Do not launch a JAR's
  `main` class as part of decompilation; that is a different request, and it belongs in
  the sandbox's normal process controls.

## Paths, limits, and permissions

- The workspace is `/workspace`; operator-granted directories are under
  `/grants/<name>`. Use absolute paths inside those trees.
- A library in `~/.m2/repository` or `~/.gradle/caches` exists here only if the
  workspace contains it or the operator granted that directory. Do not assume the
  host's Maven or Gradle cache is visible.
- Resource reads are size-capped by the server. If a resource is reported as too
  large, say so rather than trying to read it in pieces with a shell tool.
- Dejared does not widen this sandbox's network policy. It reads local files; if the
  archive you need is outside the mounts, use the `deepsand-permissions` skill.
- The decompiler's cache and log paths are set by the generated settings. Do not
  change them; `/tmp` is the writable log location and the JAR comes from the image.

## When an MCP call does not work

A missing `mcp__dejared__*` tool is not a reason to install anything. Check whether the
tool is actually enabled with `deepsand_sandbox_info`; if it is listed but the tools are
absent, the server did not start, and that is worth reporting rather than working
around. Do not run `npx`, do not download the release JAR, and do not start a Java
server by hand: the image already contains the one this sandbox was built with.
