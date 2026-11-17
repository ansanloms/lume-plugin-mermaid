import { merge } from "@lumeland/core/utils/object.ts";
import type Site from "@lumeland/core/site.ts";

import "@lumeland/core/types.ts";

/**
 * icon pack 。
 */
interface IconPack {
  /**
   * icon 名称。
   */
  name: string;

  /**
   * icon pack の URL。
   */
  url: string;
}

/**
 * パン・ズームの設定。
 */
interface ZoomOptions {
  /**
   * パン・ズーム機能の有効・無効。
   */
  enable: boolean;

  /**
   * ホイール操作でのズーム挙動。
   * false               : ホイールでズームしない。
   * true                : 常にホイールでズームする。
   * ("ctrl" | "meta")[] : 指定したキーを押下している間だけホイールでズームする。
   */
  wheel?: boolean | ("ctrl" | "meta")[];

  /**
   * パン・ズーム領域のアスペクト比。"4:3" や "16:9" のように指定する。
   * 空文字を指定した場合は領域比を固定しない。
   */
  aspectRatio?: string;

  /**
   * パン・ズーム領域の最大幅。CSS の max-width 値。"600px" や "80vw" のように指定する。
   * 未指定の場合は最大幅を制限しない。
   */
  maxWidth?: string;

  /**
   * パン・ズーム領域の最大高さ。CSS の max-height 値。"400px" や "80vh" のように指定する。
   * 未指定の場合は最大高さを制限しない。
   */
  maxHeight?: string;
}

/**
 * オプション。
 */
export interface Options {
  /**
   * mermaid のバージョン。
   */
  version: string;

  /**
   * mermaid.initialize の設定。
   */
  config: { [k: string]: unknown };

  /**
   * mermaid に読込ませるアイコン。
   */
  icons: IconPack[];

  /**
   * mermaid 描画対象要素のセレクタ。
   */
  querySelector: string;

  /**
   * パン・ズームの設定。
   */
  zoom: ZoomOptions;

  /**
   * mermaid 実行スクリプトのパス。
   */
  scriptSrc: string;
}

export const defaults: Options = {
  version: "11.15.0",
  config: {},
  icons: [
    {
      name: "logos",
      url: "https://unpkg.com/@iconify-json/logos@1.2.11/icons.json",
    },
    {
      name: "aws",
      // 注意: CC-BY-ND-2.0
      // aws-icons-mermaid.json 内に記述あり。
      // ビルド結果にそのままこの json が含まれるからそれでいいはず。
      url: "https://raw.githubusercontent.com/awslabs/aws-icons-for-plantuml/refs/tags/v23.0/dist/aws-icons-mermaid.json",
    },
  ],
  querySelector: "pre > code.language-mermaid",
  zoom: {
    enable: true,
    wheel: ["ctrl", "meta"],
    aspectRatio: "4:3",
  },
  scriptSrc: "/mermaid/scripts/mermaid.mjs",
};

/**
 * インライン script に埋め込む値を JS のリテラル式にする。
 * `<` をすべて `\u003c` にして、値に含まれる `</script>`・`<!--`・`<script` が
 * HTML のパースに影響しないようにする。
 * 置換を `</` だけに狭めないこと。`<!--` と `<script` を含む値で HTML パーサの
 * 状態が変わり、本物の `</script>` で script が終わらなくなる。
 */
function toScriptLiteral(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.addEventListener("beforeBuild", () => {
      site.add(
        `npm:mermaid@${options.version}/dist/mermaid.esm.min.mjs`,
        "/mermaid/mermaid.esm.min.mjs",
      );
      site.add(
        `npm:mermaid@${options.version}/dist/chunks/mermaid.esm.min/*`,
        "/mermaid/chunks/mermaid.esm.min",
      );

      for (const icon of options.icons) {
        site.add(icon.url, `/mermaid/icons/${icon.name}.json`);
      }
    });

    const mermaidScript = `
import mermaid from ${toScriptLiteral(site.url("/mermaid/mermaid.esm.min.mjs"))};
import { run } from ${toScriptLiteral(site.url(options.scriptSrc))};
import { enableZoom } from ${toScriptLiteral(site.url("/mermaid/scripts/zoom.mjs"))};
import { enableCopy } from ${toScriptLiteral(site.url("/mermaid/scripts/copy.mjs"))};

await run({
  mermaid,
  config: ${toScriptLiteral(options.config)},
  icons: ${toScriptLiteral(
    options.icons.map((icon) => ({
      name: icon.name,
      url: site.url(`/mermaid/icons/${icon.name}.json`),
    })),
  )},
  querySelector: ${toScriptLiteral(options.querySelector)},
  zoom: ${toScriptLiteral(options.zoom)},
  enableZoom,
  enableCopy,
})

`.trim();

    site.process([".html"], (pages) => {
      for (const page of pages) {
        if (!page.document) {
          continue;
        }

        const script = page.document.createElement("script");
        script.setAttribute("type", "module");
        script.innerText = mermaidScript;

        page.document.body.append(script);
      }
    });
  };
}
