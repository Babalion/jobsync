"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { JobTitle } from "@prisma/client";
import JobTitlesTable from "./JobTitlesTable";
import { getJobTitleList } from "@/actions/jobtitle.actions";
import Loading from "../Loading";
import { useTranslations } from "@/lib/i18n";

function JobTitlesContainer() {
  const { t } = useTranslations();
  const [titles, setTitles] = useState<JobTitle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadJobTitles = useCallback(
    async () => {
      setLoading(true);
      const { data, total } = await getJobTitleList(
        1,
        null,
        "applied"
      );
      if (data) {
        setTitles(data);
        setLoading(false);
      }
    },
    []
  );

  const reloadJobTitles = useCallback(async () => {
    await loadJobTitles();
  }, [loadJobTitles]);

  useEffect(() => {
    (async () => await loadJobTitles())();
  }, [loadJobTitles]);

  return (
    <>
      <div className="col-span-3">
        <Card x-chunk="dashboard-06-chunk-0">
          <CardHeader className="flex-row justify-between items-center">
            <CardTitle>{t("Job Titles")}</CardTitle>
            <div className="flex items-center">
              <div className="ml-auto flex items-center gap-2">
                {/* <AddCompany reloadCompanies={reloadJobTitles} /> */}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && <Loading />}
            {titles.length > 0 && (
              <JobTitlesTable jobTitles={titles} reloadJobTitles={reloadJobTitles} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default JobTitlesContainer;
