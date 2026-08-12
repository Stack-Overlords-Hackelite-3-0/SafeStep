import { useEffect } from "react";
import { updateLocation } from "../api/location";
import { getCurrentLocation } from "../utils/geo";

const PUSH_INTERVAL_MS = 30000;

// Keeps the logged-in user's last-known location fresh in the backend so any
// mutually-accepted trusted contact can see it on their dashboard map — this
// runs for as long as the app is open, independent of the separate public
// share-link feature (which is opt-in and time-limited).
export default function usePassiveLocationSync(enabled) {
  useEffect(() => {
    if (!enabled) return;

    const push = () => {
      getCurrentLocation()
        .then(({ latitude, longitude }) => updateLocation(latitude, longitude))
        .catch(() => {
          // Permission denied or unavailable — trusted contacts just won't see
          // this user on the map, which fails safe (no crash, no retry storm).
        });
    };

    push();
    const interval = setInterval(push, PUSH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled]);
}
