"use client";

import { Check, ChevronsUpDown, CirclePlus, Loader } from "lucide-react";
import { ControllerRenderProps } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FormControl } from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { useState, useTransition } from "react";
import { createLocation } from "@/actions/job.actions";
import { addCompany } from "@/actions/company.actions";
import { createJobTitle } from "@/actions/jobtitle.actions";
import { toast } from "./ui/use-toast";

interface ComboboxProps {
  options: any[];
  field: ControllerRenderProps<any, any>;
  creatable?: boolean;
  extraPayload?: Record<string, any>;
}

export function Combobox({ options, field, creatable, extraPayload }: ComboboxProps) {
  const [newOption, setNewOption] = useState<string>("");
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  const [isPending, startTransition] = useTransition();

  const onCreateOption = (label: string) => {
    if (!label || !creatable) return;
    startTransition(async () => {
      let response;
      switch (field.name) {
        case "company":
          const res = await addCompany({ company: label });
          if (!res?.success) {
            toast({
              variant: "destructive",
              title: "Error!",
              description: res?.message ?? "Failed to create item.",
            });
            return;
          }
          response = res.data;
          break;
        case "title":
          response = await createJobTitle(label);
          if ((response as any)?.success === false) {
            toast({
              variant: "destructive",
              title: "Error!",
              description:
                (response as any)?.message ?? "Failed to create item.",
            });
            return;
          }
          break;
        case "location": {
          const zipCode = extraPayload?.locationZip;
          const country = extraPayload?.locationCountry;
          if (!zipCode) {
            toast({
              variant: "destructive",
              title: "Error!",
              description: "Zip/postal code is required.",
            });
            return;
          }
          const { data, success, message } = await createLocation(label, zipCode, country);
          if (!success) {
            toast({
              variant: "destructive",
              title: "Error!",
              description: message,
            });
            return;
          }
          response = data;
          break;
        }
        default:
          break;
      }
      if (!response?.id) {
        toast({
          variant: "destructive",
          title: "Error!",
          description: "Failed to create item. Please try again.",
        });
        return;
      }
      options.unshift(response);
      field.onChange(response.id);
      setIsPopoverOpen(false);
      setNewOption("");
    });
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "md:w-[240px] lg:w-[280px] justify-between capitalize",
              !field.value && "text-muted-foreground"
            )}
          >
            {field.value
              ? options.find((option) => option.id === field.value)?.label
              : `Select ${field.name}`}

            {isPending ? (
              <Loader className="h-4 w-4 shrink-0 spinner" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="md:w-[240px] lg:w-[280px] p-0">
        <Command
          filter={(value, search) =>
            value.includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput
            value={newOption}
            onValueChange={(val: string) => setNewOption(val)}
            placeholder={`${creatable ? "Create or " : ""}Search ${field.name}`}
          />
          <CommandEmpty
            onClick={() => {
              onCreateOption(newOption);
              setNewOption("");
            }}
            className={cn(
              "flex cursor-pointer items-center justify-center gap-1 italic mt-2",
              !newOption && "text-muted-foreground cursor-default"
            )}
          >
            {creatable ? (
              <>
                <CirclePlus className="h-4 w-4" />
                <p>Create: </p>
                <p className="block max-w-48 truncate font-semibold text-primary">
                  {newOption}
                </p>
              </>
            ) : (
              <p className="font-semibold text-primary">No source found!</p>
            )}
          </CommandEmpty>
          <ScrollArea>
            <CommandGroup>
              <CommandList className="capitalize">
                {options.map((option) => (
                  <CommandItem
                    value={option.value}
                    key={option.id ?? `${option.value}-${option.label}`}
                    onSelect={() => {
                      if (field.onChange) {
                        field.onChange(option.id);
                        setIsPopoverOpen(false);
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        option.value === field.value
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandList>
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
