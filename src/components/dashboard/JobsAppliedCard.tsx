"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/lib/i18n";

export default function JobsAppliedCard() {
  const router = useRouter();
  const { t } = useTranslations();
  return (
    <Card className="sm:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle>{t("Jobs Applied")}</CardTitle>
        <CardDescription className="max-w-lg text-balance leading-relaxed">
          {t("Create new jobs to apply and track.")}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/myjobs")}
        >
          <PlusCircle className="h-3.5 w-3.5 mr-1" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            {t("Add New Job")}
          </span>
        </Button>
      </CardFooter>
    </Card>
  );
}
