import { enableZoom } from "./zoom.mjs";

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

  try {
    // 壊れた図が含まれていても例外で停止させず、描画できた図はすべて処理する。
    await mermaid.run({ querySelector, suppressErrors: true });
  } finally {
    // run が途中で失敗しても、描画済みの図にはズームを付与する。
    enableZoom(querySelector, zoom);
  }
};
