"use client";

import { JobResponse, JobStatus } from "@/models/job.model";
import { getCoordsForLocation } from "@/lib/data/countryCoords";
import { useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { format } from "date-fns";

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

  const markers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return jobs
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
        const coords = getCoordsForLocation(
          job.Location?.label,
          job.Location?.country,
          job.Location?.zipCode
        );
        const x = ((coords.lng + 180) / 360) * 100;
        const y = ((90 - coords.lat) / 180) * 100;
        return { job, x, y };
      });
  }, [jobs, searchTerm, statusFilter]);

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
        <CardContent>
          <div className="relative w-full rounded-xl border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 aspect-[16/9] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.04),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.05),transparent_35%)]" />
            {markers.map(({ job, x, y }) => (
              <button
                key={job.id}
                style={{ left: `${x}%`, top: `${y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                onClick={() => setHighlightId(job.id)}
                title={`${job.JobTitle?.label} @ ${job.Company?.label}`}
              >
                <span
                  className={`block h-3 w-3 rounded-full border border-white/60 shadow ${
                    highlightId === job.id ? "ring-2 ring-white" : ""
                  } ${statusColor(job.Status?.value)}`}
                />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {highlightId && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Job</CardTitle>
          </CardHeader>
          <CardContent>
            {markers
              .filter((m) => m.job.id === highlightId)
              .map(({ job }) => (
                <div key={job.id} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className={statusColor(job.Status?.value)}>
                      {job.Status?.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {job.JobSource?.label}
                    </span>
                  </div>
                  <div className="text-lg font-semibold">
                    {job.JobTitle?.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {job.Company?.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {job.Location?.zipCode && `${job.Location.zipCode}, `}{" "}
                    {job.Location?.label}
                    {job.Location?.country ? `, ${job.Location.country}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Added:{" "}
                    {job.createdAt ? format(job.createdAt, "PP") : "Unknown"}
                    {job.appliedDate
                      ? ` • Applied: ${format(job.appliedDate, "PP")}`
                      : ""}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
