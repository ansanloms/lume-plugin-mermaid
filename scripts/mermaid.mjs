import { enableZoom } from "./zoom.mjs";
import { enableCopy } from "./copy.mjs";

/**
 * @typedef {{ name: string, url: string }} Icon
 * @typedef {{ enable: boolean, wheel?: boolean | ("ctrl" | "meta")[], aspectRatio?: string, maxWidth?: string, maxHeight?: string }} Zoom
 * @typedef {{ mermaid: Object, config: Object, icons: Icon[], querySelector: string, zoom: Zoom }} Options
 */

/**
 * @param {Options} options
 */
export const run = async (options) => {
  const { mermaid, config, icons, querySelector, zoom } = options;

  mermaid.registerIconPacks(icons.map(({ name, url }) => ({
    name,
    loader: () => fetch(url).then((res) => res.json()),
  })));

  mermaid.initialize({
    ...config,
    startOnLoad: false,
  });

  // mermaid.run は対象要素の中身を SVG に差し替え、元コードを破棄する。
  // コピー機能で使うため、描画前に各要素の元コードを退避しておく。
  for (const target of document.querySelectorAll(querySelector)) {
    if (target.dataset.mermaidSource === undefined) {
      target.dataset.mermaidSource = target.textContent;
    }
  }

  try {
    // 壊れた図が含まれていても例外で停止させず、描画できた図はすべて処理する。
    await mermaid.run({ querySelector, suppressErrors: true });
  } finally {
    // run が途中で失敗しても、描画済みの図にはズーム・コピーを付与する。
    enableZoom(querySelector, zoom);
    enableCopy(querySelector);
  }
};
