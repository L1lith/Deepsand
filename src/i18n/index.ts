/**
 * The interface language.
 *
 * Two things make this deliberately small. The English bundle is the source
 * language and the fallback, so a key missing from another bundle degrades to
 * readable text rather than to a key name. And detection is based on the same
 * locale list the operating system gives the webview, so a Chinese Windows
 * install opens in Chinese without asking the backend anything.
 *
 * Adding a language means adding a JSON file, one entry here, and nothing else:
 * no component knows which languages exist.
 */

import { createSignal } from "solid-js";
import en from "./en.json";
import zh from "./zh.json";
import hi from "./hi.json";
import es from "./es.json";
import ar from "./ar.json";
import fr from "./fr.json";
import ru from "./ru.json";
import ja from "./ja.json";
import ko from "./ko.json";
import vi from "./vi.json";
import pt from "./pt.json";
import id from "./id.json";
import bn from "./bn.json";
import sw from "./sw.json";
import ha from "./ha.json";
import yo from "./yo.json";
import am from "./am.json";

export type Locale =
  | "en"
  | "zh"
  | "hi"
  | "es"
  | "ar"
  | "fr"
  | "ru"
  | "ja"
  | "ko"
  | "vi"
  | "pt"
  | "id"
  | "bn"
  | "sw"
  | "ha"
  | "yo"
  | "am";

export interface Language {
  /** The language tag stored in localStorage and used for date/number formatting. */
  code: Locale;
  /** The language's name written in its own script. */
  nativeName: string;
  /** A stable English label for logs and accessibility fallbacks. */
  englishName: string;
  /** The writing direction of the bundle. Arabic is the one RTL language here. */
  dir: "ltr" | "rtl";
}

/**
 * The languages this build actually carries a bundle for.
 *
 * The selector renders this list. It is intentionally not a list of every
 * language a browser might request: offering a language whose bundle does not
 * exist would put English text behind a label in another script.
 */
export const LANGUAGES: readonly Language[] = [
  { code: "en", nativeName: "English", englishName: "English", dir: "ltr" },
  { code: "zh", nativeName: "简体中文", englishName: "Chinese (Simplified)", dir: "ltr" },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", dir: "ltr" },
  { code: "es", nativeName: "Español", englishName: "Spanish", dir: "ltr" },
  { code: "ar", nativeName: "العربية", englishName: "Arabic (Modern Standard)", dir: "rtl" },
  { code: "fr", nativeName: "Français", englishName: "French", dir: "ltr" },
  { code: "ru", nativeName: "Русский", englishName: "Russian", dir: "ltr" },
  { code: "ja", nativeName: "日本語", englishName: "Japanese", dir: "ltr" },
  { code: "ko", nativeName: "한국어", englishName: "Korean", dir: "ltr" },
  { code: "vi", nativeName: "Tiếng Việt", englishName: "Vietnamese", dir: "ltr" },
  { code: "pt", nativeName: "Português", englishName: "Portuguese", dir: "ltr" },
  { code: "id", nativeName: "Bahasa Indonesia", englishName: "Indonesian", dir: "ltr" },
  { code: "bn", nativeName: "বাংলা", englishName: "Bengali", dir: "ltr" },
  { code: "sw", nativeName: "Kiswahili", englishName: "Swahili", dir: "ltr" },
  { code: "ha", nativeName: "Hausa", englishName: "Hausa", dir: "ltr" },
  { code: "yo", nativeName: "Yorùbá", englishName: "Yoruba", dir: "ltr" },
  { code: "am", nativeName: "አማርኛ", englishName: "Amharic", dir: "ltr" },
];

const BUNDLES: Record<Locale, Record<string, string>> = {
  en,
  zh,
  hi,
  es,
  ar,
  fr,
  ru,
  ja,
  ko,
  vi,
  pt,
  id,
  bn,
  sw,
  ha,
  yo,
  am,
};
const FALLBACK: Locale = "en";
const STORAGE_KEY = "deepsand.language";

export function isLocale(value: unknown): value is Locale {
  return LANGUAGES.some((language) => language.code === value);
}

export function languageFor(code: Locale): Language {
  return LANGUAGES.find((language) => language.code === code) ?? LANGUAGES[0];
}

/**
 * The first supported language in a browser's preference list.
 *
 * `navigator.languages` is ordered by preference and includes the regional
 * variants (`zh-CN`, `zh-TW`), while `navigator.language` is the single
 * fallback. We compare the primary subtag so every regional variant -- `zh-TW`,
 * `es-MX`, `ar-EG`, `fr-CA`, `hi-IN` -- reaches the bundle for its language,
 * and an unsupported locale reaches English rather than a half-built bundle.
 */
export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return FALLBACK;
  const candidates = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const primary = candidate.toLowerCase().split(/[-_]/)[0];
    if (isLocale(primary)) return primary;
  }
  return FALLBACK;
}

function storedLocale(): Locale | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

const initialStored = typeof window === "undefined" ? null : storedLocale();
const initialLocale = initialStored ?? detectLocale();
const [locale, setLocaleSignal] = createSignal<Locale>(initialLocale);
const [chosen, setChosenSignal] = createSignal(initialStored !== null);

/**
 * Put the language on the document itself.
 *
 * `lang` is what a screen reader chooses its voice from; `dir` is what makes
 * Arabic lay out right-to-left rather than rendering RTL text in an LTR shell.
 * Both are part of the interface contract, not decoration.
 */
function applyDocumentLanguage(next: Locale): void {
  if (typeof document === "undefined") return;
  const language = languageFor(next);
  document.documentElement.lang = language.code;
  document.documentElement.dir = language.dir;
}

// Set it before the first paint.
applyDocumentLanguage(initialLocale);

export { locale };

/** Whether the operator has ever confirmed a language in the selector. */
export { chosen as hasChosenLanguage };

function rememberLanguage(next: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage can be denied. The choice still applies for this run.
  }
  applyDocumentLanguage(next);
}

/**
 * Change the language without counting it as the operator's choice.
 *
 * Used by the first-run selector while the operator is still trying the
 * options. If the app closes before Continue, the selector should be shown
 * again rather than silently recording a preview as a decision.
 */
export function previewLanguage(next: Locale): void {
  setLocaleSignal(next);
  applyDocumentLanguage(next);
}

/** Change and remember the language, as the selector's Continue button does. */
export function chooseLanguage(next: Locale): void {
  setLocaleSignal(next);
  setChosenSignal(true);
  rememberLanguage(next);
}

/** The Settings selector's action: changing it there is already a decision. */
export function setLanguage(next: Locale): void {
  chooseLanguage(next);
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (whole, name: string) => {
    const value = params[name];
    return value === undefined ? whole : String(value);
  });
}

/**
 * Translate one key.
 *
 * Reading `locale()` inside this function is what makes every call site
 * reactive in Solid: a string rendered in JSX re-runs when the signal changes,
 * and a memo that calls `t` recomputes. There is no global DOM rewrite.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const current = locale();
  const template = BUNDLES[current]?.[key] ?? BUNDLES[FALLBACK][key] ?? key;
  return interpolate(template, params);
}

/** The bundle text for a key, or undefined when the language has no override. */
export function tOptional(key: string): string | undefined {
  return BUNDLES[locale()][key];
}

/** Locale tag for `toLocaleString` and friends. */
export function dateLocale(): string {
  switch (languageFor(locale()).code) {
    case "zh":
      return "zh-CN";
    case "hi":
      return "hi-IN";
    case "es":
      return "es-ES";
    case "ar":
      return "ar";
    case "fr":
      return "fr-FR";
    case "ru":
      return "ru-RU";
    case "ja":
      return "ja-JP";
    case "ko":
      return "ko-KR";
    case "vi":
      return "vi-VN";
    case "pt":
      return "pt-PT";
    case "id":
      return "id-ID";
    case "bn":
      return "bn-BD";
    case "sw":
      return "sw-KE";
    case "ha":
      return "ha-NG";
    case "yo":
      return "yo-NG";
    case "am":
      return "am-ET";
    case "en":
      return "en";
  }
}
