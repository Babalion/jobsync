"use client";
import CompaniesContainer from "@/components/admin/CompaniesContainer";
import JobLocationsContainer from "@/components/admin/JobLocationsContainer";
import JobTitlesContainer from "@/components/admin/JobTitlesContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "@/lib/i18n";

function AdminTabsContainer() {
  const { t } = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const queryParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(queryParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [queryParams]
  );

  const onTabChange = (tab: string) => {
    router.push(pathname + "?" + createQueryString("tab", tab));
  };
  return (
    <Tabs
      defaultValue={queryParams.get("tab") || "companies"}
      onValueChange={(e) => onTabChange(e)}
    >
      <TabsList>
        <TabsTrigger value="companies">{t("Companies")}</TabsTrigger>
        <TabsTrigger value="job-titles">{t("Job Titles")}</TabsTrigger>
        <TabsTrigger value="locations">{t("Locations")}</TabsTrigger>
      </TabsList>
      <TabsContent value="companies">
        <CompaniesContainer />
      </TabsContent>
      <TabsContent value="job-titles">
        <JobTitlesContainer />
      </TabsContent>
      <TabsContent value="locations">
        <JobLocationsContainer />
      </TabsContent>
    </Tabs>
  );
}

export default AdminTabsContainer;
