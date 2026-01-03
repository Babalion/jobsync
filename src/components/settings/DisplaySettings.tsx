"use client";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "../ui/use-toast";
import { Button } from "../ui/button";
import { useTheme } from "next-themes";
import { LANGUAGE_OPTIONS, useTranslations } from "@/lib/i18n";
import { useEffect } from "react";

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"], {
    required_error: "Please select a theme.",
  }),
  language: z.enum(["en", "de"], {
    required_error: "Please select a language.",
  }),
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

const currentTheme =
  typeof window !== "undefined"
    ? (localStorage.getItem("theme") as "light" | "dark" | "system" | undefined)
    : "system";

// This can come from your database or API.
function DisplaySettings() {
  const { setTheme, systemTheme } = useTheme();
  const { language, setLanguage, t } = useTranslations();
  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: currentTheme || "system",
      language,
    },
  });

  useEffect(() => {
    form.setValue("language", language);
  }, [form, language]);

  function onSubmit(data: AppearanceFormValues) {
    setTheme(data.theme);
    setLanguage(data.language);
    toast({
      variant: "success",
      title: t("Update preferences"),
      description: `${t("Your selected theme has been saved.")} ${t("Language has been updated.")}`,
    });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Appearance")}</CardTitle>
      </CardHeader>
      <CardContent className="ml-4">
        <div className="mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>{t("Theme")}</FormLabel>
                    <FormDescription>
                      {t("Select the theme for the app.")}
                    </FormDescription>
                    <FormMessage />
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid max-w-lg md:grid-cols-3 gap-8 pt-2"
                    >
                      <FormItem>
                        <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                          <FormControl>
                            <RadioGroupItem value="light" className="sr-only" />
                          </FormControl>
                          <LightThemeElement />
                          <span className="block w-full p-2 text-center font-normal">
                            {t("Light")}
                          </span>
                        </FormLabel>
                      </FormItem>
                      <FormItem>
                        <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                          <FormControl>
                            <RadioGroupItem value="dark" className="sr-only" />
                          </FormControl>
                          <DarkThemeElement />
                          <span className="block w-full p-2 text-center font-normal">
                            {t("Dark")}
                          </span>
                        </FormLabel>
                      </FormItem>
                      <FormItem>
                        <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                          <FormControl>
                            <RadioGroupItem
                              value="system"
                              className="sr-only"
                            />
                          </FormControl>
                          {systemTheme === "dark" ? (
                            <DarkThemeElement />
                          ) : (
                            <LightThemeElement />
                          )}
                          <span className="block w-full p-2 text-center font-normal">
                            {t("System")}
                          </span>
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>{t("Language")}</FormLabel>
                    <FormDescription>
                      {t("Select your preferred language.")}
                    </FormDescription>
                    <FormMessage />
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid max-w-lg md:grid-cols-2 gap-4 pt-2"
                    >
                      {LANGUAGE_OPTIONS.map((option) => (
                        <FormItem
                          key={option.code}
                          className="flex items-center space-x-3 space-y-0 rounded-md border p-3"
                        >
                          <FormControl>
                            <RadioGroupItem value={option.code} />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {option.label}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormItem>
                )}
              />

              <Button type="submit">{t("Update preferences")}</Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}

export default DisplaySettings;

function LightThemeElement() {
  return (
    <div className="cursor-pointer items-center rounded-md border-2 border-muted p-1 hover:border-accent">
      <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
        <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
          <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
        </div>
        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
          <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
        </div>
        <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
          <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
          <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
        </div>
      </div>
    </div>
  );
}
function DarkThemeElement() {
  return (
    <div className="cursor-pointer items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
      <div className="space-y-2 rounded-sm bg-slate-950 p-2">
        <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
          <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
        </div>
        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
          <div className="h-4 w-4 rounded-full bg-slate-400" />
          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
        </div>
        <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
          <div className="h-4 w-4 rounded-full bg-slate-400" />
          <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
        </div>
      </div>
    </div>
  );
}
