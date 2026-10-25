/**
 * The Tools tab and the thinking-intensity slider.
 *
 * Both save on change rather than behind a Save button: they are switches, and a
 * switch that needs confirming is not a switch. Each says what it will do before it
 * does it, because both change what the sandbox can do.
 */

import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import * as api from "../lib/api";
import type { EffortView, ModelChoice, ModelView, ToolCatalogView, ToolView } from "../lib/types";
import { describeError, selectedProject, store, toast } from "../store";
import { t, tOptional } from "../i18n";
import { Modal } from "./Dialogs";

/** A catalogue entry's prose lives in the backend; the bundle may override it. */
function toolLabel(tool: ToolView): string {
  return tOptional(`tools.tool.${tool.id}.label`) ?? tool.label;
}

function toolDescription(tool: ToolView): string {
  return tOptional(`tools.tool.${tool.id}.description`) ?? tool.description;
}

function toolCostNote(tool: ToolView): string | null {
  if (!tool.costNote) return null;
  return tOptional(`tools.tool.${tool.id}.cost`) ?? tool.costNote;
}

/** Provider labels the backend writes as prose, rather than as an identifier. */
function providerLabel(provider: string): string {
  switch (provider) {
    case "apt (third-party repo)":
      return t("tools.provider.aptRepo");
    case "built in":
      return t("tools.provider.builtIn");
    case "source build":
      return t("tools.provider.sourceBuild");
    default:
      return provider;
  }
}

/** The catalogue's category labels are data; these are the translated names. */
function categoryLabel(category: string): string {
  switch (category) {
    case "Utilities":
      return t("tools.category.utilities");
    case "Languages":
      return t("tools.category.languages");
    case "Package managers":
      return t("tools.category.packageManagers");
    case "Capabilities":
      return t("tools.category.capabilities");
    case "Reverse Engineering":
      return t("tools.category.reverseEngineering");
    default:
      return category;
  }
}

/* ------------------------------------------------------------------------- */
/* Model                                                                     */
/* ------------------------------------------------------------------------- */

/**
 * The model the sandbox runs, chosen from the ones the configured API offers.
 *
 * It sits beside Run because it decides what the agent *is*, not what it can reach: the list
 * comes from the project's own API, and the request for it is made by the app rather than from
 * here, because it is signed with a key that must not reach the window.
 *
 * "Defer to Config" is the default and means exactly that -- the project keeps no model of its
 * own, and whatever configuration resolves to is what runs, which is what the label names so it
 * can be read without opening anything. "Custom" is there because an API's list is never the
 * whole story: a private build, a proxy alias, or a name that has not been published yet can
 * still be typed in, and is used as it is.
 */
export function ModelSelect() {
  const [view, setView] = createSignal<ModelView | null>(null);
  const [busy, setBusy] = createSignal(false);
  /** The name being typed into the Custom dialog, or null when it is closed. */
  const [custom, setCustom] = createSignal<string | null>(null);

  const project = () => selectedProject();
  const CUSTOM = "__custom__";

  onMount(() => {
    const current = project();
    if (current) void load(current.id);
  });

  // Reload when the project changes, so one project's model is never shown under another
  // project's name, and when the host's settings file changes, because what "Defer to Config"
  // resolves to is read from it.
  createMemo(() => {
    const current = project();
    const revision = store.configRevision;
    void revision;
    if (current) void load(current.id);
  });

  async function load(projectId: string) {
    try {
      // What the project is set to first: that answer is local, so the control works at once.
      setView(await api.getModel(projectId));
    } catch {
      // A project whose setting cannot be read shows no dropdown rather than a wrong one.
      setView(null);
      return;
    }
    try {
      // Then the list, which is a request to the project's API and may be slow or refused.
      const listed = await api.listModels(projectId);
      if (project()?.id === projectId) setView(listed);
    } catch {
      /* The saved value is already on screen; the list is a convenience, not the setting. */
    }
  }

  /** The listed models, plus whatever this project runs if the list does not mention it. */
  function options(): ModelChoice[] {
    const current = view();
    if (!current) return [];
    const chosen = current.value;
    if (chosen && !current.options.some((model) => model.id === chosen)) {
      return [{ id: chosen, name: chosen }, ...current.options];
    }
    return current.options;
  }

  function labelFor(id: string): string {
    return options().find((model) => model.id === id)?.name ?? id;
  }

  function sayWhatHappened(saved: ModelView, what: string) {
    toast(
      "ok",
      saved.deferring ? t("tools.modelFollowing") : t("tools.modelSet", { name: what }),
      saved.deferring
        ? t("tools.modelFromConfig", { name: saved.configured })
        : saved.appliedLive
          ? t("tools.modelAppliedLive")
          : t("tools.modelSaved"),
    );
  }

  async function choose(value: string) {
    const current = project();
    if (!current || busy()) return;

    if (value === CUSTOM) {
      setCustom(view()?.value ?? view()?.configured ?? "");
      return;
    }

    setBusy(true);
    try {
      const saved = await api.setModel(current.id, value === "" ? null : value);
      setView(saved);
      // The name if the list has one, so the toast reads like the dropdown.
      sayWhatHappened(saved, labelFor(value));
    } catch (error) {
      toast("error", t("tools.couldNotChangeModel"), describeError(error));
      // Put the control back to what is saved, rather than leaving it showing a choice that
      // was refused.
      setView(await api.getModel(current.id).catch(() => view()));
    } finally {
      setBusy(false);
    }
  }

  async function saveCustom(name: string) {
    const current = project();
    if (!current || busy()) return;
    setBusy(true);
    try {
      const saved = await api.setModel(current.id, name);
      setView(saved);
      setCustom(null);
      sayWhatHappened(saved, name);
    } catch (error) {
      toast("error", t("tools.couldNotSetModel"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Show when={view()}>
      {(current) => (
        <>
          <select
            class="model-select"
            disabled={busy()}
            title={
              current().problem ??
              (current().configured
                ? t("tools.modelTitleConfigured", { model: current().configured })
                : t("tools.modelTitleDefer"))
            }
            value={current().value ?? ""}
            onChange={(event) => void choose(event.currentTarget.value)}
          >
            <option value="">
              {current().configured
                ? `${t("tools.deferToConfig")} (${current().configured})`
                : t("tools.deferToConfig")}
            </option>
            <For each={options()}>
              {(model) => (
                <option value={model.id} title={model.id}>
                  {model.name}
                </option>
              )}
            </For>
            <option value={CUSTOM}>{t("tools.custom")}</option>
          </select>
          {/* The list is a network call; when it fails the dropdown is still usable, and this
              is what says why it is short. */}
          <Show when={current().problem}>
            <span class="model-warning" title={current().problem ?? ""}>
              !
            </span>
          </Show>
          <Show when={custom() !== null}>
            <CustomModelDialog
              initial={custom() ?? ""}
              busy={busy()}
              onClose={() => setCustom(null)}
              onSave={(name) => void saveCustom(name)}
            />
          </Show>
        </>
      )}
    </Show>
  );
}

/** Type a model name that the API's list does not have. */
function CustomModelDialog(props: {
  initial: string;
  busy: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = createSignal(props.initial);
  const ready = () => name().trim().length > 0 && !props.busy;

  function save() {
    if (ready()) props.onSave(name().trim());
  }

  return (
    <Modal
      title={t("tools.customModel")}
      subtitle={t("tools.customModelSubtitle")}
      onClose={props.onClose}
      footer={
        <>
          <button class="btn btn-danger left" disabled={props.busy} onClick={props.onClose}>
            {t("common.cancel")}
          </button>
          <button class="btn btn-primary" disabled={!ready()} onClick={save}>
            {t("tools.useModel")}
          </button>
        </>
      }
    >
      <label class="field">
        <span>{t("tools.modelName")}</span>
        <input
          autofocus
          value={name()}
          placeholder={t("tools.modelNamePlaceholder")}
          onInput={(event) => setName(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
          }}
        />
      </label>
      <p class="small">{t("tools.customModelDetail")}</p>
    </Modal>
  );
}

/* ------------------------------------------------------------------------- */
/* Thinking intensity                                                        */
/* ------------------------------------------------------------------------- */

/**
 * A five-stop slider beside Run.
 *
 * A real `input[type=range]` rather than a row of buttons, so it drags, responds to
 * arrow keys, and announces itself correctly. The filled part of the track is painted
 * with a gradient driven by `--fill`, which is the one thing a native range cannot be
 * told to do by itself.
 *
 * Committing happens on `change` (pointer release, or a key press) rather than on
 * `input`, so dragging across five stops sends one request instead of five. The thumb
 * still tracks the pointer, because `input` moves the local value.
 */
export function EffortSwitch() {
  const [view, setView] = createSignal<EffortView | null>(null);
  const [dragged, setDragged] = createSignal<number | null>(null);
  const [busy, setBusy] = createSignal(false);

  const project = () => selectedProject();

  onMount(() => {
    const current = project();
    if (current) void load(current.id);
  });

  // Reload when the project changes, so one project's setting is never shown under another
  // project's name, and when the host's settings file changes: whether this switch is deferring
  // to it is exactly what that file decides.
  createMemo(() => {
    const current = project();
    const revision = store.configRevision;
    void revision;
    if (current) void load(current.id);
  });

  async function load(projectId: string) {
    try {
      setView(await api.getEffort(projectId));
      setDragged(null);
    } catch {
      // A project whose setting cannot be read simply shows no slider.
      setView(null);
    }
  }

  const options = () => view()?.options ?? [];

  /** The stop on show: the dragged one if there is one, otherwise the saved one. */
  const index = createMemo(() => {
    const current = view();
    if (!current) return 0;
    const held = dragged();
    if (held !== null) return held;
    return Math.max(
      0,
      current.options.findIndex((option) => option.value === current.value),
    );
  });

  const active = () => options()[index()];
  const lastIndex = () => Math.max(1, options().length - 1);

  async function commit(at: number) {
    const current = project();
    const option = options()[at];
    if (!current || !option || busy()) {
      setDragged(null);
      return;
    }
    // Already there: nothing to send.
    if (option.value === view()?.value) {
      setDragged(null);
      return;
    }

    const previous = view();
    setBusy(true);
    try {
      const saved = await api.setEffort(current.id, option.value);
      setView(saved);
      setDragged(null);
      toast(
        "ok",
        t("tools.thinking", { label: option.label }),
        saved.deferring
          ? t("tools.followingSettings")
          : saved.appliedLive
            ? t("tools.appliedLive")
            : t("tools.savedNextRun"),
      );
    } catch (error) {
      setView(previous);
      setDragged(null);
      toast("error", t("tools.couldNotChangeThinking"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Show when={view() && options().length > 0}>
      <div class="effort" classList={{ "effort-busy": busy() }}>
        <span class="effort-value" title={active()?.description}>
          {active()?.label ?? "…"}
        </span>
        <div class="effort-track">
          <input
            class="effort-slider"
            type="range"
            min={0}
            max={lastIndex()}
            step={1}
            value={index()}
            disabled={busy()}
            aria-label={t("tools.thinkingIntensity")}
            aria-valuetext={active()?.label}
            title={active()?.description}
            style={{ "--fill": `${(index() / lastIndex()) * 100}%` }}
            onInput={(event) => setDragged(Number(event.currentTarget.value))}
            onChange={(event) => void commit(Number(event.currentTarget.value))}
          />
          {/* Tick marks, so the stops are visible without labels competing for room. */}
          <div class="effort-ticks" aria-hidden="true">
            <For each={options()}>
              {(_, at) => <span class="effort-tick" classList={{ on: at() <= index() }} />}
            </For>
          </div>
        </div>
      </div>
    </Show>
  );
}

/* ------------------------------------------------------------------------- */
/* Tools                                                                     */
/* ------------------------------------------------------------------------- */

/** One row: the description on the left, a switch on the right. */
function ToolRow(props: {
  tool: ToolView;
  busy: boolean;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const locked = () => !props.tool.available;
  const opensNetwork = () => !locked() && props.tool.enabled && props.tool.hosts.length > 0;

  return (
    <div class="tool-row" classList={{ "tool-off": locked() }}>
      <div class="tool-body">
        <div class="tool-head">
          <span class="tool-name">{toolLabel(props.tool)}</span>
          <Show when={props.tool.homepage}>
            {(homepage) => (
              <button
                type="button"
                class="tool-home"
                title={t("tools.openHomepage", { url: homepage() })}
                aria-label={t("tools.openProjectPage", { name: toolLabel(props.tool) })}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void api
                    .openToolHomepage(props.tool.id)
                    .catch((error) =>
                      toast("error", t("tools.couldNotOpenPage"), describeError(error)),
                    );
                }}
              >
                {t("tools.projectPage")}
              </button>
            )}
          </Show>
          <Show when={locked()}>
            <span class="chip chip-warn" title={props.tool.unavailableReason ?? ""}>
              {t("tools.needs", { base: props.tool.requires })}
            </span>
          </Show>
          <Show when={opensNetwork()}>
            <span class="chip chip-accent">{t("tools.opensNetwork")}</span>
          </Show>
        </div>

        <p class="tool-desc">{toolDescription(props.tool)}</p>

        {/* Before the switch, not after it: this is the only warning about a cost the operator
            would otherwise discover on the next build. */}
        <Show when={toolCostNote(props.tool)}>
          {(note) => <p class="tool-note tool-note-warn">{note()}</p>}
        </Show>

        <Show when={locked()}>
          <p class="tool-note tool-note-warn">{props.tool.unavailableReason}</p>
        </Show>

        <Show when={opensNetwork()}>
          <p class="tool-note">
            {t("tools.reachesHosts", { hosts: props.tool.hosts.join(", ") })}
          </p>
        </Show>

        <Show when={!locked()}>
          <p class="tool-meta">
            {t("tools.installedWith", { provider: providerLabel(props.tool.provider) })}
          </p>
        </Show>
      </div>

      <button
        class="switch"
        role="switch"
        aria-checked={props.tool.enabled}
        aria-label={`${toolLabel(props.tool)}${locked() ? t("tools.notAvailableHere") : ""}`}
        title={
          locked()
            ? (props.tool.unavailableReason ?? t("tools.needsImage", { base: props.tool.requires }))
            : props.tool.enabled
              ? t("tools.switchOff")
              : t("tools.switchOn")
        }
        disabled={locked() || props.busy}
        onClick={() => props.onToggle(props.tool.id, !props.tool.enabled)}
      >
        <span class="switch-knob" />
      </button>
    </div>
  );
}

/** The distinct hosts a set of tools would open, sorted. */
function hostsOf(tools: ToolView[]): string[] {
  return [...new Set(tools.flatMap((tool) => tool.hosts))].sort();
}

export function ToolsPanel() {
  const [catalog, setCatalog] = createSignal<ToolCatalogView | null>(null);
  const [busy, setBusy] = createSignal(false);

  const project = () => selectedProject();

  onMount(() => {
    const current = project();
    if (current) void load(current.id);
  });

  // Reload when the selection changes, so switching projects never shows the last
  // project's tools.
  createMemo(() => {
    const current = project();
    if (current) void load(current.id);
  });

  async function load(projectId: string) {
    try {
      setCatalog(await api.listTools(projectId));
    } catch (error) {
      toast("error", t("tools.couldNotRead"), describeError(error));
    }
  }

  const tools = () => catalog()?.tools ?? [];

  /**
   * Replace the whole selection in one request.
   *
   * The bulk buttons use this rather than looping over `toggle`: one round trip instead
   * of one per tool, and no moment where the selection is half-applied and the image
   * tag is wrong for neither state.
   */
  async function applySelection(
    ids: string[],
    message: { title: string; detail: string },
  ): Promise<void> {
    const current = project();
    if (!current || !catalog() || busy()) return;
    setBusy(true);
    try {
      const saved = await api.setProjectTools(current.id, ids);
      setCatalog(saved);
      toast("ok", message.title, message.detail);
    } catch (error) {
      toast("error", t("tools.couldNotChange"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  /** Enable every tool a category can hold, leaving the rest of the selection alone. */
  function enableCategory(group: { tools: ToolView[]; category: string }) {
    const actionable = group.tools.filter((tool) => tool.available && !tool.enabled);
    if (actionable.length === 0) return;
    const ids = [
      ...tools().filter((tool) => tool.enabled).map((tool) => tool.id),
      ...actionable.map((tool) => tool.id),
    ];
    const hosts = hostsOf(actionable);
    void applySelection(ids, {
      title: t("tools.allCategoryOn", {
        category: categoryLabel(group.category),
        count: actionable.length,
      }),
      detail:
        (hosts.length > 0 ? t("tools.networkOpened", { hosts: hosts.join(", ") }) : "") +
        t("tools.rebuildToInstall"),
    });
  }

  function disableCategory(group: { tools: ToolView[]; category: string }) {
    const actionable = group.tools.filter((tool) => tool.enabled);
    if (actionable.length === 0) return;
    const off = new Set(actionable.map((tool) => tool.id));
    void applySelection(
      tools()
        .filter((tool) => tool.enabled && !off.has(tool.id))
        .map((tool) => tool.id),
      {
        title: t("tools.allCategoryOff", {
          category: categoryLabel(group.category),
          count: actionable.length,
        }),
        detail:
          (hostsOf(actionable).length > 0
            ? t("tools.networkClosed", { hosts: hostsOf(actionable).join(", ") })
            : "") + t("tools.rebuildToRemove"),
      },
    );
  }

  function enableEverything() {
    const actionable = tools().filter((tool) => tool.available && !tool.enabled);
    if (actionable.length === 0) return;
    const hosts = hostsOf(actionable);
    void applySelection(
      tools()
        .filter((tool) => tool.available)
        .map((tool) => tool.id),
      {
        title: t("tools.everyToolOn", { count: tools().filter((tool) => tool.available).length }),
        // The widest change this panel can make, so it says what it opened rather than
        // just reporting a count.
        detail: t("tools.everyToolOnDetail", {
          network: hosts.length > 0 ? t("tools.networkOpened", { hosts: hosts.join(", ") }) : "",
        }),
      },
    );
  }

  function disableEverything() {
    const on = tools().filter((tool) => tool.enabled);
    if (on.length === 0) return;
    const hosts = hostsOf(on);
    void applySelection([], {
      title: t("tools.everyToolOff"),
      detail: t("tools.everyToolOffDetail", {
        network: hosts.length > 0 ? t("tools.networkClosed", { hosts: hosts.join(", ") }) : "",
      }),
    });
  }

  async function toggle(id: string, enabled: boolean) {
    const current = project();
    const view = catalog();
    if (!current || !view || busy()) return;
    const ids = view.tools
      .filter((tool) => (tool.id === id ? enabled : tool.enabled))
      .map((tool) => tool.id);
    setBusy(true);
    try {
      const saved = await api.setProjectTools(current.id, ids);
      setCatalog(saved);
      const tool = saved.tools.find((candidate) => candidate.id === id);
      const hosts = tool?.hosts ?? [];
      toast(
        "ok",
        t(enabled ? "tools.toolOn" : "tools.toolOff", {
          name: tool ? toolLabel(tool) : id,
        }),
        enabled && hosts.length > 0
          ? t("tools.toolOnHosts", { hosts: hosts.join(", ") })
          : enabled
            ? t("tools.rebuildToInstallOne")
            : hosts.length > 0
              ? t("tools.closedAgain", { hosts: hosts.join(", ") })
              : t("tools.rebuildToApply"),
      );
    } catch (error) {
      toast("error", t("tools.couldNotChange"), describeError(error));
    } finally {
      setBusy(false);
    }
  }

  /**
   * The catalogue grouped by category, preserving the catalogue's own order.
   *
   * `enabled` and `available` are counted here rather than in the markup so the bulk
   * buttons can be disabled when they would do nothing -- an "Enable all" that is
   * already true is a button that only produces a confusing toast.
   */
  const groups = createMemo(() => {
    const view = catalog();
    if (!view) return [];
    const order: string[] = [];
    const byCategory = new Map<string, ToolView[]>();
    for (const tool of view.tools) {
      if (!byCategory.has(tool.category)) {
        byCategory.set(tool.category, []);
        order.push(tool.category);
      }
      byCategory.get(tool.category)!.push(tool);
    }
    return order.map((category) => {
      const list = byCategory.get(category)!;
      return {
        category,
        tools: list,
        enabled: list.filter((tool) => tool.enabled).length,
        // Only these can be switched on, so they are what "all" means for a category.
        available: list.filter((tool) => tool.available).length,
        canEnable: list.some((tool) => tool.available && !tool.enabled),
        canDisable: list.some((tool) => tool.enabled),
      };
    });
  });

  const unavailable = createMemo(() => tools().filter((tool) => !tool.available).length);
  const enableableTools = createMemo(() => tools().filter((tool) => tool.available).length);
  const canEnableAnything = createMemo(() => tools().some((tool) => tool.available && !tool.enabled));
  const canDisableAnything = createMemo(() => tools().some((tool) => tool.enabled));

  return (
    <div class="panel">
      <Show when={catalog()} fallback={<div class="empty">{t("tools.loading")}</div>}>
        {(view) => (
          <>
            <div class="card">
              <div class="card-head">
                <h3>{t("tools.title")}</h3>
                <span class="chip chip-quiet mono" title={t("tools.imageTagTitle")}>
                  {view().image}
                </span>
              </div>
              <p class="muted small">{t("tools.detail")}</p>
              <Show when={view().effectiveHosts.length > 0}>
                <p class="muted small">
                  {t("tools.openNow", { hosts: view().effectiveHosts.join(", ") })}
                </p>
              </Show>
              <Show when={unavailable() > 0}>
                <p class="muted small">
                  {t(unavailable() === 1 ? "tools.unavailableOne" : "tools.unavailableMany", {
                    count: unavailable(),
                  })}
                </p>
              </Show>

              <div class="bulk-row">
                <span class="bulk-label">{t("tools.wholeCatalogue")}</span>
                <button
                  class="btn btn-ghost btn-sm"
                  disabled={busy() || !canEnableAnything()}
                  title={t("tools.enableAllTitle")}
                  onClick={enableEverything}
                >
                  {t("tools.enableAll")}
                </button>
                <button
                  class="btn btn-ghost btn-sm"
                  disabled={busy() || !canDisableAnything()}
                  title={t("tools.disableAllTitle")}
                  onClick={disableEverything}
                >
                  {t("tools.disableAll")}
                </button>
                <span class="bulk-count">
                  {t("tools.available", { count: enableableTools() })}
                  <Show when={unavailable() > 0}>
                    {" · "}
                    {t("tools.notForImage", { count: unavailable() })}
                  </Show>
                </span>
              </div>
            </div>

            <For each={groups()}>
              {(group) => (
                <div class="card">
                  <div class="card-head">
                    <h3>{categoryLabel(group.category)}</h3>
                    <span class="chip chip-quiet">
                      {t("tools.onOf", { on: group.enabled, total: group.tools.length })}
                    </span>
                  </div>

                  <div class="bulk-row">
                    <button
                      class="btn btn-ghost btn-sm"
                      disabled={busy() || !group.canEnable}
                      title={t("tools.enableAllGroupTitle", { category: categoryLabel(group.category) })}
                      onClick={() => enableCategory(group)}
                    >
                      {t("tools.enableAllGroup")}
                    </button>
                    <button
                      class="btn btn-ghost btn-sm"
                      disabled={busy() || !group.canDisable}
                      title={t("tools.disableAllGroupTitle", { category: categoryLabel(group.category) })}
                      onClick={() => disableCategory(group)}
                    >
                      {t("tools.disableAllGroup")}
                    </button>
                    <Show when={group.available < group.tools.length}>
                      <span class="bulk-count">
                        {t("tools.notForImage", { count: group.tools.length - group.available })}
                      </span>
                    </Show>
                  </div>

                  <div class="tool-list">
                    <For each={group.tools}>
                      {(tool) => <ToolRow tool={tool} busy={busy()} onToggle={toggle} />}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </>
        )}
      </Show>
    </div>
  );
}
