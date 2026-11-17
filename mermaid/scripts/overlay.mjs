/**
 * mermaid 図のオーバーレイ UI(操作ボタン群)の共通基盤。
 *
 * zoom.mjs(パン・ズーム)と copy.mjs(コードのコピー)の双方から使う。
 * 図を包むラッパの右上に 1 つのツールバーを置き、各機能はそこへ
 * ボタンを追加する。ツールバーはラッパへのマウスオーバー時のみ表示する。
 */

/**
 * ホバー表示用スタイルを 1 度だけ <head> に注入する。
 *
 * ツールバーは通常 opacity: 0 / pointer-events: none で隠し、
 * 親ラッパ(.mermaid-overlay)へのホバー時とフォーカス時のみ表示する。
 * inline style では :hover 疑似クラスを表現できないため <style> で注入する。
 */
export const injectStyle = () => {
  const id = "mermaid-overlay-style";
  if (document.getElementById(id)) {
    return;
  }

  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
.mermaid-toolbar {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}
.mermaid-overlay:hover > .mermaid-toolbar,
.mermaid-overlay:focus-within > .mermaid-toolbar {
  opacity: 1;
  pointer-events: auto;
}
`.trim();

  document.head.appendChild(style);
};

/**
 * ラッパ右上のツールバーを確保する。既にあればそれを返す(冪等)。
 *
 * zoom と copy は適用順に関わらずこの関数を呼ぶことで、同じツールバーへ
 * 各自のボタンを追加できる。
 *
 * @param {HTMLElement} wrapper 図を包むラッパ要素。
 * @returns {HTMLDivElement}
 */
export const ensureToolbar = (wrapper) => {
  const existing = wrapper.querySelector(":scope > .mermaid-toolbar");
  if (existing) {
    return existing;
  }

  const toolbar = document.createElement("div");
  toolbar.className = "mermaid-toolbar";

  Object.assign(toolbar.style, {
    position: "absolute",
    top: "8px",
    right: "8px",
    display: "flex",
    gap: "4px",
    zIndex: "1",
  });

  wrapper.appendChild(toolbar);
  return toolbar;
};

/**
 * ツールバーに並べる操作ボタンを 1 つ生成する。
 *
 * @param {string} label ボタンに表示する記号。
 * @param {string} title ツールチップ。
 * @param {() => void} onClick クリック時の処理。
 * @returns {HTMLButtonElement}
 */
export const createButton = (label, title, onClick) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.title = title;

  Object.assign(button.style, {
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
    margin: "0",
    fontSize: "18px",
    lineHeight: "1",
    cursor: "pointer",
    border: "1px solid rgba(0, 0, 0, 0.15)",
    borderRadius: "6px",
    background: "rgba(255, 255, 255, 0.85)",
    color: "#24292f",
  });

  // ボタン操作をラッパのドラッグ・ダブルクリック判定に巻き込ませない。
  button.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
  button.addEventListener("dblclick", (event) => {
    event.stopPropagation();
  });
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });

  return button;
};
