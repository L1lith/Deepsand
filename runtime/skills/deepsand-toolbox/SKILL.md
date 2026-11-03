---
name: deepsand-toolbox
description: What tools this Deepsand sandbox has, what it could have, and how to get one, plus how to use the operator's saved secrets. Use when a command fails with "not found" for a program, when you are about to install something with a package manager, when you need to know whether a compiler or runtime is available, when you need an API key or other credential, before telling the user that a language or tool is unsupported, or before printing any value that came from the environment.
---

# What is in the box

This sandbox's container image was built for this project, with the tools the operator selected and any Debian packages they approved. That set is fixed while the sandbox runs.

**You cannot install anything into this sandbox.** It runs as an unprivileged user over a read-only root filesystem, so `apt-get install`, `apt-get update`, `dpkg -i` and `npm install -g` cannot write where they would have to. `apt` fails immediately with `Could not open lock file /var/lib/dpkg/lock-frontend ... Permission denied` or `List directory /var/lib/apt/lists/partial is missing` — that is not a missing permission you can work around, it is the sandbox. Asking is the only supported way to add something, and it is installed into the image, not into the running container.

## Check before you assume

Call **`deepsand_sandbox_info`**. It lists the tools *and the extra Debian packages* this sandbox was built with. That output is the truth; do not infer from what a typical machine has, and do not assume a tool is missing just because a command failed — read the error.

Note that a tool being absent is not an accident or an oversight. The operator chose the set, and the image is deliberately small.

## Asking for a tool

Use **`deepsand_request_tool`**:

```
tools:   ["python"]
purpose: "running the project's build script"
```

Ask for everything you know you need in one request. `tools` takes a list, and three separate requests for three tools waste three of the operator's decisions.

An approved tool is added to the project's image. **It is not installed yet.** The image has to be rebuilt and the sandbox restarted, which the operator does from the Tools tab. The reply says so explicitly. Do not retry the command that needed it, and do not try to install it yourself in the meantime — report that it is approved and pending a rebuild, and carry on with something else.

## Asking for a Debian package

The catalogue above is a fixed list; a package it does not mention is requested by name, with **`deepsand_request_packages`**:

```
packages: ["graphviz", "libpq-dev"]
purpose:  "rendering the dependency graph the README promises"
```

Names are exactly as apt writes them: lower case, digits, `+`, `-` and `.` only. `graphviz` and `libjq1` are package names; `apt-get install graphviz`, `graphviz=2.42` and `graphviz:amd64` are not, and are refused rather than guessed at. Ask for everything you need together — a library and the tool that links it are one request, not two.

What happens next is the same as for a tool: the package is added to the project, installed the next time the image is built, and usable only after the sandbox has been rebuilt and restarted. It is **not** on `PATH` yet. Do not retry the command that needed it, and do not try to fetch or unpack it yourself: dependencies, `PATH` and library locations are what the package manager exists to get right, and a hand-unpacked copy is a support case rather than a tool.

## A bin directory of your own

`~/.deepcode/bin` is on `PATH` — first, ahead of the image — and it is writable. A shell script, a compiled binary, or a copy of a virtualenv's entry point that you put there is found by your later commands, with no permission needed: it changes nothing outside this sandbox, and no host path or Deepsand credential is involved. It lives in this project's session volume, so it survives a restart, and it goes when that volume is wiped.

Two things to keep in mind:

- Because it comes first, a file there **shadows** an image tool of the same name for every later command. Do not shadow something the sandbox gave you — if `python` is installed, do not put your own `python` there.
- It is not how the image gains a tool. A command you write belongs to this project's sandboxes; it is not in the image, so a different project will not have it. Ask for `deepsand_request_tool` or `deepsand_request_packages` when the image should carry it.

### Python packages: use a virtualenv

Debian's `pip` refuses to install into the system interpreter (`error: externally-managed-environment`, PEP 668), and `pip install --user` would write to `~/.local`, which is part of the read-only image. Neither is a bug you can work around with `--break-system-packages`: the right answer is a virtualenv, which needs no root and no permission.

```bash
python -m venv ~/.deepcode/venv            # or /workspace/.venv, which travels with the project
~/.deepcode/venv/bin/pip install -r requirements.txt
~/.deepcode/venv/bin/python script.py
```

Put the venv in `~/.deepcode` or the workspace, **not in `/tmp`**: `/tmp` is mounted no-exec, so `venv/bin/pip` there fails with `Permission denied` even though the venv was created fine. If you want one of its commands bare on `PATH`, link it into your bin directory (`ln -s ~/.deepcode/venv/bin/graph-easy ~/.deepcode/bin/`).

## The catalogue

These are the ids. Anything not in this list does not exist as far as Deepsand is concerned.

**Commonly selected** — do not assume they are here; `deepsand_sandbox_info` reports the tools this image actually has:

| id | what it is |
|---|---|
| `git` | version control, with a sane sandbox identity configured |
| `jq` | JSON processing |
| `ripgrep` | fast recursive search — prefer it to `grep -r` |
| `curl` | HTTP client |
| `zip` | `zip` and `unzip` |
| `htmlq` | CSS-selector queries over HTML |

**Capabilities** — not a language or a utility, but something this sandbox can be given:

| id | what it is | notes |
|---|---|---|
| `xvfb` | a virtual display | a screen that exists only inside this container; nothing appears on the operator's screen. Provides `Xvfb`, `x11-utils` and `x11-apps` |
| `puppeteer` | a browser driven from Node | bundles a browser as well as the Node package: about 850 MB of image and a couple of minutes of building, which is worth telling the operator when you ask for it. See below before promising a screenshot |
| `web-search` | DeepCode's own web search | needs the vendor's API, so it also opens that API in the network filter while it is on |
| `wrangler` | Cloudflare's CLI | Workers, Pages, KV, R2 and D1 |

**Reverse engineering** — for taking a shipped artifact apart:

| id | what it is | notes |
|---|---|---|
| `rea` | REA, for reverse engineering shipped applications and binaries | a local analysis toolkit and MCP server for Electron/JavaScript bundles, .NET assemblies, Go and Rust binaries, archives and PE resources. Native decompilation still needs Ghidra/Hopper/IDA, which this image does not carry. When it is enabled, the `deepsand-rea` skill is installed with it |
| `dejared` | Dejared, for inspecting and decompiling Java JARs | an MCP server with its own Java 17 runtime and decompiler JAR: list packages and resources, search classes and strings, read metadata, and decompile with CFR, Vineflower or Procyon. Ordinary JARs (classes at the root) work directly; a Spring Boot fat-jar, WAR/EAR or AAR stores classes behind a nested prefix and has to be unpacked first. When it is enabled, the `deepsand-dejared` skill is installed with it |
| `ffdec` | FFDec, for Shockwave Flash (SWF) | an MCP server built from ffdec-mcp, plus the JPEXS FFDec CLI: inspect tags, classes, symbols and methods, decompile ActionScript, search source and P-code, patch classes/methods/constants, and save a copied SWF. The CLI covers the bulk exporters and SWF/XML conversion the MCP surface does not wrap. When it is enabled, the `deepsand-ffdec` skill is installed with it |
| `mcp-reverse` | mcp-reverse, a reverse-engineering workbench | a source-built MCP server on its own pinned Node 24 runtime: native PE/ELF/Mach-O/DEX/.NET/WASM parsers, entropy and packer triage, YARA, x86-64 and ARM64 disassembly and emulation, function diffing, and a searchable 4,200-skill knowledge base. Its Ghidra/IDA/Binary Ninja/x64dbg/Frida bridges need those tools on the operator's machine and report `unavailable` here — do not offer to install them. When it is enabled, the `deepsand-mcp-reverse` skill is installed with it |

**Cyber security** — for deciding whether a device or a collection shows signs of intrusion:

| id | what it is | notes |
|---|---|---|
| `zero-breach` | the Zero Breach Toolkit, for mercenary-spyware indicators | a read-only Python CLI on `PATH` as `zero-breach`, with the published indicator sets downloaded when the image was built. It checks the computer it runs on — browser profiles and caches, files, hosts entries, DNS records, startup entries — and, pointed at a phone or a folder, an AndroidQF collection, an iPhone backup or extracted file system, a sysdiagnose archive or copies of suspect files. It reports what it could not check as a gap rather than as clean. Inside this sandbox the computer it runs on is the container, so a whole-computer scan is one the operator runs on their own machine; here it checks evidence placed in the workspace. Made by @archive.genocide on Instagram. When it is enabled, the `deepsand-zero-breach` skill is installed with it |

**Available on request:**

| id | what it is | notes |
|---|---|---|
| `node` | Node.js | already in the base image; enabling pins a current line |
| `npm` | npm | |
| `python` | Python 3 with pip and venv | `python`, `python3`, `pip` and `pip3` are all on `PATH`; `python -m venv` works |
| `cargo` | Rust toolchain via rustup | large; the first build is slow |
| `go` | Go toolchain | |
| `brew` | Homebrew on Linux | installs into the sandbox user's home, so it works without root |
| `nix` | Nix with flakes | large |

**Not available here:** `apk`. It is Alpine's package manager and this image is Debian, so it could never install anything. If you see it greyed out, that is why.

**Not available here either: `apt` as a tool you can turn on.** apt is on the image, but it cannot install anything from inside a session — no root, read-only root filesystem. There is no switch to find. Individual Debian packages are requested by name with `deepsand_request_packages`, above.

## A screen, and a browser

`xvfb` and `puppeteer` are two different things and a browser on Linux wants both: one is the
screen, the other is the program that draws into it. Neither tells you about the other, so use the
checks below rather than assuming in either direction.

- The screen: `deepsand-display` reports it, starts or restarts it at a size, and stops it —
  `deepsand-display 1440x900`. Nothing appears on the operator's screen; you take screenshots of
  the display itself. Restarting it at a new size drops whatever was drawing into it.
- The browser: when `puppeteer` is on, this image carries a browser as well as the Node package.
  It is fetched while the image is built, into this user's cache, so nothing has to be downloaded
  while you work. `node -e "console.log(require('puppeteer').executablePath())"` prints where it is.

### Launch it with `--no-sandbox`

A browser keeps its own sandbox using user namespaces, and this container does not allow those:

```
const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
```

Without that flag the launch fails with "Failed to launch the browser process" and nothing that
explains why. It is a property of this sandbox, not of the browser or of your code.

Write screenshots into the workspace — `/workspace/shot.png` — and not into `/tmp`, which is
mounted no-exec here. A screenshot the operator cannot open is not a visual check.

**Check before you promise.** Both checks are cheap:

```
node -e "console.log(require('puppeteer').executablePath())"   # is there a browser, and where
```

```
deepsand-display                                               # is there a screen, and at what size
```

If the binary the first command names is missing, or it is there and will not start, that is a real
gap in the image rather than a fact about the machine: say which check failed and what it said, and
ask the operator for it. What is not acceptable is reporting "this sandbox has no browser" when
`puppeteer` is in the list above, or describing a screenshot you could not take as though you had
seen the page.

## Secrets in the environment

The operator can store credentials for this project: an API key, a database URL, a
deploy token. They arrive as **environment variables**, so you do not need a file and
you should not ask for one.

Read them the ordinary way for your language:

- shell: `"$MY_API_KEY"`
- Python: `os.environ["MY_API_KEY"]`
- Node: `process.env.MY_API_KEY`

`deepsand_sandbox_info` lists which secret *names* are present. It never shows values,
and neither does Deepsand's own interface: there is no way to read one back, only to
replace it.

### Never print a secret

Do not echo, log, print, or pass a secret where the command line shows it. Deepsand
redacts values it recognises from your terminal output, but treat that as a backstop
rather than a licence: redaction works per output chunk, so it is not a guarantee, and
it does not cover anything you write into a file in the workspace.

In particular:

- Do not commit a secret, and do not write one into a `.env`, a config file, or a test
  fixture. It is already in the environment, so putting it in the workspace converts a
  managed secret into one that gets pushed to a remote.
- Do not paste a secret into a message, an issue, or a comment.
- Do not run `env` or `printenv` to see what is available. That prints every secret at
  once. To check for presence rather than value, test it:

  ```
  [ -n "$MY_API_KEY" ] && echo "MY_API_KEY is set"
  ```

### If a secret is missing

Missing means the operator has not added it, or the sandbox has not been restarted
since they did. Say which name you need and what for. Do not invent a placeholder and
do not fall back to a public test key: a silent fallback hides the problem until it
fails somewhere worse.

### Secrets and the network

A secret is only useful to you if its destination is reachable, and a broad egress
rule is the way a secret leaves. If you need both, ask for the narrowest host that
works. The operator is warned when an allowlist entry is wide enough to make
exfiltration easy, and that warning is about exactly this.

## Working with what you have

- **`git` is preconfigured.** The sandbox has its own committer identity, deliberately not the operator's — commits you make are attributed to the agent, not forged under their name. `safe.directory` is set so git works on the bind-mounted workspace.
- **There is no `sudo`, no Docker socket, and no way to become root.** Every tool installs into the sandbox user's home.
- **`ripgrep` is faster and is the expected choice** for searching. Prefer it to `grep -r` and to `find`.
- **`jq` is the expected way to read JSON**, including API responses.

## What not to do

- Do not run `apt-get install`, `apt-get update`, `dpkg -i` or `pip install --system`: they cannot write here, and the error they print names a lock file or a missing directory rather than the real reason. Ask instead.
- Do not report a language as unavailable before calling `deepsand_sandbox_info`. It may already be there.
- Do not request a package for something the catalogue already has as a tool, and do not request a tool for a package that is really a plain Debian package. One request each, to the thing that actually installs it.
- Do not request tools or packages "just in case". Each one enlarges the image and the operator has to decide about it.


## Tools can arrive while you are running

A sandbox can be started before its tools have finished building, so that nobody waits ten minutes
for a compiler. The tools are then compiled behind you and copied into this container when they
are ready: it does not restart, and neither does your session.

What that means in practice:

- `deepsand_sandbox_info` lists the tools this sandbox was built with. If it lists one that is
  not actually on `PATH` yet, the build has not finished. Try again in a minute or two rather
  than reporting the tool as missing.
- Only compiled binaries and npm globals arrive this way. A tool installed as a system package,
  and every Debian package from `deepsand_request_packages`, is part of the image: it needs the
  sandbox rebuilt and restarted, which the operator does from Deepsand.
- None of this is a failure and none of it needs reporting as one. Do not install, reinstall or
  work around a tool that is listed but not yet present -- wait, then use it.
