import { useState } from "react";
import { MapPin, LocateFixed, Search } from "lucide-react";

export default function LocationPicker({ location, setLocation }) {
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude.toFixed(6);
      const lng = position.coords.longitude.toFixed(6);
      
      let addressStr = location.address;
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, { headers: { "Accept-Language": "en-US,en;q=0.9" }});
        const data = await res.json();
        if (data && data.display_name) {
          addressStr = data.display_name;
        }
      } catch (err) {
        console.error("Reverse geocoding failed", err);
      }

      setLocation({
        latitude: lat,
        longitude: lng,
        address: addressStr
      });
      setIsLocating(false);
    }, () => {
      setError("Unable to retrieve your location.");
      setIsLocating(false);
    });
  };

  const handleAddressSearch = async () => {
    if (!location.address) return;
    setIsGeocoding(true);
    setError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location.address)}`;
      const res = await fetch(url, { headers: { "Accept-Language": "en-US,en;q=0.9" }});
      if (!res.ok) {
        throw new Error("API returned status " + res.status);
      }
      const data = await res.json();
      if (data && data.length > 0) {
        setLocation({
          address: data[0].display_name || location.address,
          latitude: parseFloat(data[0].lat).toFixed(6),
          longitude: parseFloat(data[0].lon).toFixed(6)
        });
      } else {
        setError("Address not found. Try a more specific address.");
      }
    } catch (err) {
      console.error("Geocoding failed", err);
      setError("Address search is temporarily unavailable.");
    }
    setIsGeocoding(false);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <h2 className="mb-6 text-[18px] font-semibold text-slate-900 tracking-tight">
        Complaint Location
      </h2>

      {error && (
        <div className="mb-5 p-3 rounded-xl bg-red-50 text-red-700 text-[14px] font-medium border border-red-100">
          {error}
        </div>
      )}

      <div className="mb-5">
        <label className="mb-2 block text-[14px] font-medium text-slate-700">
          Address
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={location.address || ""}
            onChange={(e) => setLocation({ ...location, address: e.target.value })}
            className="h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-[15px] text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Gandhipuram, Coimbatore"
          />
          <button
            type="button"
            onClick={handleAddressSearch}
            disabled={isGeocoding || !location.address}
            className="flex h-12 items-center justify-center rounded-xl bg-blue-50 px-4 text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition"
            title="Search Coordinates"
          >
            {isGeocoding ? <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <Search size={20} />}
          </button>
        </div>
      </div>

      <div className="mb-4 text-center text-[13px] font-bold text-slate-400 uppercase tracking-wider">
        OR
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-700">
            Latitude
          </label>
          <input
            type="number"
            step="any"
            min="-90"
            max="90"
            value={location.latitude}
            onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-[15px] text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. 11.0254"
          />
        </div>

        <div>
          <label className="mb-2 block text-[14px] font-medium text-slate-700">
            Longitude
          </label>
          <input
            type="number"
            step="any"
            min="-180"
            max="180"
            value={location.longitude}
            onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-[15px] text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. 76.9678"
          />
        </div>
      </div>

      <button
        onClick={getCurrentLocation}
        disabled={isLocating}
        type="button"
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-[15px] font-semibold text-white hover:bg-slate-800 transition disabled:opacity-70 shadow-[0_2px_10px_rgba(15,23,42,0.1)]"
      >
        {isLocating ? (
          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <LocateFixed size={20} />
        )}
        Use Current Location
      </button>

      <div className="mt-5 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-[14px] font-medium text-blue-700">
        <MapPin className="shrink-0 text-blue-600" size={20} />
        <span className="leading-relaxed">You can enter an address manually or use your current location.</span>
      </div>
    </div>
  );
}