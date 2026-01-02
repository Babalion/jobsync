// Basic lat/lng lookup for common countries plus a deterministic fallback.
const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  germany: { lat: 51.1657, lng: 10.4515 },
  usa: { lat: 37.0902, lng: -95.7129 },
  unitedstates: { lat: 37.0902, lng: -95.7129 },
  "united states": { lat: 37.0902, lng: -95.7129 },
  canada: { lat: 56.1304, lng: -106.3468 },
  france: { lat: 46.2276, lng: 2.2137 },
  spain: { lat: 40.4637, lng: -3.7492 },
  italy: { lat: 41.8719, lng: 12.5674 },
  uk: { lat: 55.3781, lng: -3.436 },
  "united kingdom": { lat: 55.3781, lng: -3.436 },
  netherlands: { lat: 52.1326, lng: 5.2913 },
  belgium: { lat: 50.5039, lng: 4.4699 },
  switzerland: { lat: 46.8182, lng: 8.2275 },
  austria: { lat: 47.5162, lng: 14.5501 },
  poland: { lat: 51.9194, lng: 19.1451 },
  sweden: { lat: 60.1282, lng: 18.6435 },
  norway: { lat: 60.472, lng: 8.4689 },
  finland: { lat: 61.9241, lng: 25.7482 },
  denmark: { lat: 56.2639, lng: 9.5018 },
  portugal: { lat: 39.3999, lng: -8.2245 },
  ireland: { lat: 53.1424, lng: -7.6921 },
  india: { lat: 20.5937, lng: 78.9629 },
  australia: { lat: -25.2744, lng: 133.7751 },
  japan: { lat: 36.2048, lng: 138.2529 },
  china: { lat: 35.8617, lng: 104.1954 },
  singapore: { lat: 1.3521, lng: 103.8198 },
  brazil: { lat: -14.235, lng: -51.9253 },
  mexico: { lat: 23.6345, lng: -102.5528 },
};

const hashToCoord = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 3600) / 10; // 0..360
  const lng = normalized - 180;
  const lat = ((Math.abs(hash / 3600) % 1800) / 10) - 90;
  return { lat, lng };
};

const hashToEuroCoord = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  // Roughly bound to Europe box: lat 35..70, lng -10..40
  const lat = 35 + (Math.abs(hash) % 3500) / 100; // 35-70
  const lng = -10 + (Math.abs(hash >> 3) % 5000) / 100; // -10 to 40
  return { lat, lng };
};

export const getCoordsForLocation = (
  locationLabel?: string,
  countryLabel?: string,
  zipCode?: string
) => {
  const base = (zipCode || countryLabel || locationLabel || "").toLowerCase().trim();
  if (!base) {
    return { lat: 0, lng: 0 };
  }
  return COUNTRY_COORDS[base] || hashToEuroCoord(base);
};
