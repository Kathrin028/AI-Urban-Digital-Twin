import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin,
  LocateFixed,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Map as MapIcon,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { searchLocations, reverseGeocode } from "../../services/geocodingService";

// Default city center (Coimbatore, Tamil Nadu)
const DEFAULT_CENTER = [11.0168, 76.9558];

// Custom crisp SVG Pin Icon for Leaflet
const pinIcon = L.divIcon({
  html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;transform:translate(-50%, -100%);">
    <div style="background-color:#2563eb;color:white;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.3);border:2px solid #ffffff;">
      <div style="width:10px;height:10px;background-color:#ffffff;border-radius:50%;transform:rotate(45deg);"></div>
    </div>
  </div>`,
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34]
});

// Component to handle map clicks and drop pin
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Component to animate map view to target coordinates
function MapViewUpdater({ center, zoom = 15 }) {
  const map = useMap();
  useEffect(() => {
    if (center && Number.isFinite(center[0]) && Number.isFinite(center[1])) {
      map.flyTo(center, Math.max(map.getZoom(), zoom), { duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
}

// Invalidate size when map renders
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function LocationPicker({ location, setLocation }) {
  const [searchInput, setSearchInput] = useState(location?.address || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvancedCoords, setShowAdvancedCoords] = useState(false);
  const [showMap, setShowMap] = useState(true);

  const searchContainerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const hasCoordinates =
    location?.latitude !== "" &&
    location?.longitude !== "" &&
    Number.isFinite(parseFloat(location?.latitude)) &&
    Number.isFinite(parseFloat(location?.longitude));

  const currentCenter = hasCoordinates
    ? [parseFloat(location.latitude), parseFloat(location.longitude)]
    : DEFAULT_CENTER;

  // Sync internal search input if external address changes
  useEffect(() => {
    if (location?.address && location.address !== searchInput) {
      setSearchInput(location.address);
    }
  }, [location?.address]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for suggestions as user types
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setError(null);

    // Keep address in sync even before picking a specific coordinate
    setLocation(prev => ({
      ...prev,
      address: value
    }));

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim() || value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(value, 5);
        setSuggestions(results);
        setShowSuggestions(true);
        if (results.length === 0) {
          setError(`No locations found for "${value}". Try refining the name or select a location on the map.`);
        }
      } catch (err) {
        console.error("Geocoding search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  };

  // Explicit search button click or Enter key
  const triggerManualSearch = async () => {
    if (!searchInput.trim()) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    setIsSearching(true);
    setError(null);
    try {
      const results = await searchLocations(searchInput.trim(), 5);
      setSuggestions(results);
      setShowSuggestions(true);
      if (results.length > 0) {
        // Automatically select the best first match
        selectSuggestion(results[0]);
      } else {
        setError(`No matching location found for "${searchInput.trim()}". Try entering a landmark or click anywhere on the map to pin.`);
      }
    } catch (err) {
      console.error("Manual search failed:", err);
      setError("Address search is temporarily unavailable. Please pick your location on the map.");
    } finally {
      setIsSearching(false);
    }
  };

  // When user selects a suggestion from dropdown
  const selectSuggestion = (item) => {
    setLocation({
      address: searchInput.trim() ? `${searchInput.trim()}` : item.displayName,
      latitude: item.latitude,
      longitude: item.longitude
    });
    setSearchInput(item.displayName);
    setShowSuggestions(false);
    setError(null);
  };

  // Map click handler: drops pin, auto-fills coordinates, and reverse-geocodes
  const handleMapLocationSelect = useCallback(async (lat, lng) => {
    const formattedLat = parseFloat(lat).toFixed(6);
    const formattedLng = parseFloat(lng).toFixed(6);

    // Immediately set coordinates
    setLocation(prev => ({
      ...prev,
      latitude: formattedLat,
      longitude: formattedLng
    }));
    setError(null);

    // Reverse geocode to retrieve address
    setIsReverseGeocoding(true);
    try {
      const rev = await reverseGeocode(formattedLat, formattedLng);
      if (rev && rev.displayName) {
        setLocation(prev => ({
          ...prev,
          address: rev.displayName
        }));
        setSearchInput(rev.displayName);
      }
    } catch (err) {
      console.error("Reverse geocoding map click failed:", err);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, [setLocation]);

  // Use Current Location button handler
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);

        setLocation(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));

        try {
          const rev = await reverseGeocode(lat, lng);
          if (rev && rev.displayName) {
            setLocation(prev => ({
              ...prev,
              address: rev.displayName
            }));
            setSearchInput(rev.displayName);
          }
        } catch (err) {
          console.error("Reverse geocode on current location failed:", err);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        let msg = "Unable to retrieve your location.";
        if (err.code === 1) {
          msg = "Location permission was denied. Please allow location access or choose a location on the map.";
        } else if (err.code === 2) {
          msg = "Location information is unavailable.";
        } else if (err.code === 3) {
          msg = "Location request timed out. Please select on the map.";
        }
        setError(msg);
        setIsLocating(false);
      },
      options
    );
  };

  const clearSearch = () => {
    setSearchInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-semibold text-slate-900 tracking-tight">
            Complaint Location
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Search full address, enter a landmark, or click on the map.
          </p>
        </div>
      </div>

      {/* Confirmation Badge when valid coordinates are active */}
      {hasCoordinates && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-emerald-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            <div className="truncate text-[13px]">
              <span className="font-semibold text-emerald-900">Coordinates confirmed:</span>{" "}
              <span className="font-mono text-emerald-700">
                {parseFloat(location.latitude).toFixed(4)}° N, {parseFloat(location.longitude).toFixed(4)}° E
              </span>
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
            Ready
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 text-amber-900 text-[13px] font-medium border border-amber-200 flex items-start gap-2.5">
          <AlertCircle size={18} className="shrink-0 text-amber-600 mt-0.5" />
          <div className="leading-snug">
            {error}
          </div>
        </div>
      )}

      {/* Search Input Box with Suggestions */}
      <div className="relative mb-4" ref={searchContainerRef}>
        <label className="mb-2 block text-[14px] font-medium text-slate-700">
          Address or Landmark
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                triggerManualSearch();
              } else if (e.key === "Escape") {
                setShowSuggestions(false);
              }
            }}
            placeholder="e.g. Near PSG Hospital, Peelamedu, Coimbatore"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-24 text-[14px] text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-slate-400"
          />

          <div className="absolute right-2 flex items-center gap-1">
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                title="Clear"
              >
                <X size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={triggerManualSearch}
              disabled={isSearching || !searchInput.trim()}
              className="h-8 px-3 rounded-lg bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 disabled:opacity-40 transition flex items-center gap-1 shadow-sm"
              title="Search Location"
            >
              {isSearching ? (
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Search"
              )}
            </button>
          </div>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-[1000] left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-slate-900/10">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              Matching Suggestions ({suggestions.length})
            </div>
            {suggestions.map((item, idx) => (
              <button
                key={`${item.latitude}-${item.longitude}-${idx}`}
                type="button"
                onClick={() => selectSuggestion(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/70 transition flex items-start gap-2.5 border-b border-slate-50 last:border-b-0"
              >
                <MapPin size={16} className="shrink-0 text-blue-600 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-slate-900 truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {item.displayName}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <button
          onClick={getCurrentLocation}
          disabled={isLocating}
          type="button"
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition disabled:opacity-60 shadow-sm"
        >
          {isLocating ? (
            <div className="h-4 w-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <LocateFixed size={16} className="text-blue-600" />
          )}
          Use Current Location
        </button>

        <button
          onClick={() => setShowMap(prev => !prev)}
          type="button"
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-sm"
        >
          <MapIcon size={16} className="text-emerald-600" />
          {showMap ? "Hide Map" : "Select on Map"}
        </button>
      </div>

      {/* Interactive Leaflet Map fallback */}
      {showMap && (
        <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 relative shadow-sm">
          <div className="h-[260px] w-full z-0 relative">
            <MapContainer
              center={currentCenter}
              zoom={hasCoordinates ? 15 : 12}
              scrollWheelZoom={false}
              className="h-full w-full"
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onLocationSelect={handleMapLocationSelect} />
              <MapViewUpdater center={hasCoordinates ? currentCenter : null} />
              <MapResizer />
              {hasCoordinates && (
                <Marker position={currentCenter} icon={pinIcon}>
                  <Popup>
                    <div className="text-[12px] font-sans">
                      <p className="font-semibold text-slate-900 mb-1">Complaint Location</p>
                      <p className="text-slate-600 text-[11px]">{location.address || "Pinned location"}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">
                        {parseFloat(location.latitude).toFixed(5)}, {parseFloat(location.longitude).toFixed(5)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          <div className="bg-slate-50 px-3.5 py-2 border-t border-slate-200 flex items-center justify-between text-[12px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <MapPin size={13} className="text-blue-600" />
              {isReverseGeocoding ? "Identifying address..." : "Click anywhere on map to pin exact location"}
            </span>
            {hasCoordinates && (
              <span className="font-mono text-[11px] text-slate-600 font-medium">
                {parseFloat(location.latitude).toFixed(4)}, {parseFloat(location.longitude).toFixed(4)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Optional Advanced Coordinates Accordion (Never required for citizens) */}
      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => setShowAdvancedCoords(prev => !prev)}
          className="flex items-center justify-between w-full py-1.5 text-[12px] font-medium text-slate-400 hover:text-slate-600 transition"
        >
          <span>Manual Coordinate Override (Optional)</span>
          {showAdvancedCoords ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showAdvancedCoords && (
          <div className="grid grid-cols-2 gap-4 mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-500">
                Latitude (-90 to 90)
              </label>
              <input
                type="number"
                step="any"
                value={location?.latitude || ""}
                onChange={(e) => setLocation(prev => ({ ...prev, latitude: e.target.value }))}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-700 outline-none focus:border-blue-500 font-mono"
                placeholder="e.g. 11.0254"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-500">
                Longitude (-180 to 180)
              </label>
              <input
                type="number"
                step="any"
                value={location?.longitude || ""}
                onChange={(e) => setLocation(prev => ({ ...prev, longitude: e.target.value }))}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-700 outline-none focus:border-blue-500 font-mono"
                placeholder="e.g. 76.9678"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}