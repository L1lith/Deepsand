#!/usr/bin/env node
/**
 * End whatever holds a TCP port, before the dev server tries to bind it.
 *
 * `vite.config.ts` sets `strictPort: true` for 1420, and `src-tauri/tauri.conf.json` points the
 * webview at that same URL. So a vite left behind by an interrupted `app:dev` -- or by a crashed
 * window, or by the previous session whose terminal was closed rather than the app -- makes the
 * next launch die with `Port 1420 is already in use` before any Rust is built. When it does not
 * die it is worse: the old server is still serving the bundle it built, so the window comes up
 * running yesterday's UI against today's backend.
 *
 * This script is the first half of `npm run app:dev` for that reason. It answers three
 * questions in order: is anything on the port, who is it, and is it gone. It never guesses --
 * if something is still listening when it finishes, it exits non-zero, because starting a
 * strict-port dev server against a held port is a known failure and the operator should see the
 * reason now rather than a Vite stack trace later.
 *
 *   node scripts/free-port.mjs 1420
 */
import { execFileSync } from "node:child_process";
import net from "node:net";
import { setTimeout as sleep } from "node:timers/promises";

const port = Number.parseInt(process.argv[2] ?? "", 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`free-port: expected a port number, got "${process.argv[2] ?? ""}"`);
  process.exit(2);
}

const isWindows = process.platform === "win32";

/** Run a command, returning its stdout, or null if it could not run or exited non-zero. */
function run(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
    });
  } catch {
    return null;
  }
}

/**
 * Does something accept a connection on the port?
 *
 * A refused connection is the answer we want and is also the common case, so this is a plain
 * connect rather than a bind: binding locally would conflict with the very thing we are
 * looking for on some platforms. A timeout is treated as "held", because a port that answers
 * neither way is still not a port we can bind.
 */
function portAnswers() {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (answer) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(answer);
    };
    const socket = net.connect({ host: "127.0.0.1", port });
    socket.setTimeout(1000);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

/** PIDs listening on the port, from whatever the platform offers to ask. */
function listenerPids() {
  if (isWindows) {
    // Not filtered on the state name: netstat prints it localized on some installs, and the
    // local address already identifies a listener. Established connections to the port have it
    // as their *remote* address, so they cannot be mistaken for one.
    const output = run("netstat", ["-ano"]);
    if (!output) return [];
    const found = [];
    for (const line of output.split(/\r?\n/)) {
      const fields = line.trim().split(/\s+/);
      if (fields.length < 5 || fields[0].toUpperCase() !== "TCP") continue;
      const local = fields[1];
      if (!local.endsWith(`:${port}`)) continue;
      const pid = Number.parseInt(fields[fields.length - 1], 10);
      if (!Number.isInteger(pid)) continue;
      found.push({ pid, listening: fields[2] === "*:*" || fields.includes("LISTENING") });
    }
    const listening = found.filter((entry) => entry.listening);
    return uniquePids(listening.length > 0 ? listening : found);
  }

  const lsof = run("lsof", ["-t", "-n", "-P", `-iTCP:${port}`, "-sTCP:LISTEN"]);
  if (lsof) {
    return uniquePids(
      lsof
        .split(/\s+/)
        .filter(Boolean)
        .map((value) => ({ pid: Number.parseInt(value, 10) })),
    );
  }

  // `ss` is on Linux and needs no extra package; `fuser` is the last resort.
  const ss = run("ss", ["-ltnpH", `sport = :${port}`]);
  if (ss) {
    const pids = [];
    for (const line of ss.split(/\r?\n/)) {
      // Only the local-address field may carry the port; the peer field is `*:*` or similar.
      const local = line.trim().split(/\s+/)[3] ?? "";
      if (!local.endsWith(`:${port}`)) continue;
      for (const match of line.matchAll(/pid=(\d+)/g)) {
        pids.push({ pid: Number.parseInt(match[1], 10) });
      }
    }
    if (pids.length > 0) return uniquePids(pids);
  }

  const fuser = run("fuser", ["-n", "tcp", String(port)]);
  if (fuser) {
    return uniquePids(
      fuser
        .split(/\s+/)
        .filter(Boolean)
        .map((value) => ({ pid: Number.parseInt(value, 10) })),
    );
  }

  return [];
}

function uniquePids(entries) {
  const pids = new Set();
  for (const { pid } of entries) {
    // Never ourselves, never the kernel: `taskkill` on pid 4 is a failure that explains
    // nothing, and a port held by System is not something this script can fix.
    if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) continue;
    if (isWindows && pid === 4) continue;
    pids.add(pid);
  }
  return [...pids];
}

/** What the process is, for the log line. Best effort -- it is a courtesy, not a control. */
function describe(pid) {
  if (isWindows) {
    const output = run("tasklist", ["/FI", `PID eq ${pid}`, "/FO", "CSV", "/NH"]);
    const name = output?.match(/"([^"]+)"/)?.[1];
    return name ? `${name} (pid ${pid})` : `pid ${pid}`;
  }
  const output = run("ps", ["-o", "comm=", "-p", String(pid)]);
  const name = output?.trim();
  return name ? `${name} (pid ${pid})` : `pid ${pid}`;
}

function stop(pid) {
  if (isWindows) {
    // `/T` takes the tree: the listener is usually a child of `npm run dev` and its own
    // children can hold the socket too. `/F` because a dev server has nothing to save.
    run("taskkill", ["/PID", String(pid), "/T", "/F"]);
    return;
  }
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    // Already gone, or not ours; either way the wait below decides.
  }
}

function forceStop(pid) {
  if (isWindows) return; // `taskkill /F` was already the whole answer.
  try {
    process.kill(pid, "SIGKILL");
  } catch {
    // Same as above.
  }
}

/** Wait for the port to stop answering, so the caller starts with the truth. */
async function waitUntilFree(ms) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (!(await portAnswers())) return true;
    await sleep(150);
  }
  return !(await portAnswers());
}

if (!(await portAnswers())) {
  console.log(`free-port: ${port} is free`);
  process.exit(0);
}

const pids = listenerPids();
if (pids.length === 0) {
  // The port answered a moment ago and does not belong to anyone now: a server that was
  // already shutting down. That is the answer we wanted, so report it rather than a failure.
  if (!(await portAnswers())) {
    console.log(`free-port: ${port} is free`);
    process.exit(0);
  }
  console.error(
    `free-port: ${port} is in use, but no process owning it could be found. ` +
      `Stop it yourself, then run this again.`,
  );
  process.exit(1);
}

for (const pid of pids) {
  console.log(`free-port: stopping ${describe(pid)}, which holds ${port}`);
  stop(pid);
}

if (await waitUntilFree(4000)) {
  console.log(`free-port: ${port} is free`);
  process.exit(0);
}

// SIGTERM is a request. A dev server wedged inside its own event loop can ignore it, so ask
// harder once before reporting failure.
for (const pid of listenerPids()) forceStop(pid);
if (await waitUntilFree(2000)) {
  console.log(`free-port: ${port} is free`);
  process.exit(0);
}

console.error(
  `free-port: ${port} is still in use after stopping ${pids.length === 1 ? "its owner" : "its owners"}. ` +
    (isWindows
      ? `A process started by another user, or by an elevated shell, needs an elevated shell to end it.`
      : `It may belong to another user; check \`lsof -iTCP:${port}\`.`),
);
process.exit(1);
