import { Capacitor, registerPlugin } from "@capacitor/core";
import { API_BASE_URL } from "../api/client";

// Bridges to the native Android SosOverlayPlugin (android/app/src/main/java/
// com/safestep/app/SosOverlayPlugin.java) — a system-wide floating SOS bubble
// that stays visible over other apps and fires SOS directly, without opening
// SafeStep. No-op stubs on web/iOS, where this isn't available.
const SosOverlay = registerPlugin("SosOverlay");

export const isSosOverlaySupported = () => Capacitor.getPlatform() === "android";

export const syncSosOverlayCredentials = (token) => {
  if (!isSosOverlaySupported()) return Promise.resolve();
  return SosOverlay.setCredentials({ token, baseUrl: API_BASE_URL });
};

export const clearSosOverlayCredentials = () => {
  if (!isSosOverlaySupported()) return Promise.resolve();
  return SosOverlay.clearCredentials();
};

// The native bubble and the in-app floating SOS button both live outside any
// single page (App shell + system overlay), so a plain custom event is the
// simplest way to tell the in-app button "the native one just turned on/off,
// re-check" without threading shared state through React context.
const OVERLAY_STATE_EVENT = "safestep:sos-overlay-changed";

export const notifySosOverlayStateChanged = () => {
  window.dispatchEvent(new Event(OVERLAY_STATE_EVENT));
};

export const onSosOverlayStateChanged = (callback) => {
  window.addEventListener(OVERLAY_STATE_EVENT, callback);
  return () => window.removeEventListener(OVERLAY_STATE_EVENT, callback);
};

export default SosOverlay;
