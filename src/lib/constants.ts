import {
  LayoutDashboard,
  BriefcaseBusiness,
  Sheet,
  MapPinned,
} from "lucide-react";

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
    icon: MapPinned,
    route: "/dashboard/map",
    label: "Map",
  },
  {
    icon: Sheet,
    route: "/dashboard/admin",
    label: "Administration",
  },
];
