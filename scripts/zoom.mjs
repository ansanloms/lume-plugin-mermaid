/**
 * mermaid が描画した SVG に、ホイール / ドラッグ / 操作ボタンによる
 * パン・ズーム機能を付与するランナースクリプト。
 *
 * mermaid.mjs から import して使う。SVG をラッパ要素で包み、
 * CSS transform で平行移動・拡大縮小する。transform はレイアウトに
 * 影響しないため、拡大しても周囲のテキストはガタつかない。
 *
 * @typedef {{
 *   enable: boolean,
 *   wheel?: boolean | ("ctrl" | "meta")[],
 *   aspectRatio?: string,
 *   maxWidth?: string,
 *   maxHeight?: string,
 * }} Zoom
 */

/**
 * ユーザ操作(ホイール / ボタン)で許容するズーム倍率の下限・上限。
 * 初期フィットの倍率はこの範囲に縛られない。
 */
const MIN_SCALE = 0.1;
const MAX_SCALE = 10;

/**
 * 操作ボタン 1 クリックあたりの倍率。
 */
const BUTTON_ZOOM_STEP = 1.2;

/**
 * 値を [min, max] の範囲に収める。
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * "4:3" 形式のアスペクト比指定を CSS の aspect-ratio 値 ("4 / 3") に変換する。
 * 既に "/" 区切りの場合はそのまま通す。
 *
 * @param {string} value
 * @returns {string}
 */
const toCssAspectRatio = (value) => value.replace(":", " / ");

/**
 * wheel 設定に基づき、このホイールイベントでズームすべきか判定する。
 *
 * @param {WheelEvent} event
 * @param {boolean | ("ctrl" | "meta")[]} wheel
 * @returns {boolean}
 */
const shouldZoomOnWheel = (event, wheel) => {
  if (wheel === true) {
    return true;
  }
  if (Array.isArray(wheel)) {
    return wheel.some((key) =>
      (key === "ctrl" && event.ctrlKey) || (key === "meta" && event.metaKey)
    );
  }
  return false;
};

/**
 * 操作ボタン 1 つを生成する。
 *
 * @param {string} label ボタンに表示する記号。
 * @param {string} title ツールチップ。
 * @param {() => void} onClick クリック時の処理。
 * @returns {HTMLButtonElement}
 */
const createButton = (label, title, onClick) => {
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

/**
 * 右上に配置する操作ボタン群を生成する。
 *
 * @param {{ zoomIn: () => void, zoomOut: () => void, reset: () => void }} handlers
 * @returns {HTMLDivElement}
 */
const createControls = (handlers) => {
  const controls = document.createElement("div");
  controls.className = "mermaid-zoom-controls";

  Object.assign(controls.style, {
    position: "absolute",
    top: "8px",
    right: "8px",
    display: "flex",
    gap: "4px",
    zIndex: "1",
  });

  controls.append(
    createButton("−", "縮小", handlers.zoomOut),
    createButton("↺", "リセット", handlers.reset),
    createButton("+", "拡大", handlers.zoomIn),
  );

  return controls;
};

/**
 * 1 つの mermaid SVG にパン・ズーム操作と操作ボタンを仕込む。
 *
 * @param {SVGElement} svg
 * @param {{ aspectRatio: string, wheel: boolean | ("ctrl" | "meta")[], maxWidth: string, maxHeight: string }} settings
 */
const setupZoom = (svg, settings) => {
  const { aspectRatio, wheel, maxWidth, maxHeight } = settings;

  // 再描画後の再適用などで二重に仕込まないようにする。
  if (svg.dataset.zoomReady === "true") {
    return;
  }
  svg.dataset.zoomReady = "true";

  const wrapper = document.createElement("div");
  wrapper.className = "mermaid-panzoom";
  Object.assign(wrapper.style, {
    overflow: "hidden",
    position: "relative",
    cursor: "grab",
    touchAction: "none",
    width: "100%",
  });
  if (aspectRatio) {
    wrapper.style.aspectRatio = aspectRatio;
  }
  if (maxWidth) {
    wrapper.style.maxWidth = maxWidth;
  }
  if (maxHeight) {
    wrapper.style.maxHeight = maxHeight;
  }

  svg.parentNode.insertBefore(wrapper, svg);
  wrapper.appendChild(svg);

  svg.style.transformOrigin = "0 0";
  if (aspectRatio) {
    // aspect-ratio 領域では svg を通常フローから外し、
    // 領域の高さが中身に押し広げられず比率だけで決まるようにする。
    Object.assign(svg.style, {
      position: "absolute",
      top: "0",
      left: "0",
      maxWidth: "none",
    });
  } else {
    svg.style.maxWidth = "100%";
  }

  let scale = 1;
  let translateX = 0;
  let translateY = 0;

  const apply = () => {
    svg.style.transform =
      `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  };

  // 図全体を領域に収める(contain)。リセット時の基準状態でもある。
  const fit = () => {
    svg.style.transform = "none";
    const view = svg.getBoundingClientRect();
    const cw = wrapper.clientWidth;
    const ch = wrapper.clientHeight;

    if (view.width > 0 && view.height > 0 && cw > 0 && ch > 0) {
      scale = Math.min(cw / view.width, ch / view.height);
      translateX = (cw - view.width * scale) / 2;
      translateY = (ch - view.height * scale) / 2;
    } else {
      scale = 1;
      translateX = 0;
      translateY = 0;
    }

    apply();
  };

  // (pointerX, pointerY) を固定点として倍率を factor 倍する。
  const zoomAt = (pointerX, pointerY, factor) => {
    const nextScale = clamp(scale * factor, MIN_SCALE, MAX_SCALE);
    const ratio = nextScale / scale;
    translateX = pointerX - (pointerX - translateX) * ratio;
    translateY = pointerY - (pointerY - translateY) * ratio;
    scale = nextScale;
    apply();
  };

  // ラッパ中心を固定点にズームする(操作ボタン用)。
  const zoomFromCenter = (factor) => {
    const rect = wrapper.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, factor);
  };

  wrapper.addEventListener("wheel", (event) => {
    if (!shouldZoomOnWheel(event, wheel)) {
      return;
    }
    event.preventDefault();

    const rect = wrapper.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;

    zoomAt(pointerX, pointerY, factor);
  }, { passive: false });

  let dragging = false;
  let originX = 0;
  let originY = 0;

  wrapper.addEventListener("pointerdown", (event) => {
    dragging = true;
    originX = event.clientX - translateX;
    originY = event.clientY - translateY;
    wrapper.style.cursor = "grabbing";
    wrapper.setPointerCapture(event.pointerId);
  });

  wrapper.addEventListener("pointermove", (event) => {
    if (!dragging) {
      return;
    }
    translateX = event.clientX - originX;
    translateY = event.clientY - originY;
    apply();
  });

  const endDrag = () => {
    dragging = false;
    wrapper.style.cursor = "grab";
  };

  wrapper.addEventListener("pointerup", endDrag);
  wrapper.addEventListener("pointercancel", endDrag);

  // ダブルクリックでフィット状態に戻す。
  wrapper.addEventListener("dblclick", fit);

  wrapper.appendChild(createControls({
    zoomIn: () => zoomFromCenter(BUTTON_ZOOM_STEP),
    zoomOut: () => zoomFromCenter(1 / BUTTON_ZOOM_STEP),
    reset: fit,
  }));

  // 初期表示は領域にフィットさせる。
  fit();
};

/**
 * 描画済みの mermaid SVG すべてにパン・ズームを有効化する。
 *
 * 既に有効化済みの SVG はスキップするため、再描画後に再度呼んでも安全。
 *
 * @param {string} querySelector
 * @param {Zoom} [zoom]
 */
export const enableZoom = (querySelector, zoom = { enable: true }) => {
  if (zoom.enable === false) {
    return;
  }

  const aspectRatio = zoom.aspectRatio
    ? toCssAspectRatio(zoom.aspectRatio)
    : "";
  const wheel = zoom.wheel ?? false;
  const maxWidth = zoom.maxWidth ?? "";
  const maxHeight = zoom.maxHeight ?? "";

  for (const target of document.querySelectorAll(querySelector)) {
    const svg = target.querySelector("svg");
    if (svg) {
      setupZoom(svg, { aspectRatio, wheel, maxWidth, maxHeight });
    }
  }
};
