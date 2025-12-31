"use client";
import { useMemo, useState, useTransition } from "react";
import { addJob } from "@/actions/job.actions";
import { AddJobFormSchema } from "@/models/addJobForm.schema";
import {
  Company,
  JOB_TYPES,
  JobLocation,
  JobSource,
  JobStatus,
  JobTitle,
} from "@/models/job.model";
import { z } from "zod";
import { SALARY_RANGES } from "@/lib/data/salaryRangeData";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Loader, Upload } from "lucide-react";
import { toast } from "../ui/use-toast";

type ImportJobJSONProps = {
  jobStatuses: JobStatus[];
  companies: Company[];
  jobTitles: JobTitle[];
  locations: JobLocation[];
  jobSources: JobSource[];
  onImported?: () => void;
};

const selectDefaultStatus = (jobStatuses: JobStatus[]) =>
  jobStatuses.find((status) => status.value === "draft") ?? jobStatuses[0];

const buildTemplate = (
  jobStatuses: JobStatus[],
  companies: Company[],
  jobTitles: JobTitle[],
  locations: JobLocation[],
  jobSources: JobSource[]
) => {
  const defaultStatus = selectDefaultStatus(jobStatuses);
  const fallbackDate = new Date();
  fallbackDate.setDate(fallbackDate.getDate() + 3);
  const first = <T extends { label?: string }>(items: T[], fallback: string) =>
    items[0]?.label ?? fallback;

  const template = {
    title: first(jobTitles, "Software Engineer"),
    company: first(companies, "Acme Corp"),
    location: first(locations, "Remote / Berlin, DE"),
    type: JOB_TYPES.FT,
    source: first(jobSources, "LinkedIn"),
    status: defaultStatus?.label ?? "Draft",
    dueDate: fallbackDate.toISOString(),
    dateApplied: null,
    salaryRange: "1",
    jobDescription:
      "Paste the full job description here or keep this placeholder.",
    jobUrl: "https://example.com/job-posting/123",
    applied: false,
    options: {
      jobTitles: jobTitles.map(({ label, value }) => ({ label, value })),
      companies: companies.map(({ label, value }) => ({ label, value })),
      locations: locations.map(({ label, value }) => ({ label, value })),
      jobTypes: Object.entries(JOB_TYPES).map(([key, label]) => ({
        key,
        label,
      })),
      jobSources: jobSources.map(({ label, value }) => ({ label, value })),
      statuses: jobStatuses.map(({ label, value }) => ({ label, value })),
      salaryRanges: SALARY_RANGES,
    },
  };

  return JSON.stringify(template, null, 2);
};

const normalizeDates = (data: any) => {
  const dueDate = data.dueDate ? new Date(data.dueDate) : new Date();
  const dateAppliedValue =
    data.dateApplied === null || data.dateApplied === undefined
      ? undefined
      : new Date(data.dateApplied);

  if (Number.isNaN(dueDate.getTime())) {
    throw new Error("Invalid dueDate. Please use a valid ISO date string.");
  }
  if (dateAppliedValue && Number.isNaN(dateAppliedValue.getTime())) {
    throw new Error("Invalid dateApplied. Please use a valid ISO date string.");
  }

  return {
    ...data,
    dueDate,
    dateApplied: dateAppliedValue,
  };
};

const resolveId = (
  labelOrId: string,
  list: Array<{ id: string; label: string; value: string }>,
  fieldName: string
) => {
  const match = list.find(
    (item) =>
      item.id === labelOrId ||
      item.label.toLowerCase() === labelOrId.toLowerCase() ||
      item.value.toLowerCase() === labelOrId.toLowerCase()
  );

  if (!match) {
    throw new Error(
      `Unknown ${fieldName}: "${labelOrId}". Please use one of the existing options.`
    );
  }
  return match.id;
};

const resolveJobType = (type: string) => {
  const directKey = Object.keys(JOB_TYPES).find(
    (key) => key.toLowerCase() === type.toLowerCase()
  );
  if (directKey) return directKey;

  const fromLabel = Object.entries(JOB_TYPES).find(
    ([, label]) => label.toLowerCase() === type.toLowerCase()
  );
  if (fromLabel) return fromLabel[0];

  throw new Error(
    `Unknown job type: "${type}". Use a key like "FT" or a label like "${JOB_TYPES.FT}".`
  );
};

const resolveSalaryRange = (salaryRange: string) => {
  const match = SALARY_RANGES.find(
    (range) =>
      range.id === salaryRange ||
      range.value.toLowerCase() === salaryRange.toLowerCase()
  );
  if (!match) {
    throw new Error(
      `Unknown salaryRange: "${salaryRange}". Please use one of: ${SALARY_RANGES.map(
        (r) => r.value
      ).join(", ")}.`
    );
  }
  return match.id;
};

export function ImportJobJSON({
  jobStatuses,
  companies,
  jobTitles,
  locations,
  jobSources,
  onImported,
}: ImportJobJSONProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [jsonValue, setJsonValue] = useState(
    buildTemplate(jobStatuses, companies, jobTitles, locations, jobSources)
  );
  const [isPending, startTransition] = useTransition();

  const defaultTemplate = useMemo(
    () => buildTemplate(jobStatuses, companies, jobTitles, locations, jobSources),
    [jobStatuses, companies, jobTitles, locations, jobSources]
  );

  const openDialog = () => {
    setJsonValue(defaultTemplate);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setJsonValue(defaultTemplate);
    }
  };

  const closeDialog = () => handleDialogChange(false);

  const importJob = () => {
    startTransition(async () => {
      try {
        const parsed = JSON.parse(jsonValue);
        const normalized = normalizeDates(parsed);
        const transformed = {
          ...normalized,
          title: resolveId(
            normalized.title,
            jobTitles,
            "job title (label or id)"
          ),
          company: resolveId(
            normalized.company,
            companies,
            "company (label or id)"
          ),
          location: resolveId(
            normalized.location,
            locations,
            "location (label or id)"
          ),
          source: resolveId(
            normalized.source,
            jobSources,
            "job source (label or id)"
          ),
          status: resolveId(
            normalized.status,
            jobStatuses,
            "status (label or id)"
          ),
          type: resolveJobType(normalized.type),
          salaryRange: resolveSalaryRange(normalized.salaryRange),
        };

        const validData = AddJobFormSchema.parse(transformed);

        const { success, message } = await addJob(validData);
        if (!success) {
          toast({
            variant: "destructive",
            title: "Error!",
            description: message,
          });
          return;
        }

        toast({
          variant: "success",
          description: "Job imported successfully",
        });
        setDialogOpen(false);
        onImported?.();
      } catch (error) {
        if (error instanceof SyntaxError) {
          toast({
            variant: "destructive",
            title: "Invalid JSON",
            description: "Please provide a valid JSON payload.",
          });
          return;
        }
        if (error instanceof z.ZodError) {
          toast({
            variant: "destructive",
            title: "Validation failed",
            description: error.errors[0]?.message ?? "Please check your fields.",
          });
          return;
        }
        toast({
          variant: "destructive",
          title: "Error!",
          description:
            error instanceof Error
              ? error.message
              : "Failed to import job from JSON.",
        });
      }
    });
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1"
        onClick={openDialog}
      >
        <Upload className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          Import Job JSON
        </span>
      </Button>

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogOverlay>
          <DialogContent className="lg:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Job JSON</DialogTitle>
            </DialogHeader>
            <Textarea
              value={jsonValue}
              onChange={(event) => setJsonValue(event.target.value)}
              className="font-mono text-xs min-h-[320px]"
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={importJob}
                disabled={isPending}
                data-testid="import-job-btn"
              >
                Import
                {isPending && <Loader className="h-4 w-4 shrink-0 spinner" />}
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogOverlay>
      </Dialog>
    </>
  );
}
