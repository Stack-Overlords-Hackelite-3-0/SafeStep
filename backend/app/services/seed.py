from sqlalchemy.orm import Session

from app.models.helper import Helper

# Sample verified helper network around Colombo, Sri Lanka - replace with real
# vetted partners before any real-world pilot.
_SEED_HELPERS = [
    {"name": "WIN Sri Lanka - Colombo Center", "phone": "0775676555", "helper_type": "safe_house", "latitude": 6.9271, "longitude": 79.8612},
    {"name": "Cinnamon Gardens Police Station", "phone": "0112695961", "helper_type": "police_station", "latitude": 6.9105, "longitude": 79.8621},
    {"name": "Fort Railway Station Help Desk", "phone": "0112421281", "helper_type": "volunteer", "latitude": 6.9344, "longitude": 79.8428},
    {"name": "Rajagiriya Pharmacy (24hr)", "phone": "0112861234", "helper_type": "shop", "latitude": 6.9095, "longitude": 79.8940},
    {"name": "Borella Junction Volunteer Post", "phone": "0112695000", "helper_type": "volunteer", "latitude": 6.9147, "longitude": 79.8778},
    {"name": "Dehiwala Police Station", "phone": "0112717222", "helper_type": "police_station", "latitude": 6.8519, "longitude": 79.8654},
]


def seed_helpers(db: Session) -> None:
    if db.query(Helper).first() is not None:
        return
    for data in _SEED_HELPERS:
        db.add(Helper(**data, verified=True, available=True))
    db.commit()
