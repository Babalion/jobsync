"use client";
import { useTransition, useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Loader, PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { createJobLocation, updateJobLocation } from "@/actions/jobLocation.actions";
import { JobLocation } from "@/models/job.model";
import { useTranslations } from "@/lib/i18n";
import { geocodeWithAddress } from "@/lib/geocode";

const AddLocationSchema = z.object({
  id: z.string().optional(),
  createdBy: z.string().optional(),
  city: z.string().min(2, { message: "City is required" }),
  zipCode: z.string().min(2, { message: "Zip/postal code is required" }),
  country: z.string().min(2, { message: "Country is required" }),
});

type AddLocationProps = {
  reloadLocations: () => void;
  editLocation?: JobLocation | null;
  resetEditLocation?: () => void;
  compact?: boolean;
  onCreated?: (loc: JobLocation) => void;
  renderTrigger?: boolean;
  locationSuggestions?: JobLocation[];
};

function AddLocation({
  reloadLocations,
  editLocation,
  resetEditLocation,
  compact,
  onCreated,
  renderTrigger = true,
  locationSuggestions = [],
}: AddLocationProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [findingZip, setFindingZip] = useState(false);
  const { t } = useTranslations();

  const form = useForm<z.infer<typeof AddLocationSchema>>({
    resolver: zodResolver(AddLocationSchema),
    defaultValues: {
      id: undefined,
      createdBy: undefined,
      city: "",
      zipCode: "",
      country: "",
    },
  });

  const cityValue = form.watch("city");
  const countryValue = form.watch("country");

  const matchingSuggestions = useMemo(() => {
    const term = cityValue.trim().toLowerCase();
    if (!term) return [];
    return (locationSuggestions || []).filter((loc) =>
      loc.label.toLowerCase().includes(term)
    );
  }, [cityValue, locationSuggestions]);

  useEffect(() => {
    if (editLocation) {
      form.reset({
        id: editLocation.id,
        createdBy: editLocation.createdBy,
        city: editLocation.label,
        zipCode: editLocation.zipCode || "",
        country: editLocation.country || "",
      });
      setOpen(true);
    }
  }, [editLocation, form]);

  const onSubmit = (values: z.infer<typeof AddLocationSchema>) => {
    startTransition(async () => {
      const action = values.id
        ? await updateJobLocation(
            values.id,
            values.city,
            values.zipCode,
            values.country,
            values.createdBy
          )
        : await createJobLocation(values.city, values.zipCode, values.country);
      const { success, message, data } = action || {};
      if (success) {
        toast({
          variant: "success",
          description: values.id ? t("Location updated") : t("Location created"),
        });
        if (data) {
          onCreated?.(data as JobLocation);
        }
        form.reset();
        setOpen(false);
        reloadLocations();
        resetEditLocation?.();
      } else {
        toast({
          variant: "destructive",
          title: t("Error!"),
          description: message,
        });
      }
    });
  };

  return (
    <>
      {renderTrigger && (
        <Button
          size={compact ? "icon" : "sm"}
          variant="outline"
          className={compact ? "h-10 w-10" : "h-8 gap-1"}
          type="button"
          onClick={() => setOpen(true)}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          {!compact && (
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              {t("Add Location")}
            </span>
          )}
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {form.getValues("id") ? t("Edit Location") : t("Add Location")}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.stopPropagation();
                form.handleSubmit(onSubmit)(e);
              }}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("City")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Zip / Postal Code")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    {matchingSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-xs mt-2">
                        {matchingSuggestions.slice(0, 5).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className="rounded-full border px-2 py-1 hover:bg-accent"
                            onClick={() => {
                              form.setValue("zipCode", s.zipCode || "");
                              if (s.country) {
                                form.setValue("country", s.country);
                              }
                            }}
                          >
                            {s.zipCode || t("Zip / Postal Code")}
                            {s.country ? ` • ${s.country}` : ""}
                          </button>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full md:w-auto"
                  onClick={async () => {
                    if (!cityValue) return;
                    setFindingZip(true);
                    const res = await geocodeWithAddress({
                      city: cityValue,
                      zipCode: form.getValues("zipCode"),
                      country: countryValue,
                    });
                    setFindingZip(false);
                    if (res?.zip) {
                      form.setValue("zipCode", res.zip);
                    }
                    if (res?.countryCode && !countryValue) {
                      const code = res.countryCode.toLowerCase();
                      const normalizedCountry =
                        code === "de" ? "deutschland" : code;
                      form.setValue("country", normalizedCountry);
                    }
                    if (!res?.zip) {
                      toast({
                        variant: "destructive",
                        title: t("Error!"),
                        description: t("Could not find a ZIP code. Please enter manually."),
                      });
                    }
                  }}
                  disabled={!cityValue || findingZip}
                >
                  {findingZip ? t("Loading...") : t("Suggest ZIP")}
                </Button>
              </div>
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Country")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="mt-2 md:mt-0"
                >
                  {t("Cancel")}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {t("Save")}
                  {isPending && <Loader className="h-4 w-4 shrink-0 spinner" />}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AddLocation;
