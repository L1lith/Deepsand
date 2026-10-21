/**
 * The activity panel: the diagnostics surface.
 *
 * Everything here exists so an operator can answer "why is it doing that?"
 * without reading logs: the exact command that was run, what the sandbox
 * reported, what was refused, the runtime image build output, and the checks
 * that could not be applied on this platform.
 */

import { createSignal, For, Show } from "solid-js";
import * as api from "../lib/api";
import { baseName, formatTimestamp, shortPath } from "../lib/format";
import { networkModeLabel } from "../lib/types";
import { t } from "../i18n";
import {
  clearBlockedEgress,
  describeError,
  refreshProjects,
  selectedProject,
  store,
  toast,
} from "../store";

export function ActivityPanel() {
  const project = () => selectedProject();
  const [plan, setPlan] = createSignal<string | null>(null);
  const [planWarnings, setPlanWarnings] = createSignal<string[]>([]);
  const [busy, setBusy] = createSignal(false);
  // Where the app writes what it says about itself, including every error the window showed.
  // Asked for rather than assembled here, so the window does not have its own idea of where
  // that file is.
  const [logPath, setLogPath] = createSignal<string | null>(null);

  async function showPlan() {
    const current = project();
    if (!current) return;
    setBusy(true);
    try {
      const preview = await api.previewPlan(current.id);
      setPlan(preview.text);
      setPlanWarnings(preview.warnings);
    } catch (error) {
      toast("error", t("activity.couldNotBuildPlan"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  async function buildImage() {
    setBusy(true);
    try {
      await api.buildRuntimeImage(false);
      toast("info", t("activity.buildingRuntimeImage"), t("activity.progressBelow"));
    } catch (error) {
      toast("error", t("activity.couldNotStartBuild"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  async function cleanup() {
    try {
      const removed = await api.cleanupOrphans();
      toast(
        removed.length > 0 ? "ok" : "info",
        removed.length > 0
          ? t("activity.removedContainers", { count: removed.length })
          : t("activity.nothingToClean"),
        removed.join(", "),
      );
      await refreshProjects();
    } catch (error) {
      toast("error", t("activity.cleanupFailed"), describeError(error));
    }
  }

  return (
    <div class="panel">
      <Show when={store.startupNotice}>
        {(notice) => (
          <div class="card">
            <div class="callout callout-warn">{notice()}</div>
          </div>
        )}
      </Show>

      <div class="card">
        <h3>{t("activity.whatRuns")}</h3>
        <p>{t("activity.whatRunsDetail")}</p>
        <div class="row-inline" style={{ "margin-top": "0.6rem" }}>
          <button class="btn" disabled={busy() || !project()} onClick={() => void showPlan()}>
            {t("activity.showCommand")}
          </button>
        </div>
        <Show when={planWarnings().length > 0}>
          <div class="callout callout-warn" style={{ "margin-top": "0.7rem" }}>
            {planWarnings().join(" ")}
          </div>
        </Show>
        <Show when={plan()}>
          {(text) => <pre class="output" style={{ "margin-top": "0.7rem" }}>{text()}</pre>}
        </Show>
      </div>

      <div class="card">
        <h3>{t("activity.runtimeImage")}</h3>
        <p>{t("activity.runtimeImageDetail")}</p>
        <div class="row-inline" style={{ "margin-top": "0.6rem" }}>
          <span class="tag">{store.info?.settings.image}</span>
          <Show when={store.info?.docker} fallback={<span class="badge">{t("common.checking")}</span>}>
            {(docker) => (
              <Show
                when={docker().image_present}
                fallback={<span class="badge badge-warn">{t("activity.notBuilt")}</span>}
              >
                <span class="badge badge-ok">{t("activity.present")}</span>
              </Show>
            )}
          </Show>
          <button class="btn" disabled={busy() || store.building} onClick={() => void buildImage()}>
            {store.building ? t("common.building") : t("activity.buildImage")}
          </button>
        </div>
        <Show when={store.buildLog.length > 0}>
          <pre class="output" style={{ "margin-top": "0.7rem" }}>{store.buildLog.join("\n")}</pre>
        </Show>
      </div>

      <div class="card">
        <h3>{t("activity.requestsDiscarded")}</h3>
        <p>{t("activity.requestsDiscardedDetail")}</p>
        <Show
          when={store.rejected.length > 0}
          fallback={<div class="empty">{t("activity.nothingDiscarded")}</div>}
        >
          <table>
            <thead>
              <tr>
                <th>{t("activity.file")}</th>
                <th>{t("activity.reason")}</th>
              </tr>
            </thead>
            <tbody>
              <For each={store.rejected}>
                {(entry) => (
                  <tr>
                    <td class="path">{entry.file}</td>
                    <td class="small">{entry.reason}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </div>

      <div class="card">
        <h3>{t("activity.blockedDestinations")}</h3>
        <p>{t("activity.blockedDestinationsDetail")}</p>
        <Show
          when={store.blockedEgress.length > 0}
          fallback={<div class="empty">{t("activity.nothingBlocked")}</div>}
        >
          <table>
            <thead>
              <tr>
                <th>{t("activity.host")}</th>
                <th>{t("activity.port")}</th>
                <th>{t("activity.reason")}</th>
                <th>{t("activity.when")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <For each={store.blockedEgress}>
                {(entry) => (
                  <tr>
                    <td class="path">{entry.host}</td>
                    <td>{entry.port}</td>
                    <td class="small">{entry.reason}</td>
                    <td class="small muted">{formatTimestamp(entry.atMs)}</td>
                    <td>
                      <button
                        class="btn btn-sm"
                        onClick={() => void allowHost(entry.host)}
                        title={t("activity.allowTitle")}
                      >
                        {t("activity.allow")}
                      </button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </div>

      <div class="card">
        <h3>{t("activity.statusTitle")}</h3>
        <table>
          <tbody>
            <tr>
              <th>{t("activity.deepsand")}</th>
              <td>{store.info?.version ?? "?"}</td>
            </tr>
            <tr>
              <th>{t("activity.dataDirectory")}</th>
              <td class="path">{store.info?.dataDir ?? "?"}</td>
            </tr>
            <tr>
              <th>{t("activity.errorLog")}</th>
              <td class="path">
                {logPath() ?? "…"}
                <Show when={logPath()}>
                  <button
                    class="btn btn-ghost btn-sm"
                    style={{ "margin-left": "0.4rem" }}
                    title={t("activity.copyPathTitle")}
                    onClick={() => void copyLogPath()}
                  >
                    {t("activity.copyPath")}
                  </button>
                </Show>
                <div class="small" style={{ "margin-top": "0.2rem" }}>
                  {t("activity.logDetail")}
                </div>
              </td>
            </tr>
            <tr>
              <th>{t("activity.docker")}</th>
              <td>
                <Show
                  when={store.info?.docker}
                  fallback={<span class="badge">{t("common.checking")}</span>}
                >
                  {(docker) => (
                    <>
                      <Show
                        when={docker().available}
                        fallback={<span class="badge badge-danger">{t("activity.daemonNotReachable")}</span>}
                      >
                        <span class="badge badge-ok">{t("activity.serverVersion", { version: docker().server_version })}</span>
                      </Show>
                      <Show when={docker().desktop}>
                        <span class="badge badge-warn" style={{ "margin-left": "0.4rem" }}>
                          {t("activity.dockerDesktopLimited")}
                        </span>
                      </Show>
                    </>
                  )}
                </Show>
              </td>
            </tr>
            <tr>
              <th>{t("activity.modelCredentials")}</th>
              <td>
                <Show
                  when={store.info?.hostConfig.apiKey !== "(unset)"}
                  fallback={<span class="badge badge-warn">{t("activity.noApiKey")}</span>}
                >
                  <span class="badge badge-ok">{t("activity.inheritedFrom", { file: baseName(store.info?.hostConfig.path ?? "") })}</span>
                </Show>
                <div class="faint small" style={{ "margin-top": "0.3rem" }}>
                  {store.info?.hostConfig.path}
                </div>
              </td>
            </tr>
            <tr>
              <th>{t("activity.networkPolicy")}</th>
              <td>
                <Show when={project()} fallback={<span class="muted">{t("activity.noProjectSelected")}</span>}>
                  {(current) => (
                    <span class="tag">{networkModeLabel(current().network.mode)}</span>
                  )}
                </Show>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="row-inline" style={{ "margin-top": "0.7rem" }}>
          <button class="btn" onClick={() => void cleanup()}>
            {t("activity.removeContainers")}
          </button>
          <button class="btn btn-ghost" onClick={() => void reveal()}>
            {t("activity.showDataFolder")}
          </button>
        </div>
      </div>
    </div>
  );

  async function allowHost(host: string) {
    const current = project();
    if (!current) return;
    try {
      // Added to *this project's* list rather than the app-wide one. A host one
      // project happened to need should not silently become reachable from every
      // other project on the machine, which is what the global list would do.
      const view = await api.projectAllowlist(current.id);
      const next = Array.from(new Set([...view.project, host]));
      const updated = await api.setProjectAllowlist(current.id, next);
      toast(
        "ok",
        t("activity.allowedHost", { host, project: current.name }),
        t(
          updated.effective.length === 1 ? "activity.entryInForce" : "activity.entriesInForce",
          { count: updated.effective.length },
        ),
      );
      clearBlockedEgress(host);
    } catch (error) {
      toast("error", t("activity.couldNotUpdateAllowlist"), describeError(error));
    }
  }

  async function loadLogPath() {
    try {
      setLogPath(await api.logFilePath());
    } catch {
      /* the row says so, rather than showing a path that may not be right */
    }
  }

  async function copyLogPath() {
    const path = logPath();
    if (!path) return;
    try {
      await navigator.clipboard.writeText(path);
      toast("ok", t("activity.copied"), t("activity.logPathOnClipboard"));
    } catch {
      toast("warn", t("common.couldNotCopy"), path);
    }
  }

  // Asked for once, when the panel is created: the answer cannot change while it is open.
  void loadLogPath();

  async function reveal() {
    try {
      const path = await api.revealDataDir();
      toast("info", t("activity.dataFolder"), shortPath(path, 90));
    } catch (error) {
      toast("error", t("activity.couldNotOpenFolder"), describeError(error));
    }
  }
}
