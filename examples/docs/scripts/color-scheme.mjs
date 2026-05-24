const button = document.getElementById("change-color-scheme");

const isDark = () => {
  return globalThis.window.matchMedia &&
    globalThis.window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const getCurrentColorScheme = () => {
  return localStorage.getItem("color-scheme") ??
    (isDark() ? "dark" : "light");
};

export const setColorScheme = (colorScheme) => {
  const setColor = colorScheme === "light" ? "light" : "dark";
  const removeColor = colorScheme === "light" ? "dark" : "light";

  [document.body, button].forEach((element) => {
    element.classList.add(setColor);
    element.classList.remove(removeColor);
  });

  localStorage.setItem("color-scheme", setColor);
};

document.addEventListener("DOMContentLoaded", () => {
  setColorScheme(getCurrentColorScheme());

  button.addEventListener("click", () => {
    setColorScheme(getCurrentColorScheme() === "light" ? "dark" : "light");

    globalThis.dispatchEvent(
      new CustomEvent("changeColorScheme", {
        detail: {
          colorScheme: getCurrentColorScheme(),
        },
      }),
    );
  });
});
