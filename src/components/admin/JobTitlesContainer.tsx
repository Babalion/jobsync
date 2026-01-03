"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { APP_CONSTANTS } from "@/lib/constants";
import { JobTitle } from "@prisma/client";
import JobTitlesTable from "./JobTitlesTable";
import { getJobTitleList } from "@/actions/jobtitle.actions";
import Loading from "../Loading";
import { Button } from "../ui/button";
import { useTranslations } from "@/lib/i18n";

function JobTitlesContainer() {
  const { t } = useTranslations();
  const [titles, setTitles] = useState<JobTitle[]>([]);
  const [totalJobTitles, setTotalJobTitles] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  const recordsPerPage = APP_CONSTANTS.RECORDS_PER_PAGE;

  const loadJobTitles = useCallback(
    async (page: number) => {
      setLoading(true);
      const { data, total } = await getJobTitleList(
        page,
        recordsPerPage,
        "applied"
      );
      if (data) {
        setTitles((prev) => (page === 1 ? data : [...prev, ...data]));
        setTotalJobTitles(total);
        setPage(page);
        setLoading(false);
      }
    },
    [recordsPerPage]
  );

  const reloadJobTitles = useCallback(async () => {
    await loadJobTitles(1);
  }, [loadJobTitles]);

  useEffect(() => {
    (async () => await loadJobTitles(1))();
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
              <>
                <JobTitlesTable
                  jobTitles={titles}
                  reloadJobTitles={reloadJobTitles}
                />
                <div className="text-xs text-muted-foreground">
                  {t("Showing {start} to {end} of {total} job titles", {
                    values: { start: 1, end: titles.length, total: totalJobTitles },
                  })}
                </div>
              </>
            )}
            {titles.length < totalJobTitles && (
              <div className="flex justify-center p-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadJobTitles(page + 1)}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? t("Loading...") : t("Load More")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default JobTitlesContainer;
