"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import AddCompany from "./AddCompany";
import CompaniesTable from "./CompaniesTable";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Company, JobLocation } from "@/models/job.model";
import { getCompanyById, getCompanyList } from "@/actions/company.actions";
import { getAllJobLocations } from "@/actions/jobLocation.actions";
import Loading from "../Loading";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useTranslations } from "@/lib/i18n";

function CompaniesContainer() {
  const { t } = useTranslations();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState("all");
  const [archetypeFilter, setArchetypeFilter] = useState("all");
  const [locationOptions, setLocationOptions] = useState<JobLocation[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: "label" | "country" | "jobsApplied" | "archetype" | "ownership" | "industryRole";
    direction: "asc" | "desc";
  }>({ key: "label", direction: "asc" });

  const loadCompanies = useCallback(
    async () => {
      setLoading(true);
      try {
        const { data, total } = await getCompanyList(
          1,
          null,
          "applied"
        );
        if (data) {
          setCompanies(data);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reloadCompanies = useCallback(async () => {
    await loadCompanies();
  }, [loadCompanies]);

  const resetEditCompany = () => {
    setEditCompany(null);
  };

  useEffect(() => {
    (async () => await loadCompanies())();
  }, [loadCompanies]);

  useEffect(() => {
    (async () => {
      const list = await getAllJobLocations();
      if (list) {
        setLocationOptions(list);
      }
    })();
  }, []);

  const filteredCompanies = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const filtered = companies.filter((c) => {
      const matchesSearch =
        !term ||
        c.label.toLowerCase().includes(term) ||
        (c.website && c.website.toLowerCase().includes(term)) ||
        (c.country && c.country.toLowerCase().includes(term)) ||
        (c.industryRole && c.industryRole.toLowerCase().includes(term));
      const matchesOwnership =
        ownershipFilter === "all" ||
        (c.ownership || "").toLowerCase() === ownershipFilter;
      const matchesArchetype =
        archetypeFilter === "all" ||
        (c.archetype || "").toLowerCase() === archetypeFilter;
      return matchesSearch && matchesOwnership && matchesArchetype;
    });

    const sorted = [...filtered].sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      const getVal = (comp: Company) => {
        switch (sortConfig.key) {
          case "country":
            return comp.country || "";
          case "archetype":
            return comp.archetype || "";
          case "ownership":
            return comp.ownership || "";
          case "industryRole":
            return comp.industryRole || "";
          case "jobsApplied":
            return comp._count?.jobsApplied ?? 0;
          default:
            return comp.label || "";
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
  }, [archetypeFilter, companies, ownershipFilter, searchTerm, sortConfig]);

  const handleSort = (
    key: "label" | "country" | "jobsApplied" | "archetype" | "ownership" | "industryRole"
  ) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const onEditCompany = async (companyId: string) => {
    const company = await getCompanyById(companyId);
    setEditCompany(company);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="col-span-3">
        <Card x-chunk="dashboard-06-chunk-0">
          <CardHeader className="flex-row justify-between items-center">
            <CardTitle>{t("Companies")}</CardTitle>
            <div className="flex items-center">
              <div className="ml-auto flex items-center gap-2">
                <AddCompany
                  editCompany={editCompany}
                  reloadCompanies={reloadCompanies}
                  resetEditCompany={resetEditCompany}
                  dialogOpen={dialogOpen}
                  setDialogOpen={setDialogOpen}
                  locations={locationOptions}
                  onLocationCreated={(loc) => {
                    setLocationOptions((prev) => [loc as JobLocation, ...prev]);
                  }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
              <Input
                placeholder={t("Search by name, website, country...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:max-w-sm"
              />
              <div className="flex gap-2">
                <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder={t("Ownership")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All ownership")}</SelectItem>
                    <SelectItem value="privat">privat</SelectItem>
                    <SelectItem value="öffentlich">öffentlich</SelectItem>
                    <SelectItem value="gemeinnützig">gemeinnützig</SelectItem>
                    <SelectItem value="öffentlich finanziert">öffentlich finanziert</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={archetypeFilter} onValueChange={setArchetypeFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={t("Archetype")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All archetypes")}</SelectItem>
                    <SelectItem value="konzern-r&d">Konzern-R&D</SelectItem>
                    <SelectItem value="mittelstand/hidden champion">Mittelstand/Hidden Champion</SelectItem>
                    <SelectItem value="deep-tech scale-up">Deep-Tech Scale-up</SelectItem>
                    <SelectItem value="behörde/regulator">Behörde/Regulator</SelectItem>
                    <SelectItem value="universität/lehrstuhl">Universität/Lehrstuhl</SelectItem>
                    <SelectItem value="forschungsinstitut">Forschungsinstitut</SelectItem>
                    <SelectItem value="defense-prime/systemhaus">Defense-Prime/Systemhaus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {loading && <Loading />}
            {companies.length > 0 ? (
              <CompaniesTable
                companies={filteredCompanies}
                reloadCompanies={reloadCompanies}
                editCompany={onEditCompany}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                {t("No companies match your filters.")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default CompaniesContainer;
