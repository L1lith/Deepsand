export const DOCS_LOCALES = [
  { code: "en", label: "English", lang: "en-US" },
  { code: "zh", label: "简体中文", lang: "zh-CN" },
  { code: "hi", label: "हिन्दी", lang: "hi-IN" },
  { code: "es", label: "Español", lang: "es-ES" },
  { code: "ar", label: "العربية", lang: "ar" },
  { code: "fr", label: "Français", lang: "fr-FR" },
  { code: "ru", label: "Русский", lang: "ru-RU" },
  { code: "ja", label: "日本語", lang: "ja-JP" },
  { code: "ko", label: "한국어", lang: "ko-KR" },
  { code: "vi", label: "Tiếng Việt", lang: "vi-VN" },
  { code: "pt", label: "Português", lang: "pt-PT" },
  { code: "id", label: "Bahasa Indonesia", lang: "id-ID" },
  { code: "bn", label: "বাংলা", lang: "bn-BD" },
  { code: "sw", label: "Kiswahili", lang: "sw-KE" },
  { code: "ha", label: "Hausa", lang: "ha-NG" },
  { code: "yo", label: "Yorùbá", lang: "yo-NG" },
  { code: "am", label: "አማርኛ", lang: "am-ET" },
] as const;

export type LocaleCode = (typeof DOCS_LOCALES)[number]["code"];

export function baseFor(code: LocaleCode): string {
  return code === "en" ? "/" : `/${code}/`;
}
