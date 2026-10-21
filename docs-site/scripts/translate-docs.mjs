/**
 * Regenerate the translated documentation pages.
 *
 * English Markdown in `docs-site/` is the source. This script writes one tree
 * per locale under `docs-site/<code>/` and the small label map the VitePress
 * configuration reads. Code fences, inline code, link targets and product names
 * are protected before anything is translated, so a translation cannot break a
 * command, a relative link or a brand name.
 *
 * Usage: npm run docs:translate
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dump as yamlDump, load as yamlLoad } from "js-yaml";

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, "..");

const languages = [
  { code: "zh", target: "zh-CN" },
  { code: "hi", target: "hi" },
  { code: "es", target: "es" },
  { code: "ar", target: "ar" },
  { code: "fr", target: "fr" },
  { code: "ru", target: "ru" },
  { code: "ja", target: "ja" },
  { code: "ko", target: "ko" },
  { code: "vi", target: "vi" },
  { code: "pt", target: "pt" },
  { code: "id", target: "id" },
  { code: "bn", target: "bn" },
  { code: "sw", target: "sw" },
  { code: "ha", target: "ha" },
  { code: "yo", target: "yo" },
  { code: "am", target: "am" },
];

const allPages = [
  "index.md",
  "download.md",
  "guide/what-is-deepsand.md",
  "guide/deepseek-api.md",
  "guide/deepcode-terminal.md",
  "guide/getting-started.md",
  "guide/security.md",
  "guide/for-developers.md",
  "guide/faq.md",
];
const requestedPages = (process.env.DOCS_TRANSLATE_PAGES ?? "")
  .split(",")
  .map((page) => page.trim())
  .filter(Boolean);
const pages = requestedPages.length
  ? allPages.filter((page) => requestedPages.includes(page))
  : allPages;
if (pages.length === 0) {
  throw new Error("DOCS_TRANSLATE_PAGES named no known page");
}

const labels = {
  siteDescription: "Learn what Deepsand does, how it keeps your files private, and how to get started.",
  navDownload: "Download",
  navWhatIs: "What is Deepsand?",
  navApiKey: "Get an API key",
  navGuide: "Guide",
  navSecurity: "Security",
  navDevelopers: "Under the hood",
  navFaq: "FAQ",
  navMore: "More",
  whatIsDeepsand: "What is Deepsand?",
  gettingStarted: "Getting started",
  sidebarTerminal: "Using the DeepCode terminal",
  security: "How the sandbox works",
  forDevelopers: "Under the hood",
  faq: "Frequently asked questions",
  downloadDetected: "Detected system:",
  downloadYourSystem: "your system",
  downloadNotRight: "Not right? Choose another system below.",
  downloadWindows: "Windows",
  downloadMacos: "macOS",
  downloadLinux: "Linux",
  downloadOsLabel: "Operating system",
  downloadLooking: "Looking up the latest release…",
  downloadCouldNotLoad: "The latest release could not be loaded.",
  downloadOpenReleases: "Open GitHub releases",
  downloadLatest: "Latest release:",
  downloadReleaseNotes: "Release notes",
  downloadNoBuild: "There is no download for this system in the latest release.",
  downloadFootnote: "The latest published release is used. If a build is still in progress, see",
  downloadAllReleases: "all releases",
  downloadWindowsInstaller: "Windows installer",
  downloadWindowsMsi: "Windows MSI package",
  downloadMacAppleSilicon: "macOS · Apple Silicon",
  downloadMacIntel: "macOS · Intel",
  downloadLinuxAppImage: "Linux AppImage",
  downloadLinuxAppImageArm: "Linux AppImage · ARM64",
  downloadDebian: "Debian / Ubuntu package",
  downloadDebianArm: "Debian / Ubuntu package · ARM64",
  downloadRpm: "Fedora / RPM package",
  downloadRpmArm: "Fedora / RPM package · ARM64",
  outlineTitle: "On this page",
  lastUpdated: "Last updated",
  prev: "Previous page",
  next: "Next page",
  darkModeSwitchLabel: "Appearance",
  sidebarMenuLabel: "Menu",
  returnToTopLabel: "Return to top",
  langMenuLabel: "Change language",
  notFoundTitle: "Page not found",
  notFoundQuote: "The page you are looking for does not exist.",
  notFoundLinkLabel: "Go to home",
  footerMessage: "Deepsand documentation.",
};

const PROTECTED = [
  "Docker Desktop",
  "Cloudflare Pages",
  "Apple Silicon",
  "AppImage",
  "Debian",
  "Ubuntu",
  "Fedora",
  "ARM64",
  "Intel",
  "DeepCode CLI",
  "DeepCode",
  "Deepsand",
  "Docker Engine",
  "Dockerfile",
  "VitePress",
  "GitHub",
  "Windows",
  "macOS",
  "Linux",
  "Node.js",
  "Docker",
  "Rust",
  "WSL",
  "MCP",
  "API",
  "CLI",
  "JSON",
  "npm",
  "cargo",
  "MSI",
  "EXE",
  "RPM",
].sort((a, b) => b.length - a.length);

function protect(value) {
  const tokens = [];
  let text = value.replace(/`[^`]*`/g, (whole) => {
    const token = `ZQXC${tokens.length}ZQX`;
    tokens.push([token, whole]);
    return token;
  });
  // Vue components and HTML tags are markup, not prose. Translating
  // `<DownloadPicker />` into another language makes the page fail to render.
  text = text.replace(/<[A-Za-z][^>]*>/g, (whole) => {
    const token = `ZQXT${tokens.length}ZQX`;
    tokens.push([token, whole]);
    return token;
  });
  for (const term of PROTECTED) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`\\b${escaped}\\b`, "g"), () => {
      const token = `ZQXB${tokens.length}ZQX`;
      tokens.push([token, term]);
      return token;
    });
  }
  return { text, tokens };
}

function extractLinks(value) {
  const links = [];
  const text = value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (whole, label, url) => {
    const token = `ZQXL${links.length}ZQX`;
    links.push({ token, label, url });
    return token;
  });
  return { text, links };
}

function extractEmphasis(value) {
  const emphasis = [];
  const text = value.replace(/\*\*([^*]+)\*\*/g, (whole, label) => {
    const token = `ZQE${emphasis.length}ZQX`;
    emphasis.push({ token, label });
    return token;
  });
  return { text, emphasis };
}

function restore(value, tokens) {
  let text = repairTokens(value);
  for (const [token, original] of tokens) {
    text = text.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), original);
  }
  return text;
}

function repairTokens(value) {
  return value.replace(/ZQX\s*(C|U|B|L|E|T)\s*(\d+)\s*ZQX/gi, (_, type, index) => {
    return `ZQX${type.toUpperCase()}${index}ZQX`;
  });
}

function cleanRestored(value) {
  return repairTokens(value).replace(/ZQX[CUBLET]\d+ZQX/g, "").trim();
}

async function requestBatch(values, target, attempt = 0) {
  const params = new URLSearchParams({ client: "dict-chrome-ex", sl: "en", tl: target });
  for (const value of values) params.append("q", value);
  const response = await fetch(`https://clients5.google.com/translate_a/t?${params}`, {
    headers: { "user-agent": "Mozilla/5.0 Deepsand docs translation" },
  });
  if (!response.ok) {
    if (attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
      return requestBatch(values, target, attempt + 1);
    }
    throw new Error(`translation failed for ${target}: HTTP ${response.status}`);
  }
  const payload = await response.json();
  if (!Array.isArray(payload) || payload.length !== values.length) {
    throw new Error(`translation shape changed for ${target}`);
  }
  return payload.map((value) => repairTokens(String(value).trim()));
}

async function translate(values, target) {
  const result = [];
  for (let start = 0; start < values.length; start += 10) {
    result.push(...(await requestBatch(values.slice(start, start + 10), target)));
  }
  return result;
}

const SKIP_FRONTMATTER_KEYS = new Set(["layout", "link", "image", "icon", "theme", "lang", "dir"]);

function splitFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return { fields: {}, body: source };
  return { fields: yamlLoad(match[1]) ?? {}, body: source.slice(match[0].length) };
}

function collectFrontmatterStrings(value, key, holder, sink) {
  if (typeof value === "string") {
    if (holder && key && !SKIP_FRONTMATTER_KEYS.has(key)) sink.push({ holder, key, value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectFrontmatterStrings(item, key, value, sink));
    return;
  }
  if (value && typeof value === "object") {
    for (const [childKey, child] of Object.entries(value)) {
      collectFrontmatterStrings(child, childKey, value, sink);
    }
  }
}

async function translateFrontmatter(fields, target) {
  const entries = [];
  collectFrontmatterStrings(fields, "", null, entries);
  if (entries.length === 0) return fields;
  const protections = entries.map((entry) => protect(entry.value));
  const translated = await translate(
    protections.map((entry) => entry.text),
    target,
  );
  entries.forEach((entry, index) => {
    let restored = cleanRestored(
      restore(translated[index], protections[index].tokens),
    );
    // A title that loses the product name is a broken title, not a translation.
    if (
      entry.key === "title" &&
      entry.value.includes("Deepsand") &&
      !restored.includes("Deepsand")
    ) {
      restored = `${restored} Deepsand`;
    }
    entry.holder[entry.key] = restored;
  });
  return fields;
}

async function translatePage(source, target) {
  const { fields, body } = splitFrontmatter(source);
  const translatedFields = await translateFrontmatter(fields, target);

  const lines = body.split("\n");
  const plan = [];
  const allLinks = [];
  const allEmphasis = [];
  let inFence = false;
  let inScript = false;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^<script\b/i.test(line)) {
      inScript = true;
      continue;
    }
    if (inScript) {
      if (/<\/script>/i.test(line)) inScript = false;
      continue;
    }
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !/[A-Za-z]/.test(line)) continue;

    let prefix = "";
    let text = line;
    const heading = line.match(/^(#{1,6}\s+)(.*)$/);
    const bullet = line.match(/^(\s*(?:[-*+]|\d+\.)\s+)(.*)$/);
    const quote = line.match(/^(>\s?)(.*)$/);
    if (heading) {
      prefix = heading[1];
      text = heading[2];
    } else if (bullet) {
      prefix = bullet[1];
      text = bullet[2];
    } else if (quote) {
      prefix = quote[1];
      text = quote[2];
    }
    const emphasized = extractEmphasis(text);
    const linked = extractLinks(emphasized.text);
    allLinks.push(...linked.links);
    allEmphasis.push(...emphasized.emphasis);
    plan.push({
      index,
      prefix,
      links: linked.links,
      emphasis: emphasized.emphasis,
      ...protect(linked.text),
    });
  }

  const translated = await translate(
    plan.map((entry) => entry.text),
    target,
  );
  const linkProtections = allLinks.map((link) => protect(link.label));
  const translatedLinkLabels =
    linkProtections.length > 0
      ? await translate(
          linkProtections.map((entry) => entry.text),
          target,
        )
      : [];
  allLinks.forEach((link, index) => {
    link.label = restore(translatedLinkLabels[index], linkProtections[index].tokens);
  });

  const emphasisProtections = allEmphasis.map((span) => protect(span.label));
  const translatedEmphasis =
    emphasisProtections.length > 0
      ? await translate(
          emphasisProtections.map((entry) => entry.text),
          target,
        )
      : [];
  allEmphasis.forEach((span, index) => {
    span.label = restore(translatedEmphasis[index], emphasisProtections[index].tokens);
  });

  for (let index = 0; index < plan.length; index += 1) {
    const entry = plan[index];
    let line = restore(translated[index], entry.tokens);
    for (const span of entry.emphasis) {
      let rendered = false;
      line = line.replace(span.token, () => {
        if (rendered) return "";
        rendered = true;
        return `**${span.label}**`;
      });
    }
    for (const link of entry.links) {
      let rendered = false;
      line = line.replace(link.token, () => {
        if (rendered) return "";
        rendered = true;
        return `[${link.label}](${link.url})`;
      });
    }
    let renderedLine = cleanRestored(line);
    const original = lines[entry.index];
    if (
      /^#{1,6}\s/.test(entry.prefix) &&
      original.includes("Deepsand") &&
      !renderedLine.includes("Deepsand")
    ) {
      renderedLine = `${renderedLine} Deepsand`;
    }
    lines[entry.index] = `${entry.prefix}${renderedLine}`;
  }

  const frontmatter = [
    "---",
    yamlDump(translatedFields, { lineWidth: 100, noRefs: true }).trimEnd(),
    "---",
    "",
  ].join("\n");
  return {
    source: `${frontmatter}${lines.join("\n")}`,
    title: typeof translatedFields.title === "string" ? translatedFields.title : "",
  };
}

function validate(page, code) {
  if (!page.startsWith("---\n")) throw new Error(`${code}: missing frontmatter`);
  if ((page.match(/^```/gm) ?? []).length % 2 !== 0) {
    throw new Error(`${code}: unbalanced code fences`);
  }
  if (/ZQX[CUBLET]\d+ZQX/.test(page)) {
    console.error(`${code}: token survived in ${page.match(/.*ZQX[CUBLET]\d+ZQX.*/)?.[0]}`);
    throw new Error(`${code}: untranslated token remained`);
  }
}

const generated = {
  en: { ...labels },
};

for (const language of languages) {
  for (const relative of pages) {
    const source = fs.readFileSync(path.join(siteRoot, relative), "utf8");
    const translated = await translatePage(source, language.target);
    validate(translated.source, `${language.code}/${relative}`);
    const destination = path.join(siteRoot, language.code, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, `${translated.source.trimEnd()}\n`, "utf8");
  }

  const values = Object.values(labels);
  const protectedValues = values.map(protect);
  const translated = await translate(
    protectedValues.map((entry) => entry.text),
    language.target,
  );
  generated[language.code] = Object.fromEntries(
    Object.keys(labels).map((key, index) => [
      key,
      restore(translated[index], protectedValues[index].tokens),
    ]),
  );
  console.log(`${language.code}: ${pages.length} pages`);
}

fs.writeFileSync(
  path.join(siteRoot, ".vitepress", "i18n.generated.json"),
  `${JSON.stringify(generated, null, 2)}\n`,
  "utf8",
);
