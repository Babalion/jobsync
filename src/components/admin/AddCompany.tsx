"use client";
import { useTransition, useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

  const pageTitle = editCompany ? "Edit Company" : "Add Company";

  const form = useForm<z.infer<typeof AddCompanyFormSchema>>({
    resolver: zodResolver(AddCompanyFormSchema),
    defaultValues: {
      company: "",
      companyUrl: "",
    },
  });

  const { reset, formState, watch, setValue } = form;
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

  useEffect(() => {
    if (editCompany) {
      reset(
        {
          id: editCompany?.id,
          company: editCompany?.label ?? "",
          createdBy: editCompany?.createdBy,
          companyUrl: editCompany?.website ?? "",
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
          title: "Error!",
          description: res?.message,
        });
      } else {
        reset();
        setDialogOpen(false);
        reloadCompanies();
        toast({
          variant: "success",
          description: `Company has been ${
            editCompany ? "updated" : "created"
          } successfully`,
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
          Add Company
        </span>
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="lg:max-h-screen overflow-y-scroll">
          <DialogHeader>
            <DialogTitle>{pageTitle}</DialogTitle>
            <DialogDescription className="text-primary">
              Caution: Editing name of the company will affect all the related
              job records.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2"
            >
              {/* COMPANY NAME */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
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
                      <FormLabel>Company Website</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            const favicon = getFaviconFromUrl(e.target.value);
                            if (favicon) {
                              setValue("companyUrl", e.target.value, {
                                shouldDirty: true,
                              });
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* LOGO PREVIEW */}
              <div className="md:col-span-2 flex items-center gap-4">
                <img
                  alt="Logo preview"
                  src={previewLogo || "/images/jobsync-logo.svg"}
                  width={48}
                  height={48}
                  className="rounded-md border"
                  onError={(e) => {
                    e.currentTarget.src = "/images/jobsync-logo.svg";
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  Preview (logo URL or favicon)
                </p>
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
                      Cancel
                    </Button>
                  </div>
                  <Button type="submit" disabled={!formState.isDirty}>
                    Save
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
