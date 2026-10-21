<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vitepress";
import messages from "../i18n.generated.json";
import { baseFor, DOCS_LOCALES } from "../locales";

const route = useRoute();
const open = ref(false);
const root = ref<HTMLElement | null>(null);

const current = computed(() => {
  const path = route.path;
  return (
    [...DOCS_LOCALES]
      .reverse()
      .find((locale) => locale.code !== "en" && path.startsWith(baseFor(locale.code))) ??
    DOCS_LOCALES[0]
  );
});

const label = computed(() => {
  const translated = messages[current.value.code as keyof typeof messages];
  return translated?.langMenuLabel ?? "Change language";
});

function targetFor(code: (typeof DOCS_LOCALES)[number]["code"]): string {
  const currentBase = baseFor(current.value.code);
  let rest = route.path;
  if (currentBase !== "/" && rest.startsWith(currentBase)) {
    rest = rest.slice(currentBase.length - 1);
  }
  const targetBase = baseFor(code);
  return rest === "/" ? targetBase : `${targetBase}${rest.replace(/^\//, "")}`;
}

function rememberLanguage(code: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `deepsand_docs_lang=${encodeURIComponent(code)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

function selectLanguage(code: string): void {
  rememberLanguage(code);
  close();
}

function rememberMiddleClick(event: MouseEvent, code: string): void {
  if (event.button === 1) rememberLanguage(code);
}

function close(): void {
  open.value = false;
}

function onDocumentClick(event: MouseEvent): void {
  if (root.value && !root.value.contains(event.target as Node)) close();
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") close();
}

watch(() => route.path, close);

onMounted(() => {
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
  document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <div ref="root" class="ds-language">
    <button
      type="button"
      class="ds-language-button"
      :aria-label="label"
      :title="label"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg
        class="ds-language-globe"
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.6 2.5 4 5.6 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.6-4-9s1.4-6.5 4-9Z" />
      </svg>
      <span class="ds-language-name">{{ current.label }}</span>
      <svg
        class="ds-language-chevron"
        :class="{ 'is-open': open }"
        viewBox="0 0 20 20"
        aria-hidden="true"
        fill="currentColor"
      >
        <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" stroke-width="1.7" fill="none" />
      </svg>
    </button>

    <Transition name="ds-language-menu">
      <div v-if="open" class="ds-language-menu" role="menu">
        <a
          v-for="locale in DOCS_LOCALES"
          :key="locale.code"
          :href="targetFor(locale.code)"
          class="ds-language-option"
          :class="{ 'is-current': locale.code === current.code }"
          :aria-current="locale.code === current.code ? 'page' : undefined"
          role="menuitem"
          @click="selectLanguage(locale.code)"
          @auxclick="rememberMiddleClick($event, locale.code)"
        >
          <span>{{ locale.label }}</span>
          <span v-if="locale.code === current.code" class="ds-language-check" aria-hidden="true">✓</span>
        </a>
      </div>
    </Transition>
  </div>
</template>
