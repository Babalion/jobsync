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

// Approximate centroids for German postal code areas (first 2 digits).
const DE_PREFIX_COORDS: Record<string, { lat: number; lng: number }> = {
  "10": { lat: 52.52, lng: 13.405 }, // Berlin
  "11": { lat: 52.52, lng: 13.405 },
  "12": { lat: 52.52, lng: 13.405 },
  "13": { lat: 52.52, lng: 13.405 },
  "14": { lat: 52.52, lng: 13.405 },
  "15": { lat: 52.4, lng: 12.5 }, // Brandenburg
  "16": { lat: 52.4, lng: 12.5 },
  "17": { lat: 52.4, lng: 12.5 },
  "18": { lat: 52.4, lng: 12.5 },
  "19": { lat: 52.4, lng: 12.5 },
  "20": { lat: 53.55, lng: 9.99 }, // Hamburg / Schleswig-Holstein
  "21": { lat: 53.55, lng: 9.99 },
  "22": { lat: 53.8, lng: 10.7 },
  "23": { lat: 54.2, lng: 10.1 },
  "24": { lat: 54.3, lng: 9.7 },
  "25": { lat: 53.87, lng: 9.7 },
  "26": { lat: 53.2, lng: 8.2 },
  "27": { lat: 53.5, lng: 8.6 },
  "28": { lat: 53.08, lng: 8.8 },
  "29": { lat: 52.6, lng: 10.8 },
  "30": { lat: 52.38, lng: 9.73 }, // Hannover / Lower Saxony
  "31": { lat: 52.58, lng: 9.74 },
  "32": { lat: 52.03, lng: 8.53 },
  "33": { lat: 52.02, lng: 8.9 },
  "34": { lat: 51.32, lng: 9.5 }, // Kassel
  "35": { lat: 51.74, lng: 9.7 },
  "36": { lat: 51.0, lng: 9.7 },
  "37": { lat: 51.5, lng: 9.9 },
  "38": { lat: 52.13, lng: 10.35 }, // Braunschweig
  "39": { lat: 52.13, lng: 11.62 }, // Magdeburg
  "40": { lat: 51.23, lng: 6.77 }, // Düsseldorf/Ruhrgebiet
  "41": { lat: 51.23, lng: 6.77 },
  "42": { lat: 51.25, lng: 7.1 },
  "43": { lat: 51.47, lng: 7.0 },
  "44": { lat: 51.52, lng: 7.45 },
  "45": { lat: 51.44, lng: 7.56 },
  "46": { lat: 51.35, lng: 6.6 },
  "47": { lat: 51.34, lng: 6.57 },
  "48": { lat: 52.0, lng: 7.6 }, // Münsterland
  "49": { lat: 52.28, lng: 7.04 },
  "50": { lat: 50.94, lng: 6.96 }, // Köln/Bonn
  "51": { lat: 50.94, lng: 6.96 },
  "52": { lat: 51.18, lng: 6.44 },
  "53": { lat: 50.73, lng: 7.1 },
  "54": { lat: 49.75, lng: 6.64 }, // Trier
  "55": { lat: 49.99, lng: 8.27 }, // Mainz
  "56": { lat: 50.44, lng: 7.47 }, // Koblenz
  "57": { lat: 50.88, lng: 8.02 }, // Siegen
  "58": { lat: 51.36, lng: 7.47 }, // Hagen
  "59": { lat: 51.8, lng: 7.8 },
  "60": { lat: 50.11, lng: 8.68 }, // Frankfurt
  "61": { lat: 50.11, lng: 8.68 },
  "62": { lat: 49.93, lng: 8.6 },
  "63": { lat: 50.2, lng: 9.1 },
  "64": { lat: 49.87, lng: 8.65 },
  "65": { lat: 50.34, lng: 8.0 }, // Wiesbaden
  "66": { lat: 49.24, lng: 6.99 }, // Saarland
  "67": { lat: 49.48, lng: 8.46 }, // Mannheim
  "68": { lat: 49.48, lng: 8.46 },
  "69": { lat: 49.4, lng: 8.65 }, // Heidelberg
  "70": { lat: 48.78, lng: 9.18 }, // Stuttgart
  "71": { lat: 48.83, lng: 9.2 },
  "72": { lat: 48.48, lng: 9.05 }, // Tübingen
  "73": { lat: 48.4, lng: 10.0 }, // Ulm
  "74": { lat: 49.15, lng: 9.22 }, // Heilbronn / Neckarsulm
  "75": { lat: 49.01, lng: 8.4 }, // Karlsruhe/Pforzheim
  "76": { lat: 49.01, lng: 8.4 },
  "77": { lat: 48.48, lng: 7.94 }, // Offenburg
  "78": { lat: 48.05, lng: 8.45 }, // Schwarzwald
  "79": { lat: 48.0, lng: 7.85 }, // Freiburg
  "80": { lat: 48.14, lng: 11.58 }, // München
  "81": { lat: 48.14, lng: 11.58 },
  "82": { lat: 48.3, lng: 10.99 }, // Augsburg
  "83": { lat: 47.9, lng: 11.8 }, // Oberbayern Süd
  "84": { lat: 48.4, lng: 12.5 }, // Landshut
  "85": { lat: 48.4, lng: 13.4 }, // Niederbayern
  "86": { lat: 48.4, lng: 10.9 },
  "87": { lat: 48.0, lng: 10.0 },
  "88": { lat: 47.7, lng: 9.9 }, // Bodensee/Allgäu
  "89": { lat: 48.35, lng: 10.89 },
  "90": { lat: 49.45, lng: 11.08 }, // Nürnberg
  "91": { lat: 49.45, lng: 11.08 },
  "92": { lat: 49.44, lng: 11.86 }, // Oberpfalz
  "93": { lat: 49.02, lng: 12.1 }, // Regensburg
  "94": { lat: 48.57, lng: 13.45 }, // Passau
  "95": { lat: 50.32, lng: 11.92 }, // Hof
  "96": { lat: 50.25, lng: 11.0 }, // Coburg
  "97": { lat: 49.79, lng: 9.93 }, // Würzburg
  "98": { lat: 50.98, lng: 11.03 }, // Erfurt
  "99": { lat: 50.92, lng: 11.58 }, // Jena/Thuringia
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

  const extractedZip =
    zipCode?.trim() ||
    locationLabel?.match(/(\d{5})/)?.[1] ||
    countryLabel?.match(/(\d{5})/)?.[1] ||
    "";

  // German ZIP heuristic mapping into Germany bounding box
  const zipMatch = extractedZip.match(/^(\d{5})$/);
  const countryLower = (countryLabel || "").toLowerCase();
  const isGermany =
    countryLower.includes("germany") ||
    countryLower.includes("deutschland") ||
    (zipMatch ? true : false);

  if (isGermany && zipMatch) {
    const prefix = zipMatch[1].slice(0, 2);
    const byPrefix = DE_PREFIX_COORDS[prefix];
    if (byPrefix) {
      return byPrefix;
    }
  }

  return COUNTRY_COORDS[base] || hashToEuroCoord(base);
};
