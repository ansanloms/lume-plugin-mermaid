import { getCurrentColorScheme } from "./color-scheme.mjs";
import { enableZoom } from "../mermaid/scripts/zoom.mjs";
import { enableCopy } from "../mermaid/scripts/copy.mjs";

/**
 * @typedef {{ name: string, url: string }} Icon
 * @typedef {{ enable: boolean, wheel?: boolean | ("ctrl" | "meta")[], aspectRatio?: string, maxWidth?: string, maxHeight?: string }} Zoom
 * @typedef {{ mermaid: Object, config: Object, icons: Icon[], querySelector: string, zoom: Zoom }} Options
 */

/**
 * @param {Options} options
 */
export const run = async (options) => {
  globalThis.__MERMAID = options;
  const { mermaid, config, icons, querySelector, zoom } = options;

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
    // コピー機能用に元コードを退避する(copy.mjs が参照する)。
    element.dataset.mermaidSource = element.textContent;
  });

  try {
    // 壊れた図が含まれていても例外で停止させず、描画できた図はすべて処理する。
    await mermaid.run({ querySelector, suppressErrors: true });
  } finally {
    // run が途中で失敗しても、描画済みの図にはズーム・コピーを付与する。
    enableZoom(querySelector, zoom);
    enableCopy(querySelector);
  }
};

globalThis.addEventListener("changeColorScheme", async (event) => {
  if (!globalThis.__MERMAID) {
    return;
  }

  /** @type Options */
  const options = globalThis.__MERMAID;

  const { mermaid, config, querySelector, zoom } = options;

  mermaid.initialize({
    ...config,
    theme: event.detail.colorScheme === "dark" ? "dark" : config.theme,
    startOnLoad: false,
  });

  for (
    const element of Array.from(document.querySelectorAll(querySelector))
  ) {
    delete element.dataset.processed;
    element.innerHTML = element.dataset.mermaid;
  }

  try {
    // run は Promise を返すため、描画完了を待ってからズーム・コピーを付け直せる。
    await mermaid.run({ querySelector, suppressErrors: true });
  } finally {
    // 再描画で wrapper が消えるため、ズーム・コピーを付け直す。
    enableZoom(querySelector, zoom);
    enableCopy(querySelector);
  }
});
