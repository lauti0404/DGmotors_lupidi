let deferred = null;
const listeners = new Set();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event;
    listeners.forEach((listener) => listener(true));
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((listener) => listener(false));
  });
}

export function onInstallable(listener) {
  listeners.add(listener);
  listener(Boolean(deferred));
  return () => listeners.delete(listener);
}

export function canInstall() {
  return Boolean(deferred);
}

export async function promptInstall() {
  if (!deferred) return false;
  deferred.prompt();
  const choice = await deferred.userChoice;
  deferred = null;
  listeners.forEach((listener) => listener(false));
  return choice?.outcome === "accepted";
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function isIos() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  const device = /iPad|iPhone|iPod/.test(ua);
  const iPadOs = window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
  return device || iPadOs;
}
