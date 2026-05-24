import { getCurrentColorScheme } from "./color-scheme.mjs";

/**
 * @typedef {{ name: string, url: string }} Icon
 * @typedef {{ mermaid: Object, config: Object, icons: Icon[], querySelector: string }} Options
 */

/**
 * @param {Options} options
 */
export const run = async (options) => {
  globalThis.__MERMAID = options;
  const { mermaid, config, icons, querySelector } = options;

  mermaid.registerIconPacks(icons.map(({ name, url }) => ({
    name,
    loader: () => fetch(url).then((res) => res.json()),
  })));

  mermaid.initialize({
    ...config,
    theme: getCurrentColorScheme() === "dark" ? "dark" : config.theme,
    startOnLoad: false,
  });

  document.querySelectorAll(querySelector).forEach((element, index) => {
    element.id = `mermaid-diagram-${index}`;
    element.dataset.mermaid = element.innerText;
  });

  await mermaid.run({ querySelector });
};

globalThis.addEventListener("changeColorScheme", async (event) => {
  if (!globalThis.__MERMAID) {
    return;
  }

  /** @type Options */
  const options = globalThis.__MERMAID;

  const { mermaid, config, querySelector } = options;

  mermaid.initialize({
    ...config,
    theme: event.detail.colorScheme === "dark" ? "dark" : config.theme,
    startOnLoad: false,
  });

  for await (
    const element of Array.from(document.querySelectorAll(querySelector))
  ) {
    delete element.dataset.processed;
    element.innerHTML = element.dataset.mermaid;
    mermaid.init(undefined, element);
  }
});
