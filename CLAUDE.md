# CLAUDE.md

## 概要

Lume (v4) 用の Mermaid.js プラグイン。Markdown の mermaid コードブロックをクライアントサイドで図として描画する。

CDN の URL を直接ブラウザから読み込まず、ビルド時に mermaid 本体・アイコンパック等のアセットをローカルに配置する。これにより外部 CDN への依存を排除し、セルフホスト可能な出力を生成する。

## ランタイム

- Node 24
- Lume v4 (`@lumeland/lume`、プラグインは `@lumeland/core` を peerDependencies で参照)
- TypeScript のまま配布する (ビルド工程なし)。git 依存 (`github:ansanloms/lume-plugin-mermaid#<tag>`) で配布し、npm には公開しない。
- LSP: vtsls

## 開発コマンド

```sh
npm run build           # ルートのサイトビルド
npm run serve           # ルートの開発サーバ起動
npm run check           # 型チェック (tsc --noEmit)
npm run lint            # oxlint + oxfmt チェック
npm run fix             # oxlint --fix + oxfmt
```

## ファイル構成

- `mod.ts` — エントリポイント。`plugins.ts` をラップし、`scripts/mermaid.mjs` を remoteFile として配信する。
- `plugins.ts` — プラグイン本体。npm から mermaid ESM モジュールとアイコンパックを取得し、全 HTML ページに初期化スクリプトを注入する。
- `scripts/mermaid.mjs` — クライアントサイドで mermaid を初期化・実行するランナースクリプト。
- `_config.ts` — このリポジトリ自体の Lume 設定(プラグイン開発用)。
- `package.json` — 依存と npm scripts。`tsconfig.json`・`.oxlintrc.json`・`.oxfmtrc.json` は検査の設定。

## examples/

`examples/` はプラグインの動作確認用の Lume サイト。`examples/package.json` は `serve` だけを持ち、依存は持たない。依存はルートの `node_modules` を使う (先にルートで `npm ci` が要る)。`examples/_config.ts` は `../mod.ts` を相対 import する。

```sh
cd examples && npm run serve
cd examples && npx lume build
```
