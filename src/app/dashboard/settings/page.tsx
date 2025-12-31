import DisplaySettings from "@/components/settings/DisplaySettings";
import React from "react";

function Settings() {
  return (
    <div className="flex flex-col col-span-3">
      <h3 className="text-2xl font-semibold leading-none tracking-tight mb-4">
        Settings
      </h3>
      <DisplaySettings />
    </div>
  );
}

export default Settings;
