"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { File, ListFilter } from "lucide-react";
import {
  deleteJobById,
  getJobDetails,
  getJobsList,
  updateJobStatus,
} from "@/actions/job.actions";
import { toast } from "../ui/use-toast";
import {
  Company,
  JobLocation,
  JobResponse,
  JobSource,
  JobStatus,
  JobTitle,
} from "@/models/job.model";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { APP_CONSTANTS } from "@/lib/constants";
import Loading from "../Loading";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AddJob } from "./AddJob";
import { ImportJobJSON } from "./ImportJobJSON";
import MyJobsTable from "./MyJobsTable";
import { format } from "date-fns";
import { Input } from "../ui/input";
import { useTranslations } from "@/lib/i18n";

type MyJobsProps = {
  statuses: JobStatus[];
  companies: Company[];
  titles: JobTitle[];
  locations: JobLocation[];
  sources: JobSource[];
};

function JobsContainer({
  statuses,
  companies,
  titles,
  locations,
  sources,
}: MyJobsProps) {
  const { t } = useTranslations();
  const pathname = usePathname();
  const queryParams = useSearchParams();
  const router = useRouter();
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(queryParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [queryParams]
  );
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [page, setPage] = useState(1);
  const [filterKey, setFilterKey] = useState<string>("all");
  const [editJob, setEditJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key:
      | "title"
      | "company"
      | "status"
      | "createdAt"
      | "appliedDate"
      | "location"
      | "source";
    direction: "asc" | "desc";
  }>({ key: "createdAt", direction: "desc" });

  const loadJobs = useCallback(
    async (page: number, filter?: string) => {
      setLoading(true);
      const { success, data, total, message } = await getJobsList(
        page,
        null,
        filter
      );
      if (success && data) {
        setJobs(data);
        setPage(page);
        setLoading(false);
      } else {
        toast({
          variant: "destructive",
          title: t("Error!"),
          description: message,
        });
        setLoading(false);
        return;
      }
    },
    [t]
  );

  const reloadJobs = useCallback(async () => {
    await loadJobs(1);
    if (filterKey !== "all") {
      setFilterKey("all");
    }
  }, [loadJobs, filterKey]);

  const onDeleteJob = async (jobId: string) => {
    const { res, success, message } = await deleteJobById(jobId);
    if (success) {
      toast({
        variant: "success",
        description: t("Job has been deleted successfully"),
      });
    } else {
      toast({
        variant: "destructive",
        title: t("Error!"),
        description: message,
      });
    }
    reloadJobs();
  };

  const onEditJob = async (jobId: string) => {
    const { job, success, message } = await getJobDetails(jobId);
    if (!success) {
      toast({
        variant: "destructive",
        title: t("Error!"),
        description: message,
      });
      return;
    }
    setEditJob(job);
  };

  const onChangeJobStatus = async (jobId: string, jobStatus: JobStatus) => {
    const { success, message } = await updateJobStatus(jobId, jobStatus);
    if (success) {
      router.refresh();
      toast({
        variant: "success",
        description: t("Job has been updated successfully"),
      });
    } else {
      toast({
        variant: "destructive",
        title: t("Error!"),
        description: message,
      });
    }
    reloadJobs();
  };

  const resetEditJob = () => {
    setEditJob(null);
  };

  useEffect(() => {
    (async () => await loadJobs(1))();
  }, [loadJobs]);

  const filteredJobs = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const filtered = jobs.filter((job) => {
      const matchesSearch =
        !term ||
        job.JobTitle?.label.toLowerCase().includes(term) ||
        (job.Company?.label || "").toLowerCase().includes(term) ||
        (job.Location?.label || "").toLowerCase().includes(term);
      return matchesSearch;
    });
    const direction = sortConfig.direction === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      const getVal = (j: JobResponse) => {
        switch (sortConfig.key) {
          case "title":
            return j.JobTitle?.label || "";
          case "company":
            return j.Company?.label || "";
          case "status":
            return j.Status?.label || "";
          case "location":
            return j.Location?.label || "";
          case "source":
            return j.JobSource?.label || "";
          case "appliedDate":
            return j.appliedDate ? new Date(j.appliedDate).getTime() : 0;
          case "createdAt":
          default:
            return j.createdAt ? new Date(j.createdAt).getTime() : 0;
        }
      };
      const aVal = getVal(a);
      const bVal = getVal(b);
      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * direction;
      }
      return String(aVal).localeCompare(String(bVal)) * direction;
    });
    return sorted;
  }, [jobs, searchTerm, sortConfig]);

  const handleSort = (
    key:
      | "title"
      | "company"
      | "status"
      | "createdAt"
      | "appliedDate"
      | "location"
      | "source"
  ) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const onFilterChange = (filterBy: string) => {
    if (filterBy === "all") {
      reloadJobs();
    } else {
      setFilterKey(filterBy);
      loadJobs(1, filterBy);
    }
  };

  const downloadJobsList = async () => {
    try {
      const res = await fetch("/api/jobs/export", {
        method: "POST",
        headers: {
          "Content-Type": "text/csv",
        },
      });
      if (!res.ok) {
        throw new Error("Failed to download jobs!");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `jobsync-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        variant: "success",
        title: t("Downloaded successfully!"),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("Error!"),
        description:
          error instanceof Error
            ? error.message
            : t("Unknown error occurred."),
      });
    }
  };

  return (
    <>
      <Card x-chunk="dashboard-06-chunk-0">
        <CardHeader className="flex-row justify-between items-center">
          <CardTitle>{t("My Jobs")}</CardTitle>
          <div className="flex items-center">
            <div className="ml-auto flex items-center gap-2">
              <Input
                placeholder={t("Search jobs...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 w-[180px]"
              />
              <Select value={filterKey} onValueChange={onFilterChange}>
                <SelectTrigger className="w-[120px] h-8">
                  <ListFilter className="h-3.5 w-3.5" />
                  <SelectValue placeholder={t("Status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{t("Status")}</SelectLabel>
                    <SelectSeparator />
                    <SelectItem value="all">{t("All statuses")}</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.value}>
                        {t(status.label)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1"
                disabled={loading}
                onClick={downloadJobsList}
              >
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  {t("Export")}
                </span>
              </Button>
              <ImportJobJSON
                jobStatuses={statuses}
                companies={companies}
                jobTitles={titles}
                locations={locations}
                jobSources={sources}
                onImported={reloadJobs}
              />
              <AddJob
                jobStatuses={statuses}
                companies={companies}
                jobTitles={titles}
                locations={locations}
                jobSources={sources}
                editJob={editJob}
                resetEditJob={resetEditJob}
                reloadJobs={reloadJobs}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <Loading />}
          {jobs.length > 0 && (
            <>
              <MyJobsTable
                jobs={filteredJobs}
                jobStatuses={statuses}
                deleteJob={onDeleteJob}
                editJob={onEditJob}
                onChangeJobStatus={onChangeJobStatus}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            </>
          )}
        </CardContent>
        <CardFooter></CardFooter>
      </Card>
    </>
  );
}

export default JobsContainer;
