"use client";

import { Company, JobLocation, JobResponse, JobStatus } from "@/models/job.model";
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
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

type CompanyWithLocations = Omit<Company, "locations"> & {
  locations?: Array<{ location: JobLocation }>;
};

type JobsMapProps = {
  jobs: JobResponse[];
  statuses: JobStatus[];
  companies: CompanyWithLocations[];
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

export default function JobsMap({ jobs, statuses, companies }: JobsMapProps) {
  const { t, dateLocale } = useTranslations();
  const [mode, setMode] = useState<"jobs" | "companies">("jobs");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(5); // integer zoom for maplibre
  const [center, setCenter] = useState({ lat: 51, lng: 10 }); // Germany-ish
  const { resolvedTheme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  const coordKey = (lat: number, lng: number) =>
    `${lat.toFixed(3)},${lng.toFixed(3)}`;

  const jobMarkers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const filtered = (jobs || []).filter((job) => {
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
      });

    const grouped = new Map<
      string,
      { coords: { lat: number; lng: number }; jobs: JobResponse[] }
    >();

    filtered.forEach((job) => {
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
      const key = coordKey(coords.lat, coords.lng);
      const existing = grouped.get(key);
      if (existing) {
        existing.jobs.push(job);
      } else {
        grouped.set(key, { coords, jobs: [job] });
      }
    });

    return Array.from(grouped.entries()).map(([key, value]) => ({
      key,
      coords: value.coords,
      jobs: value.jobs,
    }));
  }, [jobs, searchTerm, statusFilter]);

  const companyMarkers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const flat = (companies || []).flatMap((company) => {
      const nameMatch = !term || company.label.toLowerCase().includes(term);
      const companyLocations = company.locations || [];
      return companyLocations
        .map((entry) => entry?.location)
        .filter(Boolean)
        .map((loc) => loc as JobLocation)
        .filter((loc) => {
          const matchesSearch =
            nameMatch ||
            loc.label.toLowerCase().includes(term) ||
            (loc.country || "").toLowerCase().includes(term) ||
            (loc.zipCode || "").toLowerCase().includes(term);
          return matchesSearch;
        })
        .map((loc) => {
          const latNum =
            loc.lat === null || loc.lat === undefined ? undefined : Number(loc.lat);
          const lngNum =
            loc.lng === null || loc.lng === undefined ? undefined : Number(loc.lng);
          const hasLatLng = Number.isFinite(latNum) && Number.isFinite(lngNum);
          const coords = hasLatLng
            ? { lat: latNum as number, lng: lngNum as number }
            : getCoordsForLocation(loc.label, loc.country, loc.zipCode) || {
                lat: 0,
                lng: 0,
              };
          return { company, location: loc, coords };
        });
    });
    const grouped = new Map<
      string,
      { coords: { lat: number; lng: number }; items: typeof flat }
    >();
    flat.forEach((entry) => {
      const key = coordKey(entry.coords.lat, entry.coords.lng);
      const existing = grouped.get(key);
      if (existing) {
        existing.items.push(entry);
      } else {
        grouped.set(key, { coords: entry.coords, items: [entry] });
      }
    });
    return Array.from(grouped.entries()).map(([key, value]) => ({
      key,
      coords: value.coords,
      items: value.items,
    }));
  }, [companies, searchTerm]);

  const markers = mode === "jobs" ? jobMarkers : companyMarkers;

  const selectedJobMarker = useMemo(
    () => (mode === "jobs" ? jobMarkers.find((m) => m.key === highlightId) : undefined),
    [highlightId, jobMarkers, mode]
  );

  const selectedCompanyMarker = useMemo(
    () =>
      mode === "companies"
        ? companyMarkers.find((m) => m.key === highlightId)
        : undefined,
    [companyMarkers, highlightId, mode]
  );

  const styleUrl =
    resolvedTheme === "dark"
      ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

  useEffect(() => {
    setHighlightId(null);
  }, [mode]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl as any,
      center: [center.lng, center.lat],
      zoom,
      attributionControl: { compact: true },
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
    const spriteUrl =
      (currentStyle as any)?.sprite?.url ??
      (currentStyle as any)?.sprite?.[0]?.url ??
      (currentStyle as any)?.sprite ??
      "";
    if (spriteUrl && spriteUrl.includes(styleUrl)) return;
    // Only switch after map is ready
    const applyStyle = () => {
      map.setStyle(styleUrl as any);
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
    markers.forEach((markerData: any) => {
      const jobGroup = (markerData.jobs as JobResponse[] | undefined) || undefined;
      const companyGroup = (markerData.items as any[] | undefined) || undefined;
      const job = jobGroup?.[0];
      const company = companyGroup?.[0]?.company as Company | undefined;
      const location = companyGroup?.[0]?.location as JobLocation | undefined;
      const coords = markerData.coords;
      const count = jobGroup?.length || companyGroup?.length || 1;
      const el = document.createElement("div");
      const colorClass = job ? statusColor(job.Status?.value) : "bg-amber-500";
      const size = count > 1 ? "h-7 w-7" : "h-3 w-3";
      el.className = `flex items-center justify-center rounded-full border border-white/60 shadow ${size} ${colorClass}`;
      el.style.cursor = "pointer";
      el.title = count > 1 ? `${count} items` : job
        ? `${job.JobTitle?.label} @ ${job.Company?.label}`
        : `${company?.label || ""} ${location?.label ? `(${location.label})` : ""}`;
      if (count > 1) {
        const span = document.createElement("span");
        span.textContent = String(count);
        span.className = "text-[10px] text-white font-semibold";
        el.appendChild(span);
      }
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setHighlightId(markerData.key as string);
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
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle>{t("Jobs Map")}</CardTitle>
            <Tabs value={mode} onValueChange={(v) => setMode(v as "jobs" | "companies")}>
              <TabsList>
                <TabsTrigger value="jobs">{t("Jobs")}</TabsTrigger>
                <TabsTrigger value="companies">{t("Companies")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Input
              placeholder={t("Search by title, company, location, zip...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              disabled={mode === "companies"}
            >
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
            selectedJobMarker || selectedCompanyMarker
              ? "grid gap-4 lg:grid-cols-[2fr_1fr]"
              : ""
          }`}
        >
          <div
            ref={mapContainerRef}
            className="relative w-full rounded-xl border bg-background overflow-hidden h-[70vh] min-h-[60vh]"
          >
          </div>
          {(selectedJobMarker || selectedCompanyMarker) && (
            <div className="rounded-xl border bg-background p-4 max-h-[78vh] overflow-auto">
              {selectedJobMarker && (
                <>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="text-sm text-muted-foreground">
                      {selectedJobMarker.jobs[0]?.Location?.zipCode
                        ? `${selectedJobMarker.jobs[0].Location.zipCode}, `
                        : ""}
                      {selectedJobMarker.jobs[0]?.Location?.label}
                      {selectedJobMarker.jobs[0]?.Location?.country
                        ? `, ${selectedJobMarker.jobs[0].Location.country}`
                        : ""}
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
                  <div className="space-y-3">
                    {selectedJobMarker.jobs.map((job) => (
                      <div key={job.id} className="border-b pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={statusColor(job.Status?.value)}>
                            {t(job.Status?.label || "")}
                          </Badge>
                          {job.JobSource?.label && (
                            <span className="text-xs text-muted-foreground">
                              {job.JobSource.label}
                            </span>
                          )}
                        </div>
                        <div className="text-lg font-semibold">
                          {job.JobTitle?.label}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {job.Company?.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t("Added:")}{" "}
                          {job.createdAt
                            ? format(job.createdAt, "PP", { locale: dateLocale })
                            : t("Unknown")}
                      {job.appliedDate
                        ? ` • ${t("Applied:")} ${format(job.appliedDate, "PP", { locale: dateLocale })}`
                        : ""}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
              {selectedCompanyMarker && (
                <>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-500 text-white">
                        {t("Company")}
                      </Badge>
                      {selectedCompanyMarker.items[0]?.company.website && (
                        <a
                          href={
                            selectedCompanyMarker.items[0].company.website.startsWith("http")
                              ? selectedCompanyMarker.items[0].company.website
                              : `https://${selectedCompanyMarker.items[0].company.website}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs underline"
                        >
                          {t("Website")}
                        </a>
                      )}
                      {selectedCompanyMarker.items[0]?.company.careerSite && (
                        <a
                          href={
                            selectedCompanyMarker.items[0].company.careerSite.startsWith("http")
                              ? selectedCompanyMarker.items[0].company.careerSite
                              : `https://${selectedCompanyMarker.items[0].company.careerSite}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs underline"
                        >
                          {t("Career Site")}
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline"
                      onClick={() => setHighlightId(null)}
                    >
                      {t("Close")}
                    </button>
                  </div>
                  <div className="text-lg font-semibold">
                    {selectedCompanyMarker.items[0]?.location.zipCode
                      ? `${selectedCompanyMarker.items[0].location.zipCode}, `
                      : ""}
                    {selectedCompanyMarker.items[0]?.location.label}
                    {selectedCompanyMarker.items[0]?.location.country
                      ? `, ${selectedCompanyMarker.items[0].location.country}`
                      : ""}
                  </div>
                  <div className="space-y-3">
                    {selectedCompanyMarker.items.map((entry) => (
                      <div key={`${entry.company.id}-${entry.location.id}`} className="border-b pb-2 last:border-0 last:pb-0">
                        <div className="text-sm font-semibold">{entry.company.label}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {entry.company.website && (
                            <a
                              href={
                                entry.company.website.startsWith("http")
                                  ? entry.company.website
                                  : `https://${entry.company.website}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="underline"
                            >
                              {t("Website")}
                            </a>
                          )}
                          {entry.company.careerSite && (
                            <a
                              href={
                                entry.company.careerSite.startsWith("http")
                                  ? entry.company.careerSite
                                  : `https://${entry.company.careerSite}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="underline"
                            >
                              {t("Career Site")}
                            </a>
                          )}
                          {entry.company.ownership && (
                            <span>{entry.company.ownership}</span>
                          )}
                          {entry.company.archetype && (
                            <span>{entry.company.archetype}</span>
                          )}
                        </div>
                        {entry.company.industryRole && (
                          <div className="text-xs text-muted-foreground">
                            {entry.company.industryRole}
                          </div>
                        )}
                        {entry.company.summary && (
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {entry.company.summary}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
