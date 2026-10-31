#!/usr/bin/env node
/**
 * Stop Ink's fullscreen fallback from rewriting the whole conversation on every tick.
 *
 * The DeepCode CLI's TUI is Ink, and Ink has two ways to put a frame on the screen:
 *
 *   normal      erase the previous frame line by line (`ESC[2K ESC[1A`...), write the new one
 *   fullscreen  `ESC[2J ESC[3J ESC[H` -- screen *and scrollback* -- then re-emit every byte of
 *               static output plus the live frame
 *
 * The second exists for a frame that is as tall as, or taller than, the terminal, and it cannot
 * simply be removed: a frame taller than the viewport cannot be rewritten in place, because its
 * top is off screen and `cursorUp` clamps at row 1. Removing it is what turned the endless scroll
 * into "the same status message over and over": Ink fell back to the in-place path, could not
 * address the frame, and pushed a slightly different copy of it into the scrollback every tick.
 *
 * So the fallback stays, and stops being expensive and destructive. This replaces the *body* of
 * `renderInteractiveFrame`'s clear branch and leaves `shouldClearTerminalForFrame` exactly as
 * shipped, so Ink still decides when a repaint is needed:
 *
 *   * `ESC[H` + `ESC[2J`, never `ESC[3J`: the viewport is repainted, the scrollback survives.
 *   * A frame taller than the viewport is drawn as its *last* `rows` lines. Those are precisely
 *     the lines upstream's `clearTerminal + fullStaticOutput + output` leaves visible, so the
 *     screen while the frame is up is identical -- at one screenful of bytes instead of one
 *     conversation.
 *   * A frame that fits again (teardown, or leaving fullscreen) is bottom-aligned, and the space
 *     above it is filled with the *last* screenful of history -- what the fullscreen repaint
 *     erased. One screenful, once, instead of a repaint of everything.
 *   * `this.log.sync(<what was drawn>)` and the `lastOutput*` fields stay exactly as Ink expects,
 *     so the next in-place update erases the right number of lines.
 *
 * The invariant is one sentence: **a repaint writes at most one viewport and never scrolls.** If
 * that holds, no frame can push a copy of itself into the scrollback, and no tick can re-emit a
 * conversation.
 *
 * The patch is deliberately exact rather than clever. It also *reverts* the superseded
 * predicate-only patch: a rebuild whose `npm install` cannot reach the registry keeps the CLI
 * copy the image already has, and that copy may carry the old patch. Any renderer it does not
 * recognise fails the build rather than shipping an image that silently still has the bug.
 *
 * Run `--check` after `--apply`; the Dockerfile does both.
 *
 * Usage:
 *   node patch-deepcode-ink.mjs --apply [--file /path/to/cli.js]
 *   node patch-deepcode-ink.mjs --check [--file /path/to/cli.js]
 *   node patch-deepcode-ink.mjs --self-test
 */

import { chmodSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";

const PREDICATE_NAME = "shouldClearTerminalForFrame";
const RENDER_NAME = "renderInteractiveFrame";

/** Marks the body this script writes, so a second run is a no-op and --check is exact. */
const RENDER_MARKER = "deepsand: repaint the viewport; never the scrollback";

/** Marks the predicate patch this script replaces. Kept only to recognise and undo it. */
const OLD_PREDICATE_MARKER = "deepsand: keep scrollback; only the teardown clear remains";

/**
 * `shouldClearTerminalForFrame` as the bundled CLI ships it. Comments omitted: comparisons are
 * made on normalized text, so they cannot matter, and the revert writes this form.
 */
const UPSTREAM_PREDICATE_BODY = `{
  if (!isTty) {
    return false;
  }
  const hadPreviousFrame = previousOutputHeight > 0;
  const wasFullscreen = previousOutputHeight >= viewportRows;
  const wasOverflowing = previousOutputHeight > viewportRows;
  const isOverflowing = nextOutputHeight > viewportRows;
  const isFullscreen = nextOutputHeight >= viewportRows;
  const isLeavingFullscreen = wasFullscreen && nextOutputHeight < viewportRows;
  const shouldClearOnUnmount = isUnmounting && wasFullscreen;
  if (isWindowsConsole && (wasFullscreen || isFullscreen)) {
    return true;
  }
  return (
    // Overflowing frames still need full clear fallback.
    wasOverflowing || isOverflowing && hadPreviousFrame || // Clear when shrinking from fullscreen to non-fullscreen output.
    isLeavingFullscreen || // Preserve legacy unmount behavior for fullscreen frames: final teardown
    // render should clear once to avoid leaving a scrolled viewport state.
    shouldClearOnUnmount
  );
}`;

/**
 * `renderInteractiveFrame` as the bundled CLI ships it, split around the one branch this patch
 * touches. Only the branch is rewritten, so the normal path stays byte-identical to upstream --
 * which is also what `--check` asserts: the head and the tail must still be exactly these.
 */
const RENDER_HEAD = `{
  const hasStaticOutput = staticOutput !== "";
  const isTty = this.options.stdout.isTTY;
  const viewportRows = isTty ? getWindowSize(this.options.stdout).rows : 24;
  const isFullscreen = isTty && outputHeight >= viewportRows;
  const outputToRender = isFullscreen ? output : output + "\\n";
  const shouldClearTerminal = shouldClearTerminalForFrame({
    isTty,
    viewportRows,
    previousOutputHeight: this.lastOutputHeight,
    nextOutputHeight: outputHeight,
    isUnmounting: this.isUnmounting
  });
`;

const RENDER_TAIL = `
  if (hasStaticOutput) {
    const sync = this.shouldSync();
    if (sync) {
      this.options.stdout.write(bsu);
    }
    this.log.clear();
    this.options.stdout.write(staticOutput);
    this.log(outputToRender);
    if (sync) {
      this.options.stdout.write(esu);
    }
  } else if (output !== this.lastOutput || this.log.isCursorDirty()) {
    this.throttledLog(outputToRender);
  }
  this.lastOutput = output;
  this.lastOutputToRender = outputToRender;
  this.lastOutputHeight = outputHeight;
}`;

/**
 * Where the frame is taller than the viewport: repaint everything, and the scrollback dies.
 * Written at the indentation it has inside the method, and with no trailing newline: the head
 * ends at the newline before it and the tail begins with the newline after it.
 */
const UPSTREAM_BRANCH = `    if (shouldClearTerminal) {
      const sync = this.shouldSync();
      if (sync) {
        this.options.stdout.write(bsu);
      }
      this.options.stdout.write(base_exports.clearTerminal + this.fullStaticOutput + output);
      this.lastOutput = output;
      this.lastOutputToRender = outputToRender;
      this.lastOutputHeight = outputHeight;
      this.log.sync(outputToRender);
      if (sync) {
        this.options.stdout.write(esu);
      }
      return;
    }`;

/** The same branch, repainting one viewport instead: the whole point of this patch. */
const PATCHED_BRANCH = `    if (shouldClearTerminal) {
      const sync = this.shouldSync();
      if (sync) {
        this.options.stdout.write(bsu);
      }
      /* ${RENDER_MARKER}: everything below is all this branch may write. */
      const rows = Math.max(1, viewportRows);
      const frame = outputToRender.split("\\n");
      let content = isFullscreen && frame.length > rows ? frame.slice(frame.length - rows) : frame;
      if (!isFullscreen) {
        const room = Math.max(0, rows - frame.length);
        if (room > 0 && this.fullStaticOutput) {
          const width = getWindowSize(this.options.stdout).columns + 1;
          const raw = this.fullStaticOutput.replace(/\\n+$/, "");
          const chunk = raw.slice(-(room * width));
          const lines = chunk.split("\\n");
          const clipped = raw.length > chunk.length ? lines.slice(1) : lines;
          content = clipped.slice(Math.max(0, clipped.length - room)).concat(frame);
        }
      }
      if (content.length > rows) {
        content = content.slice(content.length - rows);
      }
      if (content.length < rows) {
        content = Array(rows - content.length).fill("").concat(content);
      }
      const text = content.join("\\n");
      this.options.stdout.write("\\x1B[H\\x1B[2J" + text);
      this.lastOutput = output;
      this.lastOutputToRender = outputToRender;
      this.lastOutputHeight = outputHeight;
      this.log.sync(text);
      if (sync) {
        this.options.stdout.write(esu);
      }
      return;
    }`;

const UPSTREAM_RENDER_BODY = RENDER_HEAD + UPSTREAM_BRANCH + RENDER_TAIL;
const PATCHED_RENDER_BODY = RENDER_HEAD + PATCHED_BRANCH + RENDER_TAIL;

function fail(message) {
  console.error(`deepsand: patch-deepcode-ink: ${message}`);
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

/**
 * Advance over a string or a comment starting at `i`, returning the index after it.
 * Enough for the bundled function bodies: quotes, escapes, line comments, block comments.
 */
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

/** The `{...}` starting at `open`, as a half-open [start, end) into `source`. */
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
  refuse(`unterminated ${what} body; the renderer shape changed`);
}

/**
 * The body of a function whose name is passed to `__name(...)`.
 *
 * The definition is the arrow function passed to that wrapper, whose name is the second
 * argument. Take the *first* arrow after the wrapper, not the last arrow before the name: a
 * future body could contain an inner arrow, and patching that would rewrite the wrong function
 * while still finding the name.
 */
function namedArrowBody(source, name) {
  const quoted = `"${name}"`;
  const named = source.indexOf(quoted);
  if (named < 0) {
    refuse(`could not find ${quoted} in the bundled CLI; the renderer shape changed`);
  }
  const wrapper = source.lastIndexOf("__name(", named);
  const definition = wrapper >= 0 ? source.indexOf("=>", wrapper) : source.indexOf("=>", source.indexOf(`${name} =`));
  const arrow = definition >= 0 && definition < named ? definition : source.lastIndexOf("=>", named);
  if (arrow < 0) {
    refuse(`no arrow function before ${quoted}; the renderer shape changed`);
  }
  const open = source.indexOf("{", arrow + 2);
  if (open < 0 || open > named) {
    refuse(`no function body before ${quoted}; the renderer shape changed`);
  }
  return braceBody(source, open, name);
}

/**
 * The body of the class method `renderInteractiveFrame(output, outputHeight, staticOutput) {...}`.
 *
 * The name occurs once as the definition and once per call site (`this.renderInteractiveFrame(`),
 * so a candidate preceded by `.` -- or by a quote, as the name is inside strings -- is not it.
 */
function methodBody(source, name) {
  for (let pos = source.indexOf(name); pos >= 0; pos = source.indexOf(name, pos + 1)) {
    const before = source.slice(0, pos).trimEnd();
    if (before.endsWith(".") || before.endsWith('"') || before.endsWith("'")) continue;
    const paramsOpen = source.indexOf("(", pos + name.length);
    if (paramsOpen < 0) continue;
    let depth = 0;
    let paramsClose = -1;
    let i = paramsOpen;
    while (i < source.length) {
      const c = source[i];
      if (c === "'" || c === '"' || c === "`") {
        i = skipNonCode(source, i);
        continue;
      }
      if (c === "(") depth++;
      if (c === ")") {
        depth--;
        if (depth === 0) {
          paramsClose = i;
          break;
        }
      }
      i++;
    }
    if (paramsClose < 0) continue;
    const open = source.indexOf("{", paramsClose);
    if (open < 0) continue;
    return braceBody(source, open, name);
  }
  refuse(`could not find the ${name} method in the bundled CLI; the renderer shape changed`);
}

/** Comments and whitespace removed, so a cosmetic difference in the bundle is not a shape change. */
function normalize(body) {
  return body
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function describe(body) {
  return normalize(body).slice(0, 320);
}

/** The `if (shouldClearTerminal) {...}` inside a render body, as a half-open range. */
function clearBranch(source, body) {
  const at = source.indexOf("if (shouldClearTerminal)", body.start);
  if (at < 0 || at >= body.end) {
    refuse(`could not find the clear branch inside ${RENDER_NAME}; the renderer shape changed`);
  }
  const open = source.indexOf("{", at);
  if (open < 0 || open > body.end) {
    refuse(`the clear branch has no body; the renderer shape changed`);
  }
  const braces = braceBody(source, open, "clear branch");
  // From the start of its line, so the replacement carries its own indentation, and from the
  // `if`, so it carries its own condition.
  let start = at;
  while (start > body.start && (source[start - 1] === " " || source[start - 1] === "\t")) start--;
  return { start, end: braces.end };
}

/** What the file we were handed actually contains. */
function inspect(source) {
  const predicateRange = namedArrowBody(source, PREDICATE_NAME);
  const predicateBody = source.slice(predicateRange.start, predicateRange.end);
  const renderRange = methodBody(source, RENDER_NAME);
  const renderBody = source.slice(renderRange.start, renderRange.end);
  const branchRange = clearBranch(source, renderRange);
  const branchBody = source.slice(branchRange.start, branchRange.end);

  // The head and the tail are everything except the branch. They must be upstream's, so a patch
  // can never quietly change the normal path -- only the branch is ours.
  const head = source.slice(renderRange.start, branchRange.start);
  const tail = source.slice(branchRange.end, renderRange.end);

  return {
    predicateRange,
    predicateBody,
    predicateUpstream: normalize(predicateBody) === normalize(UPSTREAM_PREDICATE_BODY),
    predicateIsOldPatch: predicateBody.includes(OLD_PREDICATE_MARKER),
    renderRange,
    renderBody,
    branchRange,
    branchBody,
    branchIsPatched: branchBody.includes(RENDER_MARKER),
    restUpstream: normalize(head) === normalize(RENDER_HEAD) && normalize(tail) === normalize(RENDER_TAIL),
  };
}

function apply(source) {
  const state = inspect(source);

  if (!state.predicateUpstream && !state.predicateIsOldPatch) {
    refuse(`unrecognized ${PREDICATE_NAME} body; refusing to patch: ${describe(state.predicateBody)}`);
  }
  // True whether or not the branch is already ours: a renderer whose normal path changed under
  // an earlier patch is not one this script may call "already applied".
  if (!state.restUpstream) {
    refuse(`unrecognized ${RENDER_NAME} body; refusing to patch: ${describe(state.renderBody)}`);
  }

  // Right to left, so the offsets of the earlier edit stay valid.
  const edits = [];
  if (state.predicateIsOldPatch) {
    edits.push({ start: state.predicateRange.start, end: state.predicateRange.end, text: UPSTREAM_PREDICATE_BODY });
  }
  if (!state.branchIsPatched) {
    edits.push({ start: state.branchRange.start, end: state.branchRange.end, text: PATCHED_BRANCH });
  }
  edits.sort((a, b) => b.start - a.start);

  let patched = source;
  for (const edit of edits) {
    patched = patched.slice(0, edit.start) + edit.text + patched.slice(edit.end);
  }
  return { changed: edits.length > 0, source: patched, reverted: state.predicateIsOldPatch };
}

function verify(source, file, version) {
  const state = inspect(source);
  if (state.predicateIsOldPatch) {
    refuse(`${file} (DeepCode ${version}) still carries the superseded predicate patch`);
  }
  if (!state.predicateUpstream) {
    refuse(`${file} (DeepCode ${version}) has a ${PREDICATE_NAME} this patch does not know: ${describe(state.predicateBody)}`);
  }
  if (!state.restUpstream) {
    refuse(`${file} (DeepCode ${version}) has a ${RENDER_NAME} whose normal path is not upstream's: ${describe(state.renderBody)}`);
  }
  if (!state.branchIsPatched) {
    refuse(`${file} (DeepCode ${version}) does not carry the viewport repaint`);
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
//
// Two halves. The structural half proves the patch finds and rewrites the two bodies it knows,
// is idempotent, and undoes the predicate patch it replaced. The semantic half runs the patched
// body against a fake Ink instance and a terminal model, and asserts what the change is for: a
// repaint costs one viewport, never scrolls, and never wipes the scrollback.

const CSI = "\x1B[";

/** A terminal: rows of text, a scrollback, and the escapes this patch can emit. */
function makeScreen(rows, columns) {
  let grid = Array.from({ length: rows }, () => "");
  const scrolled = [];
  let row = 0;
  let col = 0;

  const scrollUp = () => {
    scrolled.push(grid[0].replace(/\s+$/, ""));
    grid = grid.slice(1).concat("");
  };
  const put = (ch) => {
    const line = grid[row].padEnd(columns, " ");
    grid[row] = (line.slice(0, col) + ch + line.slice(col + 1)).replace(/\s+$/, "");
    col++;
    if (col >= columns) {
      col = 0;
      if (row === rows - 1) scrollUp();
      else row++;
    }
  };
  const feed = (text) => {
    let i = 0;
    while (i < text.length) {
      if (text[i] === "\x1B") {
        const match = /^\x1B\[([0-9;?]*)([A-Za-z])/.exec(text.slice(i));
        if (!match) {
          i += 1;
          continue;
        }
        i += match[0].length;
        if (match[1].startsWith("?")) continue;
        const n = Number.parseInt(match[1] || "1", 10) || 1;
        if (match[2] === "H" || match[2] === "f") {
          row = 0;
          col = 0;
        } else if (match[2] === "A") {
          row = Math.max(0, row - n);
        } else if (match[2] === "B") {
          row = Math.min(rows - 1, row + n);
        } else if (match[2] === "G") {
          col = 0;
        } else if (match[2] === "J") {
          if (match[1] === "" || match[1] === "0") {
            grid[row] = grid[row].slice(0, col);
            for (let r = row + 1; r < rows; r++) grid[r] = "";
          } else if (match[1] === "2") {
            grid = Array.from({ length: rows }, () => "");
          } else if (match[1] === "3") {
            scrolled.length = 0; // only reachable if the patch regressed
          }
        } else if (match[2] === "K") {
          if (match[1] === "" || match[1] === "0") grid[row] = grid[row].slice(0, col);
          else if (match[1] === "2") grid[row] = "";
        }
        continue;
      }
      if (text[i] === "\n") {
        // A cooked PTY maps LF to CR+LF (ONLCR), which is what Ink's plain "\n" relies on.
        col = 0;
        if (row === rows - 1) scrollUp();
        else row++;
        i++;
        continue;
      }
      if (text[i] === "\r") {
        col = 0;
        i++;
        continue;
      }
      put(text[i]);
      i++;
    }
  };

  return {
    feed,
    lines: () => grid.map((line) => line.replace(/\s+$/, "")),
    scrollback: () => scrolled.slice(),
  };
}

/** The standard log-update Ink uses: erase what it drew, then write. */
function makeLog(emit) {
  let lines = 0;
  const erase = (count) => {
    let text = "";
    for (let i = 0; i < count; i++) text += `${CSI}2K` + (i < count - 1 ? `${CSI}1A` : "");
    return count ? text + `${CSI}G` : "";
  };
  const log = (text) => {
    emit(erase(lines) + text);
    lines = text.split("\n").length;
  };
  log.sync = (text) => {
    lines = text.split("\n").length;
  };
  log.clear = () => {
    emit(erase(lines));
    lines = 0;
  };
  log.isCursorDirty = () => false;
  log.willRender = () => true;
  log.done = () => {};
  log.lineCount = () => lines;
  return log;
}

const getWindowSize = (stdout) => ({ columns: stdout.columns || 80, rows: stdout.rows || 24 });
const bsu = "";
const esu = "";
const base_exports = { clearTerminal: `${CSI}2J${CSI}3J${CSI}H` };

/** `UPSTREAM_PREDICATE_BODY` as a function; `isWindowsConsole` is false in the container. */
function upstreamPredicate({ isTty, viewportRows, previousOutputHeight, nextOutputHeight, isUnmounting }) {
  if (!isTty) return false;
  const hadPreviousFrame = previousOutputHeight > 0;
  const wasFullscreen = previousOutputHeight >= viewportRows;
  const wasOverflowing = previousOutputHeight > viewportRows;
  const isOverflowing = nextOutputHeight > viewportRows;
  const isLeavingFullscreen = wasFullscreen && nextOutputHeight < viewportRows;
  const shouldClearOnUnmount = isUnmounting && wasFullscreen;
  return wasOverflowing || (isOverflowing && hadPreviousFrame) || isLeavingFullscreen || shouldClearOnUnmount;
}

/** The patched method, compiled from the same text that is written into the bundle. */
const renderFrame = new Function(
  "getWindowSize",
  "shouldClearTerminalForFrame",
  "base_exports",
  "bsu",
  "esu",
  `return function (output, outputHeight, staticOutput) ${PATCHED_RENDER_BODY};`,
)(getWindowSize, upstreamPredicate, base_exports, bsu, esu);

function makeInstance(screen, rows, columns) {
  const writes = [];
  const emit = (text) => {
    writes.push(text);
    screen.feed(text);
  };
  const stdout = { isTTY: true, columns, rows, write: emit };
  const log = makeLog(emit);
  return {
    options: { stdout },
    log,
    throttledLog: (text) => log(text),
    shouldSync: () => false,
    fullStaticOutput: "",
    lastOutput: "",
    lastOutputToRender: "",
    lastOutputHeight: 0,
    isUnmounting: false,
    /** What Ink's `onRender` does: fold in the static delta, then hand over the frame. */
    render(output, height, staticDelta = "") {
      writes.length = 0;
      if (staticDelta) this.fullStaticOutput += staticDelta;
      renderFrame.call(this, output, height, staticDelta);
      return writes.join("");
    },
  };
}

function selfTest() {
  // ---- structural: a fixture carrying the two bodies the bundle ships
  const fixture = `var shouldClearTerminalForFrame = /* @__PURE__ */ __name(({ isTty }) => ${UPSTREAM_PREDICATE_BODY}, "shouldClearTerminalForFrame");
var Ink = class {
  renderInteractiveFrame(output, outputHeight, staticOutput) ${UPSTREAM_RENDER_BODY}
  clear() {}
};`;

  const first = apply(fixture);
  if (!first.changed) fail("self-test: the fixture was not patched");
  if (apply(first.source).changed) fail("self-test: applying twice changed the file twice");
  verify(first.source, "fixture", "self-test");
  if (!first.source.includes(RENDER_MARKER)) fail("self-test: the patched fixture carries no marker");
  if (first.source.includes("clearTerminal + this.fullStaticOutput")) {
    fail("self-test: the patched fixture can still re-emit the whole conversation");
  }

  // ---- structural: an unpatched renderer does not pass --check
  let passedUnpatched = false;
  try {
    verify(fixture, "fixture", "self-test");
    passedUnpatched = true;
  } catch {}
  if (passedUnpatched) fail("self-test: an unpatched fixture passed --check");

  // ---- structural: only the clear branch may differ. Anything else is a renderer we refuse.
  let refusedChange = false;
  try {
    apply(fixture.replace("this.log.clear();", "this.log.clear(); this.somethingElse();"));
  } catch (error) {
    refusedChange = /unrecognized/.test(error.message);
  }
  if (!refusedChange) {
    fail("self-test: a renderer whose normal path was changed was not refused");
  }

  // ---- structural: an image built with the superseded predicate patch is repaired
  const legacy = fixture.replace(
    UPSTREAM_PREDICATE_BODY,
    `{\n  /* ${OLD_PREDICATE_MARKER} */\n  return Boolean(isUnmounting && isTty && previousOutputHeight >= viewportRows);\n}`,
  );
  const repaired = apply(legacy);
  if (!repaired.reverted) fail("self-test: the superseded predicate patch was not recognised");
  verify(repaired.source, "legacy fixture", "self-test");
  if (!inspect(repaired.source).predicateUpstream) {
    fail("self-test: the predicate was not restored to upstream");
  }

  // ---- semantic: a frame taller than the viewport
  const rows = 12;
  const columns = 40;
  const screen = makeScreen(rows, columns);
  const inst = makeInstance(screen, rows, columns);

  for (let message = 0; message < 30; message++) {
    inst.render("Type your message...\n> ", 3, `message ${message}.a\nmessage ${message}.b\n`);
  }
  const scrollbackBefore = screen.scrollback().length;

  const tall = Array.from({ length: 29 }, (_, i) => `panel line ${i}`).concat("Working... 0s (status)");
  let widest = 0;
  let wiped = false;
  for (let tick = 0; tick < 20; tick++) {
    const frame = tall.slice(0, 29).concat(`Working... ${tick}s (status)`).join("\n");
    // A message completes while the panel fills the screen. It cannot be shown above a frame
    // that has no room for it, but it must not be lost either.
    const delta = tick === 10 ? "late message a\nlate message b\n" : "";
    const bytes = inst.render(frame, tall.length, delta);
    widest = Math.max(widest, bytes.split("\n").length);
    if (bytes.includes(`${CSI}3J`)) wiped = true;
  }

  if (wiped) fail("self-test: a repaint wiped the scrollback ([3J)");
  if (screen.scrollback().length !== scrollbackBefore) {
    fail(
      `self-test: 20 repaints of an overflowing frame scrolled the screen (${scrollbackBefore} -> ${screen.scrollback().length} scrollback lines)`,
    );
  }
  if (widest !== rows) fail(`self-test: a repaint wrote ${widest} lines into a ${rows}-row viewport`);

  const expected = tall.slice(tall.length - rows);
  expected[expected.length - 1] = "Working... 19s (status)";
  const shown = screen.lines();
  if (JSON.stringify(shown) !== JSON.stringify(expected)) {
    fail(
      `self-test: the overflowing frame is not drawn tail-anchored:\n  want ${JSON.stringify(expected)}\n  got  ${JSON.stringify(shown)}`,
    );
  }

  // ---- semantic: the frame fits again, and the history it covered comes back
  const exitBytes = inst.render("Type your message...\n> ", 3);
  if (exitBytes.includes(`${CSI}3J`)) fail("self-test: leaving fullscreen wiped the scrollback");
  if (screen.scrollback().length !== scrollbackBefore) {
    fail("self-test: leaving fullscreen scrolled the screen instead of repainting it");
  }
  const exitShown = screen.lines();
  const frameLines = ["Type your message...", "> ", ""];
  const room = rows - frameLines.length;
  const exitExpected = inst.fullStaticOutput
    .replace(/\n+$/, "")
    .split("\n")
    .slice(-room)
    .concat(frameLines)
    .map((line) => line.replace(/\s+$/, ""));
  if (JSON.stringify(exitShown) !== JSON.stringify(exitExpected)) {
    fail(
      `self-test: leaving fullscreen did not restore the history above the frame:\n  want ${JSON.stringify(exitExpected)}\n  got  ${JSON.stringify(exitShown)}`,
    );
  }
  if (inst.log.lineCount() !== rows) {
    fail(`self-test: the log was told ${inst.log.lineCount()} lines were drawn, not ${rows}`);
  }
  if (!exitShown.some((line) => line.includes("late message a"))) {
    fail(`self-test: a message that completed while the frame filled the screen was lost: ${JSON.stringify(exitShown)}`);
  }

  // ---- semantic: a repaint costs the same however long the conversation is
  const cheap = makeInstance(makeScreen(rows, columns), rows, columns);
  const dear = makeInstance(makeScreen(rows, columns), rows, columns);
  cheap.render("", 0, "small\n");
  dear.render("", 0, Array.from({ length: 4000 }, (_, i) => `history line ${i}`).join("\n") + "\n");
  const cheapBytes = cheap.render(tall.join("\n"), tall.length).length;
  const dearBytes = dear.render(tall.join("\n"), tall.length).length;
  if (cheapBytes !== dearBytes) {
    fail(`self-test: a repaint grows with the conversation (${cheapBytes} vs ${dearBytes} bytes)`);
  }

  console.log("deepsand: patch-deepcode-ink: self-test passed");
}

// --------------------------------------------------------------------------- CLI
const args = process.argv.slice(2);
const mode = args.includes("--apply") ? "apply" : args.includes("--check") ? "check" : args.includes("--self-test") ? "self-test" : null;
if (!mode) {
  fail("expected --apply, --check or --self-test");
}
if (mode === "self-test") {
  selfTest();
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
  console.log(`deepsand: patch-deepcode-ink: verified DeepCode ${version} at ${file}`);
  process.exit(0);
}

let result;
try {
  result = apply(source);
} catch (error) {
  fail(error.message);
}
if (result.reverted) {
  console.log(`deepsand: patch-deepcode-ink: restored the superseded predicate patch in DeepCode ${version}`);
}
if (!result.changed) {
  console.log(`deepsand: patch-deepcode-ink: already applied to DeepCode ${version} at ${file}`);
  process.exit(0);
}
writeAtomically(file, result.source);
try {
  verify(readFileSync(file, "utf8"), file, version);
} catch (error) {
  fail(`the patch did not survive being written back: ${error.message}`);
}
console.log(`deepsand: patch-deepcode-ink: patched DeepCode ${version} at ${file}`);
