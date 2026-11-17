// Lint rules for the card sources: real mistakes only (unknown names, duplicates, unreachable code).
const browser = ["window", "document", "customElements", "HTMLElement", "fetch", "console", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "navigator", "CustomEvent", "Event", "localStorage", "getComputedStyle", "ResizeObserver", "performance"];

export default [{
  files: ["src/**/*.js"],
  languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: Object.fromEntries(browser.map((k) => [k, "readonly"])) },
  rules: {
    "no-undef": "error",
    "no-unused-vars": ["warn", { args: "after-used", caughtErrors: "none" }],
    "no-dupe-keys": "error",
    "no-dupe-class-members": "error",
    "no-unreachable": "error",
    "no-self-assign": "error",
    "no-redeclare": "error",
    "no-cond-assign": "warn",
    "no-empty": "warn",
  },
}];
