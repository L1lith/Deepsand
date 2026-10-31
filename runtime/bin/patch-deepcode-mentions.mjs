#!/usr/bin/env node
/**
 * Make the `@`-mention index stop blocking the first paint.
 *
 * DeepCode's prompt input builds its file-mention index in the **initialiser of a `useState`**,
 * which runs during the component's first render -- before Ink is given a frame to paint:
 *
 *   const [fileMentionItems, setFileMentionItems] = useState(() => scanFileMentionItems(projectRoot));
 *
 * That is a walk of the whole workspace, and the walk is *sync*: the first render cannot finish
 * until it does. On a normal filesystem it is milliseconds and nobody notices. Inside this
 * sandbox the workspace is a bind mount served by Docker Desktop's FUSE layer, where a single
 * `readdir`/`stat` costs milliseconds rather than microseconds -- measured here: 39,192 entries
 * took 2m35s to walk from inside a container, and the CLI painted nothing for the first ~90
 * seconds of a resume. The operator sees an empty terminal with no status bar, no input box and
 * no cursor: "it hangs". (It is not the renderer, and not the conversation.)
 *
 * Two things are wrong, and each one is fixed here on its own terms:
 *
 *   1. **The initialiser does not need to scan at all.** Three lines below it, upstream already
 *      runs the same scan in a mount effect (`refreshFileMentionItems`), and again whenever the
 *      agent goes idle and when a mention token first appears. Starting from an empty list is
 *      what makes the first frame cheap; the effect fills the index one task later.
 *
 *   2. **The walk descends into dot-directories.** `.toolchain`, `.cargo`, `.venv`, `.npm`,
 *      `.terraform`... are tool state, not source, and they are where the entries are. This
 *      workspace carries a 31,000-file `.toolchain` inside it; the scan's cap is on *items*
 *      (20,000), so the toolchain consumed the whole budget and the real source -- `ui/`,
 *      `crates/` -- was never indexed at all. `@` completion was both slow *and* wrong.
 *
 * A dot-directory is skipped unless it is one people actually keep source in (`.github`,
 * `.vscode`, `.devcontainer`, `.storybook`, `.well-known`, `.deepcode`, `.claude`). Hidden
 * *files* are untouched: mentioning `.env.example` or `.gitignore` still works. This is the
 * rule ripgrep applies by default, and the index is a completion aid: nothing is removed from
 * the sandbox, and the model can still read any path it names.
 *
 * The patch is exact rather than clever, and fail-closed: a bundle whose shape this does not
 * recognise fails the build. It also refuses to patch when the mount effect that fills the index
 * is absent, because then starting empty would mean never having an index at all.
 *
 * Run `--check` after `--apply`; the Dockerfile does both, and `--self-test` too, so the scan
 * that ships in the image is the one that gets measured.
 *
 * Usage:
 *   node patch-deepcode-mentions.mjs --apply [--file /path/to/cli.js]
 *   node patch-deepcode-mentions.mjs --check [--file /path/to/cli.js]
 *   node patch-deepcode-mentions.mjs --self-test [--file /path/to/cli.js]
 */

import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const PREFIX = "deepsand: patch-deepcode-mentions:";

/** The module boundary in the bundle. Everything below is scoped to it. */
const MODULE_HEADER = "// packages/cli/src/ui/core/file-mentions.ts";

/**
 * The scanner's entry point; the patch inserts the directory rule immediately before it. A
 * pattern rather than a string because the default is spelled `DEFAULT_MAX_ITEMS` in one release
 * and inlined in the next, and that difference must not read as a missing patch.
 */
const SCAN_HEAD = /^function scanFileMentionItems\(root, maxItems = [^)]*\) \{$/m;

/**
 * The first render's scan. Written as a pattern because the React namespace name is esbuild's
 * (`import_react48` today), and a rename between releases should not read as a missing patch.
 */
const EAGER_INITIALIZER =
  /const \[fileMentionItems, setFileMentionItems\] = \(0, ([\w$]+)\.useState\)\(\(\) => scanFileMentionItems\(projectRoot\)\);/;
const LAZY_INITIALIZER =
  /const \[fileMentionItems, setFileMentionItems\] = \(0, ([\w$]+)\.useState\)\(\(\) => \[\]\);/;

/** Marks the replacement, so a second `--apply` is a no-op and `--check` is exact. */
const LAZY_MARKER = "deepsand: the mount effect below fills this after the first frame";

/** The skip condition, as shipped and as patched. */
const SKIP_UPSTREAM = `      if (entry.name === "." || entry.name === ".." || entry.name === ".git") {`;
const SKIP_PATCHED = `      if (entry.name === "." || entry.name === ".." || entry.name === ".git" || isHiddenMentionDirectory(entry)) {`;

/**
 * The premise of edit 1: the same scan already runs after the first frame. Written against
 * normalized text so formatting cannot hide it, and required by both `apply` and `verify`.
 */
const MOUNT_EFFECT = `(0, import_react48.useEffect)(() => { refreshFileMentionItems(); }, [refreshFileMentionItems]);`;

/** Marks the inserted rule, so `--check` can tell "not yet patched" from "patched". */
const RULE_MARKER = "deepsand: a dot-directory is tool state, not source";

const ALLOWED_DOT_DIRS = [
  ".github",
  ".vscode",
  ".devcontainer",
  ".storybook",
  ".well-known",
  ".deepcode",
  ".claude",
];

const RULE = `// ${RULE_MARKER}. Walking them made the index cost minutes on a bind-mounted workspace, and
// because the cap is on items, a vendored toolchain could consume it before any source was reached.
var MENTION_ALLOWED_DOT_DIRS = ${JSON.stringify(ALLOWED_DOT_DIRS)};
function isHiddenMentionDirectory(entry) {
  return (entry.isDirectory() || entry.isSymbolicLink()) && entry.name.startsWith(".") && entry.name !== "." && entry.name !== ".." && !MENTION_ALLOWED_DOT_DIRS.includes(entry.name);
}
__name(isHiddenMentionDirectory, "isHiddenMentionDirectory");
`;

// --------------------------------------------------------------------------- mechanics

function fail(message) {
  console.error(`${PREFIX} ${message}`);
  process.exit(1);
}

/** The same, as an exception, so the self-test can assert that a shape it does not know is refused. */
function refuse(message) {
  throw new Error(message);
}

function defaultCliJs() {
  if (process.env.DEEPCODE_CLI_JS) return process.env.DEEPCODE_CLI_JS;
  const fixed = "/usr/local/lib/node_modules/@vegamo/deepcode-cli/cli.js";
  try {
    if (statSync(fixed).isFile()) return fixed;
  } catch {}
  try {
    const root = execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim();
    return join(root, "@vegamo", "deepcode-cli", "cli.js");
  } catch {
    return fixed;
  }
}

function cliVersion(cliJs) {
  try {
    const pkg = JSON.parse(readFileSync(join(dirname(cliJs), "package.json"), "utf8"));
    return typeof pkg.version === "string" ? pkg.version : "unknown";
  } catch {
    return "unknown";
  }
}

function writeAtomically(file, contents) {
  const mode = statSync(file).mode & 0o777;
  const tmp = `${file}.deepsand-patch-${process.pid}`;
  writeFileSync(tmp, contents, { mode });
  chmodSync(tmp, mode);
  renameSync(tmp, file);
}

/** Collapse whitespace, so a comparison is about code and not about formatting. */
function normalize(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\s+/g, " ").trim();
}

function countOf(source, needle) {
  return source.split(needle).length - 1;
}

function countRegex(source, pattern) {
  return (source.match(new RegExp(pattern.source, `${pattern.flags}g`)) ?? []).length;
}

/**
 * The scanner's own module, from its bundle header to the next module's.
 *
 * Every locator below is scoped to this slice, so an identical line somewhere else in a 4 MB
 * bundle (`file-mentions` is not the only module that walks a directory) cannot be patched by
 * accident.
 */
function mentionsModule(source) {
  const start = source.indexOf(MODULE_HEADER);
  if (start === -1) {
    refuse(`the bundle has no "${MODULE_HEADER}" module, so the file-mention scanner is not where this expects it`);
  }
  const rest = source.slice(start + MODULE_HEADER.length);
  const nextModule = rest.search(/\n\/\/ packages\//);
  const end = nextModule === -1 ? source.length : start + MODULE_HEADER.length + nextModule;
  const text = source.slice(start, end);
  if (countRegex(text, SCAN_HEAD) !== 1) {
    refuse(`the file-mention module does not contain exactly one "${SCAN_HEAD}", so its scanner has changed shape`);
  }
  return { start, end, text };
}

/**
 * What the file currently says.
 *
 * Two scopes, on purpose. The *scanner* lives in the `file-mentions` module, so its rule is
 * matched there and nowhere else. The *prompt input* that calls it lives in another module
 * entirely -- that is where the initialiser and the mount effect are -- so those are matched
 * against the whole bundle, where each appears exactly once.
 */
function inspect(source) {
  const { start, end, text } = mentionsModule(source);
  return {
    start,
    end,
    text,
    eagerInitializer: countRegex(source, EAGER_INITIALIZER) === 1,
    lazyInitializer: countRegex(source, LAZY_INITIALIZER) === 1 && countOf(source, LAZY_MARKER) === 1,
    rulePresent: text.includes(RULE_MARKER) && countOf(text, SKIP_PATCHED) === 1,
    skipUpstream: countOf(text, SKIP_UPSTREAM) === 1,
    skipPatched: countOf(text, SKIP_PATCHED) === 1,
    mountEffect: normalize(source).includes(normalize(MOUNT_EFFECT)),
  };
}

function replaceOnce(source, needle, replacement, description) {
  if (countOf(source, needle) !== 1) {
    refuse(`${description}: expected exactly one occurrence, found ${countOf(source, needle)}`);
  }
  return source.split(needle).join(replacement);
}

/**
 * Apply both edits. Returns `{ source, changed }`, or throws -- never writes a half patch.
 */
function apply(source) {
  const state = inspect(source);
  if (!state.mountEffect) {
    refuse(
      "the file-mention index is no longer filled after the first frame (the mount effect is missing), " +
        "so starting empty would leave it empty forever",
    );
  }
  if (state.skipPatched !== state.rulePresent) {
    refuse("the directory rule is half applied; rebuild the image rather than patching over it");
  }

  let next = source;
  let changed = false;

  if (!state.lazyInitializer) {
    if (!state.eagerInitializer) {
      refuse("the file-mention index does not start from a scan of the project this patch recognises");
    }
    const replacement = [
      `  // ${LAZY_MARKER}. Scanning here ran a whole-workspace walk inside the first render,`,
      "  // so Ink got no frame to paint until it finished: a blank pane that looks like a hang.",
      "  const [fileMentionItems, setFileMentionItems] = (0, import_react48.useState)(() => []);",
    ].join("\n");
    next = next.replace(EAGER_INITIALIZER, replacement);
    changed = true;
  }

  if (!state.rulePresent) {
    if (!state.skipUpstream) {
      refuse("the scanner's directory skip is not the one this patch recognises");
    }
    const state2 = inspect(next);
    // The rule goes immediately above the scanner, and the skip condition names it. A callback
    // for the insert keeps the matched signature byte-for-byte: this edits one line, not a body.
    const withRule = state2.text.replace(SCAN_HEAD, (match) => `${RULE}\n${match}`);
    next =
      next.slice(0, state2.start) +
      withRule.replace(SKIP_UPSTREAM, SKIP_PATCHED) +
      next.slice(state2.end);
    changed = true;
  }

  return { source: next, changed };
}

function verify(source, file, version) {
  const state = inspect(source);
  if (state.eagerInitializer) {
    refuse(`${file} (DeepCode ${version}) still scans the workspace during the first render`);
  }
  if (!state.lazyInitializer) {
    refuse(`${file} (DeepCode ${version}) does not start the file-mention index empty`);
  }
  if (!state.mountEffect) {
    refuse(`${file} (DeepCode ${version}) no longer fills the file-mention index after the first frame`);
  }
  if (!state.rulePresent || !state.skipPatched) {
    refuse(`${file} (DeepCode ${version}) does not skip hidden directories while scanning`);
  }
}

// --------------------------------------------------------------------------- run the scanner
//
// The semantic half needs the scanner *as it exists in the file*: a reimplementation would prove
// nothing about what ships. The module is self-contained apart from two node built-ins and the
// `ignore` package, so it is evaluated on its own with the smallest honest stand-ins.

function loadScanner(source) {
  const { text } = mentionsModule(source);
  const body = text.replace(/^\s*import .*$/gm, "");
  if (/\bimport\s/.test(body)) {
    refuse("the file-mention module imports something this harness does not provide");
  }
  const factory = new Function(
    "__toESM",
    "__name",
    "init_esbuild_shims",
    "require_ignore2",
    "fs23",
    "path22",
    `${body}\nreturn { scanFileMentionItems };`,
  );
  const require = createRequire(import.meta.url);
  const __name = (fn) => fn;
  const __toESM = (mod) => {
    const out = { default: mod && mod.default ? mod.default : mod };
    for (const key of Object.keys(mod || {})) out[key] = mod[key];
    return out;
  };
  // No pattern here names `.toolchain`, so if the scanner descended into it the item would be in
  // the result -- which is what makes the assertion below a measurement of the new rule.
  // The bundle calls `require_ignore2()` to get the *module* -- whose default export is the
  // `ignore` function -- and then `(0, import_ignore2.default)().add(...)`. So the module is
  // `() => ignore`, and `ignore()` is what returns a matcher.
  //
  // The matcher understands a name and a `*` glob, which is all the scanner's own patterns are.
  // That is deliberately enough to keep the shipped noisy list honest: this test must show
  // `node_modules` and `target` are still skipped, so that "the rule is the only thing that
  // changed" is a measurement and not a claim.
  const ignore = () => {
    const patterns = [];
    const matcher = {
      add(next) {
        if (typeof next === "string") patterns.push(...next.split(/\r?\n/));
        else if (Array.isArray(next)) patterns.push(...next);
        return matcher;
      },
      filter: (paths) => paths,
      test(candidate) {
        const relative = String(candidate).replace(/^\/+|\/+$/g, "");
        const segments = relative.split("/");
        const ignored = patterns.some((raw) => {
          const pattern = String(raw).trim().replace(/^\/+|\/+$/g, "");
          if (!pattern || pattern.startsWith("#") || pattern.startsWith("!")) return false;
          if (!pattern.includes("*")) return segments.includes(pattern);
          const source = pattern.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
          const re = new RegExp(`^${source}$`);
          return re.test(relative) || segments.some((segment) => re.test(segment));
        });
        return { ignored, unignored: false };
      },
    };
    return matcher;
  };
  const fs = require("node:fs");
  const path = require("node:path");
  return factory(__toESM, __name, () => {}, () => ignore, fs, path);
}

function makeFixtureTree() {
  const root = mkdtempSync(join(tmpdir(), "deepsand-mentions-"));
  const write = (relative, contents = "x\n") => {
    const file = join(root, relative);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, contents);
  };
  write("src/main.rs");
  write("README.md");
  write(".env.example", "KEY=\n"); // a hidden *file*: still mentionable
  write(".github/workflows/ci.yml");
  write("node_modules/dep/index.js"); // in the shipped noisy list
  write("target/debug/app"); // also in the shipped noisy list
  // The case this patch exists for: a vendored toolchain, bigger than the item cap.
  for (let index = 0; index < 300; index += 1) {
    write(`.toolchain/zig/lib/libc/include/header-${index}.h`);
  }
  try {
    symlinkSync(join(root, ".toolchain"), join(root, ".venv"));
  } catch {
    // A symlink that cannot be created (permissions) is not a failure of the rule; the
    // directory cases above already cover it.
  }
  return root;
}

function scanFixture(source) {
  const root = makeFixtureTree();
  try {
    const { scanFileMentionItems } = loadScanner(source);
    const items = scanFileMentionItems(root);
    return { root, paths: items.map((item) => item.path) };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

// --------------------------------------------------------------------------- self-test

const FIXTURE = [
  "// packages/cli/src/ui/core/file-mentions.ts",
  "init_esbuild_shims();",
  'import * as fs23 from "fs";',
  'import * as path22 from "path";',
  "var DEFAULT_MAX_ITEMS = 2e4;",
  "var DEFAULT_MAX_DEPTH = 8;",
  "var DEFAULT_NOISY_DIR_NAMES = [",
  '  ".git",',
  '  "node_modules"',
  "];",
  "function scanFileMentionItems(root, maxItems = DEFAULT_MAX_ITEMS) {",
  "  function visit(directory, depth, matchers) {",
  "    for (const entry of entries) {",
  SKIP_UPSTREAM,
  "        continue;",
  "      }",
  "      addItem({ path: relative5, type: \"file\" });",
  "    }",
  "  }",
  "  return items;",
  "}",
  "__name(scanFileMentionItems, \"scanFileMentionItems\");",
  "// packages/cli/src/ui/core/clipboard.ts",
  "function PromptInput() {",
  "  const [fileMentionItems, setFileMentionItems] = (0, import_react48.useState)(() => scanFileMentionItems(projectRoot));",
  "  const refreshFileMentionItems = import_react48.default.useCallback(() => {",
  "    setFileMentionItems(scanFileMentionItems(projectRoot));",
  "  }, [projectRoot]);",
  "  (0, import_react48.useEffect)(() => {",
  "    refreshFileMentionItems();",
  "  }, [refreshFileMentionItems]);",
  "}",
  "// packages/cli/src/ui/core/prompt-buffer.ts",
].join("\n");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function judge(hidden, name, isDirectory, expected) {
  assert(hidden(name, isDirectory) === expected, `${name} (${isDirectory ? "dir" : "file"}) should ${expected ? "" : "not "}be skipped`);
}

function selfTest(file) {
  // --- structural: the three edits, idempotence, and the shapes it must refuse
  let state = inspect(FIXTURE);
  assert(!state.lazyInitializer && state.eagerInitializer, "the fixture must start unpatched");
  assert(state.skipUpstream, "the fixture must carry the shipped skip condition");
  assert(state.mountEffect, "the fixture must carry the mount effect");

  let failed = false;
  try {
    verify(FIXTURE, "fixture", "fixture");
  } catch {
    failed = true;
  }
  assert(failed, "an unpatched fixture must not verify");

  const first = apply(FIXTURE);
  assert(first.changed, "the first apply must change the fixture");
  verify(first.source, "fixture", "fixture");
  const second = apply(first.source);
  assert(!second.changed && second.source === first.source, "a second apply must be a no-op");

  let refused = false;
  try {
    apply(FIXTURE.replace(/  \(0, import_react48\.useEffect\)\(\(\) => \{\n    refreshFileMentionItems\(\);\n  \}, \[refreshFileMentionItems\]\);\n/, ""));
  } catch {
    refused = true;
  }
  assert(refused, "a bundle without the mount effect must be refused");

  refused = false;
  try {
    apply(FIXTURE.replace("() => scanFileMentionItems(projectRoot)", "() => scanFileMentionItems(projectRoot, 5)"));
  } catch {
    refused = true;
  }
  assert(refused, "an initializer shape this does not know must be refused");

  // --- the rule itself: dot-directories go, dot-files and ordinary names stay
  // Sliced from the start of the marker's comment, so what is evaluated is the real declaration
  // and the real function -- not a copy of them.
  const ruleStart = first.source.indexOf(`// ${RULE_MARKER}`);
  assert(ruleStart !== -1, "the patched fixture must carry the directory rule");
  const ruleSource = first.source.slice(ruleStart);
  const ruleBody = ruleSource.slice(0, ruleSource.indexOf("__name(isHiddenMentionDirectory"));
  const rule = new Function("entry", `${ruleBody}\nreturn isHiddenMentionDirectory(entry);`);
  const judge = (name, kind, expected) => {
    const entry = { name, isDirectory: () => kind === "dir", isSymbolicLink: () => kind === "link" };
    const skipped = rule(entry);
    assert(
      skipped === expected,
      `${name} (${kind}) should ${expected ? "" : "not "}be skipped by the mention scan`,
    );
  };
  judge(".toolchain", "dir", true);
  judge(".cargo", "dir", true);
  judge(".venv", "link", true);
  judge(".git", "dir", true);
  judge(".github", "dir", false);
  judge(".vscode", "dir", false);
  judge(".claude", "dir", false);
  judge(".env.example", "file", false);
  judge("src", "dir", false);

  // --- semantic, against the real scanner when this machine has one
  const target = file ?? defaultCliJs();
  let measured = 0;
  if (existsSync(target)) {
    const source = readFileSync(target, "utf8");
    const state = inspect(source);
    if (!state.lazyInitializer) {
      throw new Error(`${target} is not patched, so its scanner cannot be measured`);
    }
    const { paths } = scanFixture(source);
    const has = (suffix) => paths.some((path) => path === suffix);
    assert(has("src/main.rs"), "the scan must still find ordinary source");
    assert(has(".github/workflows/ci.yml"), "the scan must still find source in an allowed dot-directory");
    assert(has(".env.example"), "the scan must still offer hidden files");
    assert(!paths.some((path) => path.startsWith(".toolchain")), "the scan must not descend into .toolchain");
    assert(!paths.some((path) => path.startsWith(".venv")), "the scan must not follow a hidden symlink");
    assert(!has("node_modules/dep/index.js"), "the shipped noisy list must still apply");
    assert(!has("target/debug/app"), "the shipped noisy list must still apply");
    measured = paths.length;
    if (!existsSync("/.dockerenv")) {
      console.log(`${PREFIX} note: measured ${target}; ${measured} entries from a tree of 306 files`);
    }
  }

  console.log(
    `${PREFIX} self-test passed (${measured > 0 ? `measured against ${target}` : "structural only: no bundle on this machine"})`,
  );
}

// --------------------------------------------------------------------------- main

const args = process.argv.slice(2);
const mode = args.includes("--self-test")
  ? "self-test"
  : args.includes("--check")
    ? "check"
    : args.includes("--apply")
      ? "apply"
      : null;
if (!mode) {
  fail("expected --apply, --check or --self-test");
}

if (mode === "self-test") {
  const fileIndex = args.indexOf("--file");
  const file = fileIndex >= 0 && args[fileIndex + 1] ? args[fileIndex + 1] : null;
  try {
    selfTest(file);
  } catch (error) {
    fail(error.message);
  }
  process.exit(0);
}

const fileIndex = args.indexOf("--file");
const file = fileIndex >= 0 && args[fileIndex + 1] ? args[fileIndex + 1] : defaultCliJs();
let source;
try {
  source = readFileSync(file, "utf8");
} catch (error) {
  fail(`could not read ${file}: ${error.message}`);
}
const version = cliVersion(file);

if (mode === "check") {
  try {
    verify(source, file, version);
  } catch (error) {
    fail(error.message);
  }
  console.log(`${PREFIX} verified DeepCode ${version} at ${file}`);
  process.exit(0);
}

let result;
try {
  result = apply(source);
} catch (error) {
  fail(error.message);
}
if (!result.changed) {
  console.log(`${PREFIX} already applied to DeepCode ${version} at ${file}`);
  process.exit(0);
}
writeAtomically(file, result.source);
try {
  verify(readFileSync(file, "utf8"), file, version);
} catch (error) {
  fail(`the patch did not survive being written back: ${error.message}`);
}
console.log(`${PREFIX} patched DeepCode ${version} at ${file}`);
