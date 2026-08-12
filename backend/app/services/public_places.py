import logging
import math
import time

import requests

from app.schemas.public_place import PublicPlaceResponse

logger = logging.getLogger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# amenity tag -> (place_type key, fallback display name)
PLACE_TAGS = {
    "hospital": ("hospital", "Hospital"),
    "police": ("police_station", "Police Station"),
    "fire_station": ("fire_station", "Fire Station"),
    "pharmacy": ("pharmacy", "Pharmacy"),
    "clinic": ("clinic", "Clinic"),
}

_CACHE: dict[tuple[float, float, float], tuple[float, list[PublicPlaceResponse]]] = {}
_CACHE_TTL_SECONDS = 600


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    )
    return r * 2 * math.asin(math.sqrt(a))


def _build_query(lat: float, lng: float, radius_m: int) -> str:
    amenity_regex = "^(" + "|".join(PLACE_TAGS) + ")$"
    around = f"(around:{radius_m},{lat},{lng})"
    clauses = "".join(f'{kind}["amenity"~"{amenity_regex}"]{around};' for kind in ("node", "way"))
    return f"[out:json][timeout:25];({clauses});out center tags;"


def fetch_nearby_public_places(lat: float, lng: float, radius_km: float) -> list[PublicPlaceResponse]:
    # Round the cache key so nearby requests (e.g. minor GPS jitter) reuse the same
    # Overpass response instead of re-hitting the public rate-limited API.
    cache_key = (round(lat, 3), round(lng, 3), round(radius_km, 1))
    cached = _CACHE.get(cache_key)
    if cached and time.time() - cached[0] < _CACHE_TTL_SECONDS:
        return cached[1]

    radius_m = int(radius_km * 1000)
    query = _build_query(lat, lng, radius_m)

    try:
        resp = requests.post(
            OVERPASS_URL,
            data={"data": query},
            headers={"User-Agent": "SafeStep/1.0 (safety helper network)"},
            timeout=20,
        )
        resp.raise_for_status()
        elements = resp.json().get("elements", [])
    except (requests.RequestException, ValueError) as exc:
        logger.warning("Overpass lookup failed: %s", exc)
        return cached[1] if cached else []

    results: list[PublicPlaceResponse] = []
    for el in elements:
        amenity = el.get("tags", {}).get("amenity")
        if amenity not in PLACE_TAGS:
            continue
        place_type, fallback_name = PLACE_TAGS[amenity]

        if el["type"] == "node":
            place_lat, place_lng = el.get("lat"), el.get("lon")
        else:
            center = el.get("center") or {}
            place_lat, place_lng = center.get("lat"), center.get("lon")
        if place_lat is None or place_lng is None:
            continue

        results.append(
            PublicPlaceResponse(
                id=f"{el['type']}/{el['id']}",
                name=el.get("tags", {}).get("name") or fallback_name,
                place_type=place_type,
                latitude=place_lat,
                longitude=place_lng,
                distance_km=round(_haversine_km(lat, lng, place_lat, place_lng), 2),
            )
        )

    results.sort(key=lambda p: p.distance_km)
    _CACHE[cache_key] = (time.time(), results)
    return results
