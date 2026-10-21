<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useData } from "vitepress";
import i18n from "../i18n.generated.json";

type Platform = "windows" | "macos" | "linux";
type Labels = typeof i18n.en;

interface ReleaseAsset {
  name: string;
  size: number;
  browser_download_url: string;
}

interface Release {
  tag_name: string;
  html_url: string;
  published_at?: string;
  assets: ReleaseAsset[];
}

const releaseUrl = "https://github.com/L1lith/Deepsand/releases";
const apiUrl = "https://api.github.com/repos/L1lith/Deepsand/releases/latest";
const { localeIndex } = useData();
const text = computed<Labels>(() => {
  const key = localeIndex.value === "root" ? "en" : localeIndex.value;
  return (i18n as Record<string, Labels>)[key] ?? i18n.en;
});

const platformIds: Platform[] = ["windows", "macos", "linux"];
function platformLabel(platform: Platform): string {
  if (platform === "windows") return text.value.downloadWindows;
  if (platform === "macos") return text.value.downloadMacos;
  return text.value.downloadLinux;
}
const platforms = computed(() =>
  platformIds.map((id) => ({ id, label: platformLabel(id) })),
);

const release = ref<Release | null>(null);
const loading = ref(true);
const error = ref("");
const selected = ref<Platform>("windows");
const autoDetected = ref<Platform | null>(null);
const detectedArch = ref<"arm64" | "x64" | "unknown">("unknown");

function detectPlatform(): Platform | null {
  const data = (navigator as Navigator & { userAgentData?: { platform?: string; architecture?: string } })
    .userAgentData;
  const value = `${data?.platform ?? ""} ${navigator.platform ?? ""} ${navigator.userAgent ?? ""}`;
  const architecture = data?.architecture?.toLowerCase() ?? "";
  detectedArch.value =
    architecture === "arm" ? "arm64" : architecture === "x86" ? "x64" : "unknown";
  if (/win/i.test(value)) return "windows";
  if (/mac/i.test(value) && !/iphone|ipad/i.test(value)) return "macos";
  if (/linux|x11/i.test(value)) return "linux";
  return null;
}

function platformOf(name: string): Platform | null {
  if (/\.(exe|msi)$/i.test(name)) return "windows";
  if (/\.dmg$/i.test(name)) return "macos";
  if (/\.(appimage|deb|rpm)$/i.test(name)) return "linux";
  return null;
}

function archOf(name: string): "arm64" | "x64" | "unknown" {
  if (/aarch64|arm64/i.test(name)) return "arm64";
  if (/x64|x86_64|amd64/i.test(name)) return "x64";
  return "unknown";
}

function formatOf(name: string): string {
  const match = name.match(/\.(exe|msi|dmg|appimage|deb|rpm)$/i);
  return match ? match[1].toUpperCase() : "";
}

function labelOf(name: string, platform: Platform): string {
  const arch = archOf(name);
  const arm = arch === "arm64";
  if (platform === "windows") {
    return /\.exe$/i.test(name)
      ? text.value.downloadWindowsInstaller
      : text.value.downloadWindowsMsi;
  }
  if (platform === "macos") {
    return arm ? text.value.downloadMacAppleSilicon : text.value.downloadMacIntel;
  }
  if (/\.appimage$/i.test(name)) {
    return arm ? text.value.downloadLinuxAppImageArm : text.value.downloadLinuxAppImage;
  }
  if (/\.deb$/i.test(name)) {
    return arm ? text.value.downloadDebianArm : text.value.downloadDebian;
  }
  return arm ? text.value.downloadRpmArm : text.value.downloadRpm;
}

function formatOrder(name: string): number {
  if (/\.exe$/i.test(name)) return 0;
  if (/\.dmg$/i.test(name)) return 0;
  if (/\.appimage$/i.test(name)) return 0;
  if (/\.msi$/i.test(name)) return 1;
  if (/\.deb$/i.test(name)) return 1;
  if (/\.rpm$/i.test(name)) return 2;
  return 9;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

const version = computed(() => release.value?.tag_name.replace(/^app-v/, "") ?? "");
const detectedLabel = computed(
  () =>
    platforms.value.find((item) => item.id === autoDetected.value)?.label ??
    text.value.downloadYourSystem,
);
const currentAssets = computed(() => {
  const assets = release.value?.assets ?? [];
  const filtered = assets
    .filter((asset) => platformOf(asset.name) === selected.value && !/\.sig$/i.test(asset.name))
    .sort((left, right) => {
      const order = formatOrder(left.name) - formatOrder(right.name);
      if (order !== 0) return order;
      const preferredArch = detectedArch.value === "unknown" ? "x64" : detectedArch.value;
      const leftPreferred = archOf(left.name) === preferredArch ? 1 : 0;
      const rightPreferred = archOf(right.name) === preferredArch ? 1 : 0;
      return rightPreferred - leftPreferred || left.name.localeCompare(right.name);
    });
  return filtered;
});

async function loadRelease() {
  loading.value = true;
  error.value = "";
  try {
    const response = await fetch(apiUrl, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status}`);
    }
    const data = (await response.json()) as Release;
    if (!Array.isArray(data.assets) || !data.tag_name) {
      throw new Error("the release did not contain an asset list");
    }
    release.value = data;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  autoDetected.value = detectPlatform();
  if (autoDetected.value) selected.value = autoDetected.value;
  void loadRelease();
});
</script>

<template>
  <section class="download-picker">
    <div class="download-detected">
      <span class="download-dot" aria-hidden="true"></span>
      <span>
        {{ text.downloadDetected }} <strong>{{ detectedLabel }}</strong>
      </span>
      <span class="download-muted">{{ text.downloadNotRight }}</span>
    </div>

    <div class="download-tabs" role="tablist" :aria-label="text.downloadOsLabel">
      <button
        v-for="platform in platforms"
        :key="platform.id"
        type="button"
        role="tab"
        class="download-tab"
        :class="{ 'is-active': selected === platform.id }"
        :aria-selected="selected === platform.id"
        @click="selected = platform.id"
      >
        {{ platform.label }}
      </button>
    </div>

    <p v-if="loading" class="download-message">{{ text.downloadLooking }}</p>

    <div v-else-if="error" class="download-message download-error">
      <p>{{ text.downloadCouldNotLoad }} ({{ error }}).</p>
      <a :href="releaseUrl" target="_blank" rel="noopener">{{ text.downloadOpenReleases }}</a>
    </div>

    <template v-else-if="release">
      <div class="download-release">
        <span
          >{{ text.downloadLatest }}
          <strong>v{{ version }}</strong></span
        >
        <a :href="release.html_url" target="_blank" rel="noopener">{{ text.downloadReleaseNotes }}</a>
      </div>

      <div v-if="currentAssets.length" class="download-links">
        <a
          v-for="asset in currentAssets"
          :key="asset.name"
          :href="asset.browser_download_url"
          class="download-link"
          target="_blank"
          rel="noopener"
        >
          <span class="download-link-title">{{ labelOf(asset.name, selected) }}</span>
          <span class="download-link-meta">
            {{ formatOf(asset.name) }}<template v-if="asset.size"> · {{ formatBytes(asset.size) }}</template>
          </span>
          <span class="download-link-name">{{ asset.name }}</span>
        </a>
      </div>

      <p v-else class="download-message">{{ text.downloadNoBuild }}</p>
    </template>

    <p class="download-footnote">
      {{ text.downloadFootnote }}
      <a :href="releaseUrl" target="_blank" rel="noopener">{{ text.downloadAllReleases }}</a>.
    </p>
  </section>
</template>

<style scoped>
.download-picker {
  margin: 1.5rem 0;
  padding: 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
}

.download-detected {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem 0.55rem;
  font-size: 14px;
}

.download-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 0 4px var(--vp-c-brand-soft);
}

.download-muted {
  color: var(--vp-c-text-2);
}

.download-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1.25rem 0 1rem;
}

.download-tab {
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-weight: 600;
  cursor: pointer;
}

.download-tab:hover {
  border-color: var(--vp-c-brand-1);
}

.download-tab.is-active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.download-release {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 0;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 14px;
}

.download-release a,
.download-message a,
.download-footnote a {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.download-links {
  display: grid;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.download-link {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: border-color 0.2s, transform 0.2s;
}

.download-link:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-1px);
}

.download-link-title {
  font-weight: 700;
}

.download-link-meta {
  color: var(--vp-c-brand-1);
  font-size: 13px;
  font-weight: 600;
}

.download-link-name {
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.download-message {
  padding: 0.75rem 0;
  color: var(--vp-c-text-2);
}

.download-error {
  color: var(--vp-c-danger-1);
}

.download-footnote {
  margin-top: 1rem;
  color: var(--vp-c-text-2);
  font-size: 13px;
}
</style>
