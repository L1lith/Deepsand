/**
 * The language selector.
 *
 * The list is the only place the names of the languages appear, and they are
 * written in their own scripts. Everything around the list uses the language
 * currently selected, including the first-run screen: a Chinese Windows install
 * opens with Chinese chrome around a list that still says "English" and
 * "简体中文".
 *
 * The first-run screen has a Continue step rather than closing on the first
 * click. Clicking an option previews it; Continue is what records the choice, so
 * closing the app while comparing the two does not silently persist a preview.
 */

import { createSignal, For, Show } from "solid-js";
import {
  chooseLanguage,
  detectLocale,
  languageFor,
  LANGUAGES,
  locale,
  previewLanguage,
  t,
  type Language,
  type Locale,
} from "../i18n";

function LanguageList(props: {
  selected: Locale;
  systemLocale: Locale;
  onSelect: (code: Locale) => void;
}) {
  return (
    <div class="language-list" role="listbox" aria-label={t("language.chooseTitle")}>
      <For each={LANGUAGES}>
        {(language: Language) => (
          <button
            type="button"
            class="language-option"
            classList={{ "language-option-selected": props.selected === language.code }}
            role="option"
            aria-selected={props.selected === language.code}
            onClick={() => props.onSelect(language.code)}
          >
            <span class="language-native" lang={language.code} dir={language.dir}>
              {language.nativeName}
            </span>
            <span class="language-option-meta">
              {props.systemLocale === language.code ? t("language.detected") : ""}
            </span>
            <span class="language-check" aria-hidden="true">
              {props.selected === language.code ? "✓" : ""}
            </span>
          </button>
        )}
      </For>
    </div>
  );
}

/** The modal shown before the operator has ever confirmed a language. */
export function LanguageOnboarding() {
  const [previewed, setPreviewed] = createSignal<Locale>(locale());
  const systemLocale = detectLocale();

  function preview(code: Locale) {
    previewLanguage(code);
    setPreviewed(code);
  }

  return (
    <div class="scrim language-gate">
      <div
        class="modal language-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="language-title"
      >
        <div class="modal-head">
          <h2 id="language-title">{t("language.title")}</h2>
          <p>{t("language.subtitle")}</p>
        </div>
        <div class="modal-body">
          <LanguageList selected={previewed()} systemLocale={systemLocale} onSelect={preview} />
          <p class="hint" style={{ "margin-top": "0.6rem" }}>
            {t("language.nativeHint")}
          </p>
        </div>
        <div class="modal-foot">
          <button
            class="btn btn-primary"
            onClick={() => chooseLanguage(previewed())}
          >
            {t("common.continue")}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Language in Settings: a button that opens the same selector.
 *
 * The list is not kept expanded here. Settings is already a long dialog, and the
 * language is a single choice rather than something to scroll past every time
 * the operator opens it. The overlay reuses the onboarding list, so a language
 * added later appears in both places without another UI change.
 */
export function LanguageSettingsSection() {
  const [open, setOpen] = createSignal(false);

  return (
    <div class="field">
      <label>{t("language.sectionLabel")}</label>
      <span class="hint">{t("language.sectionHint")}</span>
      <div class="row-inline" style={{ "margin-top": "0.5rem" }}>
        <span class="grow">
          <span class="language-native" lang={locale()}>
            {languageFor(locale()).nativeName}
          </span>
        </span>
        <button class="btn" onClick={() => setOpen(true)}>
          {t("language.change")}
        </button>
      </div>

      <Show when={open()}>
        <div
          class="scrim language-gate"
          onClick={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              // Close the selector, not the Settings dialog underneath it.
              event.stopPropagation();
              setOpen(false);
            }
          }}
        >
          <div
            class="modal language-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="language-settings-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div class="modal-head">
              <h2 id="language-settings-title">{t("language.chooseTitle")}</h2>
              <p>{t("language.subtitle")}</p>
            </div>
            <div class="modal-body">
              <LanguageList
                selected={locale()}
                systemLocale={detectLocale()}
                onSelect={(code) => chooseLanguage(code)}
              />
              <p class="hint" style={{ "margin-top": "0.6rem" }}>
                {t("language.nativeHint")}
              </p>
            </div>
            <div class="modal-foot">
              <button class="btn btn-primary" onClick={() => setOpen(false)}>
                {t("common.done")}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
