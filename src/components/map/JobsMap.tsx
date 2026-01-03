"use client";

import { JobResponse, JobStatus } from "@/models/job.model";
import { getCoordsForLocation } from "@/lib/data/countryCoords";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { format } from "date-fns";
import TileLayer from "./TileLayer";
import { Plus, Minus } from "lucide-react";

type JobsMapProps = {
  jobs: JobResponse[];
  statuses: JobStatus[];
};

const statusColor = (value?: string) => {
  switch (value) {
    case "applied":
      return "bg-sky-500";
    case "interview":
      return "bg-emerald-500";
    case "offer":
      return "bg-amber-500";
    case "rejected":
      return "bg-rose-500";
    case "expired":
      return "bg-slate-500";
    case "archived":
      return "bg-neutral-500";
    case "draft":
    default:
      return "bg-gray-400";
  }
};

export default function JobsMap({ jobs, statuses }: JobsMapProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(5); // integer tile zoom for better accuracy
  const wheelDeltaRef = useRef(0);
  const [center, setCenter] = useState({ lat: 51, lng: 10 }); // Germany-ish
  const [dragging, setDragging] = useState(false);
  const { resolvedTheme } = useTheme();
  const dragStart = useRef<{
    x: number;
    y: number;
    centerPx: { x: number; y: number };
  } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 800, height: 450 });
  const userInteracted = useRef(false);

  const clampZoom = (z: number) => Math.min(Math.max(z, 2), 12);
  const clampLatLng = (lat: number, lng: number) => {
    const clampedLat = Math.min(Math.max(lat, -85), 85);
    let wrappedLng = lng;
    if (wrappedLng > 180 || wrappedLng < -180) {
      wrappedLng = ((wrappedLng + 180) % 360) - 180;
    }
    return { lat: clampedLat, lng: wrappedLng };
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height: Math.min(height, width * 0.7) });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    window.addEventListener("wheel", handler, { passive: false });
    return () => window.removeEventListener("wheel", handler);
  }, []);

  const TILE_SIZE = 256;
  const project = (lat: number, lng: number, z: number) => {
    const scale = Math.pow(2, z);
    const x = ((lng + 180) / 360) * TILE_SIZE * scale;
    const latRad = (lat * Math.PI) / 180;
    const y =
      (1 -
        Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) /
      2 *
      TILE_SIZE *
      scale;
    return { x, y };
  };

  const unproject = (x: number, y: number, z: number) => {
    const scale = Math.pow(2, z);
    const lng = (x / (TILE_SIZE * scale)) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * y) / (TILE_SIZE * scale);
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    return { lat, lng };
  };

  const worldSize = TILE_SIZE * Math.pow(2, zoom);
  const halfW = Math.min(size.width / 2, worldSize / 2 - 1);
  const halfH = Math.min(size.height / 2, worldSize / 2 - 1);
  const clampedCenter = clampLatLng(center.lat, center.lng);
  const centerPx = project(clampedCenter.lat, clampedCenter.lng, zoom);
  const viewport = {
    minX: centerPx.x - halfW,
    maxX: centerPx.x + halfW,
    minY: centerPx.y - halfH,
    maxY: centerPx.y + halfH,
  };

  const tileUrlTemplate =
    resolvedTheme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_no_buildings/{z}/{x}/{y}.png";

  const markers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return (jobs || [])
      .filter((job) => {
        const matchesStatus =
          statusFilter === "all" || job.Status?.value === statusFilter;
        const matchesSearch =
          !term ||
          job.JobTitle?.label.toLowerCase().includes(term) ||
          (job.Company?.label || "").toLowerCase().includes(term) ||
          (job.Location?.label || "").toLowerCase().includes(term) ||
          (job.Location?.country || "").toLowerCase().includes(term) ||
          (job.Location?.zipCode || "").toLowerCase().includes(term);
        return matchesStatus && matchesSearch;
      })
      .map((job) => {
        const latNum =
          job.Location?.lat === null || job.Location?.lat === undefined
            ? undefined
            : Number(job.Location.lat);
        const lngNum =
          job.Location?.lng === null || job.Location?.lng === undefined
            ? undefined
            : Number(job.Location.lng);
        const hasLatLng = Number.isFinite(latNum) && Number.isFinite(lngNum);
        const coords = hasLatLng
          ? { lat: latNum as number, lng: lngNum as number }
          : getCoordsForLocation(
              job.Location?.label,
              job.Location?.country,
              job.Location?.zipCode
            ) || { lat: 0, lng: 0 };
        const coordsClamped = clampLatLng(coords.lat, coords.lng);
        const px = project(coordsClamped.lat, coordsClamped.lng, zoom);
        let dx = px.x - centerPx.x;
        if (dx > worldSize / 2) dx -= worldSize;
        if (dx < -worldSize / 2) dx += worldSize;
        const dy = px.y - centerPx.y;
        const x = halfW + dx;
        const y = halfH + dy;
        return { job, x, y, coords: coordsClamped };
      });
  }, [
    jobs,
    searchTerm,
    statusFilter,
    zoom,
    centerPx.x,
    centerPx.y,
    worldSize,
    halfW,
    halfH,
  ]);

  const fitToMarkers = useCallback(() => {
    if (!markers.length) return;
    const lats = markers.map((m) => m.coords.lat);
    const lngs = markers.map((m) => m.coords.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;

    const spanLat = Math.max(maxLat - minLat, 0.05);
    const spanLng = Math.max(maxLng - minLng, 0.05);

    const zoomForSpan = () => {
      const WORLD_DIM = { height: TILE_SIZE, width: TILE_SIZE };
      const latRad = (lat: number) => {
        const sin = Math.sin((lat * Math.PI) / 180);
        const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
      };

      const latFraction = (latRad(maxLat) - latRad(minLat)) / Math.PI;
      const lngFraction = spanLng / 360;

      const zoomLat = Math.log(size.height / WORLD_DIM.height / latFraction) / Math.LN2;
      const zoomLng = Math.log(size.width / WORLD_DIM.width / lngFraction) / Math.LN2;

      const target = Math.min(zoomLat, zoomLng);
      return clampZoom(Math.floor(target));
    };

    const nextCenter = clampLatLng(midLat, midLng);
    const nextZoom = zoomForSpan();

    const sameCenter =
      Math.abs(nextCenter.lat - center.lat) < 0.0001 &&
      Math.abs(nextCenter.lng - center.lng) < 0.0001;
    const sameZoom = nextZoom === zoom;
    if (sameCenter && sameZoom) return;

    setCenter(clampLatLng(nextCenter.lat, nextCenter.lng));
    setZoom(nextZoom);
    userInteracted.current = true; // avoid refitting loop
  }, [markers, size.height, size.width, center.lat, center.lng, zoom]);

  useEffect(() => {
    userInteracted.current = false;
  }, [jobs, statusFilter, searchTerm]);

  useEffect(() => {
    if (!markers.length) return;
    if (userInteracted.current) return;
    fitToMarkers();
  }, [markers, fitToMarkers]);

  const selectedMarker = useMemo(
    () => markers.find((m) => m.job.id === highlightId),
    [highlightId, markers]
  );

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    userInteracted.current = true;
    // Accumulate wheel movement so zoom steps feel slower/smoother.
    const threshold = 220; // pixels of wheel delta before a zoom step
    wheelDeltaRef.current += e.deltaY;
    if (Math.abs(wheelDeltaRef.current) < threshold) {
      return;
    }
    const steps = Math.trunc(Math.abs(wheelDeltaRef.current) / threshold);
    const direction = wheelDeltaRef.current > 0 ? -1 : 1;
    wheelDeltaRef.current = wheelDeltaRef.current % threshold;
    const nextZoom = clampZoom(zoom + direction * steps);
    if (nextZoom !== zoom) {
      setZoom(nextZoom);
    }
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    userInteracted.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      centerPx,
    };
    setDragging(true);
    e.preventDefault();
  };
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragStart.current) {
      e.preventDefault();
      const dx = dragStart.current.x - e.clientX;
      const dy = dragStart.current.y - e.clientY;
      const newCenterPx = {
        x: dragStart.current.centerPx.x + dx,
        y: dragStart.current.centerPx.y + dy,
      };
      const worldSize = TILE_SIZE * Math.pow(2, zoom);
      const halfW = Math.min(size.width / 2, worldSize / 2 - 1);
      const halfH = Math.min(size.height / 2, worldSize / 2 - 1);
      const clampedPx = {
        x: Math.min(Math.max(newCenterPx.x, halfW), worldSize - halfW),
        y: Math.min(Math.max(newCenterPx.y, halfH), worldSize - halfH),
      };
      const nextCenter = unproject(clampedPx.x, clampedPx.y, zoom);
      setCenter(clampLatLng(nextCenter.lat, nextCenter.lng));
    }
  };
  const onMouseUp = () => {
    dragStart.current = null;
    setDragging(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Jobs Map</CardTitle>
          <div className="flex gap-2 w-full md:w-auto">
            <Input
              placeholder="Search by title, company, location, zip..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statuses?.map((s) => (
                  <SelectItem key={s.id} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent
          className={`max-h-[78vh] overflow-hidden ${
            selectedMarker ? "grid gap-4 lg:grid-cols-[2fr_1fr]" : ""
          }`}
        >
          <div
            ref={containerRef}
            className={`relative w-full rounded-xl border bg-background overflow-hidden h-[70vh] min-h-[60vh] ${
              dragging ? "cursor-grabbing" : "cursor-grab"
            } select-none`}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onDoubleClick={() => {
              userInteracted.current = true;
              setHighlightId(null);
            }}
          >
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  userInteracted.current = true;
                  setZoom((z) => clampZoom(z + 1));
                }}
                className="h-10 w-10 rounded-md bg-background/80 border shadow flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  userInteracted.current = true;
                  setZoom((z) => clampZoom(z - 1));
                }}
                className="h-10 w-10 rounded-md bg-background/80 border shadow flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.04),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.05),transparent_35%)]" />
            {/* Tile layer */}
            <TileLayer
              viewport={viewport}
              zoom={zoom}
              tileSize={TILE_SIZE}
              tileUrlTemplate={tileUrlTemplate}
              subdomains={["a", "b", "c", "d"]}
            />
            {/* Markers */}
            {markers.map(({ job, x, y }) => (
              <div
                key={job.id}
                style={{ left: x, top: y }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
              >
                <button
                  className="relative"
                  onClick={() => {
                    setHighlightId(job.id);
                    userInteracted.current = true;
                  }}
                  title={`${job.JobTitle?.label} @ ${job.Company?.label}`}
                >
                  <span
                    className={`block h-3 w-3 rounded-full border border-white/60 shadow transition-transform duration-150 group-hover:scale-125 ${
                      highlightId === job.id ? "ring-2 ring-white" : ""
                    } ${statusColor(job.Status?.value)}`}
                  />
                </button>
                <div className="pointer-events-none absolute left-4 top-0 opacity-0 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-150">
                  <div className="rounded-md bg-background/90 px-3 py-2 text-xs shadow border">
                    <div className="font-semibold">
                      {job.JobTitle?.label}
                    </div>
                    <div className="text-muted-foreground">
                      {job.Company?.label}
                    </div>
                    <div className="text-muted-foreground">
                      {job.Location?.zipCode ? `${job.Location.zipCode}, ` : ""}
                      {job.Location?.label}
                      {job.Location?.country ? `, ${job.Location.country}` : ""}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {selectedMarker && (
            <div className="rounded-xl border bg-background p-4 max-h-[78vh] overflow-auto">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Badge className={statusColor(selectedMarker.job.Status?.value)}>
                    {selectedMarker.job.Status?.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedMarker.job.JobSource?.label}
                  </span>
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  onClick={() => {
                    setHighlightId(null);
                    userInteracted.current = true;
                  }}
                >
                  Close
                </button>
              </div>
              <div className="text-lg font-semibold">
                {selectedMarker.job.JobTitle?.label}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedMarker.job.Company?.label}
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                {selectedMarker.job.Location?.zipCode
                  ? `${selectedMarker.job.Location.zipCode}, `
                  : ""}
                {selectedMarker.job.Location?.label}
                {selectedMarker.job.Location?.country
                  ? `, ${selectedMarker.job.Location.country}`
                  : ""}
              </div>
              <div className="text-xs text-muted-foreground">
                Added:{" "}
                {selectedMarker.job.createdAt
                  ? format(selectedMarker.job.createdAt, "PP")
                  : "Unknown"}
                {selectedMarker.job.appliedDate
                  ? ` • Applied: ${format(selectedMarker.job.appliedDate, "PP")}`
                  : ""}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
