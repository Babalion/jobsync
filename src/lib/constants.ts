import { LayoutDashboard, BriefcaseBusiness, Sheet } from "lucide-react";

export enum APP_CONSTANTS {
  RECORDS_PER_PAGE = 10,
}

export const SIDEBAR_LINKS = [
  {
    icon: LayoutDashboard,
    route: "/dashboard",
    label: "Dashboard",
  },
  {
    icon: BriefcaseBusiness,
    route: "/dashboard/myjobs",
    label: "My Jobs",
  },
  {
    icon: Sheet,
    route: "/dashboard/admin",
    label: "Administration",
  },
];
