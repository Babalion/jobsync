"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Locale } from "date-fns";
import { de, enUS } from "date-fns/locale";

export type SupportedLanguage = "en" | "de";

type TranslationOptions = {
  fallback?: string;
  values?: Record<string, string | number>;
};

type TranslationContext = {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, options?: TranslationOptions) => string;
  dateLocale: Locale;
};

const LANGUAGE_STORAGE_KEY = "jobsync-language";

const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    Settings: "Settings",
    Appearance: "Appearance",
    Theme: "Theme",
    "Select the theme for the app.": "Select the theme for the app.",
    "Update preferences": "Update preferences",
    Light: "Light",
    Dark: "Dark",
    System: "System",
    "Your selected theme has been saved.": "Your selected theme has been saved.",
    Language: "Language",
    "Select your preferred language.": "Select your preferred language.",
    English: "English",
    German: "German",
    "Language has been updated.": "Language has been updated.",
    "Toggle Menu": "Toggle Menu",
    "JobSync - Job Search Assistant": "JobSync - Job Search Assistant",
    "My Account": "My Account",
    Support: "Support",
    Logout: "Logout",
    Dashboard: "Dashboard",
    "My Jobs": "My Jobs",
    Map: "Map",
    Administration: "Administration",
    "Jobs Applied": "Jobs Applied",
    "Create new jobs to apply and track.": "Create new jobs to apply and track.",
    "Add New Job": "Add New Job",
    "Recent Jobs Applied": "Recent Jobs Applied",
    "Last 7 days": "Last 7 days",
    "Last 30 days": "Last 30 days",
    "NUMBER OF JOBS APPLIED": "NUMBER OF JOBS APPLIED",
    "DAYS OF WEEK": "DAYS OF WEEK",
    "Applications Calendar": "Applications Calendar",
    "Jobs Map": "Jobs Map",
    "Search by title, company, location, zip...":
      "Search by title, company, location, zip...",
    Status: "Status",
    "All statuses": "All statuses",
    Close: "Close",
    "Added:": "Added:",
    "Applied:": "Applied:",
    Unknown: "Unknown",
    "Search jobs...": "Search jobs...",
    Filter: "Filter",
    "Filter by": "Filter by",
    None: "None",
    Applied: "Applied",
    Interview: "Interview",
    Draft: "Draft",
    Rejected: "Rejected",
    "Part-time": "Part-time",
    "Full-time": "Full-time",
    Contract: "Contract",
    Offer: "Offer",
    Archived: "Archived",
    Expired: "Expired",
    Export: "Export",
    "Downloaded successfully!": "Downloaded successfully!",
    "Failed to download jobs!": "Failed to download jobs!",
    "Unknown error occurred.": "Unknown error occurred.",
    "Showing {start} to {end} of {total} jobs":
      "Showing {start} to {end} of {total} jobs",
    "Showing {start} to {end} of {total} companies":
      "Showing {start} to {end} of {total} companies",
    "Showing {start} to {end} of {total} job titles":
      "Showing {start} to {end} of {total} job titles",
    "Showing {start} to {end} of {total} job locations":
      "Showing {start} to {end} of {total} job locations",
    "Loading...": "Loading...",
    "Load More": "Load More",
    "Job has been deleted successfully": "Job has been deleted successfully",
    "Job has been updated successfully": "Job has been updated successfully",
    "Job has been created successfully": "Job has been created successfully",
    "Error!": "Error!",
    "Add Job": "Add Job",
    "Edit Job": "Edit Job",
    "Job Title": "Job Title",
    Company: "Company",
    "Job Location": "Job Location",
    "Job Type": "Job Type",
    "Job Source": "Job Source",
    "Job Status": "Job Status",
    "Not Applied": "Not Applied",
    "Date Applied": "Date Applied",
    "Due Date": "Due Date",
    "Salary Range": "Salary Range",
    "Job URL": "Job URL",
    "Copy and paste job link here": "Copy and paste job link here",
    "Job Description": "Job Description",
    Cancel: "Cancel",
    Save: "Save",
    "Import Job JSON": "Import Job JSON",
    "Job imported successfully": "Job imported successfully",
    "Invalid JSON": "Invalid JSON",
    "Please provide a valid JSON payload.":
      "Please provide a valid JSON payload.",
    "Validation failed": "Validation failed",
    "Please check your fields.": "Please check your fields.",
    "Failed to import job from JSON.": "Failed to import job from JSON.",
    Import: "Import",
    "Add Company": "Add Company",
    "Company Name": "Company Name",
    "Company Website": "Company Website",
    "Select archetype": "Select archetype",
    "Select ownership": "Select ownership",
    "Industry & Role": "Industry & Role",
    "Innovation Level": "Innovation Level",
    "Select innovation level": "Select innovation level",
    "Culture Tag": "Culture Tag",
    "Select culture": "Select culture",
    "TLDR Summary": "TLDR Summary",
    "Fit Notes": "Fit Notes",
    "Logo preview": "Logo preview",
    "Company has been created successfully":
      "Company has been created successfully",
    "Company has been updated successfully":
      "Company has been updated successfully",
    "Company Logo": "Company Logo",
    "Date Added": "Date Added",
    "Title": "Title",
    "Location": "Location",
    "Source": "Source",
    "Actions": "Actions",
    "Toggle menu": "Toggle menu",
    "View Details": "View Details",
    "Change status": "Change status",
    Delete: "Delete",
    Expired: "Expired",
    Website: "Website",
    Archetype: "Archetype",
    Ownership: "Ownership",
    "Industry Role": "Industry Role",
    Innovation: "Innovation",
    Country: "Country",
    "Works Council": "Works Council",
    "Collective Agreement": "Collective Agreement",
    Summary: "Summary",
    Notes: "Notes",
    "Location updated": "Location updated",
    "Location created": "Location created",
    "Add Location": "Add Location",
    "Zip / Postal Code": "Zip / Postal Code",
    "Betriebsrat: Yes": "Betriebsrat: Yes",
    "Betriebsrat: No": "Betriebsrat: No",
    "Tarifvertrag: Yes": "Tarifvertrag: Yes",
    "Tarifvertrag: No": "Tarifvertrag: No",
    Yes: "Yes",
    No: "No",
    "Are you sure you want to delete this {item}?":
      "Are you sure you want to delete this {item}?",
    "This action cannot be undone. This will permanently delete and remove data from server.":
      "This action cannot be undone. This will permanently delete and remove data from server.",
    Companies: "Companies",
    "Job Titles": "Job Titles",
    Locations: "Locations",
    "Search by name, website, country...":
      "Search by name, website, country...",
    "All ownership": "All ownership",
    "All archetypes": "All archetypes",
    "No companies match your filters.": "No companies match your filters.",
    companies: "companies",
    "job titles": "job titles",
    City: "City",
    Zip: "Zip",
    Jobs: "Jobs",
    "Lat / Lng": "Lat / Lng",
    "Edit Location": "Edit Location",
    "Job location has been deleted successfully":
      "Job location has been deleted successfully",
    "Applied jobs exist!": "Applied jobs exist!",
    "Associated jobs applied must be 0 to be able to delete this job location":
      "Associated jobs applied must be 0 to be able to delete this job location",
    "Associated jobs applied must be 0 to be able to delete this company":
      "Associated jobs applied must be 0 to be able to delete this company",
    "Associated jobs applied must be 0 to be able to delete this job title":
      "Associated jobs applied must be 0 to be able to delete this job title",
    "Job title has been deleted successfully":
      "Job title has been deleted successfully",
    "Company has been deleted successfully":
      "Company has been deleted successfully",
    "Job Locations": "Job Locations",
    "Job Titles": "Job Titles",
    "Job location": "Job location",
    Login: "Login",
    "Enter your email below to login to your account":
      "Enter your email below to login to your account",
    "Don't have an account?": "Don't have an account?",
    "Sign up": "Sign up",
    "Sign Up": "Sign Up",
    "Enter your information to create an account":
      "Enter your information to create an account",
    "Full Name": "Full Name",
    "Create an account": "Create an account",
    "Already have an account?": "Already have an account?",
    "Sign in": "Sign in",
    Password: "Password",
    Email: "Email",
    "Search city, zip, country...": "Search city, zip, country...",
    "Edit Company": "Edit Company",
    Job: "Job",
  },
  de: {
    Settings: "Einstellungen",
    Appearance: "Darstellung",
    Theme: "Thema",
    "Select the theme for the app.": "Wähle das App-Design.",
    "Update preferences": "Einstellungen speichern",
    Light: "Hell",
    Dark: "Dunkel",
    System: "System",
    "Your selected theme has been saved.": "Dein ausgewähltes Thema wurde gespeichert.",
    Language: "Sprache",
    "Select your preferred language.": "Wähle deine bevorzugte Sprache.",
    English: "Englisch",
    German: "Deutsch",
    "Language has been updated.": "Sprache wurde aktualisiert.",
    "Toggle Menu": "Menü umschalten",
    "JobSync - Job Search Assistant": "JobSync - Bewerbungsassistent",
    "My Account": "Mein Konto",
    Support: "Support",
    Logout: "Abmelden",
    Dashboard: "Dashboard",
    "My Jobs": "Meine Jobs",
    Map: "Karte",
    Administration: "Administration",
    "Jobs Applied": "Beworbene Jobs",
    "Create new jobs to apply and track.": "Lege neue Bewerbungen an und behalte den Überblick.",
    "Add New Job": "Neuen Job hinzufügen",
    "Recent Jobs Applied": "Zuletzt beworbene Jobs",
    "Last 7 days": "Letzte 7 Tage",
    "Last 30 days": "Letzte 30 Tage",
    "NUMBER OF JOBS APPLIED": "ANZAHL BEWORBENER JOBS",
    "DAYS OF WEEK": "WOCHENTAGE",
    "Applications Calendar": "Bewerbungskalender",
    "Jobs Map": "Job-Karte",
    "Search by title, company, location, zip...": "Suche nach Titel, Firma, Ort, PLZ...",
    Status: "Status",
    "All statuses": "Alle Status",
    Close: "Schließen",
    "Added:": "Hinzugefügt:",
    "Applied:": "Beworben:",
    Unknown: "Unbekannt",
    "Search jobs...": "Jobs suchen...",
    Filter: "Filter",
    "Filter by": "Filtern nach",
    None: "Keiner",
    Applied: "Beworben",
    Interview: "Interview",
    Draft: "Entwurf",
    Rejected: "Abgelehnt",
    "Part-time": "Teilzeit",
    "Full-time": "Vollzeit",
    Contract: "Vertrag",
    Offer: "Angebot",
    Archived: "Archiviert",
    Expired: "Abgelaufen",
    Export: "Exportieren",
    "Downloaded successfully!": "Erfolgreich heruntergeladen!",
    "Failed to download jobs!": "Jobs konnten nicht heruntergeladen werden!",
    "Unknown error occurred.": "Unbekannter Fehler aufgetreten.",
    "Showing {start} to {end} of {total} jobs":
      "Zeige {start} bis {end} von {total} Jobs",
    "Showing {start} to {end} of {total} companies":
      "Zeige {start} bis {end} von {total} Unternehmen",
    "Showing {start} to {end} of {total} job titles":
      "Zeige {start} bis {end} von {total} Jobtiteln",
    "Showing {start} to {end} of {total} job locations":
      "Zeige {start} bis {end} von {total} Arbeitsorten",
    "Loading...": "Lädt...",
    "Load More": "Mehr laden",
    "Job has been deleted successfully": "Job wurde erfolgreich gelöscht",
    "Job has been updated successfully": "Job wurde erfolgreich aktualisiert",
    "Job has been created successfully": "Job wurde erfolgreich erstellt",
    "Error!": "Fehler!",
    "Add Job": "Job hinzufügen",
    "Edit Job": "Job bearbeiten",
    "Job Title": "Jobtitel",
    Company: "Unternehmen",
    "Job Location": "Arbeitsort",
    "Job Type": "Anstellungsart",
    "Job Source": "Quelle",
    "Job Status": "Job-Status",
    "Not Applied": "Nicht beworben",
    "Date Applied": "Bewerbungsdatum",
    "Due Date": "Frist",
    "Salary Range": "Gehaltsrahmen",
    "Job URL": "Job-URL",
    "Copy and paste job link here": "Hier Job-Link einfügen",
    "Job Description": "Stellenbeschreibung",
    Cancel: "Abbrechen",
    Save: "Speichern",
    "Import Job JSON": "Job aus JSON importieren",
    "Job imported successfully": "Job erfolgreich importiert",
    "Invalid JSON": "Ungültiges JSON",
    "Please provide a valid JSON payload.": "Bitte gib ein gültiges JSON ein.",
    "Validation failed": "Validierung fehlgeschlagen",
    "Please check your fields.": "Bitte prüfe deine Felder.",
    "Failed to import job from JSON.": "Import aus JSON fehlgeschlagen.",
    Import: "Importieren",
    "Add Company": "Unternehmen hinzufügen",
    "Company Name": "Unternehmensname",
    "Company Website": "Unternehmenswebsite",
    "Select archetype": "Archetyp auswählen",
    "Select ownership": "Eigentumsform auswählen",
    "Industry & Role": "Branche & Rolle",
    "Innovation Level": "Innovationsgrad",
    "Select innovation level": "Innovationsgrad auswählen",
    "Culture Tag": "Kultur-Typ",
    "Select culture": "Kultur auswählen",
    "TLDR Summary": "Kurzbeschreibung",
    "Fit Notes": "Notizen",
    "Logo preview": "Logo-Vorschau",
    "Company has been created successfully":
      "Unternehmen wurde erfolgreich erstellt",
    "Company has been updated successfully":
      "Unternehmen wurde erfolgreich aktualisiert",
    "Company Logo": "Firmenlogo",
    "Date Added": "Hinzugefügt am",
    Title: "Titel",
    Location: "Ort",
    Source: "Quelle",
    Actions: "Aktionen",
    "Toggle menu": "Menü öffnen",
    "View Details": "Details anzeigen",
    "Change status": "Status ändern",
    Delete: "Löschen",
    Expired: "Abgelaufen",
    Website: "Webseite",
    Archetype: "Archetyp",
    Ownership: "Eigentum",
    "Industry Role": "Branche",
    Innovation: "Innovation",
    Country: "Land",
    "Works Council": "Betriebsrat",
    "Collective Agreement": "Tarifvertrag",
    Summary: "Zusammenfassung",
    Notes: "Notizen",
    "Location updated": "Standort aktualisiert",
    "Location created": "Standort erstellt",
    "Add Location": "Ort hinzufügen",
    "Zip / Postal Code": "PLZ",
    "Betriebsrat: Yes": "Betriebsrat: Ja",
    "Betriebsrat: No": "Betriebsrat: Nein",
    "Tarifvertrag: Yes": "Tarifvertrag: Ja",
    "Tarifvertrag: No": "Tarifvertrag: Nein",
    Yes: "Ja",
    No: "Nein",
    "Are you sure you want to delete this {item}?":
      "Möchtest du {item} wirklich löschen?",
    "This action cannot be undone. This will permanently delete and remove data from server.":
      "Diese Aktion kann nicht rückgängig gemacht werden und entfernt die Daten dauerhaft vom Server.",
    Companies: "Unternehmen",
    "Job Titles": "Jobtitel",
    Locations: "Standorte",
    "Search by name, website, country...":
      "Suche nach Name, Website, Land...",
    "All ownership": "Alle Eigentumsformen",
    "All archetypes": "Alle Archetypen",
    "No companies match your filters.":
      "Keine Unternehmen entsprechen den Filtern.",
    companies: "Unternehmen",
    "job titles": "Jobtitel",
    City: "Stadt",
    Zip: "PLZ",
    Jobs: "Jobs",
    "Lat / Lng": "Breite / Länge",
    "Edit Location": "Ort bearbeiten",
    "Job location has been deleted successfully":
      "Job-Ort wurde erfolgreich gelöscht",
    "Applied jobs exist!": "Beworbene Jobs vorhanden!",
    "Associated jobs applied must be 0 to be able to delete this job location":
      "Zum Löschen dürfen keine Bewerbungen mit diesem Ort verknüpft sein.",
    "Associated jobs applied must be 0 to be able to delete this company":
      "Zum Löschen dürfen keine Bewerbungen mit diesem Unternehmen verknüpft sein.",
    "Associated jobs applied must be 0 to be able to delete this job title":
      "Zum Löschen dürfen keine Bewerbungen mit diesem Jobtitel verknüpft sein.",
    "Job title has been deleted successfully":
      "Jobtitel wurde erfolgreich gelöscht",
    "Company has been deleted successfully":
      "Unternehmen wurde erfolgreich gelöscht",
    "Job Locations": "Arbeitsorte",
    "Job Titles": "Jobtitel",
    "Job location": "Job-Ort",
    Login: "Anmelden",
    "Enter your email below to login to your account":
      "Gib deine E-Mail ein, um dich anzumelden.",
    "Don't have an account?": "Noch kein Konto?",
    "Sign up": "Registrieren",
    "Sign Up": "Registrieren",
    "Enter your information to create an account":
      "Gib deine Daten ein, um ein Konto zu erstellen.",
    "Full Name": "Vollständiger Name",
    "Create an account": "Konto erstellen",
    "Already have an account?": "Bereits ein Konto?",
    "Sign in": "Anmelden",
    Password: "Passwort",
    Email: "E-Mail",
    "Search city, zip, country...": "Suche nach Stadt, PLZ, Land...",
    "Edit Company": "Unternehmen bearbeiten",
    Job: "Job",
  },
};

const LanguageContext = createContext<TranslationContext | null>(null);

const interpolate = (template: string, values?: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, token) =>
    values && token in values ? String(values[token]) : `{${token}}`
  );

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");

  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as
      | SupportedLanguage
      | null;
    if (stored) {
      setLanguageState(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<TranslationContext>(() => {
    const translate = (key: string, options?: TranslationOptions) => {
      const template = translations[language][key] ?? options?.fallback ?? key;
      return options?.values ? interpolate(template, options.values) : template;
    };

    return {
      language,
      setLanguage: setLanguageState,
      t: translate,
      dateLocale: language === "de" ? de : enUS,
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslations() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslations must be used within a LanguageProvider");
  }
  return context;
}

export const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
];

export function TranslatedText({
  id,
  fallback,
}: {
  id: string;
  fallback?: string;
}) {
  const { t } = useTranslations();
  return <>{t(id, { fallback })}</>;
}
