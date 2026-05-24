/**
 * @typedef {{ name: string, url: string }} Icon
 * @typedef {{ mermaid: Object, config: Object, icons: Icon[], querySelector: string }} Options
 */

/**
 * @param {Options} options
 */
export const run = async (options) => {
  const { mermaid, config, icons, querySelector } = options;

  mermaid.registerIconPacks(icons.map(({ name, url }) => ({
    name,
    loader: () => fetch(url).then((res) => res.json()),
  })));

  mermaid.initialize({
    ...config,
    startOnLoad: false,
  });

  await mermaid.run({ querySelector });
};
