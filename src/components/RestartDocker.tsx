/**
 * The two-step control that recovers a wedged Docker runtime.
 *
 * One implementation for the two places that show the same failure — the project pane's
 * callout and the sidebar's status strip — because a restart ends every container on the
 * machine and both have to say so the same way before the operator confirms.
 *
 * Nothing here restarts Docker on its own: the first click says what the second will do, and
 * `onConfirm` is only called by the second. `busy` is the caller's, so a surface that already
 * has in-flight state (the project pane's Run button) does not grow a second signal that can
 * disagree with it.
 */

import { createEffect, createSignal, Show } from "solid-js";
import { t } from "../i18n";

export function RestartDockerControl(props: {
  /** Runs when the operator confirms — never before. */
  onConfirm: () => void;
  /** While true, the control says a restart is running and refuses another. */
  busy: boolean;
  /** The project pane retries the launch, so its confirm button says so. */
  confirmLabel?: string;
  /** Shorter copy, for the narrow sidebar. */
  compact?: boolean;
}) {
  const [confirming, setConfirming] = createSignal(false);

  // A restart begun any other way, or one that has finished, must take the confirmation down:
  // a stale "are you sure" left standing after the thing it asked about is done is how a
  // second, unintended restart gets clicked.
  createEffect(() => {
    if (props.busy) setConfirming(false);
  });

  return (
    <Show
      when={confirming()}
      fallback={
        <button
          class="btn btn-sm"
          disabled={props.busy}
          title={t("docker.restartTitle")}
          onClick={() => setConfirming(true)}
        >
          {t("docker.restartButton")}
        </button>
      }
    >
      <p class="faint">
        {props.compact ? t("docker.restartCompact") : t("docker.restartDetail")}
      </p>
      <div class="row-inline">
        <button
          class="btn btn-sm btn-danger"
          disabled={props.busy}
          onClick={() => props.onConfirm()}
        >
          {props.busy ? t("docker.restarting") : (props.confirmLabel ?? t("docker.restartConfirm"))}
        </button>
        <button class="btn btn-sm" disabled={props.busy} onClick={() => setConfirming(false)}>
          {t("common.cancel")}
        </button>
      </div>
    </Show>
  );
}
