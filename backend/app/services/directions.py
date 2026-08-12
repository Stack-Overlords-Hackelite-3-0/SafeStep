import logging

import requests

from app.schemas.directions import DirectionsResponse

logger = logging.getLogger(__name__)

OSRM_URL = "https://router.project-osrm.org/route/v1/{profile}/{coords}"


def fetch_shortest_path(
    from_lat: float, from_lng: float, to_lat: float, to_lng: float, profile: str = "foot"
) -> DirectionsResponse | None:
    coords = f"{from_lng},{from_lat};{to_lng},{to_lat}"
    url = OSRM_URL.format(profile=profile, coords=coords)

    try:
        resp = requests.get(
            url,
            params={"overview": "full", "geometries": "geojson"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except (requests.RequestException, ValueError) as exc:
        logger.warning("OSRM directions lookup failed: %s", exc)
        return None

    routes = data.get("routes") or []
    if not routes:
        return None

    route = routes[0]
    # OSRM returns [lng, lat] pairs; Leaflet wants [lat, lng].
    coordinates = [[lat, lng] for lng, lat in route["geometry"]["coordinates"]]

    return DirectionsResponse(
        distance_km=round(route["distance"] / 1000, 2),
        duration_min=round(route["duration"] / 60, 1),
        coordinates=coordinates,
    )
