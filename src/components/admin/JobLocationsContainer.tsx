"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { APP_CONSTANTS } from "@/lib/constants";
import { JobLocation } from "@/models/job.model";
import JobLocationsTable from "./JobLocationsTable";
import { getJobLocationsList } from "@/actions/jobLocation.actions";
import Loading from "../Loading";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import AddLocation from "./AddLocation";
import { toast } from "../ui/use-toast";

function JobLocationsContainer() {
  const [locations, setLocations] = useState<JobLocation[]>([]);
  const [totalJobLocations, setTotalJobLocations] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: "label" | "zipCode" | "country" | "jobsApplied";
    direction: "asc" | "desc";
  }>({ key: "label", direction: "asc" });

  const recordsPerPage = APP_CONSTANTS.RECORDS_PER_PAGE;

  const loadJobLocations = useCallback(
    async (page: number) => {
      setLoading(true);
      const { data, total } = await getJobLocationsList(
        page,
        recordsPerPage,
        "applied"
      );
      if (data) {
        setLocations((prev) => (page === 1 ? data : [...prev, ...data]));
        setTotalJobLocations(total);
        setPage(page);
        setLoading(false);
      }
    },
    [recordsPerPage]
  );

  const reloadJobLocations = useCallback(async () => {
    await loadJobLocations(1);
  }, [loadJobLocations]);

  useEffect(() => {
    (async () => await loadJobLocations(1))();
  }, [loadJobLocations]);

  const filteredLocations = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const filtered = locations.filter((loc: any) => {
      return (
        !term ||
        loc.label.toLowerCase().includes(term) ||
        (loc.zipCode || "").toLowerCase().includes(term) ||
        (loc.country || "").toLowerCase().includes(term)
      );
    });
    const dir = sortConfig.direction === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((a: any, b: any) => {
      const getVal = (l: any) => {
        switch (sortConfig.key) {
          case "zipCode":
            return l.zipCode || "";
          case "country":
            return l.country || "";
          case "jobsApplied":
            return l._count?.jobsApplied ?? 0;
          case "label":
          default:
            return l.label || "";
        }
      };
      const aVal = getVal(a);
      const bVal = getVal(b);
      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * dir;
      }
      return String(aVal).localeCompare(String(bVal)) * dir;
    });
    return sorted;
  }, [locations, searchTerm, sortConfig]);

  const handleSort = (key: "label" | "zipCode" | "country" | "jobsApplied") => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const [editLocation, setEditLocation] = useState<JobLocation | null>(null);
  const onEditLocation = (loc: JobLocation) => {
    setEditLocation(loc);
  };
  const resetEditLocation = () => setEditLocation(null);

  return (
    <>
      <div className="col-span-3">
        <Card x-chunk="dashboard-06-chunk-0">
          <CardHeader className="flex-row justify-between items-center">
            <CardTitle>Job Locations</CardTitle>
            <div className="flex items-center">
              <div className="ml-auto flex items-center gap-2">
                <Input
                  placeholder="Search city, zip, country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 w-[220px]"
                />
                <AddLocation reloadLocations={reloadJobLocations} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && <Loading />}
            {locations.length > 0 && (
              <>
                <JobLocationsTable
                  jobLocations={filteredLocations as any}
                  reloadJobLocations={reloadJobLocations}
                  onSort={handleSort}
                  sortConfig={sortConfig}
                  onEditLocation={onEditLocation}
                />
                <div className="text-xs text-muted-foreground">
                  Showing{" "}
                  <strong>
                    {1} to {filteredLocations.length}
                  </strong>{" "}
                  of
                  <strong> {totalJobLocations}</strong> job locations
                </div>
              </>
            )}
            {locations.length < totalJobLocations && (
              <div className="flex justify-center p-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadJobLocations(page + 1)}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <AddLocation
        reloadLocations={reloadJobLocations}
        editLocation={editLocation}
        resetEditLocation={resetEditLocation}
      />
    </>
  );
}

export default JobLocationsContainer;
