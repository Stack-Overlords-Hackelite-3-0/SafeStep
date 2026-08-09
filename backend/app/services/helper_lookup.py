import math
import uuid

from sqlalchemy.orm import Session

from app.models.helper import Helper
from app.models.location import LocationPing

_NEARBY_KEYWORDS = [
    "nearest police",
    "nearest station",
    "police station",
    "nearest helper",
    "helper near",
    "help near me",
    "police near me",
    "safe house near",
    "where is the nearest",
    "closest police",
    "closest helper",
    "closest station",
]

_HELPER_TYPE_LABELS = {
    "en": {"police_station": "Police Station", "volunteer": "Volunteer", "shop": "Shop", "safe_house": "Safe House"},
    "si": {
        "police_station": "පොලිස් ස්ථානය",
        "volunteer": "ස්වේච්ඡා සේවකයා",
        "shop": "සාප්පුව",
        "safe_house": "ආරක්ෂිත නිවස",
    },
    "ta": {
        "police_station": "காவல் நிலையம்",
        "volunteer": "தன்னார்வலர்",
        "shop": "கடை",
        "safe_house": "பாதுகாப்பான இல்லம்",
    },
}

_STRINGS = {
    "en": {
        "intro": "Here's what I found near your last known location:",
        "distance": "{km} km away",
        "phone": "Phone: {phone}",
        "no_location": (
            "I don't have your current location yet. Please allow location access, or start location "
            "sharing from the Dashboard, then ask me again. You can also check the Helper Network page "
            "for the full list."
        ),
        "no_helpers": (
            "I couldn't find any verified helpers near your last known location yet. Please check the "
            "Helper Network page for the full list, or call the police emergency line 119 if this is urgent."
        ),
    },
    "si": {
        "intro": "ඔබේ අවසන් දන්නා ස්ථානය ආසන්නයේ මට හමු වූයේ මෙයයි:",
        "distance": "කි.මී. {km} ක් දුරින්",
        "phone": "දුරකථනය: {phone}",
        "no_location": (
            "මට තවම ඔබේ වත්මන් ස්ථානය නොදනී. කරුණාකර ස්ථාන ප්‍රවේශයට අවසර දෙන්න, හෝ උපකරණ පුවරුවෙන් ස්ථාන "
            "බෙදාගැනීම ආරම්භ කර නැවත මගෙන් අසන්න. සම්පූර්ණ ලැයිස්තුව සඳහා උදව්කරු ජාලයේ පිටුව ද පරීක්ෂා කළ හැක."
        ),
        "no_helpers": (
            "ඔබේ අවසන් දන්නා ස්ථානය ආසන්නයේ සත්‍යාපිත උදව්කරුවන් තවම හමු නොවීය. සම්පූර්ණ ලැයිස්තුව සඳහා "
            "උදව්කරු ජාලයේ පිටුව පරීක්ෂා කරන්න, නැතහොත් මෙය හදිසි නම් 119 අමතන්න."
        ),
    },
    "ta": {
        "intro": "உங்கள் கடைசியாக அறியப்பட்ட இருப்பிடத்திற்கு அருகில் நான் கண்டறிந்தவை:",
        "distance": "{km} கி.மீ தொலைவில்",
        "phone": "தொலைபேசி: {phone}",
        "no_location": (
            "உங்கள் தற்போதைய இருப்பிடம் என்னிடம் இன்னும் இல்லை. இருப்பிட அணுகலை அனுமதிக்கவும், அல்லது "
            "டாஷ்போர்டில் இருந்து இருப்பிடப் பகிர்வைத் தொடங்கி மீண்டும் என்னிடம் கேளுங்கள். முழு பட்டியலுக்கு "
            "உதவியாளர் வலையமைப்பு பக்கத்தையும் பார்க்கலாம்."
        ),
        "no_helpers": (
            "உங்கள் கடைசியாக அறியப்பட்ட இருப்பிடத்திற்கு அருகில் சரிபார்க்கப்பட்ட உதவியாளர்கள் யாரும் "
            "இதுவரை கிடைக்கவில்லை. முழு பட்டியலுக்கு உதவியாளர் வலையமைப்பு பக்கத்தைப் பார்க்கவும், அல்லது "
            "இது அவசரமானால் 119 ஐ அழைக்கவும்."
        ),
    },
}


def is_nearby_helper_query(message: str) -> bool:
    m = message.lower()
    return any(kw in m for kw in _NEARBY_KEYWORDS)


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    )
    return r * 2 * math.asin(math.sqrt(a))


def _find_nearby(db: Session, user_id: uuid.UUID, police_only: bool, top_k: int, radius_km: float):
    ping = db.query(LocationPing).filter(LocationPing.user_id == user_id).first()
    if ping is None:
        return None

    query = db.query(Helper).filter(Helper.available.is_(True))
    if police_only:
        query = query.filter(Helper.helper_type == "police_station")

    scored = []
    for h in query.all():
        d = _haversine_km(ping.latitude, ping.longitude, h.latitude, h.longitude)
        if d <= radius_km:
            scored.append((h, round(d, 2)))
    scored.sort(key=lambda pair: pair[1])
    return scored[:top_k]


def answer_nearby_helper_query(
    db: Session, user_id: uuid.UUID, message: str, language: str, top_k: int = 3, radius_km: float = 15.0
) -> str:
    """Answers a "nearest police/helper" question directly from the app's own
    Helper Network + location data, so the reply is always factually grounded
    (real names, phones, distances) rather than left to the LLM to guess."""
    language = language if language in _STRINGS else "en"
    strings = _STRINGS[language]
    type_labels = _HELPER_TYPE_LABELS[language]

    police_only = "police" in message.lower()
    results = _find_nearby(db, user_id, police_only, top_k, radius_km)

    if results is None:
        return strings["no_location"]
    if not results:
        return strings["no_helpers"]

    lines = [strings["intro"], ""]
    for i, (helper, distance) in enumerate(results, start=1):
        type_label = type_labels.get(helper.helper_type, helper.helper_type)
        line = f"{i}. {helper.name} ({type_label}) - {strings['distance'].format(km=distance)}"
        if helper.phone:
            line += f". {strings['phone'].format(phone=helper.phone)}"
        lines.append(line)

    return "\n".join(lines)
