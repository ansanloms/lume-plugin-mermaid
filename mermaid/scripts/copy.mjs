/**
 * mermaid が描画した図に、元の mermaid コードをコピーするボタンを付与する
 * ランナースクリプト。
 *
 * mermaid.run は対象要素の中身を SVG に差し替え、元コードを破棄する。
 * そのため mermaid.mjs 側で run 前に各要素の元コードを dataset.mermaidSource
 * へ退避しておき、ここではそれを読んでコピーする。
 *
 * zoom.mjs と同じツールバー(overlay.mjs)へボタンを追加する。zoom が無効で
 * ラッパが無い場合は、コピー専用の最小ラッパを自作して動作する。
 */

import { createButton, ensureToolbar, injectStyle } from "./overlay.mjs";

/**
 * コピーボタンに表示する記号と、コピー成功時のフィードバック記号。
 */
const COPY_ICON = "⧉"; // ⧉
const DONE_ICON = "✓"; // ✓

/**
 * 成功フィードバックを元に戻すまでの時間(ミリ秒)。
 */
const FEEDBACK_DURATION = 1200;

/**
 * テキストをクリップボードへ書き込む。
 *
 * navigator.clipboard を第一手段とし、非対応環境(HTTP 等で Clipboard API が
 * 使えない場合)では textarea + execCommand のフォールバックを使う。
 *
 * @param {string} text
 * @returns {Promise<void>}
 */
const writeClipboard = async (text) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  // 画面外に置き、レイアウトへ影響させずに選択・コピーする。
  Object.assign(textarea.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "1px",
    height: "1px",
    padding: "0",
    border: "none",
    opacity: "0",
  });

  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
};

/**
 * コピーボタンを生成する。クリックで source をコピーし、成功時は一時的に
 * アイコンを切り替えてフィードバックする。
 *
 * @param {string} source コピーする mermaid コード。
 * @returns {HTMLButtonElement}
 */
const createCopyButton = (source) => {
  let resetTimer;

  const button = createButton(COPY_ICON, "コードをコピー", async () => {
    try {
      await writeClipboard(source);
      button.textContent = DONE_ICON;
      button.title = "コピーしました";
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        button.textContent = COPY_ICON;
        button.title = "コードをコピー";
      }, FEEDBACK_DURATION);
    } catch (error) {
      // コピー失敗はユーザ操作で再試行できるため握り潰し、ログのみ残す。
      console.error("mermaid: コードのコピーに失敗しました", error);
    }
  });

  return button;
};

/**
 * 描画済みの mermaid SVG すべてにコピーボタンを付与する。
 *
 * 既に付与済みの SVG はスキップするため、再描画後に再度呼んでも安全。
 *
 * @param {string} querySelector
 */
export const enableCopy = (querySelector) => {
  for (const target of document.querySelectorAll(querySelector)) {
    const svg = target.querySelector("svg");
    if (!svg) {
      continue;
    }

    // 退避した元コードが無い要素はコピー対象にしない。
    const source = target.dataset.mermaidSource;
    if (source === undefined) {
      continue;
    }

    // 再描画後の再適用などで二重に仕込まないようにする。
    if (svg.dataset.copyReady === "true") {
      continue;
    }
    svg.dataset.copyReady = "true";

    // zoom が作ったラッパがあれば再利用、無ければコピー専用ラッパを自作する。
    let wrapper = svg.closest(".mermaid-overlay");
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.className = "mermaid-copy mermaid-overlay";
      Object.assign(wrapper.style, {
        position: "relative",
        display: "inline-block",
        maxWidth: "100%",
      });
      svg.parentNode.insertBefore(wrapper, svg);
      wrapper.appendChild(svg);
    }

    injectStyle();
    const toolbar = ensureToolbar(wrapper);
    toolbar.appendChild(createCopyButton(source.trim()));
  }
};
