import plugins, { Options } from "./plugins.ts";

import type Site from "lume/core/site.ts";

export type { Options } from "./plugins.ts";

export default (options: Partial<Options> = {}) => {
  return (site: Site) => {
    site.use(plugins(options));

    [
      "scripts/mermaid.mjs",
      "scripts/zoom.mjs",
      "scripts/copy.mjs",
      "scripts/overlay.mjs",
    ].forEach((file) => {
      if (!file.startsWith("_")) {
        site.remoteFile(`/mermaid/${file}`, import.meta.resolve(`./${file}`));
        site.add(`/mermaid/${file}`);
      }
    });
  };
};
