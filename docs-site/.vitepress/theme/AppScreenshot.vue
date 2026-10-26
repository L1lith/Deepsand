<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";

/**
 * A screenshot of the running app in the page's own language.
 *
 * The images are real: each was taken from the built app driven over the WebView2 debugging
 * protocol, with the interface set to that language and three throw-away projects named in it.
 * Nothing is mocked up, which is the only way a screenshot can be worth showing somebody who
 * has not installed the app yet.
 *
 * The language comes from VitePress rather than from the file: every locale's home page uses
 * the same `<AppScreenshot>` line, so the translator has one component to protect instead of
 * sixteen image paths to keep in step. A locale without its own image falls back to English
 * rather than rendering a broken one.
 */
const SHOTS = new Set([
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

const { lang } = useData();
const source = computed(() => {
  const code = (lang.value || "en").split("-")[0];
  return `/screenshots/app-${SHOTS.has(code) ? code : "en"}.png`;
});
</script>

<template>
  <figure class="app-shot">
    <!-- Empty alt with a visible caption: the picture is described by the caption below it,
         and that caption is documentation prose, so it is translated with the page. -->
    <img :src="source" alt="" width="1320" height="860" loading="lazy" />
    <figcaption><slot /></figcaption>
  </figure>
</template>

<style scoped>
.app-shot {
  margin: 1.6rem 0 2.2rem;
}

.app-shot img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.3);
}

.app-shot figcaption {
  margin-top: 0.7rem;
  font-size: 0.86rem;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}
</style>
