import { useState, useCallback, useRef } from "react";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchProps {
  onSelect: (lat: number, lng: number, name: string) => void;
  placeholder?: string;
}

const COLORS = {
  bg: "#0a0e1a",
  surface: "#161b22",
  border: "#30363d",
  text: "#c9d1d9",
  textMuted: "#8b949e",
  accent: "#00d4ff",
};

export default function LocationSearch({
  onSelect,
  placeholder = "Search location...",
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchLocation = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
        { headers: { "User-Agent": "OpenSentry-Training-Sim/1.0" } },
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocation(value), 300);
  };

  const handleSelect = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const name = result.display_name.split(",")[0];
    onSelect(lat, lng, name);
    setQuery(name);
    setResults([]);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "220px",
          padding: "6px 10px",
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "4px",
          color: COLORS.text,
          fontSize: "13px",
          outline: "none",
        }}
      />
      {searching && (
        <span
          style={{
            position: "absolute",
            right: "8px",
            top: "7px",
            fontSize: "11px",
            color: COLORS.textMuted,
          }}
        >
          ...
        </span>
      )}
      {results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "320px",
            maxHeight: "200px",
            overflowY: "auto",
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "4px",
            zIndex: 1000,
            marginTop: "2px",
          }}
        >
          {results.map((r) => (
            <div
              key={r.place_id}
              onClick={() => handleSelect(r)}
              style={{
                padding: "8px 10px",
                cursor: "pointer",
                fontSize: "12px",
                color: COLORS.text,
                borderBottom: `1px solid ${COLORS.border}`,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#1c2333")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {r.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
