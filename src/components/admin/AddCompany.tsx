"use client";
import { useTransition, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Loader, PlusCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { AddCompanyFormSchema } from "@/models/addCompanyForm.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { toast } from "../ui/use-toast";
import { addCompany, updateCompany } from "@/actions/company.actions";
import { Company } from "@/models/job.model";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { useTranslations } from "@/lib/i18n";

type AddCompanyProps = {
  reloadCompanies: () => void;
  editCompany?: Company | null;
  resetEditCompany: () => void;
  dialogOpen: boolean;
  setDialogOpen: (e: boolean) => void;
};

function AddCompany({
  reloadCompanies,
  editCompany,
  resetEditCompany,
  dialogOpen,
  setDialogOpen,
}: AddCompanyProps) {
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslations();

  const pageTitle = editCompany ? t("Edit Company") : t("Add Company");

  const form = useForm<z.infer<typeof AddCompanyFormSchema>>({
    resolver: zodResolver(AddCompanyFormSchema),
    defaultValues: {
      company: "",
      companyUrl: "",
      archetype: "",
      ownership: "",
      industryRole: "",
      innovationLevel: "",
      cultureTag: "",
      country: "",
      summary: "",
      fitNotes: "",
      hasWorksCouncil: false,
      hasCollectiveAgreement: false,
    },
  });

  const { reset, formState, watch } = form;
  const watchedCompanyUrl = watch("companyUrl");

  const getFaviconFromUrl = (siteUrl?: string) => {
    if (!siteUrl) return "";
    try {
      const url = siteUrl.match(/^https?:\/\//)
        ? new URL(siteUrl)
        : new URL(`https://${siteUrl}`);
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
    } catch {
      return "";
    }
  };

  const previewLogo =
    (watchedCompanyUrl ? getFaviconFromUrl(watchedCompanyUrl) : "") ||
    "/images/jobsync-logo.svg";

  const archetypeOptions = [
    "Konzern-R&D",
    "Mittelstand/Hidden Champion",
    "Deep-Tech Scale-up",
    "Behörde/Regulator",
    "Universität/Lehrstuhl",
    "Forschungsinstitut",
    "Defense-Prime/Systemhaus",
  ];
  const ownershipOptions = ["privat", "öffentlich", "gemeinnützig", "öffentlich finanziert"];
  const innovationOptions = ["hoch", "mittel", "niedrig"];
  const cultureOptions = ["engineering-first", "research-first", "policy-first", "sales-first"];

  useEffect(() => {
    if (editCompany) {
      reset(
        {
          id: editCompany?.id,
          company: editCompany?.label ?? "",
          createdBy: editCompany?.createdBy,
          companyUrl: editCompany?.website ?? "",
          archetype: editCompany?.archetype ?? "",
          ownership: editCompany?.ownership ?? "",
          industryRole: editCompany?.industryRole ?? "",
          innovationLevel: editCompany?.innovationLevel ?? "",
          cultureTag: editCompany?.cultureTag ?? "",
          country: editCompany?.country ?? "",
          summary: editCompany?.summary ?? "",
          fitNotes: editCompany?.fitNotes ?? "",
          hasWorksCouncil: editCompany?.hasWorksCouncil ?? false,
          hasCollectiveAgreement: editCompany?.hasCollectiveAgreement ?? false,
        },
        { keepDefaultValues: true }
      );
    }
  }, [editCompany, reset]);

  const addCompanyForm = () => {
    reset();
    resetEditCompany();
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const onSubmit = (data: z.infer<typeof AddCompanyFormSchema>) => {
    startTransition(async () => {
      const res = editCompany
        ? await updateCompany(data)
        : await addCompany(data);
      if (!res?.success) {
        toast({
          variant: "destructive",
          title: t("Error!"),
          description: res?.message,
        });
      } else {
        reset();
        setDialogOpen(false);
        reloadCompanies();
        toast({
          variant: "success",
          description: editCompany
            ? t("Company has been updated successfully")
            : t("Company has been created successfully"),
        });
      }
    });
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1"
        onClick={addCompanyForm}
        data-testid="add-company-btn"
      >
        <PlusCircle className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          {t("Add Company")}
        </span>
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="lg:max-h-screen overflow-y-scroll lg:max-w-4xl w-full">
            <DialogHeader>
              <DialogTitle>{pageTitle}</DialogTitle>
            </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2"
            >
              <div className="md:col-span-2 flex gap-4 items-start">
                <img
                  alt={t("Logo preview")}
                  src={previewLogo || "/images/jobsync-logo.svg"}
                  width={64}
                  height={64}
                  className="rounded-md border mt-1"
                  onError={(e) => {
                    e.currentTarget.src = "/images/jobsync-logo.svg";
                  }}
                />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* COMPANY NAME */}
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Company Name")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* COMPANY WEBSITE FOR FAVICON */}
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="companyUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Company Website")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="archetype"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Archetype")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("Select archetype")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {archetypeOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ownership"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Ownership")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("Select ownership")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ownershipOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="industryRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Industry & Role")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("Industry & Role")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="innovationLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Innovation Level")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("Select innovation level")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {innovationOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cultureTag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Culture Tag")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("Select culture")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cultureOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Country")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("Country")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("TLDR Summary")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("TLDR Summary")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fitNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Fit Notes")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("Fit Notes")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hasWorksCouncil"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel className="mb-0">{t("Works Council")}</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hasCollectiveAgreement"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel className="mb-0">{t("Collective Agreement")}</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="md:col-span-2 mt-4">
                <DialogFooter
                // className="md:col-span
                >
                  <div>
                    <Button
                      type="reset"
                      variant="outline"
                      className="mt-2 md:mt-0 w-full"
                      onClick={closeDialog}
                    >
                      {t("Cancel")}
                    </Button>
                  </div>
                  <Button type="submit" disabled={!formState.isDirty}>
                    {t("Save")}
                    {isPending && (
                      <Loader className="h-4 w-4 shrink-0 spinner" />
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AddCompany;
