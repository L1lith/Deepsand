/**
 * The Secrets tab.
 *
 * Values go one way only. Nothing the backend returns contains a secret, so the table
 * can only ever show that one exists -- which is also why there is no reveal toggle:
 * there would be nothing for it to reveal.
 *
 * The reason to have this at all is that a secret in the sandbox's environment is
 * visible to everything running in the sandbox. That is the point -- the agent needs
 * it to build -- but it means a broad network allowlist is a way for a secret to
 * leave. The panel says so where the operator can see it while deciding.
 */

import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import * as api from "../lib/api";
import type { SecretListView, SecretView } from "../lib/types";
import { describeError, selectedProject, toast } from "../store";
import { t } from "../i18n";

/**
 * One icon from a path, with its meaning carried in text.
 *
 * A picture on its own is not a label: the aria-label is what a screen reader says and the
 * title is what a pointer reveals, and both come from the same word the button used to
 * show. The row of five words was the thing being replaced, not the information.
 */
function Icon(props: { path: string; label: string }) {
  return (
    <svg class="icon" viewBox="0 0 16 16" role="img" aria-label={props.label}>
      <path
        d={props.path}
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}

const ICONS = {
  copy: "M6 2.5h7.5V10 M2.5 6h7.5v7.5H2.5z",
  power: "M8 2.5v5 M4.2 4.6a4.8 4.8 0 1 0 7.6 0",
  pencil: "M3 13l.8-3L10 3.8l2.2 2.2L6 12.2z M9.4 4.4l2.2 2.2",
  swap: "M3.2 8a4.8 4.8 0 0 1 8-3.4 M12.8 8a4.8 4.8 0 0 1-8 3.4 M11.2 2.6v2.2H9 M4.8 13.4v-2.2H7",
  trash: "M3.5 5h9 M6 5V3.4h4V5 M4.8 5l.6 8.2h5.2L11.2 5",
};

/** A button whose whole content is an icon. The label is required, not optional. */
function IconButton(props: {
  icon: keyof typeof ICONS;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      class="btn btn-ghost btn-icon small"
      type="button"
      title={props.label}
      aria-label={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      <Icon path={ICONS[props.icon]} label={props.label} />
    </button>
  );
}

export function SecretsPanel() {
  const [view, setView] = createSignal<SecretListView | null>(null);
  const [busy, setBusy] = createSignal(false);
  const [name, setName] = createSignal("");
  const [value, setValue] = createSignal("");
  const [editing, setEditing] = createSignal<string | null>(null);
  const [editValue, setEditValue] = createSignal("");
  const [renaming, setRenaming] = createSignal<string | null>(null);
  const [newName, setNewName] = createSignal("");

  const project = () => selectedProject();

  onMount(() => {
    const current = project();
    if (current) void load(current.id);
  });

  // Reload when the selection changes, so one project's secrets are never shown
  // under another project's name.
  createMemo(() => {
    const current = project();
    if (current) void load(current.id);
  });

  async function load(projectId: string) {
    try {
      setView(await api.listSecrets(projectId));
    } catch (error) {
      toast("error", t("secrets.couldNotRead"), describeError(error));
    }
  }

  // The name rules in one place: the add form, the rename form and the backend all have to
  // agree, and a second copy is how they stop agreeing.
  function checkName(candidate: string): string | null {
    const trimmed = candidate.trim();
    if (!trimmed) return null;
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed)) {
      return t("secrets.nameLetters");
    }
    const upper = trimmed.toUpperCase();
    if (upper.startsWith("DEEPSAND_")) {
      return t("secrets.nameReservedPrefix");
    }
    if ((view()?.reserved ?? []).includes(upper)) {
      return t("secrets.nameReserved", { name: upper });
    }
    return null;
  }

  const nameProblem = createMemo(() => checkName(name()));

  async function add() {
    const current = project();
    if (!current || busy() || nameProblem()) return;
    setBusy(true);
    try {
      const saved = await api.setSecret(current.id, name().trim(), value());
      setView(saved);
      toast(
        "ok",
        t("secrets.saved", { name: name().trim() }),
        saved.restartNeeded ? t("secrets.savedRestart") : t("secrets.savedNextStart"),
      );
      setName("");
      setValue("");
    } catch (error) {
      toast("error", t("secrets.couldNotSave"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  async function replace(target: string) {
    const current = project();
    if (!current || busy() || !editValue()) return;
    setBusy(true);
    try {
      const saved = await api.setSecret(current.id, target, editValue());
      setView(saved);
      setEditing(null);
      setEditValue("");
      toast("ok", t("secrets.replaced", { name: target }), t("secrets.replacedBody"));
    } catch (error) {
      toast("error", t("secrets.couldNotReplace"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  async function copy(target: string) {
    const current = project();
    if (!current || busy()) return;
    setBusy(true);
    try {
      await api.copySecret(current.id, target);
      toast("ok", t("secrets.copied", { name: target }), t("secrets.copiedBody"));
    } catch (error) {
      toast("error", t("secrets.couldNotCopy"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  async function toggleEnabled(secret: SecretView) {
    const current = project();
    if (!current || busy()) return;
    setBusy(true);
    try {
      const saved = await api.setSecretEnabled(current.id, secret.name, !secret.enabled);
      setView(saved);
      toast(
        "ok",
        secret.enabled
          ? t("secrets.disabledToast", { name: secret.name })
          : t("secrets.enabledToast", { name: secret.name }),
        secret.enabled ? t("secrets.disabledBody") : t("secrets.enabledBody"),
      );
    } catch (error) {
      toast("error", t("secrets.couldNotChange"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  async function rename(target: string) {
    const current = project();
    const next = newName().trim();
    if (!current || busy() || !next || checkName(next)) return;
    setBusy(true);
    try {
      const saved = await api.renameSecret(current.id, target, next);
      setView(saved);
      setRenaming(null);
      setNewName("");
      toast("ok", t("secrets.renamed", { from: target, to: next }), t("secrets.renamedBody"));
    } catch (error) {
      toast("error", t("secrets.couldNotRename"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove(target: string) {
    const current = project();
    if (!current || busy()) return;
    setBusy(true);
    try {
      const saved = await api.deleteSecret(current.id, target);
      setView(saved);
      toast("ok", t("secrets.removed", { name: target }), t("secrets.removedBody"));
    } catch (error) {
      toast("error", t("secrets.couldNotRemove"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="panel">
      <Show when={view()} fallback={<div class="empty">{t("secrets.loading")}</div>}>
        {(current) => (
          <>
            <div class="card">
              <h3>{t("secrets.title")}</h3>
              <p class="muted small">{t("secrets.detail")}</p>
              <Show when={current().restartNeeded}>
                <div class="callout callout-warn">{t("secrets.restartNeeded")}</div>
              </Show>
              <Show when={!current().available}>
                <div class="callout callout-danger">{current().unavailableReason}</div>
              </Show>
            </div>

            <Show when={current().available}>
              <div class="card">
                <h3>{t("secrets.stored")}</h3>
                <Show
                  when={current().secrets.length > 0}
                  fallback={<div class="empty">{t("secrets.none")}</div>}
                >
                  <table class="secret-table">
                    <thead>
                      <tr>
                        <th>{t("secrets.name")}</th>
                        <th>{t("secrets.value")}</th>
                        <th class="num">{t("secrets.length")}</th>
                        <th class="actions" />
                      </tr>
                    </thead>
                    <tbody>
                      <For each={current().secrets}>
                        {(secret) => (
                          <>
                            <tr classList={{ "secret-off": !secret.enabled }}>
                              <td class="mono">
                                {secret.name}
                                <Show when={!secret.enabled}>
                                  <span class="badge secret-badge">{t("secrets.disabled")}</span>
                                </Show>
                              </td>
                              <td class="mono faint">{secret.masked}</td>
                              <td class="num faint">{secret.length}</td>
                              <td class="actions">
                                <IconButton
                                  icon="copy"
                                  label={t("secrets.copyLabel")}
                                  disabled={busy()}
                                  onClick={() => void copy(secret.name)}
                                />
                                <IconButton
                                  icon="power"
                                  label={
                                    secret.enabled
                                      ? t("secrets.disableLabel")
                                      : t("secrets.enableLabel")
                                  }
                                  disabled={busy()}
                                  onClick={() => void toggleEnabled(secret)}
                                />
                                <IconButton
                                  icon="pencil"
                                  label={t("secrets.renameLabel")}
                                  disabled={busy()}
                                  onClick={() => {
                                    setRenaming(secret.name);
                                    setNewName(secret.name);
                                    setEditing(null);
                                  }}
                                />
                                <IconButton
                                  icon="swap"
                                  label={t("secrets.replaceLabel")}
                                  disabled={busy()}
                                  onClick={() => {
                                    setEditing(secret.name);
                                    setEditValue("");
                                    setRenaming(null);
                                  }}
                                />
                                <IconButton
                                  icon="trash"
                                  label={t("secrets.removeLabel")}
                                  disabled={busy()}
                                  onClick={() => void remove(secret.name)}
                                />
                              </td>
                            </tr>

                            {/*
                              The editors live in a row of their own, spanning the table,
                              rather than inside the actions cell. In that cell they were
                              squeezed into a column sized for buttons and the save button
                              hung off the edge of the panel; a full-width row under the
                              secret being edited cannot do that.
                            */}
                            <Show when={editing() === secret.name}>
                              <tr class="secret-edit-row">
                                <td colspan={4}>
                                  <div class="secret-edit">
                                    <span class="secret-edit-label hint">{t("secrets.newValueFor", { name: secret.name })}</span>
                                    <input
                                      type="password"
                                      autocomplete="off"
                                      placeholder={t("secrets.newValuePlaceholder")}
                                      aria-label={t("secrets.newValueFor", { name: secret.name })}
                                      value={editValue()}
                                      onInput={(event) => setEditValue(event.currentTarget.value)}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter") void replace(secret.name);
                                        if (event.key === "Escape") setEditing(null);
                                      }}
                                    />
                                    <button
                                      class="btn btn-primary small"
                                      disabled={busy() || !editValue()}
                                      onClick={() => void replace(secret.name)}
                                    >
                                      {t("common.save")}
                                    </button>
                                    <button
                                      class="btn btn-ghost small"
                                      onClick={() => {
                                        setEditing(null);
                                        setEditValue("");
                                      }}
                                    >
                                      {t("common.cancel")}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            </Show>

                            <Show when={renaming() === secret.name}>
                              <tr class="secret-edit-row">
                                <td colspan={4}>
                                  <div class="secret-edit">
                                    <span class="secret-edit-label hint">{t("secrets.renameTo", { name: secret.name })}</span>
                                    <input
                                      type="text"
                                      autocomplete="off"
                                      placeholder="NEW_NAME"
                                      aria-label={t("secrets.newNameFor", { name: secret.name })}
                                      value={newName()}
                                      onInput={(event) => setNewName(event.currentTarget.value)}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter") void rename(secret.name);
                                        if (event.key === "Escape") setRenaming(null);
                                      }}
                                    />
                                    <button
                                      class="btn btn-primary small"
                                      disabled={busy() || !newName().trim() || checkName(newName()) !== null}
                                      onClick={() => void rename(secret.name)}
                                    >
                                      {t("common.save")}
                                    </button>
                                    <button
                                      class="btn btn-ghost small"
                                      onClick={() => {
                                        setRenaming(null);
                                        setNewName("");
                                      }}
                                    >
                                      {t("common.cancel")}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              <Show when={checkName(newName())}>
                                {(problem) => <tr><td colspan={4} class="hint tool-unavailable">{problem()}</td></tr>}
                              </Show>
                            </Show>
                          </>
                        )}
                      </For>
                    </tbody>
                  </table>
                </Show>
              </div>

              <div class="card">
                <h3>{t("secrets.addSecret")}</h3>
                <div class="row-inline">
                  <input
                    class="grow"
                    type="text"
                    placeholder={t("secrets.namePlaceholder")}
                    aria-label={t("secrets.nameAria")}
                    autocomplete="off"
                    value={name()}
                    onInput={(event) => setName(event.currentTarget.value)}
                  />
                  <input
                    class="grow"
                    type="password"
                    placeholder={t("secrets.valuePlaceholder")}
                    aria-label={t("secrets.valueAria")}
                    autocomplete="off"
                    value={value()}
                    onInput={(event) => setValue(event.currentTarget.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void add();
                    }}
                  />
                  <button
                    class="btn btn-primary"
                    disabled={busy() || !name().trim() || !value() || nameProblem() !== null}
                    onClick={() => void add()}
                  >
                    {t("common.add")}
                  </button>
                </div>
                <Show when={nameProblem()}>
                  {(problem) => <div class="hint tool-unavailable">{problem()}</div>}
                </Show>
                <span class="hint">{t("secrets.addHint")}</span>
              </div>
            </Show>
          </>
        )}
      </Show>
    </div>
  );
}
