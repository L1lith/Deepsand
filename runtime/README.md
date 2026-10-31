# The sandbox runtime

This directory is the **inside** of the sandbox. Everything Deepsand claims about
containment is either enforced by the files here or by the mount list that
`crates/deepsand-core/src/policy.rs` builds against them.

```
runtime/
├─ Dockerfile                    the whole universe the sandbox can see
├─ bin/
│  ├─ entrypoint.sh              settings, egress rules, privilege drop, exec
│  ├─ netfilter.sh               the network policy, installed as root
│  ├─ ffdec.sh                   the JPEXS FFDec CLI, for exports MCP does not wrap
│  ├─ mcp-reverse.sh             starts mcp-reverse from its writable copy in the state volume
│  ├─ zero-breach.sh             the spyware triage CLI, with the image's indicator sets
│  ├─ patch-deepcode-ink.mjs     repaints one viewport where Ink rewrote the conversation
│  ├─ patch-deepcode-mentions.mjs  builds the @-index after the first frame, not during it
│  └─ deepsand-mcp-bridge.mjs    the API DeepCode asks permission through
├─ skills/
│  ├─ deepsand-permissions/
│  │  └─ SKILL.md                playbook DeepCode loads when it needs access
│  ├─ deepsand-toolbox/
│  │  └─ SKILL.md                what tools this sandbox has and how to ask for one
│  ├─ deepsand-rea/
│  │  └─ SKILL.md                REA's playbook, installed only when rea is selected
│  ├─ deepsand-dejared/
│  │  └─ SKILL.md                Dejared's playbook, installed only when dejared is selected
│  ├─ deepsand-ffdec/
│  │  └─ SKILL.md                FFDec's playbook, installed only when ffdec is selected
│  ├─ deepsand-mcp-reverse/
│  │  └─ SKILL.md                mcp-reverse's playbook, installed only when it is selected
│  └─ deepsand-zero-breach/
│     └─ SKILL.md                the spyware triage playbook, installed only when it is selected
├─ seccomp-hardened.json         opt-in additive seccomp profile
└─ scripts/
   ├─ build-image.mjs            docker build with the configured tag
   ├─ test-mcp-bridge.mjs        drives the bridge against a simulated broker
   └─ make-icon.mjs              regenerates the app icon from code
```

## Building

```bash
node runtime/scripts/build-image.mjs                      # uses the tag in Deepsand's state
node runtime/scripts/build-image.mjs deepsand/runtime:dev # or an explicit tag
DEEPSAND_BUILD_ARGS="--build-arg INSTALL_BUILD_TOOLS=1" node runtime/scripts/build-image.mjs
```

`INSTALL_BUILD_TOOLS=1` adds `build-essential`, `python3` and `pkg-config`, which
roughly doubles the image. It is off by default because most projects install
their own toolchains, and a smaller image is a smaller attack surface.

### How the tool plan reaches the build

The app turns a project's tool selection into build arguments, and three of them are
**comma-separated lists**: `APT_PACKAGES`, `NPM_GLOBALS` and `CARGO_INSTALLS`. Commas
rather than spaces because a build argument is a single argv entry and needs no quoting.

The Dockerfile splits them **once**, at the top of the step that uses them, into the same
names. Do it there and not at each use. The apt branch used to expand `$APT_PACKAGES`
directly, so apt was handed the whole list as one package name:

```
E: Unable to locate package curl,git,jq,ripgrep,unzip,zip
```

Every project whose tools needed an apt package failed to build an image, in four
seconds, with an error that named none of this. `crates/deepsand-core/tests/runtime_dockerfile.rs`
now asserts the split happens before every use, so a new list-valued argument that
forgets to be split fails a unit test instead of a build. The same file is why a failed
build now reports the last lines of its own output.

## The container's startup sequence

`entrypoint.sh` runs as root for exactly three reasons, in this order:

1. **Materialise the settings.** `/etc/deepsand/settings.json` (mounted `:ro` from
   Deepsand's private data directory) is copied to
   `$HOME/.deepcode/settings.json`. Copying rather than mounting directly means
   the sandbox cannot write back to a host-owned file, and the home volume
   always ends up with a usable one. `/etc/deepsand/AGENTS.md` is handled the
   same way.
2. **Install the egress policy.** `netfilter.sh` runs in the container's own
   network namespace. This is *fail-closed*: if the rules cannot be installed the
   container exits rather than running with an open network, unless
   `DEEPSAND_NETFILTER_OPTIONAL=1` was set explicitly.
3. **Adopt the state volume.** A freshly created named volume is root-owned, so
   ownership is fixed before the drop.

Then it drops everything with

```
setpriv --reuid=1000 --regid=1000 --clear-groups \
        --inh-caps=-all --ambient-caps=-all --bounding-set=-all --no-new-privs
```

and `exec`s DeepCode. After that point nothing in the container can run
`iptables`, regain a capability, or become root.

## The TUI renderer patch

The installed CLI renders its TUI with Ink. Ink has a fallback for a frame that is as tall
as, or taller than, the terminal: clear the screen **and the scrollback**
(`ESC[2J ESC[3J ESC[H`) and rewrite the whole static conversation plus the live frame. The
fallback itself is necessary -- a frame taller than the viewport cannot be rewritten in place,
because its top is off screen and moving the cursor up clamps at the first row -- but as a
steady state it is catastrophic. A tall live frame (the process-output panel, a long prompt, a
session list) hits it on every status tick: the screen cannot be read or scrolled, the PTY sees
tens of megabytes of rewritten conversation, and the app's xterm has only one screen to show
for it.

`bin/patch-deepcode-ink.mjs` leaves the rule alone and replaces **what the repaint writes**: the
viewport only (`ESC[H ESC[2J`, never `ESC[3J`), the live frame's last `rows` lines when it is
taller than the screen -- the same lines upstream leaves visible -- and, when the frame fits
again, the last screenful of history above it, bottom-aligned. So a repaint costs one viewport,
never scrolls, and never writes the conversation twice. `--check` also proves the normal
(erase-and-rewrite) path is still byte-for-byte upstream's: only that one branch differs. The
same run undoes the earlier predicate-only patch, because a rebuild that cannot reach the
registry keeps the CLI copy the image already has.

The Dockerfile applies the patch after installing the CLI and then runs `--check`. If the
bundled renderer changes shape, `--apply` refuses and fails the build. Do not weaken that
failure into a warning: an unpatched image looks fine until the next tall view. `--self-test`
runs without the CLI and without Docker, and asserts the bytes: one screenful per repaint, no
scrollback wipe, no scrolling, and a repaint that does not grow with the conversation.

## The mention-index patch

The prompt's `@`-file completion index is built by walking the whole workspace, and upstream
builds it in the **initialiser of a `useState`** -- which runs during the component's first
render, so Ink has no frame to paint until the walk finishes. On a local filesystem that is
milliseconds. The workspace here is a Docker Desktop bind mount, where one directory entry costs
milliseconds: measured from inside a container, 39,192 entries took **2m35s**, and the CLI
painted nothing for the first ~90 seconds of a resume. The operator sees an empty pane with no
status bar and no cursor, and reasonably calls it a hang.

Two things are wrong there, and `bin/patch-deepcode-mentions.mjs` fixes each on its own terms:

* Starting empty is enough, because three lines below the initialiser upstream already runs the
  same scan in a mount effect -- and again when the agent goes idle and when a mention token
  first appears. The first frame stops walking anything.
* The walk descends into dot-directories (`.toolchain`, `.cargo`, `.venv`, `.npm`), which are
  tool state rather than source. This workspace carries a 31,000-file `.toolchain`; the scan's
  cap is on *items* (20,000), so the toolchain consumed the budget and `ui/` and `crates/` were
  never indexed at all. `@` completion was slow *and* wrong. Hidden directories are now skipped
  except the ones that hold source (`.github`, `.vscode`, `.devcontainer`, `.storybook`,
  `.well-known`, `.deepcode`, `.claude`); hidden *files* are untouched, so `.env.example` is
  still offered.

The index is a completion aid, so skipping entries removes nothing from the sandbox: the model
can still read any path it names. `--apply` refuses a bundle it does not recognise, and also
refuses if the mount effect that fills the index has gone (starting empty would then leave it
empty forever). `--check` proves the installed copy carries both edits. `--self-test` runs the
scanner **from the file being patched** against a temporary tree: real source and
`.github/workflows` are found, a 300-file `.toolchain` and a hidden symlink are not, hidden
files still are, and the shipped noisy list still applies.

## The MCP bridge

`deepsand-mcp-bridge.mjs` is a stdio MCP server that DeepCode spawns because
Deepsand puts it in the generated `settings.json` under `mcpServers`. It is
deliberately powerless:

* it can **write** request files into `/deepsand/ipc/requests`
* it can **read** replies from `/deepsand/ipc/responses`
* it can **read** its own description from `/deepsand/state`

The last two are mounted read-only, which is the entire security model of the
permission system in one mount flag: the sandbox can ask, but it cannot answer.

It exposes four tools:

| Tool | Purpose |
| --- | --- |
| `deepsand_sandbox_info` | What can I currently reach? Also the network policy and why. |
| `deepsand_request_directory_access` | "I need `C:\Users\me\brand`" — the operator sees the exact path. |
| `deepsand_request_resource` | "I need the my-website repo but can't see where it is" — the operator gets a folder picker. |
| `deepsand_check_request` | Collect the answer to a request that came back as `PENDING`. |

Because DeepCode caps MCP `tools/call` at 60 s, the bridge waits ~45 s and then
answers `PENDING` with a request id rather than failing the call.

## Agent Skills

The sandbox ships two always-on Agent Skills, `deepsand-permissions` and
`deepsand-toolbox`, installed under `/home/deepcode/.agents/skills/` by the
Dockerfile. The first is the playbook for asking for access: which request tool to
use, how to read an approval reply, and how to handle `PENDING`. The second is what
tools this sandbox has, what each one costs, and how to ask for one.

A tool that carries its own skill gets it only when that tool was selected for the
image. The Dockerfile stages `skills/` outside the discovery roots, installs the
always-on skills, copies a tool's skill (`deepsand-rea`, `deepsand-dejared` or
`deepsand-ffdec`) inside the `case` that matches that tool's id, and then removes the
staging tree. A skill is
instructions the model may act on, so shipping one for a tool the image does not
contain is worse than shipping none: the model reads a playbook for a capability it
cannot use. That is the same rule as the image's `deepsand.tools` label, and
`runtime/skills/deepsand-toolbox` is kept up to date with the catalogue so the model
can request a tool it does not have yet.

**Why a skill and not just `AGENTS.md`.** DeepCode teaches the sandbox about its
permissions through three channels, and they are not equally reliable:

| Channel | Reach |
| --- | --- |
| MCP tool descriptions | Always present — the tools are in the model's tool list every turn. This is why the model always knows the request tools exist. |
| `AGENTS.md` | **Conditional.** DeepCode loads `<project>/AGENTS.md` or `<project>/.deepcode/AGENTS.md` if either exists, and only falls back to `~/.deepcode/AGENTS.md` when the project has neither. Most real repositories ship their own `AGENTS.md`, so the user-level file is silently ignored in exactly the projects that need it most. |
| Agent Skills | Discovered from four roots independently of `AGENTS.md`, and selected by the model from each skill's name and description. |

So the tool descriptions carry the essentials and the skill carries the depth. The
generated `AGENTS.md` cross-references the skill, but nothing depends on that file
being loaded.

### Where DeepCode looks for skills

Scanned in this order, deduplicated by name, first match wins:

```
<project>/.deepcode/skills/<name>/SKILL.md    project, native
<project>/.agents/skills/<name>/SKILL.md      project, interoperable
~/.deepcode/skills/<name>/SKILL.md            user, native
~/.agents/skills/<name>/SKILL.md              user, interoperable
bundled:<name>/SKILL.md                       shipped inside the CLI package
```

Plus `enabledSkills` in settings, which can disable a skill by name.

Deepsand installs at **user level** so nothing is ever written into the operator's
repository. A skill is only picked up if it is a directory containing a readable
`SKILL.md` whose frontmatter has a `name` and a `description`, which is why the
Dockerfile asserts both and fails the build otherwise. Adding
`metadata: { allow-implicit-invocation: false }` to the frontmatter would hide a
skill from automatic selection and require an explicit slash command instead.

### Verifying it

DeepCode's own resolver scans the same roots, so it can be used as the authority.
Note that the bundled `find-skill.js` in `skill-digester` is written as CommonJS
inside a `"type": "module"` package, so running it directly fails; copy it to a
`.cjs` name first:

```bash
docker run --rm --entrypoint sh deepsand/runtime:0.1.0 -c '
  FS=/usr/local/lib/node_modules/@vegamo/deepcode-cli/bundled/skill-digester/scripts/find-skill.js
  cp "$FS" /tmp/find-skill.cjs
  node /tmp/find-skill.cjs deepsand-permissions /workspace'
```

It resolves to `~/.agents/skills/deepsand-permissions/SKILL.md`, scope `user`.

### Testing the bridge

The bridge only talks to the host through those three directories, so the host
broker can be simulated exactly:

```bash
node runtime/scripts/test-mcp-bridge.mjs
```

40 checks covering the handshake, both prompts, approval and denial rendering,
the pending path, hostile input, and a bridge whose spool has gone missing.
