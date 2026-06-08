import lume from "lume/mod.ts";
import mermaid from "../mod.ts";

const site = lume({
  src: "./docs",
});

site
  .copy("/scripts/mermaid.mjs")
  .copy("/scripts/color-scheme.mjs")
  .copy("/styles/general.css")
  .use(mermaid({
    config: { theme: "forest" },
    scriptSrc: "/scripts/mermaid.mjs",
    zoom: {
      enable: true,
      wheel: true,
      aspectRatio: "16/9",
      maxWidth: "50%",
      maxHeight: "64svh",
    },
  }))
  .process([".html"], (pages) => {
    for (const page of pages) {
      if (!page.document) {
        continue;
      }

      const colorScheme = page.document.createElement("script");
      colorScheme.setAttribute("type", "module");
      colorScheme.setAttribute("src", site.url("/scripts/color-scheme.mjs"));

      const styleGeneral = page.document.createElement("link");
      styleGeneral.setAttribute("rel", "stylesheet");
      styleGeneral.setAttribute("href", site.url("/styles/general.css"));

      page.document.body.append(colorScheme);
      page.document.body.append(styleGeneral);
    }
  });

export default site;
