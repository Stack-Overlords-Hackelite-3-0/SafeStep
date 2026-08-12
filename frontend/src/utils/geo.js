import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

// Plain navigator.geolocation isn't reliably wired up inside a Capacitor WebView
// (no native permission prompt without the plugin), so native builds go through
// @capacitor/geolocation instead — same return shape either way, so every call
// site (Dashboard, Helpers, RouteIntelligence, MapView, SOSButton, ...) works
// unchanged on both web and Android/iOS.
export async function getCurrentLocation() {
  if (Capacitor.isNativePlatform()) {
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
