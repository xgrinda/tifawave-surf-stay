"use client";
import { MediaPicker } from "./media-picker";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveWorkspaceAction } from "../workspace-actions";
import type { WorkspaceEntity } from "@/types/modules";
export type EntityField = {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "number"
    | "date"
    | "textarea"
    | "checkbox"
    | "select"
    | "hidden";
  value?: string | number | null | boolean;
  options?: { value: string; label: string }[];
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  help?: string;
};
export function EntityForm({
  entity,
  id,
  version = 0,
  fields,
  label = "Save changes",
}: {
  entity: WorkspaceEntity;
  id?: string;
  version?: number;
  fields: EntityField[];
  label?: string;
}) {
  const [state, action, pending] = useActionState(saveWorkspaceAction, {
    ok: false,
    message: "",
    id: "",
  });
  const router = useRouter();
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);
  if (version === 0 && state.ok)
    return (
      <div className="desk-saved-record" role="status">
        <p>Record saved. It now appears in the workspace.</p>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={() => window.location.reload()}
        >
          Add another record
        </button>
      </div>
    );
  return (
    <form
      action={action}
      className="desk-entity-form"
      onSubmit={(e) => {
        const f = e.currentTarget.elements.namedItem(
          "archived",
        ) as HTMLInputElement | null;
        if (
          f?.checked &&
          !fields.find((x) => x.name === "archived")?.value &&
          !window.confirm(
            "Archive this record? Its history is retained and it can be restored.",
          )
        )
          e.preventDefault();
      }}
    >
      <input type="hidden" name="entity" value={entity} />
      <input type="hidden" name="id" value={id || state.id || ""} />
      <input
        type="hidden"
        name="version"
        value={version || state.version || 0}
      />
      <div className="desk-form-grid">
        {fields.map((field) =>
          field.type === "hidden" ? (
            <input
              key={field.name}
              type="hidden"
              name={field.name}
              value={String(field.value ?? "")}
            />
          ) : (
            <div
              key={field.name}
              className={field.type === "textarea" ? "desk-form-wide" : ""}
            >
              <label htmlFor={entity + "-" + (id || "new") + "-" + field.name}>
                {field.label}
                {field.required ? " *" : ""}
              </label>
              {field.name === "image_url" ? (
                <MediaPicker
                  name={field.name}
                  label="Photograph"
                  defaultValue={String(field.value ?? "")}
                  required={field.required}
                />
              ) : field.type === "textarea" ? (
                <textarea
                  id={entity + "-" + (id || "new") + "-" + field.name}
                  name={field.name}
                  defaultValue={String(field.value ?? "")}
                  rows={4}
                  maxLength={field.maxLength || 4000}
                  required={field.required}
                />
              ) : field.type === "select" ? (
                <select
                  id={entity + "-" + (id || "new") + "-" + field.name}
                  name={field.name}
                  defaultValue={String(field.value ?? "")}
                  required={field.required}
                >
                  {field.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <input
                  type="checkbox"
                  id={entity + "-" + (id || "new") + "-" + field.name}
                  name={field.name}
                  defaultChecked={Boolean(field.value)}
                />
              ) : (
                <input
                  type={field.type || "text"}
                  id={entity + "-" + (id || "new") + "-" + field.name}
                  name={field.name}
                  defaultValue={String(field.value ?? "")}
                  step={field.name.endsWith("_cents") ? "0.01" : undefined}
                  min={field.min}
                  max={field.max}
                  maxLength={field.maxLength || 2000}
                  required={field.required}
                />
              )}{" "}
              {field.help && <small>{field.help}</small>}
            </div>
          ),
        )}
      </div>
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={state.ok ? "admin-success" : "admin-error"}
        >
          {state.message}
        </p>
      )}
      <button disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : label}
      </button>
    </form>
  );
}
