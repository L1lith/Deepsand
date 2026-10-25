/**
 * Regenerate the translated documentation pages.
 *
 * English Markdown in `docs-site/` is the source. This script writes one tree
 * per locale under `docs-site/<code>/` and the small label map the VitePress
 * configuration reads. Code fences, inline code, link targets and product names
 * are protected before anything is translated, so a translation cannot break a
 * command, a relative link or a brand name.
 *
 * Hand-written corrections belong in OVERRIDES below. They are applied after
 * the translator and before validation, so they survive every regeneration.
 * A path or line that no longer exists in the English source fails the run
 * instead of silently disappearing.
 *
 * Usage:
 *   npm run docs:translate
 *   DOCS_TRANSLATE_PAGES=download.md npm run docs:translate
 *   DOCS_TRANSLATE_LANGS=es npm run docs:translate
 *   npm run docs:check            # validate overrides without calling the translator
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

const requestedLanguages = (process.env.DOCS_TRANSLATE_LANGS ?? "")
  .split(",")
  .map((code) => code.trim())
  .filter(Boolean);
const unknownLanguages = requestedLanguages.filter(
  (code) => !languages.some((language) => language.code === code),
);
if (unknownLanguages.length > 0) {
  const sourceNote = unknownLanguages.includes("en")
    ? ' ("en" is the source language and is not generated)'
    : "";
  throw new Error(
    `DOCS_TRANSLATE_LANGS named unknown language: ${unknownLanguages.join(", ")}${sourceNote}`,
  );
}
const selectedLanguages = requestedLanguages.length
  ? languages.filter((language) => requestedLanguages.includes(language.code))
  : languages;

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

/**
 * Hand-written corrections for machine translations.
 *
 * These are applied after the translator and before the page is validated, so
 * they survive every regeneration. A locale page is generated output: edit this
 * map, never `docs-site/<locale>/...`.
 *
 * Shape:
 *   OVERRIDES[locale] = {
 *     pages: {
 *       [relative]: {
 *         frontmatter: { "hero.tagline": "...", "features.0.title": "..." },
 *         lines: { "The exact English source line": "The localized line" },
 *       },
 *     },
 *     labels: { navDownload: "..." },
 *   }
 *
 * `frontmatter` paths are dot-separated and may contain array indices. `lines`
 * keys are compared with the exact English source line, including any Markdown
 * prefix. A missing path, an unmatched line, an unknown page or label, or a line
 * inside a code fence is an error rather than a silent no-op. A path that still
 * exists keeps applying when the English sentence changes, so review the
 * override when the source text is revised.
 */
const OVERRIDES = {
  es: {
    pages: {
      "index.md": {
        frontmatter: {
          "hero.tagline":
            "Deepsand brinda a un asistente de codificación de IA su propio espacio de trabajo privado y seguro. Puede ver el proyecto que elijas, pedir permiso antes de acceder a cualquier otra cosa y dejar el resto de tus archivos en paz.",
        },
      },
    },
  },
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

/**
 * Resolve a dot path to its parent object/array and final key.
 *
 * Applied to frontmatter only. Array segments are numeric indices, so
 * `features.0.title` and `hero.actions.1.text` work.
 */
function frontmatterParent(root, dotted, where) {
  const parts = dotted.split(".");
  let node = root;
  for (const part of parts.slice(0, -1)) {
    const next = Array.isArray(node) ? node[Number(part)] : node?.[part];
    if (next === undefined || next === null) {
      throw new Error(`${where}: no frontmatter path "${dotted}"`);
    }
    node = next;
  }
  return { node, key: parts[parts.length - 1] };
}

function getFrontmatterPath(root, dotted, where) {
  const { node, key } = frontmatterParent(root, dotted, where);
  if (Array.isArray(node)) {
    const index = Number(key);
    if (!Number.isInteger(index) || index < 0 || index >= node.length) {
      throw new Error(`${where}: no frontmatter path "${dotted}"`);
    }
    return node[index];
  }
  if (typeof node !== "object" || node === null || !(key in node)) {
    throw new Error(`${where}: no frontmatter path "${dotted}"`);
  }
  return node[key];
}

function assertFrontmatterPath(root, dotted, where) {
  getFrontmatterPath(root, dotted, where);
}

function setFrontmatterPath(root, dotted, value, where) {
  const { node, key } = frontmatterParent(root, dotted, where);
  if (Array.isArray(node)) {
    const index = Number(key);
    if (!Number.isInteger(index) || index < 0 || index >= node.length) {
      throw new Error(`${where}: no frontmatter path "${dotted}"`);
    }
    node[index] = value;
    return;
  }
  if (typeof node !== "object" || node === null || !(key in node)) {
    throw new Error(`${where}: no frontmatter path "${dotted}"`);
  }
  node[key] = value;
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

/**
 * The body lines the translator will actually consider.
 *
 * Used to reject an override that points at a code fence or a `<script>` block
 * before any network call. It deliberately does not apply the "has an ASCII
 * letter" rule, because an override may legitimately target a line of
 * punctuation or numbers.
 */
function translatableLines(body) {
  const result = new Set();
  let inFence = false;
  let inScript = false;
  for (const line of body.split("\n")) {
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
    if (!inFence) result.add(line);
  }
  return result;
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

async function translatePage(source, language, relative) {
  const { code, target } = language;
  const pageOverride = OVERRIDES[code]?.pages?.[relative];
  const { fields, body } = splitFrontmatter(source);
  const translatedFields = await translateFrontmatter(fields, target);

  for (const [dotted, value] of Object.entries(pageOverride?.frontmatter ?? {})) {
    setFrontmatterPath(translatedFields, dotted, value, `${code}/${relative}`);
  }

  const lines = body.split("\n");
  const plan = [];
  const allLinks = [];
  const allEmphasis = [];
  let inFence = false;
  let inScript = false;
  const lineOverrides = pageOverride?.lines ?? {};
  const appliedLineOverrides = new Set();
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
    if (inFence) continue;
    if (Object.prototype.hasOwnProperty.call(lineOverrides, line)) {
      lines[index] = lineOverrides[line];
      appliedLineOverrides.add(line);
      continue;
    }
    if (!/[A-Za-z]/.test(line)) continue;

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

  for (const sourceLine of Object.keys(lineOverrides)) {
    if (!appliedLineOverrides.has(sourceLine)) {
      throw new Error(
        `${code}/${relative}: line override did not match a translatable English line: ${JSON.stringify(sourceLine)}`,
      );
    }
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

function validateOverrides() {
  const knownLocales = new Set(languages.map((language) => language.code));
  for (const [code, spec] of Object.entries(OVERRIDES)) {
    if (code !== "en" && !knownLocales.has(code)) {
      throw new Error(`translation overrides name unknown locale "${code}"`);
    }
    const pageOverrides = Object.entries(spec.pages ?? {});
    if (code === "en" && pageOverrides.length > 0) {
      throw new Error('translation overrides for "en" pages are not generated; override labels instead');
    }
    for (const [relative, page] of pageOverrides) {
      if (!allPages.includes(relative)) {
        throw new Error(`translation overrides name unknown page "${code}/${relative}"`);
      }
      for (const [dotted, value] of Object.entries(page.frontmatter ?? {})) {
        if (typeof value !== "string") {
          throw new Error(
            `translation overrides for "${code}/${relative}" must be strings: "${dotted}"`,
          );
        }
      }
      for (const [line, value] of Object.entries(page.lines ?? {})) {
        if (typeof value !== "string") {
          throw new Error(
            `translation overrides for "${code}/${relative}" must be strings: ${JSON.stringify(line)}`,
          );
        }
      }
    }
    for (const [key, value] of Object.entries(spec.labels ?? {})) {
      if (typeof value !== "string") {
        throw new Error(`translation overrides for "${code}" must be strings: label "${key}"`);
      }
      if (!(key in labels)) {
        throw new Error(`translation overrides name unknown label "${code}.${key}"`);
      }
    }
  }
}

function validateOverridesAgainstSource() {
  for (const [code, spec] of Object.entries(OVERRIDES)) {
    for (const [relative, page] of Object.entries(spec.pages ?? {})) {
      const source = fs.readFileSync(path.join(siteRoot, relative), "utf8");
      const { fields, body } = splitFrontmatter(source);
      for (const dotted of Object.keys(page.frontmatter ?? {})) {
        assertFrontmatterPath(fields, dotted, `${code}/${relative}`);
      }
      const sourceLines = translatableLines(body);
      for (const line of Object.keys(page.lines ?? {})) {
        if (!sourceLines.has(line)) {
          throw new Error(
            `${code}/${relative}: line override does not match a translatable English line: ${JSON.stringify(line)}`,
          );
        }
      }
    }
  }
}

function verifyOverridesRoundTrip() {
  for (const [code, spec] of Object.entries(OVERRIDES)) {
    for (const [relative, page] of Object.entries(spec.pages ?? {})) {
      const source = fs.readFileSync(path.join(siteRoot, relative), "utf8");
      const { fields } = splitFrontmatter(source);
      for (const [dotted, value] of Object.entries(page.frontmatter ?? {})) {
        setFrontmatterPath(fields, dotted, value, `${code}/${relative}`);
        const reloaded = yamlLoad(yamlDump(fields, { lineWidth: 100, noRefs: true }));
        const actual = getFrontmatterPath(reloaded, dotted, `${code}/${relative}`);
        if (actual !== value) {
          throw new Error(
            `${code}/${relative}: override for "${dotted}" did not survive YAML serialization`,
          );
        }
      }
    }
  }
}

function applyLabelOverrides(code, target) {
  for (const [key, value] of Object.entries(OVERRIDES[code]?.labels ?? {})) {
    target[key] = value;
  }
}

validateOverrides();
validateOverridesAgainstSource();
verifyOverridesRoundTrip();
if (process.argv.includes("--verify")) {
  console.log("translation overrides are valid");
  process.exit(0);
}

const generatedPath = path.join(siteRoot, ".vitepress", "i18n.generated.json");
const existingGenerated =
  requestedLanguages.length > 0 && fs.existsSync(generatedPath)
    ? JSON.parse(fs.readFileSync(generatedPath, "utf8"))
    : {};
if (requestedLanguages.length > 0) {
  const incomplete = languages.filter((language) => {
    if (requestedLanguages.includes(language.code)) return false;
    const entry = existingGenerated[language.code];
    return !entry || Object.keys(labels).some((key) => !(key in entry));
  });
  if (incomplete.length > 0) {
    throw new Error(
      `i18n.generated.json is missing labels for ${incomplete.map((language) => language.code).join(", ")}; run without DOCS_TRANSLATE_LANGS to regenerate them`,
    );
  }
}
const generated = { en: { ...labels } };
applyLabelOverrides("en", generated.en);
const refreshed = {};

for (const language of selectedLanguages) {
  for (const relative of pages) {
    const source = fs.readFileSync(path.join(siteRoot, relative), "utf8");
    const translated = await translatePage(source, language, relative);
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
  const labelsForLanguage = Object.fromEntries(
    Object.keys(labels).map((key, index) => [
      key,
      restore(translated[index], protectedValues[index].tokens),
    ]),
  );
  applyLabelOverrides(language.code, labelsForLanguage);
  refreshed[language.code] = labelsForLanguage;
  console.log(`${language.code}: ${pages.length} pages`);
}

// A filtered run must not drop the label maps it did not regenerate: VitePress
// reads `messages[code]` for every locale in locales.ts.
for (const language of languages) {
  if (refreshed[language.code]) {
    generated[language.code] = refreshed[language.code];
  } else if (existingGenerated[language.code]) {
    generated[language.code] = existingGenerated[language.code];
  } else {
    throw new Error(
      `i18n.generated.json has no entry for "${language.code}"; run without DOCS_TRANSLATE_LANGS to regenerate it`,
    );
  }
}

fs.writeFileSync(
  generatedPath,
  `${JSON.stringify(generated, null, 2)}\n`,
  "utf8",
);
