# AGENTS.md

How to change **Deepsand itself** — a Tauri desktop app that runs the DeepCode
CLI inside a Docker container it cannot escape.

This file is for anyone, human or agent, editing this repository. It is not the
document the contained model receives; that one is generated per project at run
time. See [Two AGENTS.md files](#two-agentsmd-files) before you confuse them.

## Get running

```bash
npm install
npm run runtime:build   # build the sandbox image (once, ~3 min, needs Docker)
npm run app:dev         # app with hot reload
```

`npm run runtime:build` needs Docker running. `npm run core:check`,
`npm run core:test` and `npm test` do not — the Rust tests never call Docker.

## Commands

| Command | What it does |
| --- | --- |
| `npm run app:dev` | Tauri app with hot reload. It first runs `scripts/free-port.mjs 1420`, because `strictPort` makes a vite left over from an interrupted run either a failed launch or, worse, a window on a stale bundle |
| `npm run app:build` | platform installer |
| `npm run core:test` | `cargo test -p deepsand-core` — 374 tests |
| `npm run app:test` | `cargo test -p deepsand-app` — the app crate's own tests, including the zombie guard. Part of `npm test`: it was not, and tests that never run are decoration |
| `npm run core:check` | `cargo check --workspace` |
| `npm run clean:dev` | `cargo clean --profile dev` — reclaims accumulated debug artifacts without touching the release build |
| `npm run test:bridge` | 55 checks of the MCP bridge against a simulated spool |
| `npm run test:ink-patch` | the Ink renderer patch's own claims: applying it twice, refusing a shape it does not know, and — against a fake terminal — one viewport per repaint, no scrollback wipe, no scrolling, nothing lost. Also run at image build time; part of `npm test` so it cannot rot |
| `npm run test:mentions-patch` | the mention-index patch's claims: applying it twice, refusing a shape it does not know, and — running the scanner out of the file being patched — real source found, `.github` found, a vendored `.toolchain` and a hidden symlink not. Also run at image build time (after the apply, because it measures the result) |
| `npm test` | the four suites above, in order |
| `npm run build` | `tsc --noEmit` + `vite build` (frontend typecheck) |
| `npm run runtime:build` | build and tag the sandbox image |
| `npm run runtime:icons` | regenerate `src-tauri/icons` from `assets/icon.png` |
| `npm run docs` | VitePress documentation with hot reload, opening the browser |
| `npm run docs:dev` | VitePress documentation with hot reload, without opening a browser |
| `npm run docs:preview` | build the docs and serve the production output locally |
| `npm run docs:build` | build the static documentation site |
| `npm run docs:translate` | regenerate every localized documentation page and UI label |
| `npm run docs:check` | validate the translator's per-locale overrides against the English source, without network |

## Where things live

| Path | Responsibility |
| --- | --- |
| `crates/deepsand-core/src/paths.rs` | Canonicalises a path, then guards it. Symlinks are resolved **before** any check. |
| `crates/deepsand-core/src/policy.rs` | Builds the one and only `docker run` argv, and audits the mount list. |
| `crates/deepsand-core/src/store.rs` | Projects, grants, and the atomic-write state store. |
| `crates/deepsand-core/src/broker.rs` | Watches the request spool, validates hostile input, surfaces prompts. |
| `crates/deepsand-core/src/proxy.rs` | Allowlist egress; resolves names itself and refuses private results. |
| `crates/deepsand-core/src/secrets.rs` | ChaCha20-Poly1305 secrets, keyed from the OS keystore. |
| `crates/deepsand-core/src/tools.rs` | Tool catalogue and the image tag a selection produces. |
| `crates/deepsand-core/src/image_gc.rs` | Which runtime images may be deleted, and the reason each one is kept. |
| `crates/deepsand-core/src/remote.rs` | What a remote client may do. Kept separate from HTTP so it is testable. |
| `crates/deepsand-core/src/seccomp.rs` | The profile's digest, the runtime-tree resolver, and the check that the applied profile is the shipped one. |
| `crates/deepsand-core/tests/seccomp_profile.rs` | Claims about the profile itself: address families, `CLONE_NEW*` bits, the ptrace family. Reads the repo artifact, so no Docker needed. |
| `crates/deepsand-core/src/bin/deepsandctl.rs` | Headless driver: `doctor`, `project`, `grants`, `plan`, `run`, `watch`, `requests`, `network`, `images`. |
| `src-tauri/src/commands.rs` | The ~30 desktop commands, and `runtime_revision`. |
| `src-tauri/src/remote_server.rs` | HTTP translation of the command surface. Binds loopback, bearer token. |
| `src-tauri/src/update.rs` | Self-updates: the check, the download, the restart. Our own commands, not the plugin's JS bindings. |
| `.github/workflows/release.yml` | Cross-platform release builds and the update manifest. Publishes a **draft**. |
| `.github/workflows/docs.yml` | Builds the VitePress site and deploys the `deepsand-docs` Cloudflare Worker on pushes to `master`. |
| `docs-site/` | User documentation. English Markdown is the source; 16 translated locale trees are generated. |
| `docs-site/wrangler.jsonc` | Cloudflare Worker static-asset configuration and the `deepsand.webslc.com` custom domain. |
| `docs-site/worker.mjs` | Rewrites VitePress clean URLs to their `.html` assets and serves the built 404 page on a miss. |
| `docs-site/scripts/translate-docs.mjs` | Regenerates the locale pages and `i18n.generated.json`, protecting commands, links, brand names, Vue tags and script blocks. |
| `docs-site/.vitepress/locales.ts` | The one list of documentation locales: native names, language tags and base paths. |
| `docs-site/.vitepress/theme/LanguageSwitcher.vue` | The explicit top-right globe button and its language menu. It stays outside the mobile "..." menu. |
| `docs-site/.vitepress/theme/DownloadPicker.vue` | Detects the visitor's OS, offers manual Windows/macOS/Linux tabs and fetches the latest release's assets from the GitHub API. |
| `src/` | SolidJS UI. Views only: no policy decisions. |
| `src/i18n/index.ts` | The one reactive locale signal, browser/OS detection, `localStorage` persistence, `t()` and date locale. |
| `src/i18n/*.json` | Every visible frontend string, as flat JSON bundles with identical keys and placeholders. Currently `en`, `zh`, `hi`, `es`, `ar`, `fr`, `ru`, `ja`, `ko`, `vi`, `pt`, `id`, `bn`, `sw`, `ha`, `yo`, `am`. |
| `src/components/LanguagePicker.tsx` | The first-run selector and the overlay opened by **Settings → Language**. |
| `runtime/` | Everything that runs **inside** the container. |
| `runtime/bin/patch-deepcode-ink.mjs` | Disables Ink's overflow/fullscreen clear (which wipes the scrollback and rewrites the whole conversation) at image build time. |
| `runtime/bin/patch-deepcode-mentions.mjs` | Builds the `@`-mention index after the first frame instead of during it, and skips hidden directories. |

## The invariants

These are load-bearing. Breaking one is how this project gets a CVE.

1. **Policy lives in `deepsand-core`, never in the GUI or the Tauri layer.** If a
   question is "should this be allowed", it belongs in `paths.rs` or `policy.rs`.
   That is what keeps the desktop app and `deepsandctl` from drifting apart, and
   it is why a reviewer can read the whole boundary in a few files.
2. **`policy::plan_run` is fail-closed.** It returns an error rather than a
   weaker plan. Hardened seccomp missing, a writable reply channel, a mount list
   that does not look right — all of those are errors, not warnings. Never add a
   fallback that starts the container anyway.
3. **The sandbox can ask; it can never answer.** The response spool and the state
   directory are mounted `:ro`. A change that makes either writable is a privilege
   escalation, not a feature.
4. **Only `/workspace` and grants are mounted from the host.** `audit_mounts`
   rejects anything else, including container-runtime sockets by name.
5. **`runtime_revision` must cover every image build input.** It hashes
   `runtime/bin/*`, `Dockerfile`, `seccomp-hardened.json`, `gitconfig` and
   `runtime/skills/*/SKILL.md`. Add a file the image is built from and you must add
   it there too, or the tag stops changing and the image silently goes stale. This
   already happened once with the seccomp profile.
6. **Secrets go through `--env-file`, never `-e`.** `docker run -e NAME=value`
   puts the value in the process argument list, where any local user can read it
   with `ps`. A test asserts no value-shaped `--env` pair can appear in a plan.
7. **Credentials and generated config go to Deepsand's data directory, never into
   the user's project.** Project directories get committed, published and synced.
8. **The profile that gets applied must be provably the profile the image carries.**
   The daemon resolves `--security-opt=seccomp=` on the *host*, so the image's copy
   is only ever read by an auditor. The Dockerfile writes the profile's digest beside
   it and `seccomp::verify` compares the two before anything starts, refusing on a
   mismatch, a missing digest or a malformed one. `seccomp::runtime_dir()` is the
   single resolver for the runtime tree — do not add a second search order, which is
   how the applied and shipped profiles drifted apart once already.
9. **The request spool is not authenticated, and cannot be.** The bridge is a child
   of the agent's own process as uid 1000, so any secret it can read the agent can
   read. Do not add a token, nonce or pid check to a request expecting it to be a
   control: it will be forgeable, and a credential-shaped field that authenticates
   nothing is worse than no field. The human decision is the control — which means
   **never add an auto-approve path** ("already granted", "approved before"), because
   that converts dialog spoofing into a silent host-directory grant.
10. **An allowlist entry's shape decides how it is enforced, and only an address
    entry may bypass the proxy.** A hostname entry goes through the egress proxy,
    which is where the path rules and the DNS-rebinding refusal live; an address
    entry is allowed directly by the container's own rules, so a database client
    that speaks no HTTP can reach it. Do not "simplify" this by resolving hostname
    entries into direct rules: that would re-open the rebinding hole the refusal
    exists for. A port named in an entry is also published on the host's
    **loopback**, never on `0.0.0.0`.
11. **Never auto-approve a permission request; auto-refusal is allowed only when
    there is nothing left to decide.** `covered.rs` refuses a request for something
    the sandbox already has (a directory inside `/workspace` or a grant, a host
    already on the allowlist, an installed tool) and says where it already is. That
    is a `deny`, because an automatic `allow` is consent the operator never gave.
    Anything ambiguous — a wildcard pattern, a write request against a read-only
    grant, `locate_resource` — must reach the operator. The same path answers a
    project whose `requests_enabled` is false, and **that check must live on the
    host, not only in the bridge**: the bridge is the agent's own child process, so
    its copy of the flag saves a wasted tool call and decides nothing.

    **A refusal has two shapes, and the model is told which one it got.** `deny` is
    final; `defer` means "not now" and says the model may ask once more later. The
    difference has to be its own value on the wire (`PermissionResponse`, the
    `answer_request` payload, the bridge's `renderDecision`, and the generated
    `config/AGENTS.md`), not a sentence in the operator's note: the model acts on
    `decision` and nothing else, so collapsing the two means either it gives up on
    something the operator would allow later, or it keeps asking after they said
    never. Closing the dialog is `defer`, because an accidental Escape is not a
    decision the operator cannot take back. Everything unrecognised is `deny`, so a
    typo can only produce the stricter answer.

    **A `deny` is enforced by the host, not by the model's compliance.** A refused
    directory is stored in `Project::blocked_paths` (canonical, covering everything
    beneath it) and a refused destination in `blocked_hosts` (covering its
    subdomains). Three places check it: `auto_refusal` refuses the request before a
    dialog can appear, `Store::add_grant` refuses the mount (a path that is never
    mounted is unreachable whatever the agent does), and the network approval path
    refuses a covered entry. Where the mode has an egress proxy,
    `effective_allowlist()` turns each host block into `!host` and `!*.host`, so the
    connection itself is refused; `internet` and `full` mode have no proxy, the
    Permissions tab says so, and there a block is a request block rather than a
    network one. Every block has an "Allow again" control -- a decision with no way
    back is a trap, which is the same rule as the tray icon. A `defer` stores nothing.
12. **LF line endings for everything Linux reads or executes.** `.gitattributes`
    enforces this. A shell script with a CRLF shebang fails inside the container
    with `bash\r: No such file or directory` and the sandbox never starts.
13. **A state file that cannot be read is not a state file that is corrupt.** The
    distinction is the difference between losing an operator's projects and not:
    `ReadOutcome::Unreadable` is retried and then reported, and the file is left
    alone; only `Corrupt` is moved aside. Two rules go with it. A store built
    because nothing could be read (`Store::fallback`) must never rotate the rolling
    backup, because its state is a substitute and promoting a substitute destroys
    the last good copy. And a set-aside copy with projects beats an empty fallback,
    because an empty answer is far more likely to be wreckage than an operator with
    no projects left. All four are asserted in `store::durability_tests`; a replay
    against a real data directory is what caught the empty-backup case, so run the
    tests against real data when the failure being fixed was real.

    **"Cannot be read" means the bytes could not be obtained, not that they were
    obtained and were not text.** `fs::read` then `String::from_utf8`: an I/O failure
    is transient and gets `Unreadable`, a decode failure is damage and gets `Corrupt`.
    Using `read_to_string` collapsed the two, so a state file with its first page
    overwritten was reported as "possibly locked this instant", which returns before
    the rolling backup, the staged write and the dated copies are consulted -- an
    empty project list with five readable copies in the same folder. Also: `save`
    promotes the live file into the backup slot only if it still parses as a state
    document, because promoting whatever is in the live slot is how one damaged file
    becomes two; the recovery chain includes `state.json.tmp` / `state.json.bak.tmp`,
    because a crash between `sync_all` and the rename leaves a complete, durable
    document there; and `snapshot_if_stale` serialises the state in memory rather
    than copying the live file, because a dated copy of the damage is worse than no
    dated copy -- one machine's newest was 13,166 bytes of NULs.
14. **The state file must stay readable by older builds, because the installed app
    and a development build share one data directory.** An older build cannot read a
    serde variant or field it has never heard of, and it reports the whole file as
    corrupt -- set aside, empty project list. That cost an operator five projects,
    twice. So: widen the stored shape only additively, and where a name changes,
    **write the older spelling** (`NetworkPolicy::Allowlisted` is stored as
    `restricted` for exactly this reason) and accept both on load. A file that this
    build cannot map is a version skew, not damage: `ReadOutcome::Incompatible`
    reports it and leaves it alone, and a file whose `version` is newer than
    `STATE_VERSION` is refused rather than loaded and silently downgraded on the
    next save. And do not point newer tooling at the live data directory of an
    older install -- `deepsandctl --data-dir` writes, and it rewrote this one.
15. **`reference/` is never committed, vendored or bundled.** Upstream DeepCode CLI
    source is downloaded there read-only, and gitignored.
16. **The update signing key never enters the repository, and its loss is
    permanent.** The private half lives in `~/.tauri/deepsand.key` and in the
    `TAURI_SIGNING_PRIVATE_KEY` secret; the public half is pinned in
    `src-tauri/tauri.conf.json`, which is what every installed copy verifies
    against. Whoever holds the private key can sign an update that all of them
    will install, and losing it means no installed copy can ever be updated.
    `.gitignore` covers `*.key` as a backstop, not as permission to be careless.
17. **The three version fields move together** — `src-tauri/tauri.conf.json`,
    `package.json`, and `version` in the workspace `Cargo.toml`. The release
    workflow fails early when they disagree, because a release whose manifest
    version is wrong tells every installed copy it is already up to date: a
    silent failure where nobody gets an error and nobody gets the update.
18. **The updater is reachable only through our own two commands.** The plugin is
    initialised in Rust and the webview is not given `updater:*` — installing an
    update replaces the binary, which is the most powerful thing a frontend could
    ask for. The commands are absent from the remote command table on purpose: a
    remote client must not be able to replace the binary on the host it reached.

## Conventions

* **Tests are named as claims.** `a_plan_never_mounts_a_container_runtime_socket`,
  `the_reply_channel_can_never_be_written_by_the_sandbox`,
  `the_seccomp_profile_is_attached_even_on_docker_desktop`. Keep that style: the
  test names *are* the security argument, and `docs/SECURITY.md` cites them.
* **Do not state a claim in `docs/` that no test asserts.** A previous round of
  this project asserted a control was in place without running the check that
  would have shown it was not. If a claim is about the deployed state — what the
  container actually got — it belongs in a run, not only in prose.
* Rust 2021, `rust-version = "1.82"`. Errors are `thiserror` in the core,
  `anyhow` at the edges.
* The frontend is **SolidJS**, not React. Signals, not hooks: do not reach for
  `useState`/`useEffect`.
* `src/lib/types.ts` mirrors the Rust payloads in `src-tauri/src/state.rs` by
  hand. Serde uses camelCase; the enums keep their own shape. Changing one side
  means changing the other.
* **Every visible frontend string lives in the JSON bundles, and new text lands in all of them
  at once.** `src/i18n/index.ts` owns the reactive `locale()` signal; `t("key", { name })` reads it,
  so a component that renders `t` re-renders when the language changes, and `tOptional` exists for
  catalogue prose that has a backend fallback. The seventeen bundles are `en`, `zh`, `hi`, `es`,
  `ar`, `fr`, `ru`, `ja`, `ko`, `vi`, `pt`, `id`, `bn`, `sw`, `ha`, `yo` and `am`; add a key to
  every one in the same change, with identical interpolation placeholders -- the parity check is
  part of review, and a missing key renders its own name in that language.
  Detection uses `navigator.languages`/`navigator.language` (the webview's OS locale): the primary
  subtag selects the bundle (`es-MX` reaches `es`, `ar-EG` reaches Modern Standard Arabic), and an
  unsupported locale falls back to English. The first run shows `LanguagePicker` when
  `deepsand.language` is absent; selecting a language previews it, and **Continue** is what writes
  it. **Settings → Language** shows the current language and a **Change…** button that opens the
  same scrollable list; choosing there is already a decision and persists immediately. Adding a
  language means a JSON bundle, a `LANGUAGES` entry with its native name and `dir`, and the
  `Locale` union -- no component should learn a language name. Arabic is RTL, so
  `applyDocumentLanguage` sets both `document.documentElement.lang` and `.dir`; `dateLocale()` maps
  each code to a regional tag. Backend paths, hostnames, tool ids and raw error details are data
  and are not translated; translate the sentence around them, and use `tools.tool.<id>.*` /
  request titles rather than translating the backend's English in place. A fixed backend sentence
  is the exception: map it to a bundle key at the render boundary, as `dockerDetail` in
  `src/lib/types.ts` does for `DockerStatus.detail`, and add the same key to every bundle. Keep
  product names and technical identifiers (`Deepsand`, `DeepCode`, `Docker`, `MCP`, `API`, `npm`,
  paths) in their original spelling inside every bundle.
* **The documentation has one English source and generated locale trees.** Edit
  `docs-site/*.md` and `docs-site/guide/*.md`, then run `npm run docs:translate`; never edit a
  locale file such as `docs-site/zh/guide/getting-started.md`, because the next run replaces it.
  The translator protects fenced code, inline code, Markdown link syntax, bold spans, product
  names, Vue component tags and `<script>` blocks, so a translation cannot break a command, a
  link, formatting or the download picker. **Tags are protected as pairs.** The pattern used to
  match only opening tags, so a component written `<AppScreenshot>...</AppScreenshot>` kept its
  opener and had its closer translated -- the Chinese page came back with
  `</应用程序屏幕截图>` and eight more locales did the same, none of which can compile.
  `assertMarkupSurvived` now compares the tag sequence of the source with the translation and
  fails the run, because a page that cannot render is worse than one that was never translated.
  `DOCS_TRANSLATE_PAGES=download.md npm run
  docs:translate` retranslates one page without touching the rest; `DOCS_TRANSLATE_LANGS=es`
  restricts the run to one locale. Hand-written corrections belong in the `OVERRIDES` map in
  `translate-docs.mjs` -- a frontmatter path, an exact English source line, or a UI label -- never
  in a generated locale file. Overrides are applied after the translator and a stale path or line
  fails the run, so they cannot silently disappear; `npm run docs:check` performs that check
  without calling the translator. It also translates the home
  page's YAML frontmatter (hero, actions and feature cards). The home page is deliberately
  written for a general audience; `what-is-deepsand.md` carries the plain-language explanation and
  `for-developers.md` the architecture, while `security.md` is the detailed boundary. It writes
  `docs-site/.vitepress/i18n.generated.json` for the VitePress navigation and UI labels, and
  `transformHtml` gives each locale its real
  `lang` and `dir` (Arabic is RTL). The top-right language button is
  `docs-site/.vitepress/theme/LanguageSwitcher.vue`; it uses the shared
  `docs-site/.vitepress/locales.ts` list so the button, VitePress locales and navigation cannot
  drift apart. Both top-level `locales` and `themeConfig.locales` come from that list. The globe
  is the language-independent cue and stays visible on mobile, where the native-name text is
  hidden. Commit the generated pages. `.github/workflows/docs.yml`
  builds the site and deploys the `deepsand-docs` Cloudflare Worker on `master`; the required
  secrets and variables are documented in `docs-site/README.md`. The Worker serves
  `docs-site/.vitepress/dist` as static assets and attaches `deepsand.webslc.com` through
  `docs-site/wrangler.jsonc`. The zone also has a `*.webslc.com/*` route on `lilis-website`, so
  the specific `deepsand.webslc.com/*` route must stay beside the custom-domain entry: with only
  the custom domain, requests were still served by the wildcard Worker and `wrangler tail`
  showed nothing. VitePress generates `sitemap.xml` from the `sitemap.hostname` value, which
  comes from `DOCS_SITE_URL` and falls back to `https://deepsand.webslc.com`. Set the repository
  variable when the domain changes, or the sitemap will name the wrong origin.
* **The app-wide model API key is keystore state, not settings state.** It lives in the OS
  keystore through `secrets::{load,store,clear}_app_api_key`, never in `AppSettings` or
  `state.json`, and `default_api_key_status` returns only a mask. Resolution order is host
  configuration, then the app-wide key from Settings, then a project override, so a per-project
  key still wins. The Settings field applies on the next sandbox start; a running sandbox is not
  rewritten. Do not add these commands to the remote command table: a remote client must not be
  able to replace the host's model credential.
* **A field the backend skips is absent from the payload, and a bound input renders that absence
  as the word "undefined".** Empty strings carry `skip_serializing_if`, so `AppSettings.user_prompt`
  was not in the JSON while it was empty -- and the text area bound to it showed that literal word,
  which the operator could then edit into their saved prompt. Mirror the skip as `?:` in
  `types.ts`, and read such a field as `?? ""` where it is rendered. Two hand-written halves of one
  contract will do this again: when a payload field is optional on one side, make it optional on
  the other in the same commit.

## Platform quirks that will cost you an afternoon

* **`CAP_DAC_OVERRIDE` is absent inside the entrypoint** (`CapEff` is `0xc1`:
  `CHOWN`, `SETUID`, `SETGID`). Root is still bound by permission bits, so
  "`chown` a directory to uid 1000, then write into it as root" fails with
  `EACCES`. The ordering in `runtime/bin/entrypoint.sh` is load-bearing: create,
  take ownership, copy, then hand over. Because Docker Desktop's volume driver
  also refuses `chmod` on a volume mount root, the entrypoint verifies the
  property that matters (uid 1000 can read its credentials and write its volume)
  and stops with an explanation instead of assuming.

  **The same rule applies to `docker exec`.** An exec without `-u` runs as the
  container's user, which is root, and root cannot create `attachments/` inside
  `/home/deepcode/.deepcode` (755, owned by 1000) any more than the agent can
  write `/usr`. Every host-to-container write therefore runs as `SANDBOX_UID`
  (`1000:1000`): `write_into_container`, `write_file_into_container` and
  `make_dirs_in_container`. And none of their scripts ends in `|| true` any
  more, because that is how this failed silently: `docker exec` exited 0, the
  window typed `/home/deepcode/.deepcode/attachments/<stamp>-image.png` into the
  agent's prompt, and there was no such file -- the agent said the attachment
  was not in the sandbox, which was true. `container_has_file` now checks the
  claim after the write, and an attachment that cannot be read back is reported
  as a problem instead of being handed over. A claim about the sandbox has to be
  checked in the sandbox.
* **One build per image, one writer per log.** Everything that builds goes through
  `build_runtime_image_impl` -- the Activity tab's button and a Run whose image is missing --
  and it claims the image in `AppState::building` first. A second caller *waits*; a second
  *writer* is how the build log came to hold two copies of the same RPC error at different
  offsets with a gap of NULs between them, which is what a write at somebody else's file
  offset looks like. If you add another way to build, put it behind that claim.
* **Build output is read through `docker::sanitize_output_line`.** A read from a dying
  daemon's pipe can come back zero-filled, and `BufRead::lines` hands that back as one line
  of 32 KiB of NULs: the log from that failure is 302 bytes of output followed by 32,289
  NULs. The filter cuts a line at its first NUL, drops control characters, drops a line that
  is only them, and truncates at 4 KiB. It is applied where lines are handed out, so the
  tail, the window and the log all see the same text. Anything that reads a pipe needs this
  reasoning: NULs are not content, they are a read that did not happen.
* **A build failure is classified before it is reported.** `docker::is_daemon_interruption`
  separates "the daemon went away" from "the Dockerfile is wrong", because the responses are
  opposite: the first is waited for and retried once (the layer cache survives it), the
  second is read. Reporting the first as the second is how an operator ends up checking
  their Dockerfile for a fault that is Docker Desktop restarting.
* **The window is the app's lifetime, and the shutdown is bounded.** `shutdown_cleanup`
  runs when the window is destroyed, on the UI thread, and it shells out to Docker. Nothing
  on that path may be unbounded: with Docker Desktop restarting under it the call never
  returned, the process sat there with no window and a blocked event loop, and -- because the
  single-instance plugin hands every later launch to whatever process already exists -- the
  app then looked like it would not start at all. It is given ten seconds and the process
  exits either way.
* **One instance, and a stuck one must not swallow a launch.** `instance.rs` holds a lock
  file for the life of the process, writes a record of itself, and proves it is alive with a
  heartbeat scheduled through `run_on_main_thread` -- so the proof comes from the *UI thread*
  and a stuck event loop stops beating. `instance::decide` is the whole rule, and it is
  tested: beating -> hand the launch over; stopped beating with a window -> leave it alone
  (the operator can see it); stopped beating with no window -> clear it and start. A launch
  must never be silently swallowed by a process that cannot show anything.
* **A status the window shows has to be re-read where it can change.** `app_info`
  deliberately carries no Docker status -- probing there put three Docker CLI calls in front of
  the first paint -- so re-reading it means calling `docker_status`. `refreshSettings` used to
  be the thing that refreshed Docker, and when the field left `app_info` the compiler could not
  see across the TS boundary: the announcement of a change arrived and nothing was re-read, so
  the app went on saying the daemon was unreachable with Docker plainly running. Worse, a "no"
  was kept forever: the probe runs once, after the window is ready, which is routinely while
  Docker Desktop is still starting. It is retried while the answer is no, and re-asked when the
  window takes focus. If you move a field out of a command, grep the frontend for it.
* **A debounce is a courtesy to the disk, never a licence to drop an edit.** The settings dialog
  saves as you type behind a 700 ms timer, and its cleanup used to do `clearTimeout(timer)` --
  cancelling the pending write when the dialog closed, which is precisely what somebody does with
  the last sentence they typed. The user prompt went missing every time that way, and the report was
  "it doesn't save when I shut down the program", which sent me looking at the state file (which was
  fine) and the backend round-trip (also fine) before the frontend. `flush()` now writes a pending
  edit on unmount, on `blur`, and on `pagehide`/`beforeunload`, and the write itself (`persist`) is
  split from the screen's signals so it can run while the dialog is being torn down. The same timer
  guarded the egress allowlist, so a typed host was lost the same way. Two things made this hard to
  see: nothing *failed* (there is no error in the log, because no request was ever made), and the
  state file is written by the backend, so it looked like a Rust problem. Reproduce UI-level
  behaviour through the running app instead of reading the JSX: `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=
  --remote-debugging-port=9222 npm run app:dev`, then drive the DOM over CDP -- a JS `click()` and a
  dispatched `input` event are delivered where synthetic mouse input is not.
* **A run that drives the window must not use the operator's state, profile, or port.** Three
  variables make a screenshot or reproduction safe, and all three are needed.
  `DEEPSAND_DATA_DIR` points the store at a throw-away directory (it is an environment variable
  rather than a setting because the setting lives *inside* the file it would have to read);
  `WEBVIEW2_USER_DATA_FOLDER` gives the run its own webview profile, so setting the language does
  not change the operator's own window; and a second `--remote-debugging-port` is impossible, so
  the port has to be clear before the next launch. Two traps, both of which cost time here. A
  surviving instance holds the single-instance mutex *and* the port, so every later launch hands
  its window over to the survivor and exits -- the loop then photographs the same blank
  `about:blank` page, and a blank window is left on the operator's screen. And a debugging target
  exists from the moment the webview is created, when it is still `about:blank`: reloading at that
  point gives another blank page that never recovers, so wait for something the app renders
  (`.brand`) before touching it. Read the locale with `Page.addScriptToEvaluateOnNewDocument`
  rather than a `localStorage` write afterwards -- the app reads its language and its first-run
  picker from that key at module load.
* **One piece of in-flight state, and it always lets go.** Whether a session operation is
  running lives in the store (`sessionBusy`), not in each component: the header's Run and the
  terminal's Run each had their own signal, so one could be left greyed out for the rest of the
  session while the other was fine. `sessionOperation` also has a ceiling, because `finally`
  releases the button whenever a promise settles -- which is every outcome except the promise
  never settling, and a backend that never answers must not be able to lock the operator out. A
  disabled button says what it is waiting for ("Starting…"): a grey button with no text cannot
  be told apart from a broken one.
* **Anything signed with the API key happens in the app, never in the window.** The model list
  is fetched in `src-tauri` with the project's resolved credentials, and the frontend receives
  ids and names -- never a key, not even masked. The cache that keeps the list between projects
  digests the key rather than storing it, and a failure to list comes back as a `problem` string
  rather than an error, so the dropdown still offers the two choices that need no list at all.
* **A project's own `AGENTS.md` replaces the file Deepsand installs, so anything that must always
  reach the model cannot live only there.** `loadAgentInstructions` picks `<project>/AGENTS.md` or
  `<project>/.deepcode/AGENTS.md` when either exists and *only* falls back to
  `~/.deepcode/AGENTS.md` -- so the generated file is silently ignored in exactly the projects that
  ship one, which is most real repositories (three of four on this machine). The per-task playbook
  went into skills for this reason, and the operator's standing instructions go three ways at once,
  all resolved by `resolve_user_prompt`: into the generated file; into
  `SandboxSnapshot::user_prompt`, which the bridge puts in `deepsand_sandbox_info`'s description and
  result, where no file in the project can shadow it and the mount is `:ro` so the sandbox cannot
  forge it; and, when there *is* something to send and the project's own instructions shadow ours,
  into a generated `deepsand-operator-instructions` skill. No prompt means no skill: it exists to
  carry the operator's words, so `Off` -- or an empty box, wherever the text would have come from --
  writes none, and the writer removes the one it wrote before. It is written by
  `settings::operator_skill` into
  the config mount and installed by the entrypoint into `$DEEPCODE_DIR/skills/` -- the user-level
  root DeepCode scans that is also writable, since the rootfs is read-only -- and the entrypoint
  **removes that directory before installing it**, because the home volume outlives the setting and
  a skill left behind would go on instructing later sessions from a prompt that had been turned off.
  If you add a fourth place these are read from, they will drift, and the symptom is an agent that
  follows instructions in one repository and not in the next.
* **A named build context is not an image, and every build path has to supply it.** The tools layer
  mounts `from=toolcache`, which BuildKit resolves as a *stage* only because something passes
  `--build-context toolcache=…`. The app passes its keyed cache. `runtime/scripts/build-image.mjs`
  passed nothing, so a `npm run runtime:build` -- the command this file tells contributors to run --
  tried to pull `docker.io/library/toolcache:latest` and died with "pull access denied ...
  insufficient_scope: authorization failed": a registry message for a problem that was not the
  registry's. It now passes an empty directory, which the layer reads as "no cache" and installs the
  tools, and `every_build_path_supplies_the_toolcache_context` keeps both paths honest.
* **The window is told when a file it read once changes.** The host's DeepCode settings decide
  what "Defer to Config" resolves to, and the backend reads that file fresh on every use, so
  only the *window* can go stale -- which it did, showing a model from startup until it was
  restarted. `host_config.rs` polls it and emits an event that carries nothing: the views that
  depend on the file re-read it from the backend rather than being handed a second copy of the
  values. The poll compares a digest as well as a timestamp and a length, because a same-size
  edit inside one filesystem timestamp tick is otherwise invisible.
* **The tools cache is keyed by what changes the tools, and filled from a successful build.**
  `toolcache.rs` holds the two decisions that matter. *What* is cached: the compiled cargo
  binaries and the installed npm globals, because those are minutes of compiling and registry
  round-trips; not apt packages, because the build already has cache mounts for their downloads
  and moving installed system packages between images is the fiddliest thing here for the
  smallest gain. *When the key changes*: the platform, the sorted tool selection, a version
  constant, and a fingerprint of the tools layer's `RUN` -- not the whole Dockerfile, because
  the image tag already changes on every runtime edit and the tools must not be recompiled for
  a fixed comment. The cache is filled *from an image that built successfully*, never by a
  parallel install, so what is in it is what an image actually has; and a build that fails while
  using it drops it, so a bad entry heals itself. Freshness is the second half -- a key cannot
  see time passing -- so an entry older than `TOOL_CACHE_MAX_AGE` (two weeks) is emptied before
  the build, which installs the tools again and refills it. That is "up to date, only when
  necessary": immediate when the selection or the installer changes, fortnightly otherwise. The
  DeepCode CLI is not cached here at all: it is resolved from npm and pinned on every start, as
  its own section below explains, and the install is bounded by npm's fetch limits and non-fatal
  when a copy exists. The cache is
  emptied *only* when a build that used it failed for a reason that is about the build -- a
  daemon that went away is neither the cache's fault nor the build's, and emptying on one of
  those would throw away minutes of compiling for nothing.
  **"There is a cache" means the marker and only the marker.** The app creates the entry's `bin/`
  and `node_modules/` before every build, because a build context has to exist, so a build that
  tests for those directories is testing something that is always true. That is exactly what the
  tools step did: it took the cached path on every build, installed nothing, and wrote a label
  naming every tool that was *asked for*. Images here were labelled `htmlq,puppeteer,wrangler`
  with none of the three in them -- confirmed against real images and reproduced with a build.
  `htmlq` was on by default then, so this was every project, and the feature's own promise that "a bad
  entry heals itself" was false: an incomplete entry never failed, so nothing healed it. The
  app's rule is `toolcache::cache_is_usable` -- marker present and recent -- and
  `runtime_dockerfile.rs` now asserts that the build asks the same question. The npm globals are
  additionally asked of npm one at a time (`npm ls -g --depth=0`), because a marker can be right
  about the entry and wrong about one package, and a cache is an accelerator rather than an
  authority: that is what lets a partial entry heal itself instead of becoming an image that lies.
* **`Project::tools` has three meanings, and `None` is not "no opinion".** `Some(list)` is what
  the operator chose, including `Some([])`. `None` means "this project predates the tool system"
  and resolves to `legacy_selection()` -- six utilities frozen by name, so an old project keeps
  the image its tools were built into. A *new* project therefore stores `Some([])`: it stored
  `None` for a while, which quietly installed those six utilities while the Tools panel's own
  default was the empty list, and `default_selection()` was called from nowhere but a test. There
  is no per-tool "on by default" flag any more, for the same reason: one flag answered both "what
  does a new project get" and "what does an old one keep", and the answers were already different.
  A tool added to the catalogue is off everywhere until somebody selects it.
* **A label is a claim about the image, and a claim about the image has to be checkable.** The
  tools step ends with `LABEL deepsand.tools="$INSTALL_TOOLS"`, and that label is what
  `deepsand_sandbox_info` reports to the agent as the truth about what it has. So a build that
  skips an install does not merely produce a thinner image, it produces a sandbox that tells the
  agent it has a browser: the agent believes it, goes looking, and spends the turn finding out
  otherwise. Anything the sandbox says about itself has to be derived from what the build
  produced, or checked -- the way a claim about the *deployed* state belongs in a run rather than
  in prose.
* **A browser is four things, and three of them are silent when missing.** The `puppeteer` tool
  promises "a browser controlled from Node, with its own copy of Chromium". Being able to take a
  screenshot needs all of: the npm driver, the libraries a browser links against (`libnss3`,
  `libgbm1`, `libatk1.0-0`, `libcups2`, `libpango-1.0-0`, `libgtk-3-0` and the rest -- none are in
  the base image), an archiver to unpack the download (`unzip`: without it the browser downloads
  and cannot be extracted, and because that happens inside the package's own postinstall the error
  is *swallowed*), and the binary itself, in the cache of the user who will look for it
  (`PUPPETEER_CACHE_DIR=/home/deepcode/.cache/puppeteer`, owned by 1000, not root's home).
  Two traps worth remembering. The postinstall's half-finished download leaves a browser folder
  with no executable in it, and puppeteer then *refuses* to repair it -- "the browser folder exists
  but the executable does not" -- so the fetch starts by emptying the cache. And a browser keeps its
  own sandbox with user namespaces, which this container does not allow, so it must be launched with
  `--no-sandbox`; without it the failure is "Failed to launch the browser process" and nothing that
  explains why. All of this is now in the tools layer, gated on the tool id, and the build *fails*
  rather than shipping an image that claims a browser it does not have -- verified end to end here:
  as uid 1000, under Xvfb, puppeteer rendered a page and wrote a 10 KB PNG.
* **The tool check empties a cache entry; it never builds.** `tool_updates.rs` asks npm and
  crates.io what they offer for the versions a cache entry recorded when it was filled, and when
  something has moved it empties that entry -- the next *build* installs the tools again and
  refills it. It deliberately does not install anything itself: that needs Docker and an image,
  and a check on a timer has no business starting a build. Two rules keep it honest. A check that
  reached nothing is not a check, so it does not record one and the next cycle tries again rather
  than waiting out six hours. And what is compared is the listing the *tools* produced
  (`npm ls`, `cargo install --list`) at fill time, not what the cache was asked for, so a cache
  entry that disagrees with its own image is detectable rather than invisible. The DeepCode CLI
  is excluded on purpose: it is refreshed on every build already.
* **Hiding is only allowed when there is a way back.** Closing to the tray and starting in the
  background are one feature with the tray icon, not two: `tray::wanted` is the rule and the
  first thing its tests check, because a window that can vanish with no way back is a machine
  quietly running containers nobody can see. The difference between hiding and closing is one
  branch in `on_window_event`: hiding never runs `shutdown_cleanup`, so the sandboxes keep
  running -- which is the entire point of closing to the tray -- while the tray's Quit goes
  through the ordinary exit, so it does stop them. Startup has three modes rather than the
  boolean it replaced, and the boolean is still read: `start_at_login: true` becomes
  `Foreground`, which is what it meant, and the field keeps the old name as an alias so an
  existing state file is understood rather than silently ignored.
* **A build that stops talking is stopped.** The readers are blocked on the child's pipe, so
  the only thing that can interrupt a `docker build` which has stopped producing output is
  ending the process: `BUILD_SILENCE_LIMIT` (ten minutes of *silence*, not of elapsed time, and
  every slow step -- apt, npm, cargo -- prints as it goes) does exactly that, and the failure
  says how long it was quiet for rather than guessing that it hung. This exists because an `npm
  install -g` behind a connection that had stopped answering left an operator with a build that
  had simply stopped, and no way back except closing the app. npm's own fetch timeouts are
  bounded in the Dockerfile as well, so the common case fails in a minute instead of never.
  **The watchdog never `join`s**: it polls `try_wait` and leaves when the child is gone. Joining
  it was the first version, and it meant a build that had *finished* waited for the watchdog to
  notice the silence that followed it -- ten minutes of a progress bar frozen on the last step,
  which is precisely what the watchdog was written to prevent. A stop is the operator's to ask
  for as well: `cancel_build` finds the build by tag in `LIVE_BUILDS` and ends it, and the
  failure says it was stopped rather than broken.
* **A build starts a thread; its return is not the build's outcome.** `build_runtime_image_impl`
  returns as soon as it has claimed the image and spawned the build, and that thread owns
  `BUILD_DONE`. A caller that needs the image must wait for the image, not for that return: the
  first Run for a tool selection treated the return as success, ran the runtime check against an
  image that did not exist yet, and refused after printing the whole build log. A Run waiting for
  a build also releases the start lock -- waiting is not starting -- and re-checks `start_epochs`
  and `stop_epochs` before re-acquiring it. That is what lets "Start now without tools" take over
  without the older Run starting a second sandbox when the build lands.
* **A preflight is bounded by a healthy answer, not by the command timeout.** The host-sharing probe
  runs while the operator watches "Starting…", and it used to inherit `COMMAND_TIMEOUT` (120 s) for
  every step -- `create`, `cp` and two `rm`s, on up to two candidate images, per mount. On a machine
  whose file-sharing layer had stalled that was minutes of nothing: measured here, a `docker cp` of
  one small file out of a bind mount answers in **0.16 s** when the layer is healthy and took **three
  minutes** when it was not, with `version`, `images` and `create` answering instantly throughout. It
  now runs on `SHARING_PROBE_LEASH` (15 s, ~90x a healthy answer), stops at the first silence instead
  of spending the leash again on the other image, and cleans up on its own short leash. The verdict
  is typed -- `ProbeStep::Silent` versus `Answered(Err(..))` -- rather than read back out of a
  sentence, because the two lead to different next steps: a refusal is worth the other image, silence
  is worth nothing at all. Silence sets `runtime_wedged`, so the window offers the restart instead of
  showing a directory problem with nothing to press; `docker_status_watched` clears it when Docker
  recovers. Two smaller things from the same afternoon: the probe container now carries
  `LABEL_MANAGED`, without which `prune_orphans` could not see the three left behind by one stalled
  probe, and `sessionOperation` re-reads the docker status when an operation fails, because a start
  that failed is exactly when the answer may have changed.
* **When Docker Desktop is unwell, Deepsand says so and offers the restart -- it does not restart it
  itself.** Restarting it ends *every* container on the machine, including work that has nothing to
  do with Deepsand, so the decision is the operator's; an automatic restart was built and removed for
  that reason. What the app owes the operator instead is that the control is actually *in front of
  them*: the start records the verdict in `runtime_wedged`, `docker_status_impl` turns that into
  `available: false` with the "its container runtime is not answering" detail, and the window's
  callout then shows `RestartDockerControl` -- which restarts Docker Desktop *and* retries the start
  (`restartDockerAndRetry`). The two things that used to break that chain were both silent: the
  sharing probe did not set the flag at all, so the runtime looked fine and no button appeared, and
  the window did not re-read the status after a failed operation, so it went on showing the stale
  "Docker is fine". Any new failure that means "Docker, not this project" has to do both.
* **Nothing this app starts outlives it.** Windows does not end a child when its parent exits,
  and `std::process::exit` in the shutdown path abandons whatever is still running: a hung
  `docker build` was found an hour and a half after the app had gone, still holding the image
  tag it was building, which is what the *next* build waits for. `docker::terminate_our_clients`
  asks the operating system for this process's own children by name (`docker*`) and ends them,
  and it is called at the start of `shutdown_cleanup` -- before the polite work, because the
  polite work is what has a budget and can be abandoned.
* **A container inventory has one rule, one list and one timer, and only the rule decides.**
  `docker::abandonment_reason` is that rule: a container is abandoned only when no live session
  owns its name, no start is in flight for its project, **its owner is this process or provably
  gone**, and it is older than `CONTAINER_GRACE_MS` (two minutes). Those protections are what
  make a periodic sweep safe -- a start creates its container before the session is registered,
  and a sharing probe creates one for a few seconds.

  **A container is not abandoned because *this* process has no session for it.**
  `deepsandctl run` starts sandboxes, and so does a second instance with its own data directory;
  neither registers a session in the window. Every plan and every sharing probe therefore
  records `deepsand.owner_pid` (the process that will `docker run`), and `owners::state_of` turns
  that into one of four answers: this process, another Deepsand process that is still running,
  gone, or unknown (a container from a build before the label). The rule removes only the first
  and the third. Liveness is the process table (`tasklist` / `ps -eo pid=,comm=`), filtered to
  executables whose name starts with `deepsand` -- a pid reused by an unrelated program counts
  as dead, so a crashed sandbox is still cleaned up. **An unreadable process list means every
  other owner is assumed alive**: not being able to see a process is not evidence that it is
  gone, and the wrong answer deletes somebody's running sandbox. `prune_orphans` at startup and
  exit uses the same answer; it is no longer "everything of ours is residue", because that
  deleted a live `deepsandctl` sandbox on the next launch.

  Ownership of a container *itself* is the `deepsand.managed` label **or** a `deepsand-` name
  with an image from the configured repository: the second test exists because a build that
  predates the probe's label left five containers the label alone could never see. The inventory
  is bounded by `INVENTORY_LEASH`, not the command timeout -- a repeated sweep against a daemon
  that has stopped answering must not leave a blocked thread behind on every tick.

  **Every image tag carries the runtime revision, so every build of a project abandons the
  previous image.** `seccomp::project_image` appends `runtime_revision(runtime/)`, which hashes
  `runtime/bin/*`, the Dockerfile, the profile and the skills. That is what forces a rebuild when
  the runtime changes -- and it also means the image built yesterday can never be run again,
  because the tag the app derives today is a different string. Each one is ~3 GB, nothing in the
  window listed them, and this machine reached sixteen gigabytes of images and 37 GB of build
  cache before anyone looked.

  The rule is `image_gc::plan`, and it is one of those where being wrong is only noticed later:
  an image kept costs disk, an image removed costs a rebuild (and, if the rule was wrong, a
  sandbox that will not start). So it keeps an image that is **any** of: not Deepsand's at all
  (never even considered), the tag some project resolves to *now* -- derived by `project_image`,
  never re-derived here -- used by **any** container, running or stopped, ours or not, younger
  than `IMAGE_GRACE_MS` (an hour, because a build takes minutes), or of unknown age (Docker would
  not say when it was made, and unknown is not abandoned). Everything else is removed **by tag**
  and never with `--force`: `rmi` refusing means a container took the image between the listing
  and the removal, which is information, not an obstacle. The inventory is three CLI calls, not
  one per image, and a daemon that does not answer is an **error**, never an empty plan -- "could
  not ask" and "nothing to clean" must not look the same before a deletion.

  It runs in three places, all best effort: four seconds after startup (after the container
  sweep, so they do not queue on the same CLI), after a build that succeeded (which is the only
  moment a *new* image can be orphaned while the app stays open), and `deepsandctl images
  [--prune]`, which lists every image with the reason it would be kept. Deliberately not on the
  sixty-second container timer: images change when something is built, not when something is
  used. Untagged *intermediate* images are left alone -- they are build cache rather than
  something this app created as an image, and `docker image prune` is the operator's tool for
  those.

  **The base tag is kept, and "image missing" asks about the runtime rather than that tag.**
  `Keep::BaseBuild`: no project runs `<stem>` itself (they all run a derived tag), but
  `runtime/scripts/build-image.mjs` builds it, prebuilding is a supported thing to do, and its
  layers are shared with every derived tag -- so it is not abandoned and it survives the sweep.
  The window's `image missing` badge used to be `image inspect <stem>`, which is the tag the app
  never builds: while the base image existed the badge was meaningless, and once the sweep
  correctly removed it the badge said "missing" **permanently**, with every project's own image
  present. `Docker::probe` now lists tags and answers `tag_is_for_stem` (the stem, or anything
  `<stem>-…`), the same call it was already paying for. Four places read that field --
  `App.tsx` badge, the Activity panel, Settings and the terminal's callout -- and all four are
  text, not a decision, so the change is safe; nothing may *skip a build* because of it, because
  a missing derived tag is exactly what a Run builds.
* **Attaching is the operator's action, and it is bounded.** What a dropped file becomes depends
  on where it came from, and `attachments::in_sandbox_path` is the one place that decides:
  * Inside the workspace **or a grant** it is *named* at the mount path (`/workspace/...`,
    `/grants/<slug>/...`) and copied nowhere. A grant is a directory the sandbox can already
    see, so the rule is the same for both -- for a while only the workspace was checked and a
    file from a granted directory was silently copied into `~/.deepcode/attachments` instead.
    The comparison is on `canonicalize`d paths, so a symlink or `..` cannot pretend to be inside
    one, and grants are compared on a separator boundary so `/srv/app-old` is not inside
    `/srv/app`.
  * From **anywhere else** it is outside every permitted directory. The host does not copy it
    and returns it in `AttachmentView::outside`; the window shows what is at stake and calls
    again with `confirmed_outside`. Nothing is written before that yes, so declining costs
    nothing. The dialog's "don't warn me again" writes the global `warn_on_outside_drops`
    setting, which Settings also shows -- a decision made once must be findable later, not only
    reachable by triggering the dialog again.
  * Once confirmed it goes to `/tmp/deepsand-incoming`, on the container's tmpfs: outside every
    mount, so it can never be swept into a `git add -A` of a permitted repository, and gone when
    the container is recreated, because these are inputs to a conversation rather than project
    files. `write_file_into_container` chowns what it writes to uid 1000, so the agent can read
    (and, for a file it is meant to work on, edit) it.
  Pasted *bytes* (a clipboard image) have no host path, so they still go to
  `~/.deepcode/attachments`. Everything is size-capped on both sides. One file failing is
  reported without losing the others: attaching three and dropping all three because the fourth
  was a directory is worse than three and a reason. The paste path is captured on the terminal's
  host element before xterm's own listener, because text paste already works and only a
  clipboard with *files* needs intercepting.
* **A per-project model is `credentials.model`, and `None` means "defer to configuration".**
  One field, so the header dropdown and the project's own credentials cannot disagree, and
  clearing the choice puts the configured model back rather than leaving the last one behind
  (`a_projects_own_model_wins_and_having_none_defers_to_configuration`).
* **Contents before name.** Anything that holds state is written to a sibling file, synced
  with `sync_all`, and only then renamed over the real one. A rename is atomic but not durable
  on its own: without the sync, a crash can commit the name and lose the data, which is how
  this machine was left with an 18,412-byte `Dockerfile` of NULs and a `state.json` of them
  twice. The build log is synced before its outcome is announced, because its job is to be read
  after a failure -- including one that takes the machine with it.
* **A reader treats a file with NUL bytes in it as damage, never as content.** That is the
  shape this failure takes, and a reader that shows it is worse than one that shows nothing:
  log lines, audit lines and runtime files are all filtered this way. `store.rs` keeps a dated
  copy of the configuration once a day for the case where the live file *and* its rolling
  backup go together, which one crash can do -- written only when there is a project worth
  keeping, so an empty state cannot hold the day's slot.
* **The runtime files are read from disk, so they are checked before they are used.** A
  machine that loses the contents of a write while keeping its size leaves a `Dockerfile` of
  NULs, and Docker's answer to that -- `dockerfile parse error on line 1: unknown instruction:`
  -- names nothing an operator can act on. `runtime_files` embeds every file under `runtime/`
  (there is a test that the list is the whole tree, so a new file cannot be forgotten) and
  repairs only what is *not text*: NULs, empty where content belongs, or missing. A file that
  merely **differs** is an edit or another build's tree, and is never touched -- overwriting
  those would be a much worse bug than the one being repaired. The build path repairs and says
  which files it replaced; `deepsandctl doctor` reports the state without writing anything.
* **When something is unreachable, say which part.** Docker Desktop running with a daemon that
  is not answering is not the same situation as Docker Desktop not running, and they get
  different sentences (`docker::unreachable_detail`, chosen by asking whether the Desktop
  processes exist -- only on the failure path, where the answer changes what to say). Telling
  an operator to start what they can see running is how a correct message gets ignored.
* **An error the operator can see is written down.** Every box the window raises with
  `toast("error" | "warn", ...)` goes to the log, every failed command is logged with its own
  name by `api.ts`, and so are the startup notice and the screen for a window that could not
  start. Three separate paths on purpose: the box carries the text the operator read, the
  command line says which call failed (including the ones the window swallows), and the fatal
  path has no box to carry anything. If you add a surface that shows an error, put it through
  `toast` or log it yourself -- the log is the only place a message survives the window.
* **An error box is not dismissed by a click.** A click is how a person starts selecting the
  text, and being gone by then is why messages could not be copied. Errors therefore stay
  until they are closed, show their body whole, and have a Copy button; the others still
  disappear on a click, which is what keeps them unobtrusive.

  **A box with something to press is pinned for the same reason.** The update notice carries
  its own **Install now**, so the moment somebody decides they want the new version is the
  moment they read that sentence rather than after they have found Settings. A six-second
  timeout is long enough to read and far too short to decide to replace the running binary,
  so an actionable box does not time out and a click on its body does not dismiss it — that
  click is how the version number gets selected. The action lives in the box
  (`ToastAction::run`), not in the store: each box owns its busy state, and a failure is
  raised as the error box it deserves while the button stays live, because `install_impl`
  puts the pending update back after a failed download so a retry is legitimate. Installing
  restarts the app and stops whatever is running, so when a sandbox *is* running the same box
  says so before the click, using the Settings strings rather than a second copy of them.
* **Anything the app says about itself goes in a file.** A Windows release build has no
  stdout, so `tracing` output went nowhere: a launch that died silently stayed silent, with
  nothing to read on the machine where it happened. `init_logging` tees to
  `data_dir/deepsand.log` (rotated at 2 MB, one previous kept) and installs a panic hook. The
  log carries ids, addresses and errors, never credentials. Anything that can fail early --
  before there is a window to report in -- has to say so there.
* **Nothing on the first-paint path may call Docker.** Every `docker` invocation spawns
  the CLI, which costs 180-600 ms on this machine, so a probe is user-visible time. A probe
  was 1549 ms: five sequential calls for two versions, two `info` fields and an image
  inspect. It is now three concurrent calls (`version --format '{{json .}}'`,
  `info --format '{{json .}}'`, `image inspect`) and costs 379 ms measured, and `app_info`
  -- the window's first call -- no longer probes at all: it returns `docker: null` and the
  window asks with `docker_status` once it is up, drawing "Checking Docker…" until then.
  The startup sweeps (orphan cleanup, the availability poll) wait two seconds so they do not
  race the window for the same CLI. If you add a startup path, ask whether the first paint
  needs the answer; if it does not, do not ask the question there.
* **A terminal resize is not a no-op, so never send one twice.** A window-change makes a
  full-screen TUI inside the sandbox paint everything it has, so a window that re-fits on every
  layout pass and tells the sandbox each time turns a layout pass into a repaint of the whole
  session. That is the failure where the terminal appears to scroll itself over and over, far too
  fast to read, and will not stay still long enough to scroll up in. Both halves are guarded:
  `TerminalPane`'s `safeFit` measures with `proposeDimensions` and does nothing when the size is
  what xterm already has (coalesced to one fit per frame, because a fit inside a `ResizeObserver`
  callback is a layout change reported back to that observer), and `Session::resize` drops a size
  the PTY already has via `resize_is_needed`, which also floors a zero-sized pane at 1×1 rather
  than resizing to nothing. Guarding only the window is not enough: the leak that matters is the
  one you did not think of.

  **A project-list refresh is not a project switch.** The pane's attach effect must key on the
  selected project *id*, not on `project()`: `refreshProjects()` replaces the whole `projects`
  array on ordinary events (a session status change, a broker answer, a container sweep, Docker
  coming back), so reading `project()` re-ran the effect and called `term.reset()` behind a TUI
  that was still running. Ink keeps the number of lines it wrote and moves the cursor up that
  many on the next frame; with the buffer cleared underneath it that arithmetic lands in the
  wrong place and every repaint scrolls instead of overwriting -- the same endless scroll, from a
  third direction. Put the id behind a `createMemo`: its `===` comparison means a new array
  holding the same selected project does not notify the effect, so the terminal is left alone
  when only the array identity changed.

  **The other half is the size the PTY is born with.** A Pane asks for its size on mount, which
  is *before* a Run and before every restart -- so the old `resize_session_impl` answered "no
  session, never mind", and the session later started at the hard-coded 40×120. If the pane was
  33 rows, the TUI drew a 40-row frame in a 33-row terminal: every spinner tick scrolled the
  screen instead of overwriting, and the status line stacked down it -- the same "scrolling itself
  over and over" from the outside, with no repeated resize to blame. `AppState::terminal_sizes`
  now remembers the last size per project even with no session, and `spawn_session` creates the
  PTY at that size instead of the guess. A project whose pane has never been on screen has no
  size of its own, so `last_terminal_size` keeps the last size *any* project reported: every
  project shares one window, and that is a far better start than a constant. Zero is ignored (a
  hidden pane is not a request for 1×1), and the size is clamped to
  `MAX_TERMINAL_ROWS`/`MAX_TERMINAL_COLS` because a console allocates for what it is told. Do not
  remove the memory on stop: a restart needs it.

  **The pane must have the same box while stopped and while running.** The remembered size is
  only as good as the pane that reported it, and the terminal pane's own layout used to change
  with `running`: a `queue-note` bar appeared only while the session was running, took 45px
  (three rows at the default font size) from the terminal *after* the PTY had been created, and
  left the TUI drawing a three-rows-too-tall frame in the pane that had just shrunk. That was the
  endless scroll the earlier size fixes kept missing. The bar is now always present -- a Run in
  the stopped state, a Stop in the running one -- and its text is one ellipsised line so a longer
  translation cannot wrap it into a second row and change the height again. Do not make anything
  in the terminal pane's flex column conditional on `running`: the PTY is created before that
  flag flips, so a running-only element is always a resize after the TUI has drawn. `terminal
  born` at debug level prints the size the PTY was created with; compare it with `stty size` in
  the container if this comes back.

  **A correct PTY size is not enough: Ink's overflow path is a whole-conversation repaint.** The
  CLI renders with Ink, and `renderInteractiveFrame` treats a frame at or over the viewport as
  fullscreen: it writes `ESC[2J ESC[3J ESC[H` and `fullStaticOutput + output`. `[3J` clears the
  scrollback, and the rewrite repeats on every status tick, so a tall live frame -- the
  process-output panel is up to 30 rows, a session list or a long prompt is taller -- becomes tens
  of megabytes of redraw and a terminal that cannot be scrolled. The stack from a live run ends in
  `Ink.renderInteractiveFrame`, not in anything in this repository.

  Removing the fallback is not the fix, and shipping that for a while is how this produced its
  second bug: a frame taller than the viewport cannot be rewritten in place (its top is off
  screen and `cursorUp` clamps at row 1), so Ink took the erase-and-rewrite path, wrote the frame
  seven lines lower each tick, and pushed a slightly different copy of it into the scrollback --
  the same status message, over and over, with minute changes, and the screen itself looked
  fine. **The fallback has to stay; what it writes is what was wrong.** The patch keeps
  `shouldClearTerminalForFrame` exactly as shipped and replaces the clear branch with: `ESC[H`
  `ESC[2J` and never `[3J`; the frame's last `rows` lines when it is taller than the screen (the
  same lines upstream leaves visible); the last screenful of history restored above the frame
  when it fits again; and `log.sync()` told exactly what was drawn. One invariant:
  **a repaint writes at most one viewport and never scrolls.** The normal path is left
  byte-identical, and `--check` asserts that, so a change to it cannot hide in this patch.

  `runtime/bin/patch-deepcode-ink.mjs` does the work; the DeepCode layer runs `--self-test`,
  `--apply` then `--check`, and a renderer whose shape the patch does not recognize fails the
  build. It also reverts the superseded predicate-only patch, because a rebuild whose
  `npm install` cannot reach the registry keeps the CLI copy the image already has.
  `runtime_revision` covers `runtime/bin/*`, so changing the patch changes the image tag. Do not
  turn an apply failure into a warning, and do not "fix" this from the frontend by resizing the
  PTY: the size was already right in the runs that reproduced both bugs.

  **An image can be current and unpatched, because the tree is the one *this window* resolved.**
  `seccomp::runtime_dir()` prefers `DEEPSAND_RUNTIME_DIR`, then `./runtime`, then the one beside
  the executable -- which for an **installed** build is the snapshot its installer shipped. So an
  installed window from before the TUI patches derives a tag from *its* tree (here
  `r708c47d8b82ea923`), builds an image from stock scripts, and runs it: the terminal scrolls on
  every repaint, exactly the bug the Ink patch fixes, while the log reads normally and the tag
  looks like any other. That is what happened when the installed build was launched instead of
  the one from the repository, and it cost a session of staring at a scrolling terminal. Two
  things now say so without a Docker call: `deepsandctl doctor` prints the tree, its revision and
  which patches it applies (`NO TUI PATCHES: missing ink-viewport-repaint, ...`), and every start
  logs the tree at INFO or a warning naming what is missing --
  `runtime_files::{tui_patches, missing_tui_patches}`, where a patch counts only if the script
  exists **and** the Dockerfile runs it. When the symptom is "the old bug is back", read that
  line before re-reading the patch: `deepsandctl doctor` with `DEEPSAND_RUNTIME_DIR` set to the
  suspect tree answers it in one command, and the revision it prints is the one in the tag.

  **A blank terminal with no status bar is the prompt's own index walk, not the renderer.**
  When a project "refuses to run" -- an empty pane, no input box, no cursor, and nothing on
  screen for minutes -- the CLI has not painted its *first* frame yet, and the reason is
  upstream's: `PromptInput` builds the `@`-mention index in a `useState` **initialiser**, which
  runs during the first render, by walking the whole workspace. On a normal filesystem that is
  milliseconds. Inside this sandbox the workspace is a Docker Desktop bind mount, where one
  entry costs milliseconds -- measured here, `find` over 39,192 entries took **2m35s**, and the
  CLI emitted nothing but the entrypoint's banner for the first ~90 seconds of a resume. The
  process is not spinning: it sits in `request_wait_answer`, the FUSE wait, inside
  `getdents64`, which is how this was identified (the `node` process's `/proc/<pid>/syscall`
  read as uid 1000 names both). Nothing about it is project-specific except that this workspace
  carries a 31,000-file `.toolchain` and a 5,600-file `target/`, and nothing about it is
  session-specific except that every run pays it.

  Two fixes, both in `runtime/bin/patch-deepcode-mentions.mjs`, and each is defensible alone.
  **Starting the index empty is enough**, because three lines below the initialiser upstream
  already runs the same scan in a mount effect (`refreshFileMentionItems`) -- and again when the
  agent goes idle and when a mention token first appears -- so the initialiser was doing the
  same work a task too early, before Ink could paint. **And the walk must not descend into
  dot-directories**: `.toolchain`, `.cargo`, `.venv`, `.npm` are tool state, and because the
  cap is on *items* (20,000) a vendored toolchain consumed the budget so that `ui/` and
  `crates/` were never indexed at all -- `@` completion was slow *and* wrong. Hidden
  directories are skipped except the ones that hold source (`.github`, `.vscode`,
  `.devcontainer`, `.storybook`, `.well-known`, `.deepcode`, `.claude`); hidden *files* still
  appear, so `.env.example` remains mentionable. The index is a completion aid, so this removes
  nothing from the sandbox: the model can still read any path it names.

  Measured after the patch, same image, same conversation, same workspace: the input box is on
  screen **within one second**, against ~90-120 before. The patch refuses a bundle whose shape
  it does not know, and refuses when the mount effect has gone (starting empty would then mean
  never having an index), so a changed CLI fails the build rather than shipping a session whose
  `@` completion silently does nothing. `--self-test` runs the scanner *out of the file being
  patched* against a temporary tree, which is why the Dockerfile runs `--apply`, `--check`, then
  `--self-test` for this patch and the reverse order for the Ink one.

  **A slow mount is the cause, and it is measurable from the host.** `MSYS2_ARG_CONV_EXCL='*'
  docker run --rm -v "<project>:/w:ro" alpine sh -c 'time find /w -type f | wc -l'` answers it
  in one command: seconds is healthy, minutes is the sharing layer, and `docker image prune` or
  a renderer fix will not touch it. Do not read a stalled bind mount as a bug in the CLI's
  logic -- the same CLI on a named volume renders immediately.

  **A start is not "no session", and a write is not the place to hold the map.** `docker run -t`
  asks the terminal for a cursor position as soon as the PTY exists and waits for the answer;
  xterm's answer arrives through `write_to_session` *before* `start_container` returns and the
  session is inserted. Refusing it with "no sandbox is running" leaves Docker waiting, and the
  container can come up with a TTY of its own choosing -- the wrong-sized frame again, and a
  start that takes seventeen seconds. `AppState::early_input` holds input while
  `is_starting` is true and `start_session` flushes it the moment the session registers; it is
  cleared when a start begins (so a stale answer is never typed into the next session), bounded
  at 64 KiB, and dropped in `cleanup_session`. The other half is the lock: `write_to_session_impl`
  used to hold `AppState::sessions` across `write_all`, so a PTY whose reader had stopped
  accepting input took the Stop and Resize paths down with it -- the window sat on "Stopping..."
  while the operator held Ctrl+C into an already-wedged terminal. Clone `Session::writer()`, drop
  the map lock, then write. A resize is the same kind of call: clone
  `Session::resize_handle()` out of the map, drop the map, then resize, or a ConPTY that has
  stopped answering takes Stop and the next start down with it.

  **A stop is bounded by the operator's patience, not by `COMMAND_TIMEOUT`.** `remove_container`
  and the stop-time thaw now use `REMOVAL_LEASH` (15 s per step). A removal that the daemon
  refuses is residue the sweep collects; two minutes of nothing on the Stop button is what the
  leash exists to prevent.
* **An egress-proxy test must not read the connection to the end.** The proxy answers a
  tunnel with `200 Connection Established` and then relays, so the connection closes when
  the *far end* closes it: measured here, GitHub at 91 s and Cloudflare at 15 s, which is
  where 170 of this suite's 175 seconds went. Read until a quiet period instead, and bound
  the upstream attempt in the proxy itself (`ProxyConfig::upstream_timeout`, which covers
  resolution as well as connect) rather than relying on the network to answer promptly.
* **MCP `tools/call` is capped at 60 s.** The bridge waits ~45 s and then replies
  `PENDING` with a request id; the model collects the answer later with
  `deepsand_check_request`. Do not make the bridge block indefinitely.
* **A permission dialog freezes the sandbox, and freezing does not stop the clock.** While the
  operator has a request in front of them the container is `docker pause`d, so the agent cannot
  work ahead of a decision it has not been given; the broker watcher reconciles that against the
  pending set every 400 ms through `docker::freeze_transition`, which answers `None` unless the
  answer changed (a `docker` call is 180-600 ms, so a level-triggered version would spawn one per
  tick). DeepCode's 60 s budget is a `setTimeout` inside the *frozen* process, and a timer counts
  down in real time whatever its process is doing: a decision that takes longer than that ends
  the tool call the agent was waiting on, which is why `deepsand_list_requests` exists -- it names
  each request and what it was for, so a model that never saw the id can still collect the
  decision. Two rules come with it. Every removal thaws first (`container_teardown_args`), because
  a frozen container refuses `exec` and cannot take a signal; and nothing may be left frozen when
  the app goes away, so `stop_session_internal` thaws and clears, and an orphan sweep at startup
  removes whatever a crash left behind.
* **The store lock is not re-entrant, and a synchronous command holds it on the UI thread.**
  `store(&state)` locks `AppState::store`, so calling it while a `MutexGuard` from the same
  thread is alive deadlocks instead of failing. The secret branch of `answer_request` did
  exactly that, and because the command was a plain `fn` it ran on the UI thread: pressing
  "Grant access" for a secret froze the whole window, saved nothing, wrote no answer and left
  the request file on disk -- so the sandbox stayed paused and the same dialog came back after
  every launch. Read what you need from the guard, drop it, then do the keystore work; the
  command is `async` now so nothing that may block holds the window. Two follow-ons came from
  the same report. Every path that answers a request must also clear it -- the secret branch
  did not, on either outcome -- and a request left behind is re-announced on the next tick and
  after every restart, so `scan_detailed` now treats an existing response as the truth: it
  drops the leftover request instead of showing a decision that was already taken.
* **Bind mounts cannot be added to a running container.** An approval recreates
  the container and resumes the session from the named volume. DeepCode's
  `--last` calls `process.exit(1)` when there is no session, so the session index
  is verified in the volume before `--last` is used. A grant inside a
  pre-declared `allowed_roots` entry is the exception that skips the restart
  (the core supports it; the UI does not expose it yet).
* **Wiping a project's DeepCode data removes only its state volume.** The conversation
  history is in `deepsand-state-<slug>`, mounted at `/home/deepcode/.deepcode`; the code is a
  bind mount of `root_dir`. `wipe_project_deepcode_data` takes a project id, resolves the
  volume from the store, stops the session, and refuses any name outside the
  `deepsand-state-` prefix. It re-checks that the volume is gone before reporting success.
  Nothing in this path receives the host project path, which is the property that makes the
  button safe next to "Remove project".
* **Windows specifics.** The terminal is a real ConPTY via `portable-pty`. When a
  command passes Windows-style paths or `/`-prefixed arguments through this
  shell, set `MSYS2_ARG_CONV_EXCL='*'` or msys rewrites them.
* **Release profile is `panic = "abort"`**, so no unwinding: a panic takes the
  process down. Prefer returning `Result` at the edges.
* **`lto = true` with `codegen-units = 1` makes the link the cost of a release
  build.** That is the right trade for a shipped binary and the wrong one for a
  local loop, which is why `app:build:debug` and `app:build:fast` exist.
  **The linker is not the lever, and that is measured, not assumed.** A release
  relink of `deepsand-app` after touching one file takes 219 s with the MSVC
  `link.exe` and 212 s with `rust-lld` — 3%, which is noise. With `lto = true` the
  time is LLVM optimizing across every crate *before* any linker runs, so swapping
  the linker cannot help. Do not spend an afternoon on it twice. The lever is LTO
  itself: turn it off for local builds, which is what `app:build:fast` does. Note
  that changing any of this changes cargo's fingerprints, so the first build after
  such a change recompiles everything — including in CI, where it costs one cache
  miss on the next release. Changing `RUSTFLAGS` does the same.
* **One image tag, derived in one place.** The `image` in settings is a *stem*: the tool
  selection and the runtime revision are appended to it, so the stem is not what any project
  runs. `settings::settings_for_project` is the only place that substitution happens, and
  every caller that builds a plan goes through it. This was wrong for a while in the most
  expensive way: two call sites derived the tag, one was forgotten, and the plan named the
  stem while the app built, labelled and digest-checked the derived tag -- so the selected
  tools were never in the sandbox and the revision that forces a rebuild never reached a
  container. If you add a plan path, add a test that the argv names the project's tag.
  `deepsandctl plan <project> --offline` prints the argv without touching Docker, which is
  how this was caught.
* **The image's slow step depends on the tool selection, not on the app.** The
  tools layer (`apt` plus `cargo install`, e.g. htmlq) is ~70 s and only rebuilds
  when a project's tools change; the DeepCode layer is keyed by the CLI version the host
  resolved, so it rebuilds when that version moves -- not on every build. Both are covered by
  BuildKit cache mounts for apt's lists/archives and npm's cache, which is why the apt
  branches must not `rm -rf /var/lib/apt/lists/*` any more: that would empty a cache
  rather than shrink a layer. Cargo's registry is deliberately *not* mounted — the
  tools step deletes `$CARGO_HOME`, and deleting a mounted path fails the build.
* **The contained CLI is brought up to date before every start, from the host.** It lives in the
  image, the rootfs is read-only, and its own update prompt appears *inside the terminal* where
  it cannot be acted on -- so an image built weeks ago asks an unanswerable question. The rule is
  `cli.rs` + `cli_refresh.rs`: resolve `dist-tags.latest` from npm (cached for
  `cli::CHECK_INTERVAL`, fifteen minutes, in `buildcache/deepcode-cli`), compare it with the
  image's `deepsand.deepcode.version` label, and rebuild that one layer before the container is
  created. Four things about it are load-bearing. The label is the *only* source of "what the
  image has" -- asking a container would need one to exist, and this is decided before there is
  one; a missing or `latest` label means *unknown*, which counts as out of date, because
  "probably fine" is how a stale CLI is never noticed. A registry that cannot be reached yields
  no version and therefore no rebuild: the sandbox starts on the image it has, since a stale CLI
  is a nuisance and a Run that refuses to start is not. The wait is on `builds_in_flight`, not on
  `image_present`, because the tag exists the whole time (it is the old image). And a failed
  refresh never fails the start -- it is logged, and the operator gets a sandbox. When a version
  *is* resolved, `DEEPCODE_REFRESH` is `pinned`, which makes the layer's cache key the version
  itself; only an unresolved build passes a timestamp, because an unpinned `@latest` install is
  the one thing the layer cache cannot see.
* **Moving or renaming the checkout needs `cargo clean`, and that includes the
  release profile.** Two things bake the absolute path of the working directory into
  build output: `env!("CARGO_MANIFEST_DIR")` in the test that reads
  `runtime/seccomp-hardened.json`, and Tauri's generated permission files under
  `target/<profile>/build/tauri-*/out/`. After a rename the stale binary or build
  script looks in the old directory and fails with `os error 3` and a path you no
  longer have. `cargo clean -p tauri -p tauri-build -p deepsand-app` covers the
  second in **both** profiles; touching the file covers the first. Do it before the
  first build after a move, not after: `tauri build` otherwise fails at the *end* of
  a long release build, which is where this note's second sentence comes from.

* **A dev cache that never prunes is not a cache.** Cargo writes a new
  `target/debug/incremental/<crate>-<hash>` directory whenever a unit's hash changes — a
  version bump, a different feature set (`devtools`), a toolchain update — and never removes
  the old ones. This workspace reached 54 GiB of dev artifacts: 24 GiB across 255 stale
  incremental directories, and 16 GiB more in `deps`, including repeated 150 MB
  `deepsand_app_lib-*.pdb` copies. `[profile.dev] incremental = false` is the structural fix;
  `npm run clean:dev` reclaims what is already there and is the first thing to reach for when
  `target/debug` grows again.

## Definition of done

```bash
npm run core:check
npm test
npm run build
```

If you added or changed visible UI text, check that every bundle in `src/i18n/`
has the same keys *and* the same `{placeholders}`. There are seventeen: `en`,
`zh`, `hi`, `es`, `ar`, `fr`, `ru`, `ja`, `ko`, `vi`, `pt`, `id`, `bn`, `sw`,
`ha`, `yo`, `am`. A key that exists only in English silently falls back to
English in every other language, which is the one translation bug `npm run
build` cannot see.

If you changed an English page under `docs-site/`, run `npm run docs:translate`
so every locale tree stays in step, then `npm run docs:build`. Do not edit the
generated locale pages by hand.

If you touched `runtime/`, re-read invariant 5 and check `runtime/README.md` —
the image is only rebuilt when its revision hash changes. If you changed the
permission protocol, `runtime/bin/deepsand-mcp-bridge.mjs` and
`crates/deepsand-core/src/broker.rs` have to move together; the two facts worth
preserving are that the bridge writes requests atomically and that the answer
directory stays read-only.

## Two AGENTS.md files

| File | Audience |
| --- | --- |
| `AGENTS.md` (this file, repository root) | Contributors and coding agents changing Deepsand. |
| The generated `config/AGENTS.md` | The model running **inside** the sandbox. |

The second one is produced by `crates/deepsand-core/src/settings.rs` for every
project, installed into the container at `/etc/deepsand/AGENTS.md`, and copied to
`$HOME/.deepcode/AGENTS.md` where DeepCode loads it automatically. It tells the
contained model what it can currently reach and how to ask for more. Changing how
the sandbox behaves means editing that generated text, not this file.
