# CLAUDE.md

## 概要

Lume (v3) 用の Mermaid.js プラグイン。Markdown の mermaid コードブロックをクライアントサイドで図として描画する。

CDN の URL を直接ブラウザから読み込まず、ビルド時に mermaid 本体・アイコンパック等のアセットをローカルに配置する。これにより外部 CDN への依存を排除し、セルフホスト可能な出力を生成する。

## ランタイム

- Deno
- Lume v3 (`cdn.jsdelivr.net` 経由で import)
- LSP: denols

## 開発コマンド

```sh
deno task build    # サイトビルド
deno task serve    # 開発サーバ起動
deno task test     # テスト実行
deno task check    # 型チェック
deno task lint     # lint + fmt チェック
deno task fix      # lint --fix + fmt
```

## ファイル構成

- `mod.ts` — エントリポイント。`plugins.ts` をラップし、`scripts/mermaid.mjs` を remoteFile として配信する。
- `plugins.ts` — プラグイン本体。npm から mermaid ESM モジュールとアイコンパックを取得し、全 HTML ページに初期化スクリプトを注入する。
- `scripts/mermaid.mjs` — クライアントサイドで mermaid を初期化・実行するランナースクリプト。
- `_config.ts` — このリポジトリ自体の Lume 設定(プラグイン開発用)。

## examples/

`examples/` は独立した Lume サイト。固有の `deno.json` と `_config.ts` を持つ。プラグインの動作確認用。

```sh
cd examples && deno task serve
```
