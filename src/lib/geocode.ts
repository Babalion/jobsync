export type GeocodeParams = {
  city?: string;
  zipCode?: string;
  country?: string;
};

export type GeocodeResult = {
  lat?: number;
  lng?: number;
  zip?: string;
  countryCode?: string;
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
    console.error("Geocoding failed", err);
  }

  return {};
};

export const geocodeWithAddress = async ({
  city,
  zipCode,
  country,
}: GeocodeParams): Promise<GeocodeResult | undefined> => {
  const query = [zipCode, city, country].filter(Boolean).join(" ");
  if (!query) return;

  const params = new URLSearchParams({
    format: "json",
    limit: "1",
    addressdetails: "1",
    q: query,
  });

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        "User-Agent": "jobsync-map/1.0",
      },
    });
    if (res.ok) {
      const data = (await res.json()) as Array<{
        lat: string;
        lon: string;
        address?: { postcode?: string; country_code?: string };
      }>;
      if (data?.length) {
        const first = data[0];
        return {
          lat: Number(first.lat),
          lng: Number(first.lon),
          zip: first.address?.postcode,
          countryCode: first.address?.country_code,
        };
      }
    }
  } catch (err) {
    console.error("Geocoding (with address) failed", err);
  }
};

export const geocode = {
  geocodeLocation,
  geocodeWithAddress,
};
