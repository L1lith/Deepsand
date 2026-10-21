/**
 * Static docs Worker with IP-region language routing.
 *
 * VitePress emits extensionless links such as `/guide/getting-started` but
 * writes the file as `guide/getting-started.html`. Workers static assets do not
 * map one to the other by themselves, so this rewrites an extensionless path to
 * its `.html` file before asking the assets binding for it.
 *
 * A first visit to an English page may redirect to the visitor's regional
 * language. A language chosen in the top-right menu is stored in a cookie; that
 * cookie always wins, including for later visits and for another device only if
 * the cookie is present there.
 */

const COOKIE_NAME = "deepsand_docs_lang";
const LOCALE_CODES = new Set([
  "zh",
  "hi",
  "es",
  "ar",
  "fr",
  "ru",
  "ja",
  "ko",
  "vi",
  "pt",
  "id",
  "bn",
  "sw",
  "ha",
  "yo",
  "am",
]);

// Countries where one of the supported languages is the dominant language.
// Ambiguous countries (Canada, Belgium, Switzerland, Nigeria) are deliberately
// absent: guessing there is worse than leaving the English page in place.
const COUNTRY_LOCALES = {
  CN: "zh",
  HK: "zh",
  MO: "zh",
  TW: "zh",
  IN: "hi",
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
  VE: "es",
  EC: "es",
  GT: "es",
  CU: "es",
  BO: "es",
  DO: "es",
  HN: "es",
  PY: "es",
  SV: "es",
  NI: "es",
  CR: "es",
  PA: "es",
  UY: "es",
  PR: "es",
  SA: "ar",
  AE: "ar",
  EG: "ar",
  DZ: "ar",
  MA: "ar",
  TN: "ar",
  LY: "ar",
  SD: "ar",
  JO: "ar",
  LB: "ar",
  SY: "ar",
  IQ: "ar",
  KW: "ar",
  QA: "ar",
  BH: "ar",
  OM: "ar",
  YE: "ar",
  PS: "ar",
  MR: "ar",
  DJ: "ar",
  SO: "ar",
  KM: "ar",
  FR: "fr",
  MC: "fr",
  SN: "fr",
  CI: "fr",
  ML: "fr",
  BF: "fr",
  TG: "fr",
  BJ: "fr",
  GA: "fr",
  CG: "fr",
  CD: "fr",
  MG: "fr",
  CM: "fr",
  HT: "fr",
  VU: "fr",
  RU: "ru",
  BY: "ru",
  KZ: "ru",
  KG: "ru",
  JP: "ja",
  KR: "ko",
  VN: "vi",
  PT: "pt",
  BR: "pt",
  AO: "pt",
  MZ: "pt",
  CV: "pt",
  GW: "pt",
  ST: "pt",
  ID: "id",
  BD: "bn",
  TZ: "sw",
  KE: "sw",
  UG: "sw",
  ET: "am",
};

export function countryLocale(country) {
  return COUNTRY_LOCALES[String(country ?? "").toUpperCase()] ?? null;
}

export function pathLocale(pathname) {
  const segments = pathname.split("/");
  const first = segments[1];
  if (LOCALE_CODES.has(first)) {
    const rest = `/${segments.slice(2).join("/")}`;
    return { locale: first, rest: rest === "/" ? "/" : rest };
  }
  return { locale: "en", rest: pathname };
}

function pathForLocale(locale, rest) {
  if (locale === "en") return rest === "/" ? "/" : rest;
  return rest === "/" ? `/${locale}/` : `/${locale}${rest}`;
}

function cookieLocale(header) {
  const match = header?.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  let value;
  try {
    value = decodeURIComponent(match[1]);
  } catch {
    return null;
  }
  return value === "en" || LOCALE_CODES.has(value) ? value : null;
}

function assetPath(pathname) {
  if (pathname.endsWith("/")) return `${pathname}index.html`;
  const last = pathname.split("/").pop() ?? "";
  return last.includes(".") ? pathname : `${pathname}.html`;
}

function wantsLanguageRedirect(request, pathname) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (pathname.startsWith("/cdn-cgi/") || pathname.startsWith("/assets/")) return false;
  return !/\.[^/]+$/.test(pathname);
}

async function assetExists(env, url, pathname) {
  const response = await env.ASSETS.fetch(
    new Request(new URL(assetPath(pathname), url), { method: "HEAD" }),
  );
  return response.status === 200;
}

async function languageRedirect(request, env, url, pathname) {
  if (!wantsLanguageRedirect(request, pathname)) return null;

  const current = pathLocale(pathname);
  const preferred =
    cookieLocale(request.headers.get("Cookie")) ??
    (current.locale === "en" ? countryLocale(request.cf?.country) : null);

  if (!preferred || preferred === current.locale) return null;

  const target = pathForLocale(preferred, current.rest);
  if (!(await assetExists(env, url, target))) return null;

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${target}${url.search}`,
      "Cache-Control": "no-store",
      Vary: "Cookie, CF-IPCountry",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);

    const redirect = await languageRedirect(request, env, url, pathname);
    if (redirect) return redirect;

    const assetUrl = new URL(assetPath(pathname), url);
    const response = await env.ASSETS.fetch(new Request(assetUrl, request));
    if (response.status !== 404) return response;

    const notFound = await env.ASSETS.fetch(
      new Request(new URL("/404.html", url), request),
    );
    return new Response(notFound.body, {
      status: 404,
      headers: notFound.headers,
    });
  },
};
