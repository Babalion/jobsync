"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { addJob, updateJob } from "@/actions/job.actions";
import { Loader, PlusCircle } from "lucide-react";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { useEffect, useState, useTransition } from "react";
import { AddJobFormSchema } from "@/models/addJobForm.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Company,
  JOB_TYPES,
  JobLocation,
  JobResponse,
  JobSource,
  JobStatus,
  JobTitle,
} from "@/models/job.model";
import { addDays } from "date-fns";
import { z } from "zod";
import { toast } from "../ui/use-toast";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import SelectFormCtrl from "../Select";
import { DatePicker } from "../DatePicker";
import { SALARY_RANGES } from "@/lib/data/salaryRangeData";
import TiptapEditor from "../TiptapEditor";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { redirect } from "next/navigation";
import { Combobox } from "../ComboBox";
import AddLocation from "../admin/AddLocation";
import { useTranslations } from "@/lib/i18n";
import { useMemo } from "react";

type AddJobProps = {
  jobStatuses: JobStatus[];
  companies: Company[];
  jobTitles: JobTitle[];
  locations: JobLocation[];
  jobSources: JobSource[];
  editJob?: JobResponse | null;
  resetEditJob: () => void;
  reloadJobs: () => Promise<void>;
};

export function AddJob({
  jobStatuses,
  companies,
  jobTitles,
  locations,
  jobSources,
  editJob,
  resetEditJob,
  reloadJobs,
}: AddJobProps) {
  const { t } = useTranslations();
  const localizedJobStatuses = useMemo(
    () => jobStatuses.map((s) => ({ ...s, label: t(s.label) })),
    [jobStatuses, t]
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [locationOptions, setLocationOptions] = useState<JobLocation[]>(locations);
  const router = useRouter();
  const form = useForm<z.infer<typeof AddJobFormSchema>>({
    resolver: zodResolver(AddJobFormSchema),
    defaultValues: {
      type: Object.keys(JOB_TYPES)[0],
      dueDate: addDays(new Date(), 3),
      status: jobStatuses[0].id,
      salaryRange: "1",
      jobUrl: "",
      applied: false,
    },
  });

  const { setValue, reset, watch, resetField } = form;

  const appliedValue = watch("applied");
  useEffect(() => {
    setLocationOptions(locations);
  }, [locations]);

  useEffect(() => {
    if (editJob) {
      reset(
        {
          id: editJob.id,
          userId: editJob.userId,
          title: editJob.JobTitle.id,
          company: editJob.Company.id,
          location: editJob.Location.id,
          type: editJob.jobType,
          source: editJob.JobSource.id,
          status: editJob.Status.id,
          dueDate: editJob.dueDate,
          salaryRange: editJob.salaryRange,
          jobDescription: editJob.description,
          applied: editJob.applied,
          jobUrl: editJob.jobUrl ?? "",
          dateApplied: editJob.appliedDate ?? undefined,
        },
        { keepDefaultValues: true }
      );
      setDialogOpen(true);
    }
  }, [editJob, reset]);

  function onSubmit(data: z.infer<typeof AddJobFormSchema>) {
    startTransition(async () => {
      const { success, message } = editJob
        ? await updateJob(data)
        : await addJob(data);
      if (success) {
        toast({
          variant: "success",
          description: editJob
            ? t("Job has been updated successfully")
            : t("Job has been created successfully"),
        });
        await reloadJobs();
        router.refresh();
        reset();
        resetEditJob();
        setDialogOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: t("Error!"),
          description: message,
        });
      }
    });
  }

  const pageTitle = editJob ? t("Edit Job") : t("Add Job");

  const addJobForm = () => {
    reset();
    resetEditJob();
    setDialogOpen(true);
  };

  const jobAppliedChange = (applied: boolean) => {
    if (applied) {
      form.getValues("status") === jobStatuses[0].id &&
        setValue("status", jobStatuses[1].id);
      setValue("dateApplied", new Date());
    } else {
      resetField("dateApplied");
      setValue("status", jobStatuses[0].id);
    }
  };

  const closeDialog = () => setDialogOpen(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1"
        onClick={addJobForm}
        data-testid="add-job-btn"
      >
        <PlusCircle className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          {t("Add Job")}
        </span>
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogOverlay>
          <DialogContent className="h-full xl:h-[85vh] lg:h-[95vh] lg:max-w-screen-lg lg:max-h-screen overflow-y-scroll">
            <DialogHeader>
              <DialogTitle data-testid="add-job-dialog-title">
                {pageTitle}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4"
              >
                {/* Job Title */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("Job Title")}</FormLabel>
                        <FormControl>
                          <Combobox
                            options={jobTitles}
                            field={field}
                            creatable
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Company */}
                <div>
                  <FormField
                    control={form.control}
                    name="company"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("Company")}</FormLabel>
                      <FormControl>
                        <Combobox
                          options={companies}
                          field={field}
                          creatable
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                />
              </div>
                {/* Location */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="location"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("Job Location")}</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Combobox
                            options={locationOptions}
                            field={field}
                              creatable={false}
                            />
                          </FormControl>
                          <AddLocation
                            compact
                            reloadLocations={async () => {
                              // just trigger options refresh from existing array
                              setLocationOptions([...locationOptions]);
                            }}
                            onCreated={(loc) => {
                              setLocationOptions((prev) => [loc, ...prev]);
                              setValue("location", loc.id);
                            }}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Job Type & Source */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="type"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="mb-2">{t("Job Type")}</FormLabel>
                      <RadioGroup
                        name="type"
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-y-1"
                        >
                          {Object.entries(JOB_TYPES).map(([key, value]) => (
                            <FormItem
                              key={key}
                              className="flex items-center space-x-3 space-y-0"
                            >
                              <FormControl>
                                <RadioGroupItem value={key} />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {t(value)}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="source"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("Job Source")}</FormLabel>
                      <Combobox options={jobSources} field={field} />
                      <FormMessage />
                    </FormItem>
                  )}
                  />
                </div>

                {/* Status & Applied */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="flex flex-col [&>button]:capitalize">
                      <FormLabel>{t("Status")}</FormLabel>
                        <SelectFormCtrl
                          label={t("Job Status")}
                          options={localizedJobStatuses}
                          field={field}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center" data-testid="switch-container">
                    <FormField
                      control={form.control}
                      name="applied"
                      render={({ field }) => (
                        <FormItem className="flex flex-row">
                          <Switch
                            id="applied-switch"
                            checked={field.value}
                            onCheckedChange={(a) => {
                              field.onChange(a);
                              jobAppliedChange(a);
                            }}
                          />
                          <FormLabel
                            htmlFor="applied-switch"
                            className="flex items-center ml-4 mb-2"
                          >
                            {field.value ? t("Applied") : t("Not Applied")}
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="dateApplied"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("Date Applied")}</FormLabel>
                        <DatePicker
                          field={field}
                          presets={false}
                          isEnabled={appliedValue}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("Due Date")}</FormLabel>
                        <DatePicker
                          field={field}
                          presets={true}
                          isEnabled={true}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Salary Range & Job URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="salaryRange"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("Salary Range")}</FormLabel>
                        <FormControl>
                          <SelectFormCtrl
                            label={t("Salary Range")}
                            options={SALARY_RANGES}
                            field={field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jobUrl"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("Job URL")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("Copy and paste job link here")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Job Description */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="jobDescription"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel id="job-description-label">
                          {t("Job Description")}
                        </FormLabel>
                        <FormControl>
                          <TiptapEditor field={field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="md:col-span-2">
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
                    <Button type="submit" data-testid="save-job-btn">
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
        </DialogOverlay>
      </Dialog>
    </>
  );
}
