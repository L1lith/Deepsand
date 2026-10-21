/**
 * Modal dialogs.
 *
 * The most important one is `PermissionDialog`, which is the two prompts the
 * product is built around:
 *
 *  * "DeepCode is trying to access <path>" — the sandbox named a path, so the
 *    dialog shows exactly that path and the operator confirms.
 *  * "DeepCode is requesting access to <thing>" — the sandbox knows *what* it
 *    needs but not *where* it lives, so the operator is given a folder picker to
 *    locate it. The sandbox never learns the host path, only where the result
 *    appears inside itself.
 */

import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show, type JSX } from "solid-js";
import { open } from "@tauri-apps/plugin-dialog";
import * as api from "../lib/api";
import { baseName, shortPath } from "../lib/format";
import {
  DEFAULT_LIMITS,
  type AppSettings,
  type StartupMode,
  type PermissionRequestView,
  type ProjectView,
  type ResourceLimits,
  type RemoteAccessSettings,
  type RemoteAccessView,
  type RemoteServerConfig,
  type UpdateCheck,
  type UpdateProgress,
  type UserPromptMode,
} from "../lib/types";
import {
  describeError,
  dismissToast,
  refreshProjects,
  refreshSettings,
  renameProject,
  selectedProject,
  store,
  toast,
} from "../store";
import { t } from "../i18n";
import { LanguageSettingsSection } from "./LanguagePicker";

/* ------------------------------------------------------------------------- */
/* Shared chrome                                                              */
/* ------------------------------------------------------------------------- */

export function Modal(props: {
  title: string;
  subtitle?: string;
  wide?: boolean;
  onClose: () => void;
  children: JSX.Element;
  footer: JSX.Element;
}) {
  return (
    <div
      class="scrim"
      onClick={(event) => {
        if (event.target === event.currentTarget) props.onClose();
      }}
    >
      <div class={props.wide ? "modal modal-wide" : "modal"} role="dialog" aria-modal="true">
        <div class="modal-head">
          <h2>{props.title}</h2>
          <Show when={props.subtitle}>
            <p>{props.subtitle}</p>
          </Show>
        </div>
        <div class="modal-body">{props.children}</div>
        <div class="modal-foot">{props.footer}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Permission request dialog                                                  */
/* ------------------------------------------------------------------------- */

/**
 * The request's title.
 *
 * The backend writes these in English because it has no notion of an interface
 * language. The pieces it interpolates -- a path, a host, a tool name -- are
 * data and stay as they are; only the sentence around them is translated.
 */
function requestTitle(request: PermissionRequestView): string {
  const target = request.claimedPath ?? request.description;
  switch (request.kind) {
    case "directory_access":
      return t("request.title.directory", { target });
    case "locate_resource":
      return t("request.title.locate", { target });
    case "network_access":
      return t("request.title.network", { target });
    case "tool_install":
      return t("request.title.tool", { target });
    default:
      return request.title;
  }
}

export function PermissionDialog(props: { request: PermissionRequestView; queued: number }) {
  const request = () => props.request;

  const [path, setPath] = createSignal(request().claimedPath ?? "");
  // A write request is a bigger ask, so it never arrives pre-selected.
  // Read-only is the default even when the sandbox asked for write: an approval
  // should be a deliberate act, not a keystroke that inherits the larger ask.
  const [access, setAccess] = createSignal<"read" | "write">("read");
  const [note, setNote] = createSignal("");
    const [busy, setBusy] = createSignal(false);
  const [check, setCheck] = createSignal<{ ok: boolean; text: string } | null>(null);

  /**
   * Whether the sandbox that made this request is being held still.
   *
   * It is, while a dialog like this one is open -- that is the point of the freeze: the agent
   * cannot work ahead of a decision it has not been given. Read from the project list rather
   * than asked for separately, because the list already carries it.
   */
  const heldSandbox = () =>
    store.projects.some((project) => project.id === request().projectId && project.paused);

  // A new request may arrive while this one is open; re-seed the form.
  createEffect(() => {
    const current = request();
    setPath(current.claimedPath ?? "");
    setAccess("read");
    setNote("");
    setBusy(false);
    if (current.claimedPath) void verify(current.claimedPath);
    else setCheck(null);
  });

  async function verify(candidate: string) {
    if (!candidate.trim()) {
      setCheck(null);
      return;
    }
    try {
      const result = await api.pathCheck(candidate);
      setCheck(
        result.allowed
          ? { ok: true, text: t("request.pathAllowed") }
          : { ok: false, text: result.reason ?? t("request.pathCannotBeShared") },
      );
    } catch (error) {
      setCheck({ ok: false, text: describeError(error) });
    }
  }

  async function locate() {
    const chosen = await open({
      directory: request().requestedKind !== "file",
      multiple: false,
      title: t("request.find", { target: request().description }),
    });
    if (typeof chosen === "string") {
      setPath(chosen);
      await verify(chosen);
    }
  }

  const blocked = createMemo(() => check()?.ok === false);

  async function decide(decision: "allow" | "deny") {
    setBusy(true);
    try {
      const allowed = await api.answerRequest({
        requestId: request().id,
        decision,
        message: note(),
        hostPath: decision === "allow" ? path() : null,
        access: decision === "allow" ? access() : null,
        secretName: request().secretName ?? null,
        secretValue: request().secretValue ?? null,
        restart: true,
      });
      if (decision === "allow" && allowed) {
        toast(
          "ok",
          t("request.sharedTitle"),
          t("request.sharedBody", { name: baseName(path()) }),
        );
      } else if (decision === "deny") {
        toast("info", t("request.deniedTitle"), t("request.deniedBody"));
      }
    } catch (error) {
      toast("error", t("request.couldNotDeliver"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  /**
   * Turn permission requests off for this project, from the dialog itself.
   *
   * The host answers this request and every other one already waiting, so the dialog
   * closes because the request was *answered* rather than because the UI hid it — and the
   * sandbox is told why instead of being left waiting for a decision that is not coming.
   */
  async function stopAsking() {
    setBusy(true);
    try {
      await api.setRequestsEnabled(request().projectId, false);
      toast(
        "info",
        t("request.requestsOffTitle"),
        t("request.requestsOffBody", { name: request().projectName }),
      );
    } catch (error) {
      toast("error", t("request.couldNotTurnOff"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  /**
   * The two request kinds that are about a path on the operator's machine.
   *
   * Network and tool requests reuse the same dialog but have no path to choose, so
   * everything path-shaped is hidden for them rather than offering a folder picker
   * for a question that is not about folders.
   */
  const isDirectoryKind = () =>
    request().kind === "directory_access" || request().kind === "locate_resource";

  return (
    <Modal
      title={requestTitle(request())}
      subtitle={t("request.project", { name: request().projectName })}
      onClose={() => void decide("deny")}
      footer={
        <>
          <span class="left">
            <Show when={props.queued > 1}>
              {t(
                props.queued - 1 === 1 ? "request.moreWaitingOne" : "request.moreWaiting",
                { count: props.queued - 1 },
              )}
            </Show>
            {/* Deliberately quiet, and in the footer's spare space: it is the right answer
                to a flood and the wrong answer to the one request you are about to grant. */}
            <button
              class="btn btn-ghost btn-sm"
              style={{ "margin-left": props.queued > 1 ? "0.6rem" : "0" }}
              disabled={busy()}
              title={t("request.stopAskingTitle", { name: request().projectName })}
              onClick={() => void stopAsking()}
            >
              {t("request.stopAsking")}
            </button>
          </span>
          <button class="btn btn-danger" disabled={busy()} onClick={() => void decide("deny")}>
            {t("request.deny")}
          </button>
          <button
            class="btn btn-primary"
            // Only a directory request needs a path. Requiring one for every kind left the
            // button dead for the kinds that have no path at all: a network request could
            // not be approved, because the field it was waiting for is never shown.
            disabled={busy() || blocked() || (isDirectoryKind() && !path().trim())}
            onClick={() => void decide("allow")}
          >
            {t("request.grant")}
          </button>
        </>
      }
    >
      <div class="stack">
        <Show when={heldSandbox()}>
          <div class="callout callout-warn">{t("request.frozen")}</div>
        </Show>
        <Show when={request().purpose}>
          {(purpose) => (
            <div class="callout callout-info">
              <strong>{t("request.purpose")}</strong> {purpose()}
            </div>
          )}
        </Show>

        <Show when={isDirectoryKind() && request().kind === "directory_access" && request().claimedPath}>
          <div class="field">
            <label>{t("request.claimedPath")}</label>
            <div class="request-path">{request().claimedPath}</div>
            <span class="hint">{t("request.pathRecheck")}</span>
          </div>
        </Show>



        <Show when={isDirectoryKind()}>
        <div class="field">
          <label for="perm-path">
            {request().kind === "locate_resource"
              ? t("request.directoryOnMachine")
              : t("request.directoryToShare")}
          </label>
          <div class="row-inline">
            <input
              id="perm-path"
              class="grow"
              type="text"
              placeholder="D:\work\brand-assets"
              value={path()}
              onInput={(event) => setPath(event.currentTarget.value)}
              onChange={(event) => void verify(event.currentTarget.value)}
            />
            <button class="btn" onClick={() => void locate()}>
              {t("request.locate")}
            </button>
          </div>
          <Show when={check()}>
            {(result) => (
              <div class={result().ok ? "callout callout-info" : "callout callout-danger"}>
                {result().text}
              </div>
            )}
          </Show>
        </div>
        </Show>

        <Show when={!isDirectoryKind()}>
          <div class="field">
            <label>
              {request().kind === "network_access"
                ? t("request.destinationsRequested")
                : t("request.toolsRequested")}
            </label>
            <div class="request-path mono">{request().description}</div>
            <Show when={request().kind === "network_access"}>
              <span class="hint">{t("request.networkHint")}</span>
            </Show>
            <Show when={request().kind === "tool_install"}>
              <span class="hint">{t("request.toolHint")}</span>
            </Show>
          </div>
        </Show>

        <Show when={isDirectoryKind()}>
        <div class="field">
          <label>{t("request.accessToGrant")}</label>
          <div class="access-choice">
            <button
              class="access-option"
              aria-pressed={access() === "read"}
              onClick={() => setAccess("read")}
            >
              <strong>{t("access.readOnly")}</strong>
              <span>{t("request.readOnlyDetail")}</span>
            </button>
            <button
              class="access-option"
              aria-pressed={access() === "write"}
              onClick={() => setAccess("write")}
            >
              <strong>{t("access.readWrite")}</strong>
              <span>{t("request.readWriteDetail")}</span>
            </button>
          </div>
        </div>
        </Show>

        <div class="field">
          <label for="perm-note">{t("request.replyOptional")}</label>
          <input
            id="perm-note"
            type="text"
            placeholder={t("request.replyPlaceholder")}
            value={note()}
            onInput={(event) => setNote(event.currentTarget.value)}
          />
        </div>

        <div class="callout callout-info">{t("request.judgment")}</div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------------- */
/* New project                                                                */
/* ------------------------------------------------------------------------- */

export function NewProjectDialog(props: { onClose: () => void }) {
  /** Which half of the dialog is showing: creating from a folder, or importing a repository. */
  const [mode, setMode] = createSignal<"manual" | "git">("manual");
  const [busy, setBusy] = createSignal(false);
  const [name, setName] = createSignal("");
  const [root, setRoot] = createSignal("");
  const [check, setCheck] = createSignal<{ ok: boolean; text: string } | null>(null);

  async function verify(candidate: string) {
    if (!candidate.trim()) {
      setCheck(null);
      return;
    }
    try {
      const result = await api.pathCheck(candidate);
      setCheck(
        result.allowed
          ? { ok: true, text: t("newProject.pathUsable") }
          : { ok: false, text: result.reason ?? t("newProject.pathUnusable") },
      );
    } catch (error) {
      setCheck({ ok: false, text: describeError(error) });
    }
  }

  async function browse() {
    const chosen = await open({ directory: true, multiple: false, title: t("newProject.browseTitle") });
    if (typeof chosen === "string") {
      setRoot(chosen);
      await verify(chosen);
    }
  }

  async function create() {
    setBusy(true);
    try {
      const project = await api.createProject(name(), root());
      await refreshProjects();
      toast("ok", t("newProject.created", { name: project.name }), t("newProject.createdBody"));
      props.onClose();
    } catch (error) {
      toast("error", t("newProject.couldNotCreate"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  /* ----------------------------------------------------------------------- */
  /* Import with Git                                                         */
  /* ----------------------------------------------------------------------- */

  const [gitUrl, setGitUrl] = createSignal("");
  const [gitParent, setGitParent] = createSignal("");
  const [gitName, setGitName] = createSignal("");
  const [gitUser, setGitUser] = createSignal("");
  const [gitToken, setGitToken] = createSignal("");
  /** Set once the machine's own credentials were refused: the window then asks for a login. */
  const [needsLogin, setNeedsLogin] = createSignal(false);
  const [loginDetail, setLoginDetail] = createSignal("");

  function resetLogin() {
    setNeedsLogin(false);
    setLoginDetail("");
    setGitUser("");
    setGitToken("");
  }

  async function browseParent() {
    const chosen = await open({
      directory: true,
      multiple: false,
      title: t("newProject.browseCloneTitle"),
    });
    if (typeof chosen === "string") setGitParent(chosen);
  }

  /**
   * Clone and import. `signingIn` is true only for the second attempt, after the machine's own
   * credentials were tried and refused -- the first attempt is always the machine's, so a login
   * is never offered before it has been given the chance to work.
   */
  async function importGit(signingIn: boolean) {
    setBusy(true);
    try {
      const result = await api.importGitProject({
        url: gitUrl(),
        parentDir: gitParent(),
        name: gitName().trim() || undefined,
        username: signingIn ? gitUser() : undefined,
        secret: signingIn ? gitToken() : undefined,
      });
      if (result.needsCredentials) {
        setNeedsLogin(true);
        setLoginDetail(result.detail);
        return;
      }
      if (result.project) {
        await refreshProjects();
        toast(
          "ok",
          t("newProject.imported", { name: result.project.name }),
          t("newProject.importedBody"),
        );
        props.onClose();
        return;
      }
      toast("error", t("newProject.couldNotImport"), result.detail);
    } catch (error) {
      toast("error", t("newProject.couldNotImport"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  const gitReady = () =>
    !busy() &&
    gitUrl().trim().length > 0 &&
    gitParent().trim().length > 0 &&
    (!needsLogin() || (gitUser().trim().length > 0 && gitToken().length > 0));

  return (
    <Modal
      title={mode() === "git" ? t("newProject.importGit") : t("app.newProject")}
      subtitle={t("newProject.subtitle")}
      onClose={props.onClose}
      footer={
        mode() === "git" ? (
          <>
            <button
              class="btn btn-ghost"
              disabled={busy()}
              onClick={() => {
                resetLogin();
                setMode("manual");
              }}
            >
              {t("common.back")}
            </button>
            <button class="btn btn-primary" disabled={!gitReady()} onClick={() => void importGit(needsLogin())}>
              {busy()
                ? t("common.cloning")
                : needsLogin()
                  ? t("newProject.signInImport")
                  : t("newProject.import")}
            </button>
          </>
        ) : (
          <>
            <button class="btn btn-ghost" onClick={props.onClose}>
              {t("common.cancel")}
            </button>
            <button
              class="btn btn-primary"
              disabled={busy() || !name().trim() || !root().trim() || check()?.ok === false}
              onClick={() => void create()}
            >
              {t("newProject.create")}
            </button>
          </>
        )
      }
    >
      <Show
        when={mode() === "git"}
        fallback={
          <div class="stack">
            <div class="row-inline">
              <button class="btn" onClick={() => setMode("git")}>
                {t("newProject.importGit")}
              </button>
              <span class="faint small">{t("newProject.cloneHint")}</span>
            </div>
            <div class="field">
              <label for="np-name">{t("newProject.name")}</label>
              <input
                id="np-name"
                type="text"
                placeholder="my-website"
                value={name()}
                onInput={(event) => setName(event.currentTarget.value)}
              />
            </div>
            <div class="field">
              <label for="np-root">{t("newProject.primaryDir")}</label>
              <div class="row-inline">
                <input
                  id="np-root"
                  class="grow"
                  type="text"
                  placeholder="D:\work\my-website"
                  value={root()}
                  onInput={(event) => setRoot(event.currentTarget.value)}
                  onChange={(event) => void verify(event.currentTarget.value)}
                />
                <button class="btn" onClick={() => void browse()}>
                  {t("common.browse")}
                </button>
              </div>
              <Show when={check()}>
                {(result) => (
                  <div class={result().ok ? "callout callout-info" : "callout callout-danger"}>
                    {result().text}
                  </div>
                )}
              </Show>
            </div>
            <div class="callout callout-info">{t("newProject.sandboxSees")}</div>
          </div>
        }
      >
        <div class="stack">
          <div class="field">
            <label for="np-git-url">{t("newProject.repoUrl")}</label>
            <input
              id="np-git-url"
              type="text"
              placeholder="https://github.com/you/project.git"
              value={gitUrl()}
              onInput={(event) => {
                setGitUrl(event.currentTarget.value);
                // A login is for the URL it was refused for; a different URL starts over.
                if (needsLogin()) resetLogin();
              }}
            />
          </div>
          <div class="field">
            <label for="np-git-parent">{t("newProject.cloneInto")}</label>
            <div class="row-inline">
              <input
                id="np-git-parent"
                class="grow"
                type="text"
                placeholder="D:\work"
                value={gitParent()}
                onInput={(event) => setGitParent(event.currentTarget.value)}
              />
              <button class="btn" onClick={() => void browseParent()}>
                {t("common.browse")}
              </button>
            </div>
            <p class="faint small">{t("newProject.cloneHintLong")}</p>
          </div>
          <div class="field">
            <label for="np-git-name">{t("newProject.nameOptional")}</label>
            <input
              id="np-git-name"
              type="text"
              placeholder={t("newProject.namePlaceholder")}
              value={gitName()}
              onInput={(event) => setGitName(event.currentTarget.value)}
            />
          </div>
          <Show when={needsLogin()}>
            <div class="callout callout-warn">
              <p>{t("newProject.credentialsTried")}</p>
              <Show when={loginDetail()}>
                <pre class="output">{loginDetail()}</pre>
              </Show>
              <p>{t("newProject.enterCredentials")}</p>
            </div>
            <div class="field">
              <label for="np-git-user">{t("newProject.username")}</label>
              <input
                id="np-git-user"
                type="text"
                autocomplete="username"
                value={gitUser()}
                onInput={(event) => setGitUser(event.currentTarget.value)}
              />
            </div>
            <div class="field">
              <label for="np-git-token">{t("newProject.token")}</label>
              <input
                id="np-git-token"
                type="password"
                autocomplete="current-password"
                value={gitToken()}
                onInput={(event) => setGitToken(event.currentTarget.value)}
              />
            </div>
          </Show>
        </div>
      </Show>
    </Modal>
  );
}

/* ------------------------------------------------------------------------- */
/* Rename project                                                             */
/* ------------------------------------------------------------------------- */

/**
 * Change a project's sidebar label.
 *
 * Separate from Project settings on purpose: this is a one-field action reachable from the
 * sidebar's context menu, and it changes nothing about what the sandbox can reach. The hint
 * says what does not move, because an operator renaming a project may reasonably expect the
 * container and saved sessions to follow the new name.
 */
export function RenameProjectDialog(props: { project: ProjectView; onClose: () => void }) {
  const [name, setName] = createSignal(props.project.name);
  const [busy, setBusy] = createSignal(false);
  const trimmed = () => name().trim();
  const canSave = () => !busy() && trimmed().length > 0 && trimmed() !== props.project.name;

  async function save() {
    if (!canSave()) return;
    setBusy(true);
    try {
      const renamed = await renameProject(props.project.id, trimmed());
      toast("ok", t("projectRename.renamed", { name: renamed.name }), t("projectRename.renamedBody"));
      props.onClose();
    } catch (error) {
      toast("error", t("projectRename.couldNotRename"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={t("projectRename.title")}
      subtitle={t("projectRename.subtitle")}
      onClose={props.onClose}
      footer={
        <>
          <button class="btn btn-ghost" onClick={props.onClose}>
            {t("common.cancel")}
          </button>
          <button class="btn btn-primary" disabled={!canSave()} onClick={() => void save()}>
            {busy() ? t("common.renaming") : t("common.rename")}
          </button>
        </>
      }
    >
      <div class="field">
        <label for="rename-project-name">{t("projectRename.name")}</label>
        <input
          id="rename-project-name"
          type="text"
          maxlength={120}
          autofocus
          value={name()}
          onFocus={(event) => event.currentTarget.select()}
          onInput={(event) => setName(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void save();
          }}
        />
        <span class="hint">{t("projectRename.hint")}</span>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------------- */
/* Project settings                                                           */
/* ------------------------------------------------------------------------- */

export function ProjectSettingsDialog(props: { project: ProjectView; onClose: () => void }) {
  const [mode, setMode] = createSignal(props.project.deepcodeMode);
  const [limits, setLimits] = createSignal<ResourceLimits>({ ...DEFAULT_LIMITS, ...props.project.limits });
  const [model, setModel] = createSignal(props.project.credentials.model ?? "");
  const [baseUrl, setBaseUrl] = createSignal(props.project.credentials.base_url ?? "");
  const [apiKey, setApiKey] = createSignal("");
  const [inherit, setInherit] = createSignal(props.project.credentials.source !== "project");
  // Both halves of the instruction choice, so saving moves the mode and the text together: the
  // mode decides whether the text is sent, and a save that carried one without the other would
  // either send the old text under the new mode or drop the new text on the floor.
  const [promptMode, setPromptMode] = createSignal<UserPromptMode>(props.project.userPromptMode);
  const [prompt, setPrompt] = createSignal(props.project.userPrompt);
  /**
   * What "Global" will actually send.
   *
   * Shown rather than named, because the alternative is a segment that says "Global" and leaves the
   * operator to remember what that is -- and to notice that it is empty, which is the difference
   * between an instruction and nothing at all.
   */
  const globalPrompt = () => (store.settings?.user_prompt ?? "").trim();
  const [busy, setBusy] = createSignal(false);
  /** The wipe is a second destructive action, so it gets its own confirmation step. */
  const [confirmWipe, setConfirmWipe] = createSignal(false);
  const [wiping, setWiping] = createSignal(false);

  async function save() {
    setBusy(true);
    try {
      await api.updateProjectSettings({
        projectId: props.project.id,
        deepcodeMode: mode(),
        limits: limits(),
        userPromptMode: promptMode(),
        userPrompt: prompt(),
        credentials: inherit()
          ? { source: "inherit_host" }
          : {
              source: "project",
              model: model() || null,
              base_url: baseUrl() || null,
              api_key: apiKey() || props.project.credentials.api_key || null,
            },
      });
      await refreshProjects();
      toast("ok", t("projectSettings.saved"), t("projectSettings.savedBody"));
      props.onClose();
    } catch (error) {
      toast("error", t("projectSettings.couldNotSave"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api.deleteProject(props.project.id);
      await refreshProjects();
      toast("info", t("projectSettings.removed", { name: props.project.name }));
      props.onClose();
    } catch (error) {
      toast("error", t("projectSettings.couldNotRemove"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  /**
   * Delete the sandbox's DeepCode data, not the project.
   *
   * The two are separate stores by construction: the conversation history lives in the
   * `deepsand-state-<slug>` Docker volume, while the code is a bind mount of `rootDir`. The
   * backend is given a project id and resolves the volume itself, so no path the operator
   * picked is ever handed to a delete.
   */
  async function wipeDeepcodeData() {
    setWiping(true);
    try {
      await api.wipeProjectDeepcodeData(props.project.id);
      await refreshProjects();
      toast(
        "ok",
        t("projectSettings.wiped"),
        t("projectSettings.wipedBody", { path: props.project.rootDir }),
      );
      props.onClose();
    } catch (error) {
      toast("error", t("projectSettings.couldNotWipe"), describeError(error));
    } finally {
      setWiping(false);
    }
  }

  return (
    <Modal
      title={t("projectSettings.title", { name: props.project.name })}
      subtitle={props.project.rootDir}
      wide
      onClose={props.onClose}
      footer={
        <>
          <button
            class="btn btn-danger left"
            disabled={busy() || wiping()}
            onClick={() => void remove()}
          >
            {t("projectSettings.removeProject")}
          </button>
          <button class="btn btn-ghost" onClick={props.onClose}>
            {t("common.cancel")}
          </button>
          <button
            class="btn btn-primary"
            disabled={busy() || wiping()}
            onClick={() => void save()}
          >
            {t("common.save")}
          </button>
        </>
      }
    >
      <div class="stack">
        <div class="field">
          <label>{t("projectSettings.deepcodePrompts")}</label>
          <div class="row-inline">
            <button
              class="btn btn-sm"
              aria-pressed={mode() === "allow_all"}
              style={
                mode() === "allow_all"
                  ? { "border-color": "var(--accent)", background: "var(--accent-soft)" }
                  : undefined
              }
              onClick={() => setMode("allow_all")}
            >
              {t("projectSettings.quiet")}
            </button>
            <button
              class="btn btn-sm"
              aria-pressed={mode() === "strict"}
              style={
                mode() === "strict"
                  ? { "border-color": "var(--accent)", background: "var(--accent-soft)" }
                  : undefined
              }
              onClick={() => setMode("strict")}
            >
              {t("projectSettings.strict")}
            </button>
          </div>
          <span class="hint">{t("projectSettings.modeHint")}</span>
        </div>

        <div class="field">
          <label>{t("projectSettings.instructions")}</label>
          <SegmentedSlider
            ariaLabel={t("projectSettings.userPrompt")}
            value={promptMode()}
            onChange={setPromptMode}
            options={[
              { value: "global", label: t("projectSettings.global"), title: t("projectSettings.globalTitle") },
              { value: "custom", label: t("projectSettings.custom"), title: t("projectSettings.customTitle") },
              { value: "off", label: t("projectSettings.off"), title: t("projectSettings.offTitle") },
            ]}
          />
          <Show when={promptMode() === "global"}>
            <Show
              when={globalPrompt()}
              fallback={<span class="hint">{t("projectSettings.noGlobal")}</span>}
            >
              {(text) => (
                <div class="prompt-preview" title={t("projectSettings.globalTitle")}>
                  {text()}
                </div>
              )}
            </Show>
          </Show>
          <Show when={promptMode() === "custom"}>
            <textarea
                            rows="6"
              placeholder={t("projectSettings.customPlaceholder")}
              value={prompt()}
              onInput={(event) => setPrompt(event.currentTarget.value)}
            />
          </Show>
          <span class="hint">{t("projectSettings.promptHint")}</span>
        </div>

        <div class="field">
          <label>{t("projectSettings.modelCredentials")}</label>
          <div class="row-inline">
            <button
              class="btn btn-sm"
              aria-pressed={inherit()}
              style={
                inherit() ? { "border-color": "var(--accent)", background: "var(--accent-soft)" } : undefined
              }
              onClick={() => setInherit(true)}
            >
              {t("projectSettings.inherit")}
            </button>
            <button
              class="btn btn-sm"
              aria-pressed={!inherit()}
              style={!inherit() ? { "border-color": "var(--accent)", background: "var(--accent-soft)" } : undefined}
              onClick={() => setInherit(false)}
            >
              {t("projectSettings.override")}
            </button>
          </div>
          <Show when={inherit()}>
            <span class="hint">
              {t("projectSettings.inheritHint", {
                path: store.info?.hostConfig.path ?? "",
                model: store.info?.hostConfig.model ?? "",
                key: store.info?.hostConfig.apiKey ?? "",
              })}
            </span>
          </Show>
          <Show when={!inherit()}>
            <div class="stack" style={{ "margin-top": "0.5rem" }}>
              <input
                type="text"
                placeholder={t("projectSettings.modelPlaceholder")}
                value={model()}
                onInput={(event) => setModel(event.currentTarget.value)}
              />
              <input
                type="text"
                placeholder={t("projectSettings.baseUrlPlaceholder")}
                value={baseUrl()}
                onInput={(event) => setBaseUrl(event.currentTarget.value)}
              />
              <input
                type="password"
                placeholder={t("projectSettings.apiKeyPlaceholder")}
                value={apiKey()}
                onInput={(event) => setApiKey(event.currentTarget.value)}
              />
            </div>
          </Show>
        </div>

        <div class="field">
          <label>{t("projectSettings.resourceLimits")}</label>
          <div class="row-inline" style={{ "flex-wrap": "wrap" }}>
            <label class="small muted">
              {t("projectSettings.memory")}
              <input
                type="number"
                min="256"
                value={limits().memory_mb}
                onInput={(event) =>
                  setLimits({ ...limits(), memory_mb: Number(event.currentTarget.value) || 0 })
                }
              />
            </label>
            <label class="small muted">
              {t("projectSettings.cpus")}
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={limits().cpus}
                onInput={(event) => setLimits({ ...limits(), cpus: Number(event.currentTarget.value) || 1 })}
              />
            </label>
            <label class="small muted">
              {t("projectSettings.processes")}
              <input
                type="number"
                min="32"
                value={limits().pids_limit}
                onInput={(event) =>
                  setLimits({ ...limits(), pids_limit: Number(event.currentTarget.value) || 128 })
                }
              />
            </label>
            <label class="small muted">
              {t("projectSettings.tmp")}
              <input
                type="number"
                min="64"
                value={limits().tmpfs_mb}
                onInput={(event) => setLimits({ ...limits(), tmpfs_mb: Number(event.currentTarget.value) || 256 })}
              />
            </label>
          </div>
        </div>

        <div class="field">
          <label>{t("projectSettings.deepcodeData")}</label>
          <Show
            when={!confirmWipe()}
            fallback={
              <div class="callout callout-danger">
                <p>
                  <strong>{t("projectSettings.wipeTitle")}</strong>
                </p>
                <p>{t("projectSettings.wipeDetail", { path: props.project.rootDir })}</p>
                <div class="row-inline">
                  <button
                    class="btn btn-danger"
                    disabled={wiping()}
                    onClick={() => void wipeDeepcodeData()}
                  >
                    {wiping() ? t("common.wiping") : t("projectSettings.yesWipe")}
                  </button>
                  <button
                    class="btn btn-ghost"
                    disabled={wiping()}
                    onClick={() => setConfirmWipe(false)}
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            }
          >
            <button
              class="btn btn-danger"
              disabled={busy() || wiping()}
              onClick={() => setConfirmWipe(true)}
            >
              {t("projectSettings.wipeButton")}
            </button>
            <span class="hint">{t("projectSettings.wipeHint")}</span>
          </Show>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------------- */
/* Global settings                                                            */
/* ------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------- */
/* Remote access                                                             */
/* ------------------------------------------------------------------------- */

/**
 * The whole remote access section, including the feature toggle that hides it.
 *
 * Saves immediately rather than through the dialog's Save button, because starting
 * and stopping listeners is a side effect the operator expects to happen when they
 * press the button, not when they later close a form.
 */
/**
 * The start-with-the-computer control.
 *
 * The switch reflects the operating system, not the settings file: if the entry is removed by
 * hand the control follows, rather than claiming to be on.
 *
 * Three options rather than a checkbox, because "start with the computer" and "start with the
 * computer and take over the screen" are different intentions. Background is the one that needs
 * the tray icon, which the app puts in place by itself.
 */
function AutostartSection() {
  const [mode, setMode] = createSignal<StartupMode | null>(null);
  const [busy, setBusy] = createSignal(false);
  const [problem, setProblem] = createSignal<string | null>(null);

  onMount(() => {
    void api
      .getStartupMode()
      .then((value) => setMode(value))
      .catch(() => setMode(null));
  });

  async function choose(next: StartupMode) {
    const previous = mode();
    setBusy(true);
    setProblem(null);
    setMode(next);
    try {
      setMode(await api.setStartupMode(next));
    } catch (error) {
      setMode(previous);
      setProblem(describeError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="field">
      <label>{t("settings.startup")}</label>
      <div class="row-inline">
        <span class="grow">
          {t("settings.startAtSignIn")}
          <span class="hint">{t("settings.startupBackgroundHint")}</span>
        </span>
        <select
          class="select-compact"
          value={mode() ?? "off"}
          disabled={busy() || mode() === null}
          onChange={(event) => void choose(event.currentTarget.value as StartupMode)}
        >
          <option value="off">{t("settings.startupOff")}</option>
          <option value="background">{t("settings.startupBackground")}</option>
          <option value="foreground">{t("settings.startupForeground")}</option>
        </select>
      </div>
      <Show when={mode() === null}>
        <span class="hint">{t("settings.startupUnreadable")}</span>
      </Show>
      <Show when={problem()}>
        {(message) => <div class="callout callout-danger">{message()}</div>}
      </Show>
      <span class="hint">{t("settings.startupHint")}</span>
    </div>
  );
}

function RemoteAccessSection() {
  const [view, setView] = createSignal<RemoteAccessView | null>(null);
  const [draft, setDraft] = createSignal<RemoteAccessSettings | null>(null);
  const [busy, setBusy] = createSignal(false);
  const [revealed, setRevealed] = createSignal<Record<string, boolean>>({});
  const [error, setError] = createSignal<string | null>(null);

  onMount(() => void load());

  async function load() {
    try {
      const loaded = await api.getRemoteAccess();
      setView(loaded);
      setDraft({
        enabled: loaded.enabled,
        persistAcrossRestarts: loaded.persistAcrossRestarts,
        lockoutAfterFailures: loaded.lockoutAfterFailures,
        servers: loaded.servers.map((server) => ({
          id: server.id,
          label: server.label,
          scope:
            server.scopeKind === "project" && server.projectId
              ? { kind: "project" as const, projectId: server.projectId }
              : { kind: "app" as const },
          bind: server.bind,
          port: server.port,
          tls: server.tls,
          capabilities: { ...server.capabilities },
          token: server.token,
        })),
      });
    } catch (caught) {
      setError(describeError(caught));
    }
  }

  function edit(change: (current: RemoteAccessSettings) => RemoteAccessSettings) {
    const current = draft();
    if (current) setDraft(change(current));
  }

  function patchServer(id: string, change: (server: RemoteServerConfig) => RemoteServerConfig) {
    edit((current) => ({
      ...current,
      servers: current.servers.map((server) => (server.id === id ? change(server) : server)),
    }));
  }

  function addServer() {
    edit((current) => ({
      ...current,
      servers: [
        ...current.servers,
        {
          // The backend only needs an id that is stable; it does not have to be a
          // uuid, and the token is generated server-side when this is saved.
          id: `srv-${Date.now().toString(36)}`,
          label:
            current.servers.length === 0
              ? t("settings.addServerLabel")
              : t("settings.serverN", { count: current.servers.length + 1 }),
          scope: selectedProject() ? { kind: "project", projectId: selectedProject()!.id } : { kind: "app" },
          bind: "127.0.0.1",
          port: 47821 + current.servers.length,
          tls: "off",
          capabilities: {
            control: true,
            grantPermissions: false,
            manageProjects: false,
            changeSecurity: false,
          },
          token: "",
        },
      ],
    }));
  }

  async function apply() {
    const current = draft();
    if (!current) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await api.setRemoteAccess(current);
      setView(saved);
      setDraft({
        ...current,
        servers: saved.servers.map((server) => ({ ...current.servers.find((s) => s.id === server.id)!, token: server.token })),
      });
      toast(
        "ok",
        current.enabled ? t("settings.remoteUpdated") : t("settings.remoteOff"),
        current.enabled
          ? t("settings.remoteListening", {
              running: saved.servers.filter((server) => server.running).length,
              total: saved.servers.length,
            })
          : t("settings.listenersStopped"),
      );
    } catch (caught) {
      // The backend refuses rather than silently downgrading, for example when TLS
      // was requested but is not implemented.
      setError(describeError(caught));
    } finally {
      setBusy(false);
    }
  }

  async function copyToken(token: string) {
    try {
      await navigator.clipboard.writeText(token);
      toast("ok", t("settings.tokenCopied"), t("settings.tokenCopiedBody"));
    } catch {
      toast("error", t("common.couldNotCopy"), t("settings.copyManually"));
    }
  }

  return (
    <div class="field">
      <label>{t("settings.remoteAccess")}</label>
      <span class="hint">{t("settings.remoteAccessHint")}</span>

      <Show when={draft()} fallback={<span class="hint">{t("common.loading")}</span>}>
        {(current) => (
          <>
            <label class="row-inline small" style={{ "margin-top": "0.5rem" }}>
              <input
                type="checkbox"
                checked={current().enabled}
                onChange={(event) =>
                  edit((state) => ({ ...state, enabled: event.currentTarget.checked }))
                }
              />
              {t("settings.remoteEnable")}
            </label>

            <Show when={current().enabled}>
              <label class="row-inline small">
                <input
                  type="checkbox"
                  checked={current().persistAcrossRestarts}
                  onChange={(event) =>
                    edit((state) => ({ ...state, persistAcrossRestarts: event.currentTarget.checked }))
                  }
                />
                {t("settings.remotePersist")}
              </label>
              <span class="hint">{t("settings.remotePersistHint")}</span>

              <label class="row-inline small" style={{ "margin-top": "0.5rem" }}>
                {t("settings.lockoutAfter")}
                <input
                  type="number"
                  min={0}
                  style={{ width: "4rem" }}
                  aria-label={t("settings.lockoutAria")}
                  value={current().lockoutAfterFailures}
                  onInput={(event) =>
                    edit((state) => ({
                      ...state,
                      lockoutAfterFailures: Math.max(0, Number(event.currentTarget.value) || 0),
                    }))
                  }
                />
                {t("settings.failedAttempts")}
              </label>
              <span class="hint">{t("settings.lockoutHint")}</span>

              <div class="callout callout-warn" style={{ "margin-top": "0.7rem" }}>
                {t("settings.plainHttpWarning")}
              </div>

              <For each={current().servers}>
                {(server) => {
                  const status = () => view()?.servers.find((candidate) => candidate.id === server.id);
                  return (
                    <div class="card" style={{ "margin-top": "0.7rem" }}>
                      <div class="row-inline" style={{ "justify-content": "space-between" }}>
                        <input
                          value={server.label}
                          aria-label={t("settings.serverLabel")}
                          onInput={(event) => patchServer(server.id, (s) => ({ ...s, label: event.currentTarget.value }))}
                        />
                        <button
                          class="btn btn-sm btn-ghost"
                          onClick={() =>
                            edit((state) => ({
                              ...state,
                              servers: state.servers.filter((candidate) => candidate.id !== server.id),
                            }))
                          }
                        >
                          {t("common.remove")}
                        </button>
                      </div>

                      <div class="row-inline" style={{ "margin-top": "0.4rem", "flex-wrap": "wrap" }}>
                        <span class="small muted">
                          {status()?.running
                            ? t("settings.listeningOn", { address: status()?.boundAddr ?? "" })
                            : current().enabled
                              ? t("settings.notListening")
                              : t("settings.stopped")}
                        </span>
                        <span class="mono small">{status()?.displayUrl ?? ""}</span>
                        <Show when={!status()?.loopbackOnly}>
                          <span class="small" style={{ color: "var(--danger)" }}>
                            {t("settings.reachableNetwork")}
                          </span>
                        </Show>
                      </div>

                      <div class="row-inline" style={{ "margin-top": "0.5rem", "flex-wrap": "wrap" }}>
                        <label class="small">
                          {t("settings.scope")}
                          <select
                            value={server.scope.kind === "project" ? server.scope.projectId : ""}
                            onChange={(event) => {
                              const value = event.currentTarget.value;
                              patchServer(server.id, (s) => ({
                                ...s,
                                scope: value ? { kind: "project", projectId: value } : { kind: "app" },
                              }));
                            }}
                          >
                            <option value="">{t("settings.everyProject")}</option>
                            <For each={store.projects}>
                              {(project) => (
                                <option value={project.id}>
                                  {t("settings.projectOnly", { name: project.name })}
                                </option>
                              )}
                            </For>
                          </select>
                        </label>
                        <label class="small">
                          {t("settings.bind")}
                          <input
                            value={server.bind}
                            aria-label={t("settings.bindAria")}
                            onInput={(event) => patchServer(server.id, (s) => ({ ...s, bind: event.currentTarget.value }))}
                          />
                        </label>
                        <label class="small">
                          {t("settings.port")}
                          <input
                            type="number"
                            value={server.port}
                            aria-label={t("settings.port")}
                            onInput={(event) =>
                              patchServer(server.id, (s) => ({ ...s, port: Number(event.currentTarget.value) || 0 }))
                            }
                          />
                        </label>
                        <label class="small">
                          {t("settings.tls")}
                          <select
                            value={server.tls}
                            onChange={(event) =>
                              patchServer(server.id, (s) => ({
                                ...s,
                                tls: event.currentTarget.value === "selfSigned" ? "selfSigned" : "off",
                              }))
                            }
                          >
                            <option value="off">{t("settings.tlsOff")}</option>
                            <option value="selfSigned">{t("settings.tlsSelfSigned")}</option>
                          </select>
                        </label>
                      </div>

                      <div class="small" style={{ "margin-top": "0.5rem" }}>
                        <strong>{t("settings.clientMay")}</strong>
                        <label class="row-inline small">
                          <input
                            type="checkbox"
                            checked={server.capabilities.control}
                            onChange={(event) =>
                              patchServer(server.id, (s) => ({
                                ...s,
                                capabilities: { ...s.capabilities, control: event.currentTarget.checked },
                              }))
                            }
                          />
                          {t("settings.capControl")}
                        </label>
                        <label class="row-inline small">
                          <input
                            type="checkbox"
                            checked={server.capabilities.grantPermissions}
                            onChange={(event) =>
                              patchServer(server.id, (s) => ({
                                ...s,
                                capabilities: { ...s.capabilities, grantPermissions: event.currentTarget.checked },
                              }))
                            }
                          />
                          {t("settings.capGrant")}
                        </label>
                        <label class="row-inline small">
                          <input
                            type="checkbox"
                            checked={server.capabilities.manageProjects}
                            onChange={(event) =>
                              patchServer(server.id, (s) => ({
                                ...s,
                                capabilities: { ...s.capabilities, manageProjects: event.currentTarget.checked },
                              }))
                            }
                          />
                          {t("settings.capProjects")}
                        </label>
                        <label class="row-inline small">
                          <input
                            type="checkbox"
                            checked={server.capabilities.changeSecurity}
                            onChange={(event) =>
                              patchServer(server.id, (s) => ({
                                ...s,
                                capabilities: { ...s.capabilities, changeSecurity: event.currentTarget.checked },
                              }))
                            }
                          />
                          {t("settings.capSecurity")}
                        </label>
                        <span class="hint">{t("settings.capHint")}</span>
                      </div>

                      <div class="field" style={{ "margin-top": "0.5rem" }}>
                        <label for={`token-${server.id}`}>{t("settings.accessToken")}</label>
                        <div class="row-inline">
                          <input
                            id={`token-${server.id}`}
                            class="mono"
                            readonly
                            value={revealed()[server.id] ? server.token : status()?.redactedToken ?? "••••"}
                          />
                          <button
                            class="btn btn-sm"
                            onClick={() =>
                              setRevealed((state) => ({ ...state, [server.id]: !state[server.id] }))
                            }
                          >
                            {revealed()[server.id] ? t("common.hide") : t("common.reveal")}
                          </button>
                          <button class="btn btn-sm" onClick={() => void copyToken(server.token)}>
                            {t("common.copy")}
                          </button>
                          <button
                            class="btn btn-sm"
                            title={t("settings.regenerateTitle")}
                            onClick={() =>
                              patchServer(server.id, (s) => ({ ...s, token: generateTokenPlaceholder() }))
                            }
                          >
                            {t("settings.regenerate")}
                          </button>
                        </div>
                        <span class="hint">{t("settings.tokenHint")}</span>
                      </div>
                    </div>
                  );
                }}
              </For>

              <div class="row-inline" style={{ "margin-top": "0.6rem" }}>
                <button class="btn btn-sm" onClick={addServer}>
                  {t("settings.addServer")}
                </button>
                <button class="btn btn-primary btn-sm" disabled={busy()} onClick={() => void apply()}>
                  {busy() ? t("common.applying") : t("settings.applyRemote")}
                </button>
              </div>

              <Show when={error()}>
                {(message) => (
                  <div class="callout callout-danger" style={{ "margin-top": "0.5rem" }}>
                    {message()}
                  </div>
                )}
              </Show>

              <Show when={view() && !view()!.uiDir}>
                <div class="callout callout-warn" style={{ "margin-top": "0.5rem" }}>
                  {t("settings.uiMissing")}
                </div>
              </Show>
            </Show>
          </>
        )}
      </Show>
    </div>
  );
}

/**
 * The backend generates the real token when the settings are saved; this only has
 * to make the field visibly different so the operator can see the change took.
 */
function generateTokenPlaceholder(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function SettingsDialog(props: { settings: AppSettings; onClose: () => void }) {
  const [draft, setDraft] = createSignal<AppSettings>({ ...props.settings });
  const [allowlist, setAllowlist] = createSignal(props.settings.egress_allowlist.join("\n"));
  // The app settings dialog has no save to be busy with; the controls still read this.
  const [busy] = createSignal(false);
  const [updateCheck, setUpdateCheck] = createSignal<UpdateCheck | null>(null);
  const [updateBusy, setUpdateBusy] = createSignal(false);
  const [installing, setInstalling] = createSignal(false);
  const [progress, setProgress] = createSignal<UpdateProgress | null>(null);

  /**
   * Ask what version is out there.
   *
   * Run when the dialog opens rather than only from the button, because the answer is
   * what this section is for. A failed check is shown as itself rather than as "up to
   * date": a laptop on a train is not the same thing as a current install.
   */
  async function toggleCloseToTray(enabled: boolean) {
    const previous = draft().close_to_tray;
    setDraft({ ...draft(), close_to_tray: enabled });
    try {
      await api.setCloseToTray(enabled);
      await refreshSettings();
    } catch (error) {
      setDraft({ ...draft(), close_to_tray: previous });
      toast("error", t("settings.couldNotChangeClosing"), describeError(error));
    }
  }

  /** The last tool-version check this dialog asked for, if any. */
  const [toolBusy, setToolBusy] = createSignal(false);
  const [toolReport, setToolReport] = createSignal<string[] | null>(null);

  async function checkToolsNow() {
    setToolBusy(true);
    try {
      const notes = await api.checkToolUpdatesNow();
      setToolReport(notes);
      toast(
        notes.length ? "info" : "ok",
        notes.length ? t("settings.toolsMoved") : t("settings.toolsCurrent"),
        notes.join(" ") || t("settings.nothingNewer"),
      );
    } catch (error) {
      toast("error", t("settings.couldNotCheckTools"), describeError(error));
    } finally {
      setToolBusy(false);
    }
  }

  async function checkUpdates() {
    setUpdateBusy(true);
    try {
      setUpdateCheck(await api.checkForUpdates());
    } catch (error) {
      setUpdateCheck({
        currentVersion: store.info?.version ?? t("common.unknown"),
        update: null,
        error: describeError(error),
      });
    } finally {
      setUpdateBusy(false);
    }
  }

  /**
   * Download and install, after which Rust restarts the app.
   *
   * This does not come back on success -- the process is replaced -- so the busy state is
   * deliberately not reset in a `finally`: it would only flicker on the way out.
   */
  async function install() {
    if (installing()) return;
    setInstalling(true);
    setProgress(null);
    try {
      await api.installUpdate();
    } catch (error) {
      toast("error", t("settings.couldNotInstallUpdate"), describeError(error));
      setInstalling(false);
      setProgress(null);
    }
  }

  onMount(() => {
    void checkUpdates();
    const unlisten = api.onUpdateProgress(setProgress);
    onCleanup(() => void unlisten.then((off) => off()).catch(() => undefined));
  });

  /** Sandboxes an installer would take down with the app. */
  const runningCount = () => store.projects.filter((project) => project.running).length;

  const downloadLine = () => {
    const current = progress();
    if (!current) return "";
    if (current.phase === "installing") return t("settings.downloadedInstalling");
    const mb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);
    return current.total
      ? t("settings.downloadingOf", { done: mb(current.downloaded), total: mb(current.total) })
      : t("settings.downloading", { done: mb(current.downloaded) });
  };

  /** Which entries were dropped as unparseable, so the hint can say so rather than be silent. */
  const [ignored, setIgnored] = createSignal(0);
  const [saving, setSaving] = createSignal(false);
  const [saved, setSaved] = createSignal(false);

  /**
   * The entries an operator typed, without the ones that cannot be an address or a name.
   *
   * A typo used to reach the backend and come back as a failed save, which is a bad way to learn
   * about a stray character: the rest of the list was fine and none of it was saved. Dropping what
   * cannot be an entry keeps the ones that can, which is what somebody editing a list expects.
   */
  function validHosts(text: string): { hosts: string[]; dropped: number } {
    const lines = text
      .split(/[\n,]/)
      .map((line) => line.trim())
      .filter(Boolean);
    const hosts = lines.filter((line) =>
      /^(\*|\*\.)?[a-z0-9._-]+(:\d{1,5})?$/i.test(line) || /^\[[0-9a-f:]+\](:\d{1,5})?$/i.test(line),
    );
    return { hosts, dropped: lines.length - hosts.length };
  }

  let settled = false;
  let timer: number | undefined;

  /**
   * Save as the operator types.
   *
   * Debounced, because a text area fires on every keystroke and each save rewrites the state file
   * and pushes the settings into any running sandbox. The first run is skipped: opening the dialog
   * is not an edit, and a save on open would rewrite a file nobody changed.
   */
  createEffect(() => {
    const settings = draft();
    const text = allowlist();
    if (!settled) {
      settled = true;
      return;
    }
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void autosave(settings, text), 700);
  });

  /**
   * Write a pending edit now instead of dropping it.
   *
   * This used to be `onCleanup(() => clearTimeout(timer))`, and cancelling a pending debounce is
   * silently throwing away what the operator typed: a user prompt typed into this dialog and then
   * closed inside the debounce window never reached the backend at all, which is exactly what
   * somebody does after typing the last thing they wanted to say. It also runs on the way out of
   * the page, because the window is the app's lifetime and the last edit is the one at risk.
   */
  function flush() {
    if (timer === undefined) return;
    window.clearTimeout(timer);
    timer = undefined;
    // The dialog may be going away, so this says nothing to the screen: only the api calls run.
    void persist(draft(), allowlist()).catch((error) => {
      toast("error", t("settings.couldNotSave"), describeError(error));
    });
  }

  onCleanup(flush);
  onMount(() => {
    // Belt and braces for the shutdown path: nothing here can await a save during teardown, but
    // the write is sent before the page goes, and `Store::save` is atomic on the other side.
    const onHide = () => flush();
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    onCleanup(() => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
    });
  });

  /** The write itself, without the screen's signals: it also runs while the dialog is closing. */
  async function persist(settings: AppSettings, text: string) {
    const { hosts, dropped } = validHosts(text);
    const cleaned = await api.setEgressAllowlist(hosts);
    await api.setSettings({ ...settings, egress_allowlist: cleaned });
    await refreshSettings();
    return dropped;
  }

  async function autosave(settings: AppSettings, text: string) {
    setSaving(true);
    try {
      const dropped = await persist(settings, text);
      setIgnored(dropped);
      setSaved(true);
    } catch (error) {
      toast("error", t("settings.couldNotSave"), describeError(error));
      setSaved(false);
    } finally {
      setSaving(false);
    }
  }

  async function buildImage() {
    try {
      await api.buildRuntimeImage(false);
      toast("info", t("settings.buildingImage"), t("settings.watchActivity"));
    } catch (error) {
      toast("error", t("settings.couldNotStartBuild"), describeError(error));
    }
    props.onClose();
  }

  return (
    <Modal
      title={t("settings.title")}
      onClose={props.onClose}
      wide
      footer={
        <>
          <span class="left">{t("settings.data", { path: store.info?.dataDir ?? "" })}</span>
          <button class="btn btn-ghost" onClick={props.onClose}>
            {t("common.cancel")}
          </button>
          <span class="hint">
            {saving() ? t("common.saving") : saved() ? t("common.saved") : ""}
            {ignored() > 0
              ? ` — ${t(ignored() === 1 ? "settings.entryIgnored" : "settings.entriesIgnored", {
                  count: ignored(),
                })}`
              : ""}
          </span>
        </>
      }
    >
      <div class="stack">
        <LanguageSettingsSection />

        <div class="field">
          <label for="set-image">{t("settings.runtimeImage")}</label>
          <div class="row-inline">
            <input
              id="set-image"
              class="grow"
              type="text"
              value={draft().image}
              onInput={(event) => setDraft({ ...draft(), image: event.currentTarget.value })}
            />
            <button class="btn" onClick={() => void buildImage()}>
              {t("settings.buildNow")}
            </button>
          </div>
          <span class="hint">
            {t("settings.builtFrom")}{" "}
            <Show
              when={store.info?.docker}
              fallback={<span class="badge">{t("common.checking")}</span>}
            >
              {(docker) => (
                <Show
                  when={docker().image_present}
                  fallback={<span class="badge badge-warn">{t("settings.notBuiltYet")}</span>}
                >
                  <span class="badge badge-ok">{t("settings.present")}</span>
                </Show>
              )}
            </Show>
          </span>
        </div>

        <div class="field">
          <label for="set-user-prompt">{t("settings.userPrompt")}</label>
          <textarea
            id="set-user-prompt"
            rows="6"
            placeholder={t("settings.userPromptPlaceholder")}
            /* `?? ""`: the backend omits this field while it is empty, and a text area bound to
               `undefined` renders the word "undefined" -- which the operator would then edit. */
            value={draft().user_prompt ?? ""}
            onInput={(event) => setDraft({ ...draft(), user_prompt: event.currentTarget.value })}
            /* Leaving the field is finishing the edit: the debounce below is a courtesy to the
               state file, not a reason to lose the last sentence somebody typed. */
            onBlur={flush}
          />
          <span class="hint">{t("settings.userPromptHint")}</span>
        </div>

        <div class="field">
          <label>{t("settings.networkNewProjects")}</label>
          <NetworkSlider
            value={draft().default_network.mode}
            disabled={busy()}
            onChange={(mode) =>
              setDraft({
                ...draft(),
                // `allowlisted` carries a list; a project starts with an empty one and inherits
                // the global entries, so the field is not a second place to maintain the
                // allowlist.
                default_network: mode === "allowlisted" ? { mode, allow: [] } : { mode },
              })
            }
          />
          <span class="hint">{t("settings.networkHint")}</span>
          <Show when={draft().default_network.mode === "full"}>
            <div class="callout callout-warn">{t("settings.fullWarning")}</div>
          </Show>
        </div>

        <div class="field">
          <label>{t("settings.defaultCredentials")}</label>
          <div class="row-inline">
            <input
              class="grow"
              type="text"
              placeholder="deepseek-v4-flash"
              value={draft().default_model}
              onInput={(event) => setDraft({ ...draft(), default_model: event.currentTarget.value })}
            />
            <input
              class="grow"
              type="text"
              placeholder="https://api.deepseek.com"
              value={draft().default_base_url}
              onInput={(event) => setDraft({ ...draft(), default_base_url: event.currentTarget.value })}
            />
          </div>
          <span class="hint">
            {t("settings.defaultCredentialsHint", { path: store.info?.hostConfig.path ?? "" })}
          </span>
        </div>

        <div class="field">
          <label for="set-allow">{t("settings.egressAllowlist")}</label>
          <textarea
            id="set-allow"
            value={allowlist()}
            onInput={(event) => setAllowlist(event.currentTarget.value)}
            /* The same rule as the prompt above: closing the dialog is not a reason to lose the
               last line somebody typed into it. */
            onBlur={flush}
          />
          <span class="hint">{t("settings.egressHint")}</span>
        </div>

        <div class="field">
          <label>{t("settings.behaviour")}</label>
          <label class="row-inline small">
            <input
              type="checkbox"
              checked={draft().auto_restart_on_grant}
              onChange={(event) =>
                setDraft({ ...draft(), auto_restart_on_grant: event.currentTarget.checked })
              }
            />
            {t("settings.autoRestart")}
          </label>
        </div>

        <AutostartSection />

        <RemoteAccessSection />

        <div class="field">
          <label>{t("settings.hardening")}</label>
          <label class="row-inline small">
            <input
              type="checkbox"
              checked={draft().security.read_only_rootfs}
              onChange={(event) =>
                setDraft({
                  ...draft(),
                  security: { ...draft().security, read_only_rootfs: event.currentTarget.checked },
                })
              }
            />
            {t("settings.readOnlyRoot")}
          </label>
          <label class="row-inline small">
            <input
              type="checkbox"
              checked={draft().security.no_new_privileges}
              onChange={(event) =>
                setDraft({
                  ...draft(),
                  security: { ...draft().security, no_new_privileges: event.currentTarget.checked },
                })
              }
            />
            {t("settings.noNewPrivileges")}
          </label>
          <label class="row-inline small">
            <input
              type="checkbox"
              checked={draft().security.netfilter_required}
              onChange={(event) =>
                setDraft({
                  ...draft(),
                  security: { ...draft().security, netfilter_required: event.currentTarget.checked },
                })
              }
            />
            {t("settings.netfilterRequired")}
          </label>
          <label class="row-inline small">
            <input
              type="checkbox"
              checked={draft().security.seccomp === "hardened"}
              onChange={(event) =>
                setDraft({
                  ...draft(),
                  security: {
                    ...draft().security,
                    seccomp: event.currentTarget.checked ? "hardened" : "default",
                  },
                })
              }
            />
            {t("settings.hardenedSeccomp")}
          </label>
          <span class="hint">{t("settings.hardeningHint")}</span>
        </div>

        <div class="field">
          <label>{t("settings.closing")}</label>
          <label class="check">
            <input
              type="checkbox"
              checked={draft().close_to_tray}
              onChange={(event) => void toggleCloseToTray(event.currentTarget.checked)}
            />
            {t("settings.closeToTray")}
          </label>
          <span class="hint">{t("settings.closeHint")}</span>
        </div>

        <div class="field">
          <label>{t("settings.updates")}</label>
          <div class="row-inline">
            <span class="grow">
              {t("settings.buildIs", { version: store.info?.version ?? t("common.unknown") })}{" "}
              <Show when={updateCheck()} fallback={<span class="hint">{t("common.checking")}</span>}>
                {(result) => (
                  <Show
                    when={result().update}
                    fallback={
                      <Show
                        when={result().error}
                        fallback={<span class="badge badge-ok">{t("settings.upToDate")}</span>}
                      >
                        {(reason) => <span class="badge badge-warn">{reason()}</span>}
                      </Show>
                    }
                  >
                    {(available) => (
                      <span class="badge badge-warn">{t("settings.available", { version: available().version })}</span>
                    )}
                  </Show>
                )}
              </Show>
            </span>
            <button class="btn" disabled={updateBusy() || installing()} onClick={() => void checkUpdates()}>
              {updateBusy() ? t("common.checking") : t("settings.checkUpdates")}
            </button>
          </div>

          <div class="row-inline">
            <label class="check grow">
              <input
                type="checkbox"
                checked={draft().check_tool_updates}
                onChange={(event) =>
                  setDraft({ ...draft(), check_tool_updates: event.currentTarget.checked })
                }
              />
              {t("settings.checkToolUpdates")}
            </label>
            <button class="btn" disabled={toolBusy()} onClick={() => void checkToolsNow()}>
              {toolBusy() ? t("common.checking") : t("settings.checkNow")}
            </button>
          </div>
          <Show when={toolReport()}>
            {(notes) => (
              <span class="hint">
                {notes().length === 0 ? t("settings.allToolsCurrent") : notes().join(" ")}
              </span>
            )}
          </Show>

          <Show when={updateCheck()?.update}>
            {(available) => (
              <>
                <Show when={available().notes}>
                  <span class="hint" style={{ display: "block", "white-space": "pre-wrap" }}>
                    {available().notes}
                  </span>
                </Show>
                {/* An install replaces this binary and restarts the app, which takes the
                    sandbox down with it. Said before the click, not after. */}
                <Show when={runningCount() > 0}>
                  <div class="callout callout-warn" style={{ "margin-top": "0.5rem" }}>
                    {t("settings.installWarning", {
                      target:
                        runningCount() === 1
                          ? t("settings.theRunningSandbox")
                          : t("settings.allRunningSandboxes", { count: runningCount() }),
                    })}
                  </div>
                </Show>
                <div class="row-inline" style={{ "margin-top": "0.5rem" }}>
                  <button class="btn btn-primary" disabled={installing()} onClick={() => void install()}>
                    {installing()
                      ? t("common.installing")
                      : t("settings.installAndRestart", { version: available().version })}
                  </button>
                  <Show when={downloadLine()}>
                    <span class="hint">{downloadLine()}</span>
                  </Show>
                </div>
              </>
            )}
          </Show>

          <span class="hint">{t("settings.toolCheckHint")}</span>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------------- */
/* Toasts                                                                     */
/* ------------------------------------------------------------------------- */

/**
 * Copy a box's text, in full.
 *
 * The clipboard is the point: the operator's next move after reading an error is to paste it
 * somewhere, and the box used to be gone the instant it was clicked -- which is the first
 * thing anyone does when they mean to select the text.
 */
async function copyToast(entry: { title: string; body?: string }) {
  const text = entry.body ? `${entry.title}\n\n${entry.body}` : entry.title;
  try {
    await navigator.clipboard.writeText(text);
    toast("ok", t("common.copied"), t("common.messageOnClipboard"));
  } catch {
    // No clipboard permission is not a reason to lose the message: it is still selectable,
    // and it is in the log.
    toast("warn", t("common.couldNotCopy"), t("common.selectTextInstead"));
  }
}

export function Toasts() {
  return (
    <div
      style={{
        position: "fixed",
        right: "1rem",
        bottom: "1rem",
        display: "flex",
        "flex-direction": "column",
        gap: "0.5rem",
        "z-index": 80,
        "max-width": "26rem",
      }}
    >
      <For each={store.toasts}>
        {(entry) => (
          <div
            class={`callout ${
              entry.kind === "error"
                ? "callout-danger"
                : entry.kind === "warn"
                  ? "callout-warn"
                  : "callout-info"
            }`}
            style={{
              "box-shadow": "0 10px 30px #00000090",
              background: "var(--bg-raised)",
              // An error is not dismissed by a click: a click is how you start selecting the
              // text, and losing the message that way is the complaint this answers. The
              // others still go away when clicked, which is what makes them unobtrusive.
              cursor: entry.kind === "error" ? "text" : "pointer",
            }}
            onClick={
              entry.kind === "error" ? undefined : () => dismissToast(entry.id)
            }
          >
            <div
              class="row-inline"
              style={{
                "justify-content": "space-between",
                "align-items": "flex-start",
                gap: "0.5rem",
              }}
            >
              <strong>{entry.title}</strong>
              <span class="row-inline" style={{ gap: "0.25rem", "flex-shrink": "0" }}>
                <button
                  class="btn btn-ghost btn-sm"
                  title={t("common.copyMessage")}
                  onClick={(event) => {
                    event.stopPropagation();
                    void copyToast(entry);
                  }}
                >
                  {t("common.copy")}
                </button>
                <Show when={entry.kind === "error"}>
                  <button
                    class="btn btn-ghost btn-sm"
                    title={t("common.dismiss")}
                    onClick={(event) => {
                      event.stopPropagation();
                      dismissToast(entry.id);
                    }}
                  >
                    {t("common.close")}
                  </button>
                </Show>
              </span>
            </div>
            <Show when={entry.body}>
              <div
                class="small"
                style={{
                  "margin-top": "0.25rem",
                  // Shown whole, and selectable: an error truncated to fit a corner is an
                  // error that cannot be pasted into a bug report.
                  "white-space": "pre-wrap",
                  "user-select": "text",
                  "max-height": "12rem",
                  overflow: "auto",
                }}
              >
                {entry.kind === "error" ? entry.body : shortPath(entry.body ?? "", 220)}
              </div>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}

import { NetworkSlider } from "./NetworkSlider";
import { SegmentedSlider } from "./SegmentedSlider";
