import { Metadata } from "next";
import { getStatusList } from "@/actions/job.actions";
import { getJobsForMap } from "@/actions/map.actions";
import JobsMap from "@/components/map/JobsMap";

export const metadata: Metadata = {
  title: "Map | JobSync",
};

async function MapPage() {
  const [statusList, mapJobs] = await Promise.all([
    getStatusList(),
    getJobsForMap(),
  ]);

  return (
    <div className="col-span-3">
      <JobsMap jobs={mapJobs?.data || []} statuses={statusList || []} />
    </div>
  );
}

export default MapPage;
