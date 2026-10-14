import { fetchApi } from './api';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Curated Coimbatore directory for instant client-side resolution
export const COIMBATORE_LOCALITIES_DIRECTORY = [
  {
    name: "Chinniampalayam (Avinashi Road)",
    aliases: ["chinniampalayam", "chinniyampalayam", "chinniampalayam coimbatore", "chinniyampalayam coimbatore", "goldwins"],
    displayName: "Chinniampalayam, Avinashi Road, Goldwins, Ward 35, East Zone, Coimbatore, Tamil Nadu, 641062, India",
    latitude: "11.055126",
    longitude: "77.065515",
    type: "suburb"
  },
  {
    name: "Chinniyampalayam (Pollachi Road)",
    aliases: ["chinniyampalayam pollachi", "chinniampalayam pollachi", "pollachi chinniyampalayam"],
    displayName: "Chinniyampalayam, Pollachi, Coimbatore, Tamil Nadu, 642001, India",
    latitude: "10.657736",
    longitude: "77.037416",
    type: "suburb"
  },
  {
    name: "Peelamedu",
    aliases: ["peelamedu", "pilamedu", "peelamedu coimbatore", "pilamedu coimbatore", "peelamedu pudur"],
    displayName: "Peelamedu, Ward 39, North Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641004, India",
    latitude: "11.027783",
    longitude: "76.998616",
    type: "suburb"
  },
  {
    name: "PSG Hospital & College (Peelamedu)",
    aliases: ["psg hospital", "psg hospital peelamedu", "psg tech", "psg medical college", "psg hospital coimbatore", "near psg hospital"],
    displayName: "PSG Hospital, Avinashi Road, Peelamedu, Ward 38, North Zone, Coimbatore, Tamil Nadu, 641004, India",
    latitude: "11.024671",
    longitude: "77.007649",
    type: "hospital"
  },
  {
    name: "Pattanam",
    aliases: ["pattanam", "pattanam coimbatore", "pattanam sulur", "pattanam pudur", "as nagar pattanam", "as nagar, pattanam"],
    displayName: "Pattanam, Sulur, Coimbatore, Tamil Nadu, 641016, India",
    latitude: "10.980414",
    longitude: "77.055187",
    type: "village"
  },
  {
    name: "Gandhipuram",
    aliases: ["gandhipuram", "gandhipuram coimbatore", "cross cut road", "crosscut road", "central bus stand coimbatore"],
    displayName: "Gandhipuram, Ward 51, Central Zone, Coimbatore, Tamil Nadu, 641012, India",
    latitude: "11.018271",
    longitude: "76.967774",
    type: "suburb"
  },
  {
    name: "RS Puram (R.S. Puram)",
    aliases: ["rs puram", "r.s. puram", "r.s.puram", "rathinasabapathy puram", "db road", "d.b. road", "rs puram coimbatore"],
    displayName: "RS Puram, Ward 24, West Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641002, India",
    latitude: "11.008018",
    longitude: "76.950166",
    type: "suburb"
  },
  {
    name: "Saravanampatti",
    aliases: ["saravanampatti", "saravanampatty", "saravanampatti coimbatore", "saravanampatty coimbatore"],
    displayName: "Saravanampatti, Villangkurichi, Ward 32, East Zone, Coimbatore, Tamil Nadu, 641035, India",
    latitude: "11.074730",
    longitude: "77.002712",
    type: "suburb"
  },
  {
    name: "Singanallur",
    aliases: ["singanallur", "singanalloor", "singanallur coimbatore", "singanallur bus stand", "trichy road singanallur"],
    displayName: "Singanallur, East Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641005, India",
    latitude: "11.012469",
    longitude: "77.039119",
    type: "suburb"
  },
  {
    name: "Ukkadam",
    aliases: ["ukkadam", "ukkadam bus stand", "ukkadam lake", "ukkadam coimbatore"],
    displayName: "Ukkadam, South Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641001, India",
    latitude: "10.993214",
    longitude: "76.961623",
    type: "suburb"
  },
  {
    name: "Saibaba Colony",
    aliases: ["saibaba colony", "sai baba colony", "nsr road", "saibaba colony coimbatore"],
    displayName: "Saibaba Colony, Ward 20, West Zone, Coimbatore North, Coimbatore, Tamil Nadu, 641011, India",
    latitude: "11.028742",
    longitude: "76.946312",
    type: "suburb"
  },
  {
    name: "Ganapathy",
    aliases: ["ganapathy", "ganapathy coimbatore", "ganapathy sathy road"],
    displayName: "Ganapathy, Ward 44, North Zone, Coimbatore North, Coimbatore, Tamil Nadu, 641006, India",
    latitude: "11.036615",
    longitude: "76.978210",
    type: "suburb"
  },
  {
    name: "Ramanathapuram",
    aliases: ["ramanathapuram", "ramanathapuram coimbatore", "trichy road ramanathapuram"],
    displayName: "Ramanathapuram, Ward 64, Central Zone, Coimbatore, Tamil Nadu, 641045, India",
    latitude: "11.000624",
    longitude: "76.990215",
    type: "suburb"
  },
  {
    name: "Hopes College (Avinashi Road)",
    aliases: ["hopes college", "hopes", "hope college", "hopes peelamedu", "hopes coimbatore"],
    displayName: "Hopes College, Avinashi Road, Peelamedu, East Zone, Coimbatore, Tamil Nadu, 641004, India",
    latitude: "11.028912",
    longitude: "77.021941",
    type: "suburb"
  },
  {
    name: "Kalapatti",
    aliases: ["kalapatti", "kalapatty", "kalapatti coimbatore"],
    displayName: "Kalapatti, Ward 33, East Zone, Coimbatore, Tamil Nadu, 641048, India",
    latitude: "11.071829",
    longitude: "77.034512",
    type: "suburb"
  },
  {
    name: "Thudiyalur",
    aliases: ["thudiyalur", "thudiyaloor", "thudiyalur coimbatore"],
    displayName: "Thudiyalur, North Zone, Coimbatore North, Coimbatore, Tamil Nadu, 641034, India",
    latitude: "11.079214",
    longitude: "76.938912",
    type: "suburb"
  },
  {
    name: "Vadavalli",
    aliases: ["vadavalli", "vadavali", "vadavalli coimbatore", "marudhamalai road"],
    displayName: "Vadavalli, West Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641041, India",
    latitude: "11.022415",
    longitude: "76.902214",
    type: "suburb"
  },
  {
    name: "Kuniamuthur",
    aliases: ["kuniamuthur", "kuniyamuthur", "kuniamuthur coimbatore"],
    displayName: "Kuniamuthur, South Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641008, India",
    latitude: "10.957612",
    longitude: "76.956014",
    type: "suburb"
  },
  {
    name: "Ondipudur",
    aliases: ["ondipudur", "ondi pudur", "ondipudur coimbatore"],
    displayName: "Ondipudur, Ward 56, East Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641016, India",
    latitude: "11.003912",
    longitude: "77.042514",
    type: "suburb"
  },
  {
    name: "Sulur",
    aliases: ["sulur", "sulur coimbatore", "sulur bus stand"],
    displayName: "Sulur, Coimbatore, Tamil Nadu, 641402, India",
    latitude: "11.024812",
    longitude: "77.126415",
    type: "town"
  },
  {
    name: "Podanur",
    aliases: ["podanur", "podanur junction", "podanur coimbatore"],
    displayName: "Podanur, South Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641023, India",
    latitude: "10.963214",
    longitude: "76.974912",
    type: "suburb"
  },
  {
    name: "Kovaipudur",
    aliases: ["kovaipudur", "kovai pudur", "kovaipudur coimbatore"],
    displayName: "Kovaipudur, South Zone, Coimbatore South, Coimbatore, Tamil Nadu, 641042, India",
    latitude: "10.938112",
    longitude: "76.935114",
    type: "suburb"
  },
  {
    name: "KMCH (Kovai Medical Center & Hospital)",
    aliases: ["kmch", "kmch hospital", "kovai medical center", "kmch avinashi road"],
    displayName: "KMCH Hospital, Avinashi Road, Civil Aerodrome Post, Coimbatore, Tamil Nadu, 641014, India",
    latitude: "11.048712",
    longitude: "77.042614",
    type: "hospital"
  },
  {
    name: "Ganga Hospital",
    aliases: ["ganga hospital", "ganga hospital mettupalayam road", "ganga hospital coimbatore"],
    displayName: "Ganga Hospital, 313, Mettupalayam Road, Saibaba Koil, Coimbatore, Tamil Nadu, 641043, India",
    latitude: "11.020512",
    longitude: "76.950814",
    type: "hospital"
  },
  {
    name: "Coimbatore Railway Junction",
    aliases: ["coimbatore railway station", "coimbatore junction", "cbe station"],
    displayName: "Coimbatore Junction Railway Station, State Bank Road, Gopalapuram, Coimbatore, Tamil Nadu, 641018, India",
    latitude: "10.997914",
    longitude: "76.964912",
    type: "station"
  },
  {
    name: "Coimbatore International Airport",
    aliases: ["coimbatore airport", "coimbatore international airport", "civil aerodrome coimbatore"],
    displayName: "Coimbatore International Airport, Airport Road, Peelamedu, Coimbatore, Tamil Nadu, 641014, India",
    latitude: "11.030014",
    longitude: "77.043412",
    type: "aerodrome"
  }
];

/**
 * Normalize whitespace, punctuation, acronyms, and noise
 */
export function normalizeQuery(queryStr) {
  if (!queryStr) return "";
  let q = queryStr.trim();
  // Collapse whitespace
  q = q.replace(/\s+/g, ' ');
  // Clean acronyms: R.S. Puram -> RS Puram, A.S. -> AS, P.S.G. -> PSG
  q = q.replace(/(?<=\b[A-Za-z])\.(?=[A-Za-z]|\s|,|$)/g, '');
  // Clean spaces around commas & slashes
  q = q.replace(/\s*,\s*/g, ', ');
  q = q.replace(/\s*\/\s*/g, '/');
  // Collapse duplicate commas
  q = q.replace(/,+/g, ',');
  return q.trim();
}

/**
 * Strip door / flat / plot numbers from beginning of address
 */
export function stripDoorNumber(q) {
  return q.replace(
    /^\s*(?:d(?:oor)?\.?\s*no\.?|flat\s*(?:no\.?)?|plot\s*(?:no\.?)?|site\s*(?:no\.?)?|s(?:urvey)?\.?\s*no\.?|no\.?|#)?\s*\d+[\w\-]*(?:[/-]\d+[\w\-]*)?\s*,\s*/i,
    ''
  ).trim();
}

/**
 * Strip relational landmark prefixes like 'Near', 'Opposite', 'Behind'
 */
export function stripLandmarkPrefix(q) {
  return q.replace(
    /^\s*(?:near\s*(?:by)?|opp(?:osite|\.|\s)?|behind|beside|next\s*to|in\s*front\s*of|close\s*to|adj(?:acent|\.|\s)?(?:\s*to)?)\s+/i,
    ''
  ).trim();
}

/**
 * Apply common spelling variations
 */
export function applySpellingVariations(text) {
  const variants = [];
  const lower = text.toLowerCase();
  const pairs = [
    ["chinniyampalayam", "chinniampalayam"],
    ["chinniampalayam", "chinniyampalayam"],
    ["peelamedu", "pilamedu"],
    ["pilamedu", "peelamedu"],
    ["saravanampatty", "saravanampatti"],
    ["saravanampatti", "saravanampatty"],
    ["singanalloor", "singanallur"],
    ["thudiyaloor", "thudiyalur"],
    ["koundampalayam", "goundampalayam"],
    ["goundampalayam", "koundampalayam"],
    ["kuniyamuthur", "kuniamuthur"],
    ["kuniamuthur", "kuniyamuthur"],
    ["kovai pudur", "kovaipudur"],
    ["kovaipudur", "kovai pudur"],
    ["ondi pudur", "ondipudur"],
    ["ondipudur", "ondi pudur"]
  ];

  for (const [oldW, newW] of pairs) {
    if (lower.includes(oldW)) {
      const regex = new RegExp(oldW, 'gi');
      const v = text.replace(regex, newW);
      if (!variants.includes(v) && v.toLowerCase() !== lower) {
        variants.push(v);
      }
    }
  }
  return variants;
}

/**
 * Generate smart ordered query variations
 */
export function generateQueryVariations(rawQuery) {
  const variations = [];
  const normQ = normalizeQuery(rawQuery);
  if (!normQ) return variations;

  function add(item) {
    const cleaned = normalizeQuery(item);
    if (cleaned && !variations.includes(cleaned)) {
      variations.push(cleaned);
    }
  }

  // 1. Full normalized query
  add(normQ);

  // 2. Spelling variants of full query
  applySpellingVariations(normQ).forEach(add);

  // 3. Clean landmark prefixes
  const landmarkClean = stripLandmarkPrefix(normQ);
  if (landmarkClean !== normQ) {
    add(landmarkClean);
    applySpellingVariations(landmarkClean).forEach(add);
  }

  // 4. Clean door numbers
  const doorClean = stripDoorNumber(normQ);
  if (doorClean !== normQ) {
    add(doorClean);
    applySpellingVariations(doorClean).forEach(add);
  }

  // 5. Clean both door and landmark
  const bothClean = stripLandmarkPrefix(doorClean);
  if (bothClean !== doorClean) {
    add(bothClean);
    applySpellingVariations(bothClean).forEach(add);
  }

  // 6. Progressive comma segments
  const parts = bothClean.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    for (let i = 1; i < parts.length; i++) {
      const sub = parts.slice(i).join(', ');
      add(sub);
      applySpellingVariations(sub).forEach(add);
    }
  }

  // 7. Context enhancement: append Coimbatore if not already present
  if (!normQ.toLowerCase().includes('coimbatore')) {
    add(`${bothClean}, Coimbatore`);
    if (parts.length > 1) {
      add(`${parts[parts.length - 1]}, Coimbatore`);
    }
  }

  return variations;
}

/**
 * Search local directory
 */
export function searchLocalDirectory(query, limit = 5) {
  const normQ = normalizeQuery(query).toLowerCase();
  if (!normQ) return [];

  const tokens = normQ.match(/\b[a-z]{3,}\b/g) || [];
  const stopWords = new Set(["near", "the", "opposite", "behind", "beside", "road", "street", "nagar", "coimbatore"]);
  const substantive = tokens.filter(t => !stopWords.has(t));

  const matches = [];
  const seen = new Set();

  for (const item of COIMBATORE_LOCALITIES_DIRECTORY) {
    let score = 0;
    for (const alias of item.aliases) {
      if (alias === normQ) {
        score += 100;
        break;
      } else if (alias.includes(normQ) || normQ.includes(alias)) {
        score += 50;
        break;
      }
    }

    const aliasTokens = new Set((item.aliases.join(' ').match(/\b[a-z]{3,}\b/g)) || []);
    for (const t of substantive) {
      if (aliasTokens.has(t)) {
        score += 25;
      }
    }

    if (score > 0) {
      const key = `${parseFloat(item.latitude).toFixed(3)},${parseFloat(item.longitude).toFixed(3)}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({ score, item });
      }
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit).map(m => ({
    name: m.item.name,
    displayName: m.item.displayName,
    latitude: m.item.latitude,
    longitude: m.item.longitude,
    type: m.item.type,
    source: "verified_directory"
  }));
}

/**
 * Direct client fallback to Nominatim in case the backend proxy is unavailable
 */
async function searchNominatimDirect(query, limit = 5) {
  const variations = generateQueryVariations(query);
  const seen = new Set();
  const allResults = [];

  for (const candidate of variations.slice(0, 3)) {
    try {
      const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(candidate)}&limit=${limit}&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const item of data) {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
          if (!seen.has(key)) {
            seen.add(key);
            allResults.push({
              displayName: item.display_name,
              name: item.name || item.display_name.split(',')[0],
              latitude: lat.toFixed(6),
              longitude: lon.toFixed(6),
              type: item.type || 'location'
            });
          }
        }
      }
      if (allResults.length >= limit) break;
    } catch {
      // Continue to next variation
    }
  }

  return allResults.slice(0, limit);
}

/**
 * Search locations with suggestions
 */
export async function searchLocations(query, limit = 5) {
  const cleanQ = normalizeQuery(query);
  if (!cleanQ || cleanQ.length < 2) return [];

  // 1. Try backend endpoint first
  try {
    const data = await fetchApi(`/api/geocoding/search?q=${encodeURIComponent(cleanQ)}&limit=${limit}`, {
      method: 'GET'
    });
    if (Array.isArray(data) && data.length > 0) {
      return data.map(item => ({
        displayName: item.display_name,
        name: item.name || item.display_name.split(',')[0],
        latitude: parseFloat(item.lat).toFixed(6),
        longitude: parseFloat(item.lon).toFixed(6),
        type: item.type || 'location'
      }));
    }
  } catch (backendErr) {
    console.warn('Backend geocoding search failed, trying local directory + Nominatim:', backendErr);
  }

  // 2. Check local directory fallback
  const dirResults = searchLocalDirectory(cleanQ, limit);
  if (dirResults.length > 0) {
    return dirResults;
  }

  // 3. Fallback to direct client geocoding
  return await searchNominatimDirect(cleanQ, limit);
}

/**
 * Reverse geocode coordinates to human-readable address
 */
export async function reverseGeocode(lat, lng) {
  const numericLat = parseFloat(lat);
  const numericLng = parseFloat(lng);
  if (isNaN(numericLat) || isNaN(numericLng)) return null;

  // 1. Check local directory proximity (< 350 meters)
  for (const item of COIMBATORE_LOCALITIES_DIRECTORY) {
    const dLat = Math.abs(parseFloat(item.latitude) - numericLat);
    const dLon = Math.abs(parseFloat(item.longitude) - numericLng);
    if (dLat < 0.003 && dLon < 0.003) {
      return {
        displayName: item.displayName,
        address: { suburb: item.name, city: "Coimbatore", state: "Tamil Nadu" }
      };
    }
  }

  // 2. Try backend endpoint
  try {
    const data = await fetchApi(`/api/geocoding/reverse?lat=${numericLat}&lon=${numericLng}`, {
      method: 'GET'
    });
    if (data && data.display_name) {
      return {
        displayName: data.display_name,
        address: data.address || {}
      };
    }
  } catch (backendErr) {
    console.warn('Backend reverse geocoding failed, trying direct Nominatim fallback:', backendErr);
  }

  // 3. Fallback to direct Nominatim
  try {
    const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${numericLat}&lon=${numericLng}&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        return {
          displayName: data.display_name,
          address: data.address || {}
        };
      }
    }
  } catch (err) {
    console.error('Reverse geocoding error:', err);
  }

  return {
    displayName: `${numericLat.toFixed(6)}, ${numericLng.toFixed(6)}`,
    address: {}
  };
}
