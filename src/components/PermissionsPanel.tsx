/**
 * The permissions panel: everything the sandbox can currently reach, plus the
 * audit trail of every decision.
 *
 * This is the authoritative view. If a directory is not in this table, the
 * sandbox cannot see it — not through a path, not through a symlink, not
 * through the network — because it is not mounted.
 */

import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import { open } from "@tauri-apps/plugin-dialog";
import * as api from "../lib/api";
import {
  accessLabel,
  networkDescription,
  networkModeLabel,
  policyMode,
  type AllowlistView,
  type NetworkPolicy,
} from "../lib/types";
import { NetworkSlider } from "./NetworkSlider";
import { t } from "../i18n";
import {
  describeError,
  refreshProjects,
  refreshProjectData,
  revealGrantDir,
  revealProjectDir,
  selectedProject,
  store,
  toast,
} from "../store";

/**
 * A folder, for the button that opens a directory in the machine's file manager.
 *
 * Its own small component rather than a shared icon set: this is the one glyph the panel needs,
 * and the toolbar pattern it sits in is the same `.btn-icon` the other panels use.
 */
function FolderIcon() {
  return (
    <svg class="icon" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M1.6 4.4a1.2 1.2 0 0 1 1.2-1.2h2.9c.3 0 .6.13.8.35l.95 1.05h5.75a1.2 1.2 0 0 1 1.2 1.2v6.1a1.2 1.2 0 0 1-1.2 1.2H2.8a1.2 1.2 0 0 1-1.2-1.2z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.3"
        stroke-linejoin="round"
      />
    </svg>
  );
}

export function PermissionsPanel() {
  const project = () => selectedProject();

  // Reload whenever the selected project changes, so switching projects never
  // shows the previous project's entries.
  createEffect(() => {
    const current = selectedProject();
    if (current) void loadAllowlist(current.id);
    else setAllowlist(null);
  });

  const [draftPath, setDraftPath] = createSignal("");
  const [draftAccess, setDraftAccess] = createSignal<"read" | "write">("read");
  const [draftPurpose, setDraftPurpose] = createSignal("");
  const [checkNote, setCheckNote] = createSignal<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = createSignal(false);

  // Network access lives here rather than in Project settings, because this tab is
  // already the answer to "what can this project reach".
  const [allowlist, setAllowlist] = createSignal<AllowlistView | null>(null);
  const [allowlistDraft, setAllowlistDraft] = createSignal("");
  const [allowlistBusy, setAllowlistBusy] = createSignal(false);
  const [presets, setPresets] = createSignal<{ name: string; entries: string[] }[]>([]);
  const [modeBusy, setModeBusy] = createSignal(false);
  const [requestsBusy, setRequestsBusy] = createSignal(false);

  onMount(() => {
    void api
      .networkPresets()
      .then(setPresets)
      .catch(() => setPresets([]));
  });

  /**
   * Whether the sandbox may ask for anything at all.
   *
   * Turning it off is a real change rather than a mute: the host refuses incoming
   * requests and answers the ones already waiting, so the sandbox is told the answer is
   * no instead of being left waiting on a dialog nobody will see.
   */
  async function setRequests(enabled: boolean) {
    const current = project();
    if (!current) return;
    setRequestsBusy(true);
    try {
      await api.setRequestsEnabled(current.id, enabled);
      toast(
        enabled ? "ok" : "info",
        enabled ? t("perm.requestsOnTitle") : t("perm.requestsOffTitle"),
        enabled ? t("perm.requestsOnBody") : t("perm.requestsOffBody"),
      );
    } catch (error) {
      toast("error", t("perm.couldNotChangeSetting"), describeError(error));
    } finally {
      setRequestsBusy(false);
    }
  }

  async function loadAllowlist(projectId: string) {
    try {
      const view = await api.projectAllowlist(projectId);
      setAllowlist(view);
      setAllowlistDraft(view.project.join("\n"));
    } catch (error) {
      toast("error", t("perm.couldNotReadAllowlist"), describeError(error));
    }
  }

  async function saveAllowlist() {
    const current = project();
    if (!current) return;
    setAllowlistBusy(true);
    try {
      const entries = allowlistDraft()
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const view = await api.setProjectAllowlist(current.id, entries);
      setAllowlist(view);
      setAllowlistDraft(view.project.join("\n"));
      toast(
        "ok",
        t("perm.allowlistSaved"),
        t(
          view.effective.length === 1 ? "perm.entryInForce" : "perm.entriesInForce",
          { count: view.effective.length },
        ),
      );
    } catch (error) {
      toast("error", t("perm.couldNotSaveAllowlist"), describeError(error));
    } finally {
      setAllowlistBusy(false);
    }
  }

  async function chooseMode(next: string) {
    const current = project();
    if (!current) return;
    setModeBusy(true);
    try {
      // Switching into allowlisted mode keeps whatever this project already listed,
      // and starts from an empty project list otherwise: the global list is
      // inherited automatically, so copying it in here would show the same entries
      // twice and make them look project-specific when they are not.
      const policy: NetworkPolicy =
        next === "allowlisted"
          ? { mode: "allowlisted", allow: allowlist()?.project ?? [] }
          : ({ mode: next } as NetworkPolicy);
      await api.updateProjectSettings({ projectId: current.id, network: policy });
      await refreshProjects();
      await loadAllowlist(current.id);
      toast("info", t("perm.networkModeChanged"), t("perm.restartForNetwork"));
    } catch (error) {
      toast("error", t("perm.couldNotChangeNetwork"), describeError(error));
    } finally {
      setModeBusy(false);
    }
  }

  async function browse() {
    const chosen = await open({
      directory: true,
      multiple: false,
      title: t("perm.browseTitle"),
    });
    if (typeof chosen === "string") {
      setDraftPath(chosen);
      await check(chosen);
    }
  }

  async function check(path: string) {
    if (!path.trim()) {
      setCheckNote(null);
      return;
    }
    try {
      const result = await api.pathCheck(path);
      setCheckNote(
        result.allowed
          ? { ok: true, text: t("perm.pathAllowedMount") }
          : { ok: false, text: result.reason ?? t("perm.pathCannotBeShared") },
      );
    } catch (error) {
      setCheckNote({ ok: false, text: describeError(error) });
    }
  }

  async function add() {
    const current = project();
    if (!current) return;
    setBusy(true);
    try {
      await api.addGrant(current.id, draftPath(), draftAccess(), undefined, draftPurpose());
      toast("ok", t("perm.permissionAdded"), t("perm.restartToAttach"));
      setDraftPath("");
      setDraftPurpose("");
      setCheckNote(null);
      await refreshProjectData(current.id);
    } catch (error) {
      toast("error", t("perm.couldNotAddPermission"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  async function flip(grantId: string, next: "read" | "write") {
    const current = project();
    if (!current) return;
    try {
      await api.setGrantAccess(current.id, grantId, next);
      await refreshProjectData(current.id);
      toast("info", next === "write" ? t("perm.nowReadWrite") : t("perm.nowReadOnly"), t("perm.restartToApply"));
    } catch (error) {
      toast("error", t("perm.couldNotChangePermission"), describeError(error));
    }
  }

  async function revoke(grantId: string, label: string) {
    const current = project();
    if (!current) return;
    try {
      await api.revokeGrant(current.id, grantId);
      await refreshProjectData(current.id);
      toast("ok", t("perm.revoked", { label }), t("perm.restartToDetach"));
    } catch (error) {
      toast("error", t("perm.couldNotRevoke"), describeError(error));
    }
  }

  /** Open the project's own directory in the machine's file manager. */
  async function openProjectDir() {
    const current = project();
    if (!current) return;
    await revealProjectDir(current.id);
  }

  /** Open one shared directory in the machine's file manager. */
  async function openGrantDir(grantId: string) {
    const current = project();
    if (!current) return;
    await revealGrantDir(current.id, grantId);
  }

  return (
    <div class="panel">
      <Show when={project()} fallback={<div class="empty">{t("perm.selectProject")}</div>}>
        {(current) => (
          <>
            <div class="card">
              <h3>{t("perm.permissionRequests")}</h3>
              <label class="row-inline small">
                <input
                  type="checkbox"
                  checked={current().requestsEnabled}
                  disabled={requestsBusy()}
                  onChange={(event) => void setRequests(event.currentTarget.checked)}
                />
                {t("perm.letAsk", { name: current().name })}
              </label>
              <span class="hint">
                {current().requestsEnabled
                  ? t("perm.onDetail")
                  : `${t("perm.offTitle")} ${t("perm.offDetail")}`}
              </span>
            </div>

            <div class="card">
              <h3>{t("perm.onLaunch")}</h3>
              <label class="check-row">
                <input
                  type="checkbox"
                  checked={current().resumeOnLaunch}
                  onChange={async (event) => {
                    const next = event.currentTarget.checked;
                    try {
                      await api.updateProjectSettings({
                        projectId: current().id,
                        resumeOnLaunch: next,
                      });
                      await refreshProjects();
                    } catch (error) {
                      toast("error", t("perm.couldNotChangeSetting"), describeError(error));
                    }
                  }}
                />
                {t("perm.startOnLaunch", { name: current().name })}
              </label>
              <span class="hint">{t("perm.resumeHint")}</span>
            </div>

            <div class="card">
              <h3>{t("perm.networkAccess")}</h3>
              <div class="row-inline" style={{ "flex-wrap": "wrap" }}>
                <NetworkSlider
                  value={policyMode(current().network)}
                  disabled={modeBusy()}
                  onChange={(mode) => void chooseMode(mode)}
                />
              </div>
              <span class="hint">{networkDescription(current().network)}</span>

              <Show when={allowlist()} fallback={<span class="hint">{t("common.loading")}</span>}>
                {(view) => (
                  <>
                    <Show when={!view().allowlisted}>
                      <div class="callout callout-warn" style={{ "margin-top": "0.7rem" }}>
                        {t("perm.notConsulted", { mode: networkModeLabel(view().mode) })}
                      </div>
                    </Show>

                    <div class="field" style={{ "margin-top": "0.8rem" }}>
                      <label for="allowlist-draft">
                        {t("perm.allowedDestinations")}
                      </label>
                      <textarea
                        id="allowlist-draft"
                        value={allowlistDraft()}
                        spellcheck={false}
                        rows={8}
                        placeholder={
                          "registry.npmjs.org\n*.githubusercontent.com\ngithub.com/org/repo\n!tracker.example.com"
                        }
                        onInput={(event) => setAllowlistDraft(event.currentTarget.value)}
                      />
                      <span class="hint">{t("perm.allowlistHint")}</span>

                      <div class="row-inline" style={{ "margin-top": "0.5rem", "flex-wrap": "wrap" }}>
                        <For each={presets()}>
                          {(preset) => (
                            <button
                              class="btn btn-sm"
                              title={preset.entries.join(", ")}
                              onClick={() => setAllowlistDraft(preset.entries.join("\n"))}
                            >
                              {t("perm.usePreset", { name: preset.name })}
                            </button>
                          )}
                        </For>
                        <button
                          class="btn btn-primary"
                          disabled={allowlistBusy() || !view().allowlisted}
                          onClick={() => void saveAllowlist()}
                        >
                          {allowlistBusy() ? t("common.saving") : t("perm.saveAllowlist")}
                        </button>
                      </div>

                      <Show when={view().problems.length > 0}>
                        <div class="callout callout-danger" style={{ "margin-top": "0.5rem" }}>
                          <strong>{t("perm.notEnforced")}</strong>
                          <ul style={{ margin: "0.3rem 0 0 1rem" }}>
                            <For each={view().problems}>
                              {(problem) => <li class="small">{problem}</li>}
                            </For>
                          </ul>
                        </div>
                      </Show>

                      <Show when={view().risky.length > 0}>
                        <div class="callout callout-warn" style={{ "margin-top": "0.5rem" }}>
                          <strong>{t("perm.inForceBroad")}</strong>{" "}
                          {t("perm.broadDetail", { entries: view().risky.join(", ") })}
                        </div>
                      </Show>

                      <details style={{ "margin-top": "0.5rem" }}>
                        <summary class="small muted">
                          {t("perm.showAllEntries", {
                            total: view().effective.length,
                            global: view().global.length,
                          })}
                        </summary>
                        <pre class="output" style={{ "margin-top": "0.4rem" }}>
                          {view().effective.join("\n")}
                        </pre>
                        <span class="hint">{t("perm.globalHint")}</span>
                      </details>
                    </div>
                  </>
                )}
              </Show>
            </div>

            <div class="card">
              <h3>{t("perm.insideSandbox")}</h3>
              <table>
                <thead>
                  <tr>
                    <th class="folder-cell" />
                    <th>{t("perm.reachableAt")}</th>
                    <th>{t("perm.hostPath")}</th>
                    <th>{t("perm.access")}</th>
                    <th>{t("perm.origin")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="folder-cell">
                      {/* The project row's icon opens the project's own directory, so the
                          workspace is reachable from this table like every other row. */}
                      <button
                        class="btn btn-icon"
                        title={t("perm.openDirectory", { path: current().rootDir })}
                        onClick={() => void openProjectDir()}
                      >
                        <FolderIcon />
                      </button>
                    </td>
                    <td class="path">/workspace</td>
                    <td class="path">{current().rootDir}</td>
                    <td>
                      <span class="badge badge-accent">{t("access.readWrite")}</span>
                    </td>
                    <td class="muted small">{t("perm.theProjectItself")}</td>
                    <td class="muted small">{t("perm.alwaysMounted")}</td>
                  </tr>
                  <For each={store.grants}>
                    {(grant) => (
                      <tr>
                        <td class="folder-cell">
                          <button
                            class="btn btn-icon"
                            disabled={!grant.exists}
                            title={
                              grant.exists
                                ? t("perm.openDirectory", { path: grant.hostPath })
                                : t("perm.directoryGone")
                            }
                            onClick={() => void openGrantDir(grant.id)}
                          >
                            <FolderIcon />
                          </button>
                        </td>
                        <td class="path">{grant.containerPath}</td>
                        <td class="path">{grant.hostPath}</td>
                        <td>
                          <span
                            class={
                              grant.access === "write" ? "badge badge-warn" : "badge badge-ok"
                            }
                          >
                            {accessLabel(grant.access)}
                          </span>
                        </td>
                        <td class="muted small">{grant.source}</td>
                        <td>
                          <div class="row-inline">
                            <Show
                              when={grant.access === "write"}
                              fallback={
                                <button
                                  class="btn btn-sm"
                                  title={t("perm.allowWriteTitle")}
                                  onClick={() => void flip(grant.id, "write")}
                                >
                                  {t("perm.allowWrite")}
                                </button>
                              }
                            >
                              <button
                                class="btn btn-sm"
                                title={t("perm.makeReadOnlyTitle")}
                                onClick={() => void flip(grant.id, "read")}
                              >
                                {t("perm.makeReadOnly")}
                              </button>
                            </Show>
                            <button
                              class="btn btn-sm btn-danger"
                              onClick={() => void revoke(grant.id, grant.label)}
                            >
                              {t("perm.revoke")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
              <Show when={store.grants.length === 0}>
                <p class="muted small" style={{ "margin-top": "0.6rem" }}>
                  {t("perm.noExtraDirectories")}
                </p>
              </Show>
              <Show when={!current().running}>
                <p class="faint small" style={{ "margin-top": "0.6rem" }}>
                  {t("perm.changesNextStart")}
                </p>
              </Show>
            </div>

            <div class="card">
              <h3>{t("perm.shareAnother")}</h3>
              <p>{t("perm.shareDetail")}</p>
              <div class="stack" style={{ "margin-top": "0.75rem" }}>
                <div class="field">
                  <label for="grant-path">{t("perm.directoryOnMachine")}</label>
                  <div class="row-inline">
                    <input
                      id="grant-path"
                      class="grow"
                      type="text"
                      placeholder="D:\work\brand-assets"
                      value={draftPath()}
                      onInput={(event) => setDraftPath(event.currentTarget.value)}
                      onChange={(event) => void check(event.currentTarget.value)}
                    />
                    <button class="btn" onClick={() => void browse()}>
                      {t("common.browse")}
                    </button>
                  </div>
                  <Show when={checkNote()}>
                    {(note) => (
                      <div class={note().ok ? "callout callout-info" : "callout callout-danger"}>
                        {note().text}
                      </div>
                    )}
                  </Show>
                </div>

                <div class="field">
                  <label>{t("perm.accessLevel")}</label>
                  <div class="access-choice">
                    <button
                      class="access-option"
                      aria-pressed={draftAccess() === "read"}
                      onClick={() => setDraftAccess("read")}
                    >
                      <strong>{t("perm.readOnly")}</strong>
                      <span>{t("perm.readOnlyDetail")}</span>
                    </button>
                    <button
                      class="access-option"
                      aria-pressed={draftAccess() === "write"}
                      onClick={() => setDraftAccess("write")}
                    >
                      <strong>{t("perm.readWrite")}</strong>
                      <span>{t("perm.readWriteDetail")}</span>
                    </button>
                  </div>
                </div>

                <div class="field">
                  <label for="grant-purpose">{t("perm.whyOptional")}</label>
                  <input
                    id="grant-purpose"
                    type="text"
                    placeholder={t("perm.whyPlaceholder")}
                    value={draftPurpose()}
                    onInput={(event) => setDraftPurpose(event.currentTarget.value)}
                  />
                </div>

                <div class="row-inline">
                  <button
                    class="btn btn-primary"
                    disabled={busy() || !draftPath().trim() || checkNote()?.ok === false}
                    onClick={() => void add()}
                  >
                    {t("perm.addPermission")}
                  </button>
                </div>
              </div>
            </div>

            <div class="card">
              <h3>{t("perm.decisionLog")}</h3>
              <p>{t("perm.decisionLogDetail")}</p>
              <Show
                when={store.audit.length > 0}
                fallback={<div class="empty">{t("perm.nothingDecided")}</div>}
              >
                <pre class="output">{store.audit.join("\n")}</pre>
              </Show>
            </div>
          </>
        )}
      </Show>
    </div>
  );
}
