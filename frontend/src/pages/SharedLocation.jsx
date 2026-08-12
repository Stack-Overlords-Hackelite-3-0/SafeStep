import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSharedLocation } from "../api/location";
import MapView from "../components/MapView";

export default function SharedLocation() {
  const { token } = useParams();
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLocation = () =>
      getSharedLocation(token)
        .then(setLocation)
        .catch(() => setError("This share link is invalid or has expired."));

    fetchLocation();
    const interval = setInterval(fetchLocation, 15000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div className="page">
      <h1>{location ? `${location.full_name}'s Live Location` : "Live Location"}</h1>
      {error && <p className="form-error">{error}</p>}
      {location && (
        <>
          <MapView
            center={[location.latitude, location.longitude]}
            zoom={16}
            height="420px"
            userPosition={[location.latitude, location.longitude]}
            userAvatar={{
              name: location.full_name,
              style: location.avatar_style,
              seed: location.avatar_seed,
              background: location.avatar_background,
            }}
            showLocate={false}
          />
          <p className="hint">Last updated: {new Date(location.updated_at).toLocaleString()}</p>
        </>
      )}
    </div>
  );
}
