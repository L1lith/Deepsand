import { defineConfig, type DefaultTheme } from "vitepress";
import messages from "./i18n.generated.json";
import { baseFor, DOCS_LOCALES as locales, type LocaleCode } from "./locales";

type Messages = (typeof messages)["en"];

function themeFor(code: LocaleCode): DefaultTheme.Config {
  const text: Messages = messages[code];
  const base = baseFor(code);
  const apiKeySidebar = [{ text: text.navApiKey, link: `${base}guide/deepseek-api` }];
  const terminalSidebar = [
    { text: text.sidebarTerminal, link: `${base}guide/deepcode-terminal` },
  ];
  return {
    nav: [
      { text: text.navDownload, link: `${base}download` },
      { text: text.navGuide, link: `${base}guide/getting-started` },
      {
        text: text.navMore,
        items: [
          { text: text.navWhatIs, link: `${base}guide/what-is-deepsand` },
          { text: text.navApiKey, link: `${base}guide/deepseek-api` },
          { text: text.navSecurity, link: `${base}guide/security` },
          { text: text.navDevelopers, link: `${base}guide/for-developers` },
          { text: text.navFaq, link: `${base}guide/faq` },
        ],
      },
    ],
    sidebar: [
      { text: text.whatIsDeepsand, link: `${base}guide/what-is-deepsand` },
      { text: text.gettingStarted, link: `${base}guide/getting-started` },
      ...terminalSidebar,
      ...apiKeySidebar,
      { text: text.security, link: `${base}guide/security` },
      { text: text.forDevelopers, link: `${base}guide/for-developers` },
      { text: text.faq, link: `${base}guide/faq` },
    ],
    outline: { level: [2, 3] },
    outlineTitle: text.outlineTitle,
    lastUpdated: { text: text.lastUpdated },
    docFooter: { prev: text.prev, next: text.next },
    darkModeSwitchLabel: text.darkModeSwitchLabel,
    sidebarMenuLabel: text.sidebarMenuLabel,
    returnToTopLabel: text.returnToTopLabel,
    langMenuLabel: text.langMenuLabel,
    notFound: {
      title: text.notFoundTitle,
      quote: text.notFoundQuote,
      linkLabel: text.notFoundLinkLabel,
      linkText: base,
    },
    footer: { message: text.footerMessage },
  };
}

const localeConfig = Object.fromEntries(
  locales.map(({ code, label, lang }) => [
    code === "en" ? "root" : code,
    {
      label,
      lang,
      dir: code === "ar" ? "rtl" : "ltr",
      link: baseFor(code),
      title: "Deepsand",
      description: messages[code].siteDescription,
      themeConfig: themeFor(code),
    },
  ]),
);

function localeForHtml(id: string) {
  const normalised = id.replace(/\\/g, "/");
  return (
    locales.find(({ code }) => code !== "en" && normalised.includes(`/${code}/`)) ??
    locales[0]
  );
}

const siteUrl = (
  process.env.DOCS_SITE_URL ?? "https://deepsand.webslc.com"
).replace(/\/+$/, "");

export default defineConfig({
  title: "Deepsand",
  description: messages.en.siteDescription,
  cleanUrls: true,
  srcExclude: ["README.md"],
  lastUpdated: true,
  sitemap: { hostname: siteUrl },
  locales: localeConfig,
  head: [
    ["meta", { name: "theme-color", content: "#0a0c11" }],
    ["link", { rel: "icon", href: "/favicon.svg" }],
  ],
  transformHtml(code, id) {
    const { lang } = localeForHtml(id);
    const dir = lang === "ar" ? "rtl" : "ltr";
    return code.replace(/<html[^>]*>/, `<html lang="${lang}" dir="${dir}">`);
  },
  themeConfig: {
    ...themeFor("en"),
    socialLinks: [{ icon: "github", link: "https://github.com/L1lith/Deepsand" }],
    locales: localeConfig,
  },
});
