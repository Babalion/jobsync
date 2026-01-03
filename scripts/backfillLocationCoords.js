#!/usr/bin/env node
// Backfill lat/lng for locations using OpenStreetMap Nominatim

require("ts-node/register/transpile-only");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Import TS module via ts-node
const { getCoordsForLocation } = require(path.join(
  process.cwd(),
  "src/lib/data/countryCoords"
));

async function geocodeLocation({ city, zipCode, country }) {
  const query = [zipCode, city, country].filter(Boolean).join(" ");
  if (!query) return {};
  const params = new URLSearchParams({ format: "json", limit: "1", q: query });
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: { "User-Agent": "jobsync-map-backfill/1.0" },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.length) {
        const first = data[0];
        return { lat: Number(first.lat), lng: Number(first.lon) };
      }
    }
  } catch (err) {
    console.error("Geocode failed, using fallback", err);
  }
  return getCoordsForLocation(city, country, zipCode);
}

async function backfill() {
  const locations = await prisma.location.findMany({
    where: { OR: [{ lat: null }, { lng: null }] },
  });
  console.log(`Found ${locations.length} locations needing coords`);

  for (const loc of locations) {
    const { lat, lng } = await geocodeLocation({
      city: loc.label,
      zipCode: loc.zipCode || undefined,
      country: loc.country || undefined,
    });
    if (lat == null || lng == null) {
      console.warn(`Skipping ${loc.label} (${loc.id}) - geocode failed`);
      continue;
    }
    await prisma.location.update({
      where: { id: loc.id },
      data: { lat, lng },
    });
    console.log(`Updated ${loc.label} -> ${lat}, ${lng}`);
  }
  console.log("Backfill complete");
}

backfill()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
