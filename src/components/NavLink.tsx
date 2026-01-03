"use client";
import React, { ForwardRefExoticComponent, RefAttributes } from "react";
import Link from "next/link";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

interface NavLinkProps {
  label: string;
  Icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  route: string;
  pathname: string;
}

function NavLink({ label, Icon, route, pathname }: NavLinkProps) {
  const { t } = useTranslations();
  const translatedLabel = t(label);
  const isActive =
    route === pathname || pathname.startsWith(`${route}/dashboard`);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={route}
          className={cn("navlink", {
            "border-b-2 border-black dark:border-white": isActive,
          })}
        >
          <Icon
            className={cn("h-5 w-5", {
              "text-black dark:text-white": isActive,
            })}
          />
          <span className="sr-only">{translatedLabel}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{translatedLabel}</TooltipContent>
    </Tooltip>
  );
}

export default NavLink;
