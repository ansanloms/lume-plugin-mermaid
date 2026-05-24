import { merge } from "lume/core/utils/object.ts";
import type Site from "lume/core/site.ts";
import { Page } from "lume/core/file.ts";

import "lume/types.ts";

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
      url:
        "https://raw.githubusercontent.com/awslabs/aws-icons-for-plantuml/refs/tags/v23.0/dist/aws-icons-mermaid.json",
    },
  ],
  querySelector: "pre > code.language-mermaid",
  scriptSrc: "/mermaid/scripts/mermaid.mjs",
};

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
import mermaid from "${site.url("/mermaid/mermaid.esm.min.mjs")}";
import { run } from "${site.url(options.scriptSrc)}";

await run({
  mermaid,
  config: ${JSON.stringify(options.config)},
  icons: ${JSON.stringify(options.icons)},
  querySelector: "${options.querySelector}",
})

`.trim();

    site.process([".html"], (pages: Page[]) => {
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
