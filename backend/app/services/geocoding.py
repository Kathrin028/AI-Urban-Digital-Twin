import re
import urllib.parse
import json
import logging
from typing import List, Dict, Any, Tuple
import requests

logger = logging.getLogger(__name__)

USER_AGENT = "UrbanMindAI-CivicTwin/1.0 (urbanmind.ai civic platform; contact: kathrin2006200@gmail.com)"

# In-memory LRU/query cache to provide instant results and adhere to OSM 1-req/sec policy
_GEOCODE_CACHE: Dict[str, List[Dict[str, Any]]] = {}
_REVERSE_CACHE: Dict[Tuple[float, float], Dict[str, Any]] = {}

# Session for connection reuse
_session = requests.Session()
_session.headers.update({
    "User-Agent": USER_AGENT,
    "Accept-Language": "en-US,en;q=0.9"
})

# Curated Coimbatore Localities & Landmarks Directory
# Provides instant, authoritative resolution for common citizen search queries
COIMBATORE_LOCALITIES_DIRECTORY = [
    {
        "name": "Chinniampalayam (Avinashi Road)",
        "aliases": [
            "chinniampalayam", "chinniyampalayam", "chinniampalayam coimbatore",
            "chinniyampalayam coimbatore", "goldwins", "airport road chinniampalayam"
        ],
        "display_name": "Chinniampalayam, Avinashi Road, Goldwins, Ward 35, East Zone, Coimbatore, Tamil Nadu, 641062, India",
        "lat": "11.055126",
        "lon": "77.065515",
        "type": "suburb"
    },
    {
        "name": "Chinniyampalayam (Pollachi Road)",
        "aliases": [
            "chinniyampalayam pollachi", "chinniampalayam pollachi",
            "chinniyampalayam, pollachi", "pollachi chinniyampalayam"
        ],
        "display_name": "Chinniyampalayam, Pollachi, Coimbatore, Tamil Nadu, 642001, India",
        "lat": "10.657736",
        "lon": "77.037416",
        "type": "suburb"
    },
    {
        "name": "Peelamedu",
        "aliases": [
            "peelamedu", "pilamedu", "peelamedu coimbatore", "pilamedu coimbatore",
            "peelamedu pudur", "peelamedu station"
        ],
        "display_name": "Peelamedu, Ward 39, North Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641004, India",
        "lat": "11.027783",
        "lon": "76.998616",
        "type": "suburb"
    },
    {
        "name": "PSG Hospital & College (Peelamedu)",
        "aliases": [
            "psg hospital", "psg hospital peelamedu", "psg tech", "psg medical college",
            "psg hospital coimbatore", "psg imsr", "near psg hospital", "psg bridge"
        ],
        "display_name": "PSG Hospital, Avinashi Road, Peelamedu, Ward 38, North Zone, Coimbatore, Tamil Nadu, 641004, India",
        "lat": "11.024671",
        "lon": "77.007649",
        "type": "hospital"
    },
    {
        "name": "Pattanam",
        "aliases": [
            "pattanam", "pattanam coimbatore", "pattanam sulur", "pattanam pudur",
            "as nagar pattanam", "as nagar, pattanam"
        ],
        "display_name": "Pattanam, Sulur, Coimbatore, Tamil Nadu, 641016, India",
        "lat": "10.980414",
        "lon": "77.055187",
        "type": "village"
    },
    {
        "name": "Gandhipuram",
        "aliases": [
            "gandhipuram", "gandhipuram coimbatore", "cross cut road", "crosscut road",
            "gandhipuram bus stand", "central bus stand coimbatore"
        ],
        "display_name": "Gandhipuram, Ward 51, Central Zone, Coimbatore, Tamil Nadu, 641012, India",
        "lat": "11.018271",
        "lon": "76.967774",
        "type": "suburb"
    },
    {
        "name": "RS Puram (R.S. Puram)",
        "aliases": [
            "rs puram", "r.s. puram", "r.s.puram", "rathinasabapathy puram",
            "db road", "d.b. road", "rs puram coimbatore", "r.s. puram coimbatore"
        ],
        "display_name": "RS Puram, Ward 24, West Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641002, India",
        "lat": "11.008018",
        "lon": "76.950166",
        "type": "suburb"
    },
    {
        "name": "Saravanampatti",
        "aliases": [
            "saravanampatti", "saravanampatty", "saravanampatti coimbatore",
            "saravanampatty coimbatore", "sathy road saravanampatti"
        ],
        "display_name": "Saravanampatti, Villangkurichi, Ward 32, East Zone, Coimbatore, Tamil Nadu, 641035, India",
        "lat": "11.074730",
        "lon": "77.002712",
        "type": "suburb"
    },
    {
        "name": "Singanallur",
        "aliases": [
            "singanallur", "singanalloor", "singanallur coimbatore", "singanallur bus stand",
            "trichy road singanallur"
        ],
        "display_name": "Singanallur, East Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641005, India",
        "lat": "11.012469",
        "lon": "77.039119",
        "type": "suburb"
    },
    {
        "name": "Ukkadam",
        "aliases": [
            "ukkadam", "ukkadam bus stand", "ukkadam lake", "ukkadam coimbatore"
        ],
        "display_name": "Ukkadam, South Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641001, India",
        "lat": "10.993214",
        "lon": "76.961623",
        "type": "suburb"
    },
    {
        "name": "Saibaba Colony",
        "aliases": [
            "saibaba colony", "sai baba colony", "nsr road", "saibaba colony coimbatore"
        ],
        "display_name": "Saibaba Colony, Ward 20, West Zone, Coimbatore North, Coimbatore, Tamil Nadu, 641011, India",
        "lat": "11.028742",
        "lon": "76.946312",
        "type": "suburb"
    },
    {
        "name": "Ganapathy",
        "aliases": [
            "ganapathy", "ganapathy coimbatore", "ganapathy sathy road"
        ],
        "display_name": "Ganapathy, Ward 44, North Zone, Coimbatore North, Coimbatore, Tamil Nadu, 641006, India",
        "lat": "11.036615",
        "lon": "76.978210",
        "type": "suburb"
    },
    {
        "name": "Ramanathapuram",
        "aliases": [
            "ramanathapuram", "ramanathapuram coimbatore", "trichy road ramanathapuram"
        ],
        "display_name": "Ramanathapuram, Ward 64, Central Zone, Coimbatore, Tamil Nadu, 641045, India",
        "lat": "11.000624",
        "lon": "76.990215",
        "type": "suburb"
    },
    {
        "name": "Hopes College (Avinashi Road)",
        "aliases": [
            "hopes college", "hopes", "hope college", "hopes peelamedu", "hopes coimbatore"
        ],
        "display_name": "Hopes College, Avinashi Road, Peelamedu, East Zone, Coimbatore, Tamil Nadu, 641004, India",
        "lat": "11.028912",
        "lon": "77.021941",
        "type": "suburb"
    },
    {
        "name": "Kalapatti",
        "aliases": [
            "kalapatti", "kalapatty", "kalapatti coimbatore", "kalapatti airport road"
        ],
        "display_name": "Kalapatti, Ward 33, East Zone, Coimbatore, Tamil Nadu, 641048, India",
        "lat": "11.071829",
        "lon": "77.034512",
        "type": "suburb"
    },
    {
        "name": "Thudiyalur",
        "aliases": [
            "thudiyalur", "thudiyaloor", "thudiyalur coimbatore", "mettupalayam road thudiyalur"
        ],
        "display_name": "Thudiyalur, North Zone, Coimbatore North, Coimbatore, Tamil Nadu, 641034, India",
        "lat": "11.079214",
        "lon": "76.938912",
        "type": "suburb"
    },
    {
        "name": "Vadavalli",
        "aliases": [
            "vadavalli", "vadavali", "vadavalli coimbatore", "marudhamalai road vadavalli"
        ],
        "display_name": "Vadavalli, West Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641041, India",
        "lat": "11.022415",
        "lon": "76.902214",
        "type": "suburb"
    },
    {
        "name": "Kuniamuthur",
        "aliases": [
            "kuniamuthur", "kuniyamuthur", "kuniamuthur coimbatore", "palakkad road kuniamuthur"
        ],
        "display_name": "Kuniamuthur, South Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641008, India",
        "lat": "10.957612",
        "lon": "76.956014",
        "type": "suburb"
    },
    {
        "name": "Ondipudur",
        "aliases": [
            "ondipudur", "ondi pudur", "ondipudur coimbatore", "trichy road ondipudur"
        ],
        "display_name": "Ondipudur, Ward 56, East Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641016, India",
        "lat": "11.003912",
        "lon": "77.042514",
        "type": "suburb"
    },
    {
        "name": "Sulur",
        "aliases": [
            "sulur", "sulur coimbatore", "sulur air force", "sulur bus stand"
        ],
        "display_name": "Sulur, Coimbatore, Tamil Nadu, 641402, India",
        "lat": "11.024812",
        "lon": "77.126415",
        "type": "town"
    },
    {
        "name": "Podanur",
        "aliases": [
            "podanur", "podanur junction", "podanur station", "podanur coimbatore"
        ],
        "display_name": "Podanur, South Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641023, India",
        "lat": "10.963214",
        "lon": "76.974912",
        "type": "suburb"
    },
    {
        "name": "Kovaipudur",
        "aliases": [
            "kovaipudur", "kovai pudur", "kovaipudur coimbatore"
        ],
        "display_name": "Kovaipudur, South Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641042, India",
        "lat": "10.938112",
        "lon": "76.935114",
        "type": "suburb"
    },
    {
        "name": "KMCH (Kovai Medical Center & Hospital)",
        "aliases": [
            "kmch", "kmch hospital", "kovai medical center", "kmch avinashi road", "kmch coimbatore"
        ],
        "display_name": "KMCH Hospital, Avinashi Road, Civil Aerodrome Post, Coimbatore, Tamil Nadu, 641014, India",
        "lat": "11.048712",
        "lon": "77.042614",
        "type": "hospital"
    },
    {
        "name": "Ganga Hospital",
        "aliases": [
            "ganga hospital", "ganga hospital mettupalayam road", "ganga hospital coimbatore"
        ],
        "display_name": "Ganga Hospital, 313, Mettupalayam Road, Saibaba Koil, Coimbatore, Tamil Nadu, 641043, India",
        "lat": "11.020512",
        "lon": "76.950814",
        "type": "hospital"
    },
    {
        "name": "Coimbatore Railway Junction",
        "aliases": [
            "coimbatore railway station", "coimbatore junction", "cbe station", "railway station coimbatore"
        ],
        "display_name": "Coimbatore Junction Railway Station, State Bank Road, Gopalapuram, Coimbatore, Tamil Nadu, 641018, India",
        "lat": "10.997914",
        "lon": "76.964912",
        "type": "station"
    },
    {
        "name": "Coimbatore International Airport",
        "aliases": [
            "coimbatore airport", "coimbatore international airport", "civil aerodrome coimbatore"
        ],
        "display_name": "Coimbatore International Airport, Airport Road, Peelamedu, Coimbatore, Tamil Nadu, 641014, India",
        "lat": "11.030014",
        "lon": "77.043412",
        "type": "aerodrome"
    }
]

def normalize_query(query_str: str) -> str:
    """Normalize whitespace, punctuation, acronyms, and common noise."""
    if not query_str:
        return ""
    q = query_str.strip()

    # 1. Collapse multiple whitespace
    q = " ".join(q.split())

    # 2. Normalize acronym periods: R.S. Puram -> RS Puram, A.S. Nagar -> AS Nagar, P.S.G. -> PSG
    q = re.sub(r'(?<=\b[A-Za-z])\.(?=[A-Za-z]|\s|,|$)', '', q)

    # 3. Clean spaces around commas and slashes
    q = re.sub(r'\s*,\s*', ', ', q)
    q = re.sub(r'\s*/\s*', '/', q)

    # 4. Collapse multiple commas
    q = re.sub(r',+', ',', q)

    return q.strip()

def strip_door_number(q: str) -> str:
    """Remove door/house/flat/plot/survey numbers from beginning of address."""
    p = re.compile(
        r'^\s*(?:d(?:oor)?\.?\s*no\.?|flat\s*(?:no\.?)?|plot\s*(?:no\.?)?|site\s*(?:no\.?)?|s(?:urvey)?\.?\s*no\.?|no\.?|#)?\s*'
        r'\d+[\w\-]*(?:[/-]\d+[\w\-]*)?\s*,\s*',
        re.IGNORECASE
    )
    return p.sub('', q).strip()

def strip_landmark_prefix(q: str) -> str:
    """Remove relative landmark prefixes such as 'Near', 'Opposite', 'Behind'."""
    p = re.compile(
        r'^\s*(?:near\s*(?:by)?|opp(?:osite|\.|\s)?|behind|beside|next\s*to|in\s*front\s*of|close\s*to|adj(?:acent|\.|\s)?(?:\s*to)?)\s+',
        re.IGNORECASE
    )
    return p.sub('', q).strip()

def apply_spelling_variations(text: str) -> List[str]:
    """Generate spelling variants for common locality names."""
    variants = []
    text_lower = text.lower()

    replacements = [
        ("chinniyampalayam", "chinniampalayam"),
        ("chinniampalayam", "chinniyampalayam"),
        ("peelamedu", "pilamedu"),
        ("pilamedu", "peelamedu"),
        ("saravanampatty", "saravanampatti"),
        ("saravanampatti", "saravanampatty"),
        ("singanalloor", "singanallur"),
        ("thudiyaloor", "thudiyalur"),
        ("koundampalayam", "goundampalayam"),
        ("goundampalayam", "koundampalayam"),
        ("kuniyamuthur", "kuniamuthur"),
        ("kuniamuthur", "kuniyamuthur"),
        ("kovai pudur", "kovaipudur"),
        ("kovaipudur", "kovai pudur"),
        ("ondi pudur", "ondipudur"),
        ("ondipudur", "ondi pudur")
    ]

    for old, new in replacements:
        if old in text_lower:
            pattern = re.compile(re.escape(old), re.IGNORECASE)
            variant = pattern.sub(new, text)
            if variant not in variants and variant.lower() != text_lower:
                variants.append(variant)

    return variants

def generate_query_variations(query_str: str) -> List[str]:
    """Generate intelligent ordered search variations from specific to broad."""
    variations: List[str] = []

    norm_q = normalize_query(query_str)
    if not norm_q:
        return variations

    def add(item: str):
        cleaned = normalize_query(item)
        if cleaned and cleaned not in variations:
            variations.append(cleaned)

    # 1. Normalized full query
    add(norm_q)

    # 2. Spelling variants of full query
    for v in apply_spelling_variations(norm_q):
        add(v)

    # 3. Clean landmark prefixes
    landmark_clean = strip_landmark_prefix(norm_q)
    if landmark_clean != norm_q:
        add(landmark_clean)
        for v in apply_spelling_variations(landmark_clean):
            add(v)

    # 4. Clean door numbers
    door_clean = strip_door_number(norm_q)
    if door_clean != norm_q:
        add(door_clean)
        for v in apply_spelling_variations(door_clean):
            add(v)

    # 5. Clean both door number and landmark prefix
    both_clean = strip_landmark_prefix(door_clean)
    if both_clean != door_clean:
        add(both_clean)
        for v in apply_spelling_variations(both_clean):
            add(v)

    # 6. Progressive comma segments (e.g. "AS Nagar, Pattanam, Coimbatore" -> "Pattanam, Coimbatore")
    parts = [p.strip() for p in both_clean.split(',') if p.strip()]
    if len(parts) >= 3:
        for i in range(1, len(parts)):
            sub_q = ', '.join(parts[i:])
            add(sub_q)
            for v in apply_spelling_variations(sub_q):
                add(v)
    elif len(parts) == 2:
        # e.g., "Pattanam, Coimbatore"
        add(', '.join(parts))

    # 7. City context enhancement
    # If "coimbatore" is not mentioned, add a variant with ", Coimbatore"
    if "coimbatore" not in norm_q.lower():
        add(f"{both_clean}, Coimbatore")
        if len(parts) > 1:
            add(f"{parts[-1]}, Coimbatore")

    return variations

def search_localities_directory(query_str: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Match query against known Coimbatore localities and landmarks directory."""
    q_norm = normalize_query(query_str).lower()
    if not q_norm:
        return []

    q_tokens = set(re.findall(r'\b[a-z]{3,}\b', q_norm))
    # Exclude common stop words
    stop_words = {"near", "the", "opposite", "behind", "beside", "road", "street", "nagar", "coimbatore"}
    substantive_tokens = q_tokens - stop_words

    matches = []
    seen_coords = set()

    for item in COIMBATORE_LOCALITIES_DIRECTORY:
        score = 0
        item_name_lower = item["name"].lower()

        # Check alias exact matches or substring matches
        for alias in item["aliases"]:
            if alias == q_norm:
                score += 100
                break
            elif alias in q_norm:
                score += 50
                break
            elif q_norm in alias:
                score += 30
                break

        # Token overlap
        alias_tokens = set()
        for a in item["aliases"]:
            alias_tokens.update(re.findall(r'\b[a-z]{3,}\b', a))
        overlap = substantive_tokens.intersection(alias_tokens)
        score += len(overlap) * 20

        if score > 0:
            key = (round(float(item["lat"]), 4), round(float(item["lon"]), 4))
            if key not in seen_coords:
                seen_coords.add(key)
                matches.append((score, {
                    "display_name": item["display_name"],
                    "name": item["name"],
                    "lat": str(item["lat"]),
                    "lon": str(item["lon"]),
                    "type": item["type"],
                    "matched_query": query_str,
                    "source": "verified_directory"
                }))

    # Sort descending by relevance score
    matches.sort(key=lambda x: x[0], reverse=True)
    return [m[1] for m in matches[:limit]]

def geocode_address(query_str: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Geocode an address or landmark query into coordinates with multiple suggestions.
    Combines local directory lookup and live OpenStreetMap Nominatim queries.
    Never returns fake city-center coordinates.
    """
    clean_q = normalize_query(query_str)
    if not clean_q or len(clean_q) < 2:
        return []

    # Check in-memory cache
    if clean_q in _GEOCODE_CACHE:
        return _GEOCODE_CACHE[clean_q][:limit]

    all_results: List[Dict[str, Any]] = []
    seen_coords = set()

    def add_result(r: Dict[str, Any]):
        try:
            lat = round(float(r["lat"]), 4)
            lon = round(float(r["lon"]), 4)
            key = (lat, lon)
            if key not in seen_coords:
                seen_coords.add(key)
                all_results.append(r)
        except (ValueError, KeyError):
            pass

    # 1. Check verified directory for immediate, accurate matches
    dir_matches = search_localities_directory(clean_q, limit=limit)
    for dm in dir_matches:
        add_result(dm)

    # If verified directory matched, return immediately to provide instant response and avoid rate limits
    if len(all_results) > 0:
        _GEOCODE_CACHE[clean_q] = all_results[:limit]
        return all_results[:limit]

    # 2. Query Nominatim with top intelligent variations if directory had no match
    variations = generate_query_variations(clean_q)

    for candidate in variations[:3]:
        if len(all_results) >= limit:
            break

        params = {
            "format": "json",
            "q": candidate,
            "limit": limit,
            "addressdetails": 1
        }

        try:
            resp = _session.get(
                "https://nominatim.openstreetmap.org/search",
                params=params,
                timeout=2.5
            )
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list):
                    for item in data:
                        # Avoid silently adding broad city boundaries when looking for specific places
                        if item.get("type") in ("city", "administrative") and len(all_results) > 0:
                            continue
                        add_result({
                            "display_name": item.get("display_name", ""),
                            "name": item.get("name") or item.get("display_name", "").split(",")[0].strip(),
                            "lat": str(item.get("lat")),
                            "lon": str(item.get("lon")),
                            "type": item.get("type", "location"),
                            "matched_query": candidate,
                            "source": "osm_nominatim"
                        })
                        if len(all_results) >= limit:
                            break
        except Exception as e:
            logger.debug(f"Nominatim search timed out or failed for candidate '{candidate}': {e}")
            continue

    _GEOCODE_CACHE[clean_q] = all_results[:limit]
    return all_results[:limit]

def reverse_geocode(lat: float, lon: float) -> Dict[str, Any]:
    """
    Reverse geocode coordinates into a human-readable display address.
    """
    cache_key = (round(lat, 5), round(lon, 5))
    if cache_key in _REVERSE_CACHE:
        return _REVERSE_CACHE[cache_key]

    # 1. Proximity check against curated directory (< 350 meters)
    for item in COIMBATORE_LOCALITIES_DIRECTORY:
        try:
            d_lat = abs(float(item["lat"]) - lat)
            d_lon = abs(float(item["lon"]) - lon)
            # Approx distance in degrees (~0.003 is ~330m)
            if d_lat < 0.003 and d_lon < 0.003:
                res = {
                    "display_name": item["display_name"],
                    "lat": str(lat),
                    "lon": str(lon),
                    "address": {
                        "suburb": item["name"],
                        "city": "Coimbatore",
                        "state": "Tamil Nadu"
                    }
                }
                _REVERSE_CACHE[cache_key] = res
                return res
        except (ValueError, KeyError):
            pass

    # 2. Live Nominatim reverse lookup
    params = {
        "format": "json",
        "lat": lat,
        "lon": lon,
        "addressdetails": 1
    }
    try:
        resp = _session.get(
            "https://nominatim.openstreetmap.org/reverse",
            params=params,
            timeout=4.0
        )
        if resp.status_code == 200:
            data = resp.json()
            res = {
                "display_name": data.get("display_name", f"{lat:.6f}, {lon:.6f}"),
                "lat": str(data.get("lat", lat)),
                "lon": str(data.get("lon", lon)),
                "address": data.get("address", {})
            }
            _REVERSE_CACHE[cache_key] = res
            return res
    except Exception as e:
        logger.warning(f"Reverse geocode failed for ({lat}, {lon}): {e}")

    fallback = {
        "display_name": f"{lat:.6f}, {lon:.6f}",
        "lat": str(lat),
        "lon": str(lon),
        "address": {}
    }
    _REVERSE_CACHE[cache_key] = fallback
    return fallback
