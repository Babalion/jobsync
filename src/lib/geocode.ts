import { getCoordsForLocation } from "./data/countryCoords";

type GeocodeParams = {
  city?: string;
  zipCode?: string;
  country?: string;
};

export const geocodeLocation = async ({
  city,
  zipCode,
  country,
}: GeocodeParams): Promise<{ lat?: number; lng?: number }> => {
  const query = [zipCode, city, country].filter(Boolean).join(" ");
  if (!query) return {};

  const params = new URLSearchParams({
    format: "json",
    limit: "1",
    q: query,
  });

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        "User-Agent": "jobsync-map/1.0",
      },
    });
    if (res.ok) {
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (data?.length) {
        const first = data[0];
        return {
          lat: Number(first.lat),
          lng: Number(first.lon),
        };
      }
    }
  } catch (err) {
    console.error("Geocoding failed, falling back to heuristic", err);
  }

  const fallback = getCoordsForLocation(city, country, zipCode);
  return fallback;
};
