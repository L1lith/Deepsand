#!/usr/bin/env node
/**
 * Keep DeepCode's busy footer to one line, so a multi-line command cannot hide the input.
 *
 * While a tool is running, `PromptInput` shows `loadingText` in its footer. For a Bash call,
 * `buildProcessLoadingText` returns `(elapsed) ${first.command}` -- the **whole** command,
 * newlines included. A heredoc is therefore rendered as a 30-line footer. That footer is taller
 * than an ordinary terminal, so the live frame is taller than the viewport; the renderer keeps
 * the last screenful, which is the footer's tail, and the prompt input -- rendered just above the
 * footer -- is pushed off the top of the screen. The operator sees a wall of shell script and no
 * input box, and the `esc to interrupt` hint was in the branch that never ran.
 *
 * This patch changes two things, both of them small and structural:
 *
 *   * `buildProcessLoadingText` collapses whitespace in the command before returning it, so the
 *     footer is one line no matter how many lines the command has. `wrap: "truncate-end"` then
 *     does the horizontal truncation it was always meant to do.
 *   * `busyStatusText` puts `esc to interrupt` on the line *before* the command, so the one way
 *     out of a long-running command stays visible when the command itself is truncated.
 *
 * The patch is exact rather than clever, and fail-closed: a bundle whose shapes this does not
 * recognise fails the build rather than shipping an image with the bug. Run `--check` after
 * `--apply`; the Dockerfile does both, and `--self-test` too.
 *
 * The idle half of the footer is operator copy, not structure, so every wording this has been
 * checked against is listed below -- 0.7.0 reworded it (`esc to interrupt · ctrl+c to cancel
 * input` became `enter queue · esc interrupt`) without touching the branch this patch rewrites.
 * An unrecognised wording still stops the build: it is a footer nobody has looked at.
 *
 * Usage:
 *   node patch-deepcode-footer.mjs --apply [--file /path/to/cli.js]
 *   node patch-deepcode-footer.mjs --check [--file /path/to/cli.js]
 *   node patch-deepcode-footer.mjs --self-test
 */

import { chmodSync, existsSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";

const PROCESS_NAME = "buildProcessLoadingText";

/** Marks the footer body this script writes, so a second run is a no-op and --check is exact. */
const PROCESS_MARKER = "deepsand: the busy footer is one line";

/**
 * The return this patch replaces, exactly as the bundled CLI ships it. The command is the
 * operator-visible cause: it is a string with whatever newlines the tool call contained.
 */
const UPSTREAM_PROCESS_RETURN =
  "  return `(${formatElapsedTime(first.startTime, now)}) ${first.command}`;";

const PATCHED_PROCESS_RETURN = `  /* ${PROCESS_MARKER}. A command with newlines made the footer taller than the
     terminal, which pushed the prompt input off the top of it. */
  const command = String(first.command ?? "").replace(/\\s+/g, " ").trim();
  const elapsed = \`(\${formatElapsedTime(first.startTime, now)})\`;
  return command ? \`\${elapsed} \${command}\` : elapsed;`;

/**
 * The branch taken while a process runs. `esc to interrupt` has to be inside it, on the same
 * line as the command: that is the whole point of the patch.
 */
const BUSY_LOADING_BRANCH = "? `${loadingText}${processOrPasteHint}` :";
const BUSY_LOADING_BRANCH_PATCHED = "? `esc to interrupt \\xB7 ${loadingText}${processOrPasteHint}` :";

/**
 * The footer line, exactly as shipped, for every wording this patch knows. `\\xB7` is the
 * escaped middle dot the bundle uses; it is written as two characters in the source and one on
 * screen. Only the loading branch is load-bearing, but the whole statement is matched so a
 * wording nobody has checked still stops the build.
 */
const BUSY_UPSTREAM = [
  "const busyStatusText = loadingText && loadingText.trim() ? `${loadingText}${processOrPasteHint}` : `esc to interrupt \\xB7 ctrl+c to cancel input${processOrPasteHint}`;",
  "const busyStatusText = loadingText && loadingText.trim() ? `${loadingText}${processOrPasteHint}` : `enter queue \\xB7 esc interrupt${processOrPasteHint}`;",
];

const BUSY_PATCHED = BUSY_UPSTREAM.map((statement) =>
  statement.replace(BUSY_LOADING_BRANCH, BUSY_LOADING_BRANCH_PATCHED),
);

function fail(message) {
  console.error(`deepsand: patch-deepcode-footer: ${message}`);
  process.exit(1);
}

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

/**
 * Every JavaScript file the CLI's entry point can load, transitively. 0.5.0 puts the UI in
 * `chunks/cli-app-<hash>.js`, and the package also ships stale chunks nothing imports; following
 * the entry point's own relative imports patches what can actually run.
 */
function bundleFiles(entry) {
  const queue = [resolve(entry)];
  const seen = new Set();
  const files = [];
  while (queue.length > 0) {
    const file = queue.shift();
    if (seen.has(file)) continue;
    seen.add(file);
    let source;
    try {
      source = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    files.push({ file, source });
    for (const match of source.matchAll(/["'`](\.{1,2}\/[^"'`\n]+?\.(?:mjs|cjs|js))["'`]/g)) {
      queue.push(resolve(dirname(file), match[1]));
    }
  }
  return files;
}

function footerFiles(entry) {
  const carrying = bundleFiles(entry).filter(({ source }) =>
    source.includes(`function ${PROCESS_NAME}(`),
  );
  if (carrying.length === 0) {
    refuse(`could not find ${PROCESS_NAME} in the bundled CLI; the footer shape changed`);
  }
  return carrying;
}

function cliVersion(cliJs) {
  let dir = dirname(resolve(cliJs));
  while (true) {
    try {
      const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
      if (typeof pkg.version === "string") return pkg.version;
    } catch {}
    const parent = dirname(dir);
    if (parent === dir) return "unknown";
    dir = parent;
  }
}

function skipNonCode(source, i) {
  const c = source[i];
  if (c === "/" && source[i + 1] === "/") {
    const end = source.indexOf("\n", i + 2);
    return end === -1 ? source.length : end + 1;
  }
  if (c === "/" && source[i + 1] === "*") {
    const end = source.indexOf("*/", i + 2);
    return end === -1 ? source.length : end + 2;
  }
  if (c === "'" || c === '"' || c === "`") {
    const quote = c;
    let j = i + 1;
    while (j < source.length) {
      if (source[j] === "\\") {
        j += 2;
        continue;
      }
      if (source[j] === quote) return j + 1;
      j++;
    }
    return source.length;
  }
  return i + 1;
}

function braceBody(source, open, what) {
  let depth = 0;
  let i = open;
  while (i < source.length) {
    const c = source[i];
    if (c === "'" || c === '"' || c === "`" || (c === "/" && (source[i + 1] === "/" || source[i + 1] === "*"))) {
      i = skipNonCode(source, i);
      continue;
    }
    if (c === "{") depth++;
    if (c === "}") {
      depth--;
      if (depth === 0) return { start: open, end: i + 1 };
    }
    i++;
  }
  refuse(`unterminated ${what} body; the footer shape changed`);
}

/** The body of `function name(...) {...}`, plus the start of the declaration. */
function functionRange(source, name) {
  const declaration = source.indexOf(`function ${name}(`);
  if (declaration < 0) {
    refuse(`could not find function ${name} in the bundled CLI; the footer shape changed`);
  }
  const open = source.indexOf("{", source.indexOf(")", declaration));
  if (open < 0) {
    refuse(`no body after function ${name}; the footer shape changed`);
  }
  return { declaration, ...braceBody(source, open, name) };
}

function describe(body) {
  return body.replace(/\s+/g, " ").trim().slice(0, 320);
}

function inspect(source) {
  const range = functionRange(source, PROCESS_NAME);
  const body = source.slice(range.start, range.end);
  return {
    range,
    body,
    processUpstream: body.includes(UPSTREAM_PROCESS_RETURN),
    processPatched: body.includes(PROCESS_MARKER),
    busyUpstream: BUSY_UPSTREAM.some((statement) => source.includes(statement)),
    busyPatched: BUSY_PATCHED.some((statement) => source.includes(statement)),
  };
}

function apply(source) {
  const state = inspect(source);
  if (!state.processUpstream && !state.processPatched) {
    refuse(`unrecognized ${PROCESS_NAME} body; refusing to patch: ${describe(state.body)}`);
  }
  if (!state.busyUpstream && !state.busyPatched) {
    refuse("unrecognized busy footer; refusing to patch: the interrupt hint shape changed");
  }

  let next = source;
  let changed = false;

  if (!state.processPatched) {
    const body = next.slice(state.range.start, state.range.end).replace(UPSTREAM_PROCESS_RETURN, PATCHED_PROCESS_RETURN);
    next = next.slice(0, state.range.start) + body + next.slice(state.range.end);
    changed = true;
  }

  if (!state.busyPatched) {
    const shipped = BUSY_UPSTREAM.find((statement) => next.includes(statement));
    next = next.replace(shipped, shipped.replace(BUSY_LOADING_BRANCH, BUSY_LOADING_BRANCH_PATCHED));
    changed = true;
  }

  return { source: next, changed };
}

function verify(source, file, version) {
  const state = inspect(source);
  if (!state.processPatched || state.processUpstream) {
    refuse(`${file} (DeepCode ${version}) does not collapse the busy footer to one line`);
  }
  if (!state.busyPatched || state.busyUpstream) {
    refuse(`${file} (DeepCode ${version}) does not keep the interrupt hint visible`);
  }
}

function writeAtomically(file, contents) {
  const mode = statSync(file).mode & 0o777;
  const tmp = `${file}.deepsand-patch-${process.pid}`;
  writeFileSync(tmp, contents, { mode });
  chmodSync(tmp, mode);
  renameSync(tmp, file);
}

// --------------------------------------------------------------------------- self-test

/** A bundle shaped like the one this patch runs against, around one shipped footer statement. */
function fixture(busyStatement) {
  return [
    "function buildProcessLoadingText(processes, now) {",
    "  if (!processes || processes.size === 0) {",
    "    return null;",
    "  }",
    "  const first = processes.values().next().value;",
    "  if (!first) {",
    "    return null;",
    "  }",
    UPSTREAM_PROCESS_RETURN,
    "}",
    "__name(buildProcessLoadingText, \"buildProcessLoadingText\");",
    "function PromptInput() {",
    "  const processOrPasteHint = \" \\xB7 ctrl+o view output\";",
    `  ${busyStatement}`,
    "}",
  ].join("\n");
}

/** 0.7.0 is the wording this build ships against; 0.6.0 and earlier used the other. */
const FIXTURE = fixture(BUSY_UPSTREAM[1]);
const FIXTURE_BEFORE_0_7 = fixture(BUSY_UPSTREAM[0]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function selfTest() {
  // Every footer wording this patch knows must patch, and the idle copy it does not own -- the
  // half 0.7.0 reworded -- has to come out the other side intact.
  for (const [label, shipped, statement] of [
    ["0.7.0", FIXTURE, BUSY_UPSTREAM[1]],
    ["0.6.0", FIXTURE_BEFORE_0_7, BUSY_UPSTREAM[0]],
  ]) {
    const state = inspect(shipped);
    assert(state.processUpstream && !state.processPatched, `${label}: the fixture must start unpatched`);
    assert(state.busyUpstream && !state.busyPatched, `${label}: the fixture must carry the shipped footer`);

    let passedUnpatched = false;
    try {
      verify(shipped, "fixture", label);
      passedUnpatched = true;
    } catch {}
    assert(!passedUnpatched, `${label}: an unpatched fixture must not verify`);

    const first = apply(shipped);
    assert(first.changed, `${label}: the first apply must change the fixture`);
    verify(first.source, "fixture", label);
    const second = apply(first.source);
    assert(!second.changed && second.source === first.source, `${label}: a second apply must be a no-op`);
    assert(!first.source.includes(UPSTREAM_PROCESS_RETURN), `${label}: the upstream multi-line return survived`);
    assert(
      BUSY_PATCHED.some((patched) => first.source.includes(patched)),
      `${label}: the interrupt hint was not moved before the command`,
    );
    const idle = statement.slice(statement.indexOf(" : `") + 1);
    assert(first.source.includes(idle), `${label}: the idle footer copy was rewritten`);
  }

  // A footer shape this does not know is a footer nobody has looked at.
  for (const [label, source] of [
    ["an unknown process body", FIXTURE.replace("first.command", "first.cmd")],
    ["an unknown idle footer", FIXTURE.replace("enter queue", "enter send")],
  ]) {
    let refused = false;
    try {
      apply(source);
    } catch {
      refused = true;
    }
    assert(refused, `${label} must be refused`);
  }

  // Semantic: the patched function, compiled from the text that will be written, must turn a
  // 40-line command into one line. This is the bug the patch exists for, measured rather than
  // asserted in prose.
  const patched = apply(FIXTURE);
  const range = functionRange(patched.source, PROCESS_NAME);
  const factory = new Function(
    "formatElapsedTime",
    `${patched.source.slice(range.declaration, range.end)}\nreturn ${PROCESS_NAME};`,
  );
  const loading = factory(() => "3s");
  const command = Array.from({ length: 40 }, (_, index) => `line ${index}`).join("\n");
  const text = loading(new Map([["p", { startTime: "t", command }]]), Date.now());
  assert(typeof text === "string", "the footer must be a string");
  assert(!text.includes("\n"), `the footer is still ${text.split("\n").length} lines`);
  assert(text.startsWith("(3s) line 0"), `unexpected footer: ${text.slice(0, 80)}`);
  assert(text.includes("line 39"), "the command tail was lost instead of collapsed");

  console.log("deepsand: patch-deepcode-footer: self-test passed");
}

// --------------------------------------------------------------------------- CLI

const args = process.argv.slice(2);
const mode = args.includes("--apply") ? "apply" : args.includes("--check") ? "check" : args.includes("--self-test") ? "self-test" : null;
if (!mode) {
  fail("expected --apply, --check or --self-test");
}
if (mode === "self-test") {
  try {
    selfTest();
  } catch (error) {
    fail(error.message);
  }
  process.exit(0);
}

const fileIndex = args.indexOf("--file");
const entry = fileIndex >= 0 && args[fileIndex + 1] ? args[fileIndex + 1] : defaultCliJs();
if (!existsSync(entry)) {
  fail(`could not read ${entry}: no such file`);
}
const version = cliVersion(entry);

let targets;
try {
  targets = footerFiles(entry);
} catch (error) {
  fail(error.message);
}

if (mode === "check") {
  try {
    for (const { file, source } of targets) verify(source, file, version);
  } catch (error) {
    fail(error.message);
  }
  console.log(
    `deepsand: patch-deepcode-footer: verified DeepCode ${version} in ${targets.length} file(s) under ${dirname(entry)}`,
  );
  process.exit(0);
}

let results;
try {
  results = targets.map(({ file, source }) => ({ file, ...apply(source) }));
} catch (error) {
  fail(error.message);
}

let changed = false;
for (const result of results) {
  if (!result.changed) continue;
  changed = true;
  writeAtomically(result.file, result.source);
  try {
    verify(readFileSync(result.file, "utf8"), result.file, version);
  } catch (error) {
    fail(`the patch did not survive being written back: ${error.message}`);
  }
  console.log(`deepsand: patch-deepcode-footer: patched DeepCode ${version} at ${result.file}`);
}

if (!changed) {
  console.log(
    `deepsand: patch-deepcode-footer: already applied to DeepCode ${version} in ${results.length} file(s) under ${dirname(entry)}`,
  );
}
