"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  ListCollapse,
  MoreHorizontal,
  Pencil,
  Tags,
  Trash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { useState } from "react";
import { Company, JobResponse, JobStatus } from "@/models/job.model";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeleteAlertDialog } from "../DeleteAlertDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useTranslations } from "@/lib/i18n";

type MyJobsTableProps = {
  jobs: JobResponse[];
  jobStatuses: JobStatus[];
  deleteJob: (id: string) => void;
  editJob: (id: string) => void;
  onChangeJobStatus: (id: string, status: JobStatus) => void;
  sortConfig?: {
    key:
      | "title"
      | "company"
      | "status"
      | "createdAt"
      | "appliedDate"
      | "location"
      | "source";
    direction: "asc" | "desc";
  };
  onSort?: (
    key:
      | "title"
      | "company"
      | "status"
      | "createdAt"
      | "appliedDate"
      | "location"
      | "source"
  ) => void;
};

function MyJobsTable({
  jobs,
  jobStatuses,
  deleteJob,
  editJob,
  onChangeJobStatus,
  sortConfig,
  onSort,
}: MyJobsTableProps) {
  const { t, dateLocale } = useTranslations();
  const [alertOpen, setAlertOpen] = useState(false);
  const [jobIdToDelete, setJobIdToDelete] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);

  const router = useRouter();
  const viewJobDetails = (jobId: string) => {
    router.push(`/dashboard/myjobs/${jobId}`);
  };

  const onDeleteJob = (jobId: string) => {
    setAlertOpen(true);
    setJobIdToDelete(jobId);
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

  const openCompanyDialog = (company?: Company | null) => {
    if (!company) return;
    setSelectedCompany(company);
    setCompanyDialogOpen(true);
  };

  const SortButton = ({
    label,
    sortKey,
  }: {
    label: string;
    sortKey:
      | "title"
      | "company"
      | "status"
      | "createdAt"
      | "appliedDate"
      | "location"
      | "source";
  }) => {
    const isActive = sortConfig?.key === sortKey;
    const direction = sortConfig?.direction === "asc" ? "↑" : "↓";
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:underline"
        onClick={() => onSort?.(sortKey)}
      >
        <span>{label}</span>
        {isActive && (
          <span className="text-muted-foreground text-xs">{direction}</span>
        )}
      </button>
    );
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden w-[100px] sm:table-cell">
              <span className="sr-only">{t("Company Logo")}</span>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <SortButton label={t("Date Added")} sortKey="createdAt" />
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <SortButton label={t("Date Applied")} sortKey="appliedDate" />
            </TableHead>
            <TableHead>
              <SortButton label={t("Title")} sortKey="title" />
            </TableHead>
            <TableHead>
              <SortButton label={t("Company")} sortKey="company" />
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <SortButton label={t("Location")} sortKey="location" />
            </TableHead>
            <TableHead>
              <SortButton label={t("Status")} sortKey="status" />
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <SortButton label={t("Source")} sortKey="source" />
            </TableHead>
            <TableHead>
              <span className="sr-only">{t("Actions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job: JobResponse) => {
            return (
              <TableRow key={job.id}>
                <TableCell className="hidden sm:table-cell">
                  <img
                    alt={t("Company Logo")}
                    className="aspect-square rounded-md object-cover"
                    height={32}
                    src={job.Company?.logoUrl || "/images/jobsync-logo.svg"}
                    onError={(e) => {
                      e.currentTarget.src = "/images/jobsync-logo.svg";
                    }}
                    width={32}
                  />
                </TableCell>
                <TableCell className="hidden md:table-cell w-[120px]">
                  {job.createdAt
                    ? format(job.createdAt, "PP", { locale: dateLocale })
                    : t("Unknown")}
                </TableCell>
                <TableCell className="hidden md:table-cell w-[120px]">
                  {job.appliedDate
                    ? format(job.appliedDate, "PP", { locale: dateLocale })
                    : t("Unknown")}
                </TableCell>
                <TableCell
                  className="font-medium cursor-pointer"
                  // onClick={() => viewJobDetails(job?.id)}
                >
                  <Link href={`/dashboard/myjobs/${job?.id}`}>
                    {job.JobTitle?.label}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">
                  <button
                    type="button"
                    className="text-left hover:underline"
                    onClick={() => openCompanyDialog(job.Company)}
                  >
                    {job.Company?.label}
                  </button>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {job.Location?.label}
                </TableCell>
                <TableCell>
                  {new Date() > job.dueDate && job.Status?.value === "draft" ? (
                    <Badge className="bg-slate-500">{t("Expired")}</Badge>
                  ) : (
                    <Badge
                      className={cn(
                        "w-[70px] justify-center",
                        statusColor(job.Status?.value)
                      )}
                    >
                      {t(job.Status?.label || "")}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {job.JobSource?.label}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-haspopup="true"
                        size="icon"
                        variant="ghost"
                        data-testid="job-actions-menu-btn"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{t("Toggle menu")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel>
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => viewJobDetails(job?.id)}
                        >
                          <ListCollapse className="mr-2 h-4 w-4" />
                          {t("View Details")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => editJob(job.id)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          {t("Edit Job")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <Tags className="mr-2 h-4 w-4" />
                              {t("Change status")}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent className="p-0">
                              {jobStatuses.map((status) => (
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  key={status.id}
                                  onSelect={(_) => {
                                    onChangeJobStatus(job.id, status);
                                  }}
                                  disabled={status.id === job.Status.id}
                                >
                                  <span>{t(status.label)}</span>
                                </DropdownMenuItem>
                              ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          {/* <Command>
                              <CommandList>
                                <CommandGroup>
                                  {jobStatuses.map((status) => (
                                    <CommandItem
                                      className="cursor-pointer"
                                      key={status.id}
                                      value={status.label}
                                      onSelect={(value) => {
                                        onChangeJobStatus(value);
                                      }}
                                    >
                                      {status.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command> */}
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 cursor-pointer"
                          onClick={() => onDeleteJob(job.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          {t("Delete")}
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <DeleteAlertDialog
        pageTitle="Job"
        open={alertOpen}
        onOpenChange={setAlertOpen}
        onDelete={() => deleteJob(jobIdToDelete)}
      />
      <Dialog open={companyDialogOpen} onOpenChange={setCompanyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <img
                alt={t("Company Logo")}
                className="h-10 w-10 rounded-md border object-cover"
                src={selectedCompany?.logoUrl || "/images/jobsync-logo.svg"}
                onError={(e) => {
                  e.currentTarget.src = "/images/jobsync-logo.svg";
                }}
              />
              <span>{selectedCompany?.label || t("Company")}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-2 text-sm">
              {selectedCompany.website && (
                <div className="flex gap-2">
                  <span className="font-medium w-28">{t("Website")}</span>
                  <a
                    className="text-primary underline break-all"
                    href={
                      selectedCompany.website.startsWith("http")
                        ? selectedCompany.website
                        : `https://${selectedCompany.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    {selectedCompany.website}
                  </a>
                </div>
              )}
              {selectedCompany.archetype && (
                <div className="flex gap-2">
                  <span className="font-medium w-28">{t("Archetype")}</span>
                  <span>{selectedCompany.archetype}</span>
                </div>
              )}
              {selectedCompany.ownership && (
                <div className="flex gap-2">
                  <span className="font-medium w-28">{t("Ownership")}</span>
                  <span>{selectedCompany.ownership}</span>
                </div>
              )}
              {selectedCompany.industryRole && (
                <div className="flex gap-2">
                  <span className="font-medium w-28">{t("Industry Role")}</span>
                  <span>{selectedCompany.industryRole}</span>
                </div>
              )}
              {selectedCompany.innovationLevel && (
                <div className="flex gap-2">
                  <span className="font-medium w-28">{t("Innovation")}</span>
                  <span>{selectedCompany.innovationLevel}</span>
                </div>
              )}
              {selectedCompany.country && (
                <div className="flex gap-2">
                  <span className="font-medium w-28">{t("Country")}</span>
                  <span>{selectedCompany.country}</span>
                </div>
              )}
              {selectedCompany.summary && (
                <div className="flex gap-2">
                  <span className="font-medium w-28">{t("Summary")}</span>
                  <span className="flex-1">{selectedCompany.summary}</span>
                </div>
              )}
              {selectedCompany.fitNotes && (
                <div className="flex gap-2">
                  <span className="font-medium w-28">{t("Notes")}</span>
                  <span className="flex-1">{selectedCompany.fitNotes}</span>
                </div>
              )}
              <div className="flex gap-4 pt-2">
                <Badge variant="secondary">
                  {selectedCompany.hasWorksCouncil
                    ? t("Betriebsrat: Yes")
                    : t("Betriebsrat: No")}
                </Badge>
                <Badge variant="secondary">
                  {selectedCompany.hasCollectiveAgreement
                    ? t("Tarifvertrag: Yes")
                    : t("Tarifvertrag: No")}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default MyJobsTable;
