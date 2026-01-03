"use client";
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
import { Company } from "@/models/job.model";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { useState } from "react";
import { deleteCompanyById } from "@/actions/company.actions";
import { toast } from "../ui/use-toast";
import { DeleteAlertDialog } from "../DeleteAlertDialog";
import { AlertDialog } from "@/models/alertDialog.model";
import { useTranslations } from "@/lib/i18n";

type CompaniesTableProps = {
  companies: Company[];
  reloadCompanies: () => void;
  editCompany: (id: string) => void;
  sortConfig: {
    key: "label" | "country" | "jobsApplied" | "archetype" | "ownership" | "industryRole";
    direction: "asc" | "desc";
  };
  onSort: (
    key: "label" | "country" | "jobsApplied" | "archetype" | "ownership" | "industryRole"
  ) => void;
};

function CompaniesTable({
  companies,
  reloadCompanies,
  editCompany,
  sortConfig,
  onSort,
}: CompaniesTableProps) {
  const { t } = useTranslations();
  const [alert, setAlert] = useState<AlertDialog>({
    openState: false,
    deleteAction: false,
  });

  const onDeleteCompany = (company: Company) => {
    if (company._count?.jobsApplied! > 0) {
      setAlert({
        openState: true,
        title: t("Applied jobs exist!"),
        description: t(
          "Associated jobs applied must be 0 to be able to delete this company"
        ),
        deleteAction: false,
      });
    } else {
      setAlert({
        openState: true,
        deleteAction: true,
        itemId: company.id,
      });
    }
  };

  const deleteCompany = async (companyId: string | undefined) => {
    if (companyId) {
      const { res, success, message } = await deleteCompanyById(companyId);
      if (success) {
        toast({
          variant: "success",
          description: t("Company has been deleted successfully"),
        });
        reloadCompanies();
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
    sortKey:
      | "label"
      | "country"
      | "jobsApplied"
      | "archetype"
      | "ownership"
      | "industryRole";
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
              <SortButton label={t("Company")} sortKey="label" />
            </TableHead>
            <TableHead>
              <SortButton label={t("Archetype")} sortKey="archetype" />
            </TableHead>
            <TableHead>
              <SortButton label={t("Ownership")} sortKey="ownership" />
            </TableHead>
            <TableHead>
              <SortButton label={t("Industry Role")} sortKey="industryRole" />
            </TableHead>
            <TableHead>{t("Innovation")}</TableHead>
            <TableHead>
              <SortButton label={t("Country")} sortKey="country" />
            </TableHead>
            <TableHead>{t("Works Council")}</TableHead>
            <TableHead>{t("Collective Agreement")}</TableHead>
            <TableHead>
              <SortButton label={t("Jobs Applied")} sortKey="jobsApplied" />
            </TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company: Company) => {
            return (
              <TableRow key={company.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <img
                      alt={t("Company Logo")}
                      className="aspect-square rounded-md object-cover border"
                      height={36}
                      src={company.logoUrl || "/images/jobsync-logo.svg"}
                      onError={(e) => {
                        e.currentTarget.src = "/images/jobsync-logo.svg";
                      }}
                      width={36}
                    />
                    <div className="flex flex-col">
                      {company.website ? (
                        <a
                          className="font-semibold"
                          href={
                            company.website.startsWith("http")
                              ? company.website
                              : `https://${company.website}`
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          {company.label}
                        </a>
                      ) : (
                        <span className="font-semibold">{company.label}</span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {company.archetype || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {company.ownership || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {company.industryRole || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {company.innovationLevel || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {company.country || "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {company.hasWorksCouncil ? t("Yes") : t("No")}
                </TableCell>
                <TableCell className="text-sm">
                  {company.hasCollectiveAgreement ? t("Yes") : t("No")}
                </TableCell>
                <TableCell className="font-medium">
                  {company._count?.jobsApplied ?? 0}
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
                      onClick={() => editCompany(company.id)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      {t("Edit Company")}
                    </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 cursor-pointer"
                        onClick={() => onDeleteCompany(company)}
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
      <DeleteAlertDialog
        pageTitle="Company"
        open={alert.openState}
        onOpenChange={() => setAlert({ openState: false, deleteAction: false })}
        onDelete={() => deleteCompany(alert.itemId)}
        alertTitle={alert.title}
        alertDescription={alert.description}
        deleteAction={alert.deleteAction}
      />
    </>
  );
}

export default CompaniesTable;
