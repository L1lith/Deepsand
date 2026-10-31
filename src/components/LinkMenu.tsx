/**
 * Right-clicking a link offers its address.
 *
 * The menu the window shows belongs to WebView2 and knows nothing about what this app means by
 * a link: a "project page" control opens the operator's browser through a Tauri command, and
 * nothing in that menu can produce the URL behind it. This intercepts a right-click on an
 * `a[href]` -- anywhere, including links added later -- and offers to copy the address the
 * click actually landed on rather than a guess from the text beside it.
 *
 * A right-click anywhere else is left alone. The default menu is where paste, select-all and
 * spell-check live, and taking it away from every text field to gain one item over a link would
 * be a trade nobody asked for.
 */
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { t } from "../i18n";
import { toast } from "../store";

/** Roughly the box's size, so the clamp keeps it on screen without measuring first. */
const MENU_WIDTH = 320;
const MENU_HEIGHT = 76;

interface OpenLink {
  /** Absolute: a relative href is copied as the address it really is. */
  href: string;
  x: number;
  y: number;
}

export function LinkContextMenu() {
  const [open, setOpen] = createSignal<OpenLink | null>(null);
  const close = () => setOpen(null);

  /**
   * Copy the address.
   *
   * No confirmation on success: a browser does not announce "copy link address" either, and
   * the menu closing is the acknowledgement. A failure is the one case that needs saying,
   * because otherwise the operator pastes the last thing that was on the clipboard.
   */
  async function copyLink(href: string) {
    close();
    try {
      await navigator.clipboard.writeText(href);
    } catch {
      toast("warn", t("common.couldNotCopy"), t("common.selectTextInstead"));
    }
  }

  onMount(() => {
    const onContextMenu = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      // Nothing to copy, and `javascript:` is not an address.
      if (!href || href.startsWith("javascript:")) return;
      // Ours, and only over the link. Capture plus stopPropagation: the project row opens its
      // own menu from a bubble listener, and two boxes must not appear on one right-click.
      event.preventDefault();
      event.stopPropagation();
      setOpen({
        href: link.href || href,
        x: Math.max(0, Math.min(event.clientX, window.innerWidth - MENU_WIDTH)),
        y: Math.max(0, Math.min(event.clientY, window.innerHeight - MENU_HEIGHT)),
      });
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    // A menu pinned to a point floats away from its link when the content under it moves.
    const onMove = () => close();

    window.addEventListener("contextmenu", onContextMenu, true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    onCleanup(() => {
      window.removeEventListener("contextmenu", onContextMenu, true);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    });
  });

  return (
    <Show when={open()}>
      {(entry) => (
        <>
          <div class="context-backdrop" onClick={close} onContextMenu={() => close()} />
          <div
            class="context-menu"
            role="menu"
            aria-label={t("context.copyLink")}
            style={{ left: `${entry().x}px`, top: `${entry().y}px` }}
          >
            {/* The address, shown before it is copied: the point of the menu is which link
                this is, and a tooltip would only say it on hover. */}
            <div class="context-url" title={entry().href}>
              {entry().href}
            </div>
            <button
              class="context-item"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation();
                void copyLink(entry().href);
              }}
            >
              {t("context.copyLink")}
            </button>
          </div>
        </>
      )}
    </Show>
  );
}
