# lume-plugin-mermaid

A [Mermaid.js](https://mermaid.js.org/) plugin for [Lume](https://lume.land/).

Renders mermaid code blocks in Markdown as diagrams on the client side.

This plugin bundles mermaid and its assets (icon packs, etc.) locally during the build. The generated site has no external CDN dependency and can be fully self-hosted.

## Installation

Load the plugin in your `_config.ts`.

```ts
import lume from "lume/mod.ts";
import mermaid from "https://raw.githubusercontent.com/ansanloms/lume-plugin-mermaid/main/mod.ts";

const site = lume();

site.use(mermaid());

export default site;
```

## Usage

Write mermaid code blocks in your Markdown files.

````md
```mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[OK]
    B -->|No| D[NG]
```
````

## Options

Pass an options object to `mermaid()` to customize behavior.

```ts
site.use(mermaid({
  version: "11.15.0",
  config: { theme: "forest" },
  icons: [
    {
      name: "logos",
      url: "https://unpkg.com/@iconify-json/logos@1.2.11/icons.json",
    },
  ],
  querySelector: "pre > code.language-mermaid",
  scriptSrc: "/mermaid/scripts/mermaid.mjs",
}));
```

| Option          | Type         | Default                          | Description                                    |
| --------------- | ------------ | -------------------------------- | ---------------------------------------------- |
| `version`       | `string`     | `"11.15.0"`                      | Mermaid version to use                         |
| `config`        | `object`     | `{}`                             | Configuration passed to `mermaid.initialize()` |
| `icons`         | `IconPack[]` | logos, aws                       | Icon packs to load                             |
| `querySelector` | `string`     | `"pre > code.language-mermaid"`  | CSS selector for mermaid target elements       |
| `scriptSrc`     | `string`     | `"/mermaid/scripts/mermaid.mjs"` | Path to the mermaid runner script              |

### Custom Script

Use `scriptSrc` to replace the mermaid runner script with your own. The custom script must export a `run` function with the following signature.

```js
/**
 * @param {{ mermaid: Object, config: Object, icons: Icon[], querySelector: string }} options
 */
export const run = async (options) => {
  // ...
};
```

See `examples/docs/scripts/mermaid.js` for a color scheme integration example.

### Icon Packs

The following icon packs are loaded by default.

- **logos** — [Iconify logos](https://icon-sets.iconify.design/logos/)
- **aws** — [AWS Icons for PlantUML](https://github.com/awslabs/aws-icons-for-plantuml) (CC-BY-ND-2.0)

## License

[MIT](LICENSE)
