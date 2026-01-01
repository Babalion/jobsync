"use client";
import { format } from "date-fns";
import { Badge } from "../ui/badge";
import { cn, formatUrl } from "@/lib/utils";
import { JobResponse } from "@/models/job.model";
import { TipTapContentViewer } from "../TipTapContentViewer";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

function JobDetails({ job }: { job: JobResponse }) {
  const router = useRouter();
  const goBack = () => router.back();
  const getJobType = (code: string) => {
    switch (code) {
      case "FT":
        return "Full-time";
      case "PT":
        return "Part-time";
      case "C":
        return "Contract";
      default:
        return "Unknown";
    }
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
  return (
    <>
      <div className="flex justify-between">
        <Button title="Go Back" size="sm" variant="outline" onClick={goBack}>
          <ArrowLeft />
        </Button>
      </div>
      {job?.id && (
        <Card className="col-span-3">
          <CardHeader className="flex-row justify-between relative">
            <div>
              {job?.Company?.label}
              <CardTitle>{job?.JobTitle?.label}</CardTitle>
              <CardDescription>
                {job?.Location?.label} - {getJobType(job?.jobType)}
              </CardDescription>
            </div>
          </CardHeader>
          <h3 className="ml-4">
            {new Date() > job.dueDate && job.Status?.value === "draft" ? (
              <Badge className="bg-slate-500">Expired</Badge>
            ) : (
              <Badge
                className={cn(
                  "w-[70px] justify-center",
                  statusColor(job.Status?.value)
                )}
              >
                {job.Status?.label}
              </Badge>
            )}
            <span className="ml-2">
              {job?.appliedDate ? format(new Date(job?.appliedDate), "PP") : ""}
            </span>
          </h3>
          {job.jobUrl && (
            <div className="my-3 ml-4">
              <span className="font-semibold mr-2">Job URL:</span>
              <a
                href={formatUrl(job.jobUrl)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {job.jobUrl}
              </a>
            </div>
          )}
          <div className="my-4 ml-4">
            <TipTapContentViewer content={job?.description} />
          </div>
          <CardFooter></CardFooter>
        </Card>
      )}
    </>
  );
}

export default JobDetails;
