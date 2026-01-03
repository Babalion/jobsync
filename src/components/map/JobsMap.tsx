"use client";

import { JobResponse, JobStatus } from "@/models/job.model";
import { getCoordsForLocation } from "@/lib/data/countryCoords";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { format } from "date-fns";
import { useTranslations } from "@/lib/i18n";

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
  const { t, dateLocale } = useTranslations();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(5); // integer zoom for maplibre
  const [center, setCenter] = useState({ lat: 51, lng: 10 }); // Germany-ish
  const { resolvedTheme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

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
        return { job, coords };
      });
  }, [
    jobs,
    searchTerm,
    statusFilter,
  ]);

  const selectedMarker = useMemo(
    () => markers.find((m) => m.job.id === highlightId),
    [highlightId, markers]
  );

  const styleUrl =
    resolvedTheme === "dark"
      ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [center.lng, center.lat],
      zoom,
      attributionControl: true,
    });
    map.addControl(new maplibregl.NavigationControl());
    mapRef.current = map;
    map.on("moveend", () => {
      const ctr = map.getCenter();
      setCenter({ lat: ctr.lat, lng: ctr.lng });
      setZoom(map.getZoom());
    });
    map.on("click", () => {
      setHighlightId(null);
    });
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update style when theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const currentStyle = map.getStyle && map.getStyle();
    if (currentStyle?.sprite && currentStyle.sprite.includes(styleUrl)) return;
    // Only switch after map is ready
    const applyStyle = () => {
      map.setStyle(styleUrl);
    };
    if (map.isStyleLoaded()) {
      applyStyle();
    } else {
      map.once("load", applyStyle);
    }
  }, [styleUrl]);

  // Sync center/zoom when props change externally (filters, refit later if needed)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const current = map.getCenter();
    if (Math.abs(current.lat - center.lat) > 1e-5 || Math.abs(current.lng - center.lng) > 1e-5) {
      map.setCenter([center.lng, center.lat]);
    }
    if (Math.abs(map.getZoom() - zoom) > 1e-3) {
      map.setZoom(zoom);
    }
  }, [center.lat, center.lng, zoom]);

  // Fit to markers on data change (only if no highlight)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !markers.length) return;
    const bounds = new maplibregl.LngLatBounds();
    markers.forEach((m) => bounds.extend([m.coords.lng, m.coords.lat]));
    map.fitBounds(bounds, { padding: 40, maxZoom: 11, animate: true });
  }, [markers]);

  // Draw markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    markers.forEach(({ job, coords }) => {
      const el = document.createElement("div");
      el.className = `rounded-full border border-white/60 shadow h-3 w-3 ${statusColor(
        job.Status?.value
      )}`;
      el.style.cursor = "pointer";
      el.title = `${job.JobTitle?.label} @ ${job.Company?.label}`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setHighlightId(job.id);
      });
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, [markers]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>{t("Jobs Map")}</CardTitle>
          <div className="flex gap-2 w-full md:w-auto">
            <Input
              placeholder={t("Search by title, company, location, zip...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder={t("Status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All statuses")}</SelectItem>
                {statuses?.map((s) => (
                  <SelectItem key={s.id} value={s.value}>
                    {t(s.label)}
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
            ref={mapContainerRef}
            className="relative w-full rounded-xl border bg-background overflow-hidden h-[70vh] min-h-[60vh]"
          >
          </div>
          {selectedMarker && (
            <div className="rounded-xl border bg-background p-4 max-h-[78vh] overflow-auto">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Badge className={statusColor(selectedMarker.job.Status?.value)}>
                    {t(selectedMarker.job.Status?.label || "")}
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
                  }}
                >
                  {t("Close")}
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
                {t("Added:")}{" "}
                {selectedMarker.job.createdAt
                  ? format(selectedMarker.job.createdAt, "PP", { locale: dateLocale })
                  : t("Unknown")}
                {selectedMarker.job.appliedDate
                  ? ` • ${t("Applied:")} ${format(selectedMarker.job.appliedDate, "PP", { locale: dateLocale })}`
                  : ""}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
