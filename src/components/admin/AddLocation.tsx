"use client";
import { useTransition, useState, useEffect } from "react";
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
};

function AddLocation({
  reloadLocations,
  editLocation,
  resetEditLocation,
  compact,
  onCreated,
}: AddLocationProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

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
          description: values.id ? "Location updated" : "Location created",
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
          title: "Error!",
          description: message,
        });
      }
    });
  };

  return (
    <>
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
            Add Location
          </span>
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.getValues("id") ? "Edit Location" : "Add Location"}</DialogTitle>
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
                    <FormLabel>City</FormLabel>
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
                    <FormLabel>Zip / Postal Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
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
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  Save
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
