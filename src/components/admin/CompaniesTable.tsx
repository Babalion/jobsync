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
  const [alert, setAlert] = useState<AlertDialog>({
    openState: false,
    deleteAction: false,
  });

  const onDeleteCompany = (company: Company) => {
    if (company._count?.jobsApplied! > 0) {
      setAlert({
        openState: true,
        title: "Applied jobs exist!",
        description:
          "Associated jobs applied must be 0 to be able to delete this company",
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
          description: `Company has been deleted successfully`,
        });
        reloadCompanies();
      } else {
        toast({
          variant: "destructive",
          title: "Error!",
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
              <SortButton label="Company" sortKey="label" />
            </TableHead>
            <TableHead>
              <SortButton label="Archetype" sortKey="archetype" />
            </TableHead>
            <TableHead>
              <SortButton label="Ownership" sortKey="ownership" />
            </TableHead>
            <TableHead>
              <SortButton label="Industry Role" sortKey="industryRole" />
            </TableHead>
            <TableHead>Innovation</TableHead>
            <TableHead>
              <SortButton label="Country" sortKey="country" />
            </TableHead>
            <TableHead>Works Council</TableHead>
            <TableHead>Tarifvertrag</TableHead>
            <TableHead>
              <SortButton label="Jobs Applied" sortKey="jobsApplied" />
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
                      alt="Company logo"
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
                  {company.hasWorksCouncil ? "Yes" : "No"}
                </TableCell>
                <TableCell className="text-sm">
                  {company.hasCollectiveAgreement ? "Yes" : "No"}
                </TableCell>
                <TableCell className="font-medium">
                  {company._count?.jobsApplied ?? 0}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => editCompany(company.id)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Company
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 cursor-pointer"
                        onClick={() => onDeleteCompany(company)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
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
        pageTitle="company"
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
