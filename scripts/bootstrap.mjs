/**
 * @typedef {{ name: string, url: string }} Icon
 * @typedef {{ enable: boolean, wheel?: boolean | ("ctrl" | "meta")[], aspectRatio?: string, maxWidth?: string, maxHeight?: string }} Zoom
 * @typedef {{ mermaidSrc: string, runnerSrc: string, zoomSrc: string, copySrc: string, config: Object, icons: Icon[], querySelector: string, zoom: Zoom }} Payload
 */

/**
 * プラグインが注入する script 要素の data-lume-mermaid 属性からオプションを読み、
 * mermaid・runner・zoom・copy を読み込んで runner の run を実行する。
 * オプションは JSON として属性に入っているので、JS ソースとして解釈されることはない。
 */
const element = document.querySelector("script[data-lume-mermaid]");

if (element) {
  /** @type {Payload} */
  const payload = JSON.parse(element.getAttribute("data-lume-mermaid"));

  // import() は bootstrap.mjs 自身の URL を基準に解決するため、
  // 相対パスがページの URL を基準にするよう document.baseURI で絶対化する。
  const resolve = (src) => new URL(src, document.baseURI).href;

  const [{ default: mermaid }, { run }, { enableZoom }, { enableCopy }] =
    await Promise.all([
      import(resolve(payload.mermaidSrc)),
      import(resolve(payload.runnerSrc)),
      import(resolve(payload.zoomSrc)),
      import(resolve(payload.copySrc)),
    ]);

  await run({
    mermaid,
    config: payload.config,
    icons: payload.icons,
    querySelector: payload.querySelector,
    zoom: payload.zoom,
    enableZoom,
    enableCopy,
  });
}
