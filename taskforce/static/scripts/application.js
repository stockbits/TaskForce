const documentElement = document.documentElement;
const navigationToggle = document.querySelector("[data-navigation-toggle]");
const navigationClose = document.querySelector("[data-navigation-close]");
const themeToggle = document.querySelector("[data-theme-toggle]");
const notificationRegion = document.querySelector("[data-notification-region]");
let notificationTimeout;

function setNavigation(open) {
  document.body.classList.toggle("navigation-open", open);
  navigationToggle?.setAttribute("aria-expanded", String(open));
  navigationToggle?.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
}

function readStoredTheme() {
  try {
    return window.localStorage.getItem("taskforce-colour-theme");
  } catch {
    return null;
  }
}

function setTheme(theme) {
  documentElement.dataset.theme = theme;
  themeToggle?.setAttribute(
    "aria-label",
    theme === "dark" ? "Use light colour theme" : "Use dark colour theme",
  );
}

function storeTheme(theme) {
  try {
    window.localStorage.setItem("taskforce-colour-theme", theme);
  } catch {
    // The preference is optional when browser storage is unavailable.
  }
}

function showNotification(message) {
  if (!notificationRegion || !message) return;
  window.clearTimeout(notificationTimeout);
  notificationRegion.textContent = message;
  notificationRegion.hidden = false;
  notificationTimeout = window.setTimeout(() => {
    notificationRegion.hidden = true;
  }, 5000);
}

setTheme(
  readStoredTheme() ??
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"),
);

navigationToggle?.addEventListener("click", () => {
  setNavigation(!document.body.classList.contains("navigation-open"));
});
navigationClose?.addEventListener("click", () => setNavigation(false));

themeToggle?.addEventListener("click", () => {
  const theme = documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(theme);
  storeTheme(theme);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setNavigation(false);
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const navigationLink = target.closest(".application-navigation a");
  if (navigationLink) setNavigation(false);

  const notificationButton = target.closest("[data-notification]");
  if (notificationButton) {
    showNotification(notificationButton.dataset.notification);
    notificationButton.closest("details")?.removeAttribute("open");
  }

  const openButton = target.closest("[data-dialog-open]");
  if (openButton) {
    document.getElementById(openButton.dataset.dialogOpen)?.showModal();
  }

  const closeButton = target.closest("[data-dialog-close]");
  if (closeButton) closeButton.closest("dialog")?.close();
});
