import { h } from "vue";
import DefaultTheme from "vitepress/theme";
import DownloadPicker from "./DownloadPicker.vue";
import LanguageSwitcher from "./LanguageSwitcher.vue";
import AppScreenshot from "./AppScreenshot.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Registered globally so every translated download page can use the same
    // component without each locale needing a relative import path.
    app.component("DownloadPicker", DownloadPicker);
    // The home page's screenshot: one line of markup, and the component chooses the
    // image that matches the page's own language.
    app.component("AppScreenshot", AppScreenshot);
  },
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "nav-bar-content-after": () => h(LanguageSwitcher),
    });
  },
};
