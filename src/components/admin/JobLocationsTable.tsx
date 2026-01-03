"use client";
import { useState } from "react";
import { DeleteAlertDialog } from "../DeleteAlertDialog";
import { Button } from "../ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { JobLocation } from "@/models/job.model";
import { MoreHorizontal, Trash } from "lucide-react";
import { AlertDialog } from "@/models/alertDialog.model";
import { toast } from "../ui/use-toast";
import { deleteJobLocationById } from "@/actions/jobLocation.actions";
import { Badge } from "../ui/badge";
import { useTranslations } from "@/lib/i18n";

type JobLocationsTableProps = {
  jobLocations: JobLocation[];
  reloadJobLocations: () => void;
  sortConfig: {
    key: "label" | "zipCode" | "country" | "jobsApplied";
    direction: "asc" | "desc";
  };
  onSort: (key: "label" | "zipCode" | "country" | "jobsApplied") => void;
  onEditLocation?: (location: JobLocation) => void;
};

function JobLocationsTable({
  jobLocations,
  reloadJobLocations,
  sortConfig,
  onSort,
  onEditLocation,
}: JobLocationsTableProps) {
  const { t } = useTranslations();
  const [alert, setAlert] = useState<AlertDialog>({
    openState: false,
    deleteAction: false,
  });
  const onDeleteJobLocation = (location: JobLocation) => {
    if (location._count?.jobsApplied! > 0) {
      setAlert({
        openState: true,
        title: t("Applied jobs exist!"),
        description: t(
          "Associated jobs applied must be 0 to be able to delete this job location"
        ),
        deleteAction: false,
      });
    } else {
      setAlert({
        openState: true,
        deleteAction: true,
        itemId: location.id,
      });
    }
  };
  const deleteJobLocation = async (locationId: string) => {
    if (locationId) {
      const { success, message } = await deleteJobLocationById(locationId);
      if (success) {
        toast({
          variant: "success",
          description: t("Job location has been deleted successfully"),
        });
        reloadJobLocations();
      } else {
        toast({
          variant: "destructive",
          title: t("Error!"),
          description: message,
        });
      }
    }
  };

  const SortButton = ({
    label,
    sortKey,
  }: {
    label: string;
    sortKey: "label" | "zipCode" | "country" | "jobsApplied" | "lat";
  }) => {
    const isActive = sortConfig.key === sortKey;
    const direction = sortConfig.direction === "asc" ? "↑" : "↓";
    return (
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:underline"
      >
        <span>{label}</span>
        {isActive && <span className="text-muted-foreground text-xs">{direction}</span>}
      </button>
    );
  };
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortButton label={t("City")} sortKey="label" />
            </TableHead>
            <TableHead>
              <SortButton label={t("Zip")} sortKey="zipCode" />
            </TableHead>
            <TableHead>
              <SortButton label={t("Country")} sortKey="country" />
            </TableHead>
            <TableHead>
              <SortButton label={t("Jobs")} sortKey="jobsApplied" />
            </TableHead>
            <TableHead className="hidden md:table-cell">
              {t("Lat / Lng")}
            </TableHead>
            <TableHead></TableHead>
            <TableHead>
              <span className="sr-only">{t("Actions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobLocations.map((location: JobLocation) => {
            return (
              <TableRow key={location.id}>
                <TableCell className="font-medium">{location.label}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {location.zipCode || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {location.country || "—"}
                </TableCell>
                <TableCell className="font-medium">
                  <Badge variant="secondary">
                    {location._count?.jobsApplied ?? 0}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                  {location.lat != null && location.lng != null
                    ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                    : "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{t("Toggle menu")}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onEditLocation?.(location)}
                      >
                        {t("Edit Location")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 cursor-pointer"
                        onClick={() => onDeleteJobLocation(location)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        {t("Delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}

export default JobLocationsTable;
