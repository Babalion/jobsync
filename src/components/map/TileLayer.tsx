import React, { useMemo } from "react";

type Props = {
  viewport: { minX: number; maxX: number; minY: number; maxY: number };
  zoom: number;
  tileSize: number;
  tileUrlTemplate?: string;
  subdomains?: string[];
};

export default function TileLayer({
  viewport,
  zoom,
  tileSize,
  tileUrlTemplate = "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  subdomains = ["a", "b", "c", "d"],
}: Props) {
  const tiles = useMemo(() => {
    const minTileX = Math.floor(viewport.minX / tileSize);
    const maxTileX = Math.floor(viewport.maxX / tileSize);
    const minTileY = Math.floor(viewport.minY / tileSize);
    const maxTileY = Math.floor(viewport.maxY / tileSize);

    const tilesPerAxis = Math.pow(2, zoom);

    const result: { x: number; y: number; url: string; left: number; top: number }[] = [];
    for (let x = minTileX; x <= maxTileX; x++) {
      for (let y = minTileY; y <= maxTileY; y++) {
        // valid y is 0..tilesPerAxis-1; skip outside mercator bounds
        if (y < 0 || y >= tilesPerAxis) continue;
        // wrap x horizontally
        const wrappedX = ((x % tilesPerAxis) + tilesPerAxis) % tilesPerAxis;
        const sub = subdomains[(Math.abs(wrappedX + y) % subdomains.length)] || "";
        const url = tileUrlTemplate
          .replace("{z}", String(zoom))
          .replace("{x}", String(wrappedX))
          .replace("{y}", String(y))
          .replace("{s}", sub);
        result.push({
          x,
          y,
          url,
          left: x * tileSize - viewport.minX,
          top: y * tileSize - viewport.minY,
        });
      }
    }
    return result;
  }, [
    subdomains,
    tileSize,
    tileUrlTemplate,
    viewport.maxX,
    viewport.maxY,
    viewport.minX,
    viewport.minY,
    zoom,
  ]);

  return (
    <>
      {tiles.map((tile) => (
        <img
          key={`${tile.x}-${tile.y}`}
          src={tile.url}
          alt=""
          aria-hidden="true"
          className="absolute select-none pointer-events-none"
          style={{
            left: tile.left,
            top: tile.top,
            width: tileSize,
            height: tileSize,
          }}
          draggable={false}
          loading="lazy"
        />
      ))}
    </>
  );
}
