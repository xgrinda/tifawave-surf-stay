"use client";
import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useUnsavedChanges } from "../_components/editor-workspace";
import { updateSettingsAction } from "./actions";
function Pending() {
  const { pending } = useFormStatus();
  return pending ? <p role="status">Saving website settings…</p> : null;
}
export function SettingsForm({ children }: { children: ReactNode }) {
  const [dirty, setDirty] = useState(false);
  useUnsavedChanges(dirty);
  return (
    <form
      action={updateSettingsAction}
      className="admin-settings-form"
      onChange={() => setDirty(true)}
    >
      {dirty && <p role="status">Unsaved website settings</p>}
      {children}
      <Pending />
    </form>
  );
}
