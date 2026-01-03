import { Metadata } from "next";
import { getStatusList } from "@/actions/job.actions";
import { getCompaniesForMap, getJobsForMap } from "@/actions/map.actions";
import JobsMap from "@/components/map/JobsMap";

export const metadata: Metadata = {
  title: "Map | JobSync",
};

async function MapPage() {
  const [statusList, mapJobs, mapCompanies] = await Promise.all([
    getStatusList(),
    getJobsForMap(),
    getCompaniesForMap(),
  ]);

  return (
    <div className="col-span-3">
      <JobsMap
        jobs={mapJobs?.data || []}
        statuses={statusList || []}
        companies={mapCompanies?.data || []}
      />
    </div>
  );
}

export default MapPage;
