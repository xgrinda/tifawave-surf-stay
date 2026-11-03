"use client";
import { useState } from "react";
import type { PublicSurfPackage } from "@/lib/surf-packages";
import { levelLabel } from "@/lib/packages/catalogue";
export function ManualPackageOptions({
  packages,
}: {
  packages: PublicSurfPackage[];
}) {
  const [id, setId] = useState("");
  const p = packages.find((p) => p.id === id);
  return (
    <section>
      <label className="admin-field">
        Package (required for surf-package requests)
        <select
          name="packageId"
          value={id}
          onChange={(e) => setId(e.target.value)}
        >
          <option value="">None</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {p && (
        <>
          <p>{p.unitLabel} · dates must match this duration.</p>
          <label className="admin-field">
            Accommodation variant
            <select name="packageVariant" required defaultValue="">
              <option value="">Choose a variant</option>
              {p.catalogue.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            Surf level
            <select name="surfLevel" required defaultValue="">
              <option value="">Choose level</option>
              {p.catalogue.levels.map((l) => (
                <option value={l} key={l}>
                  {levelLabel(l, "en")}
                </option>
              ))}
            </select>
          </label>
          {p.catalogue.extras.map((e) => (
            <label className="admin-field" key={e.id}>
              <span>
                <input type="checkbox" name="packageExtras" value={e.id} />{" "}
                {e.label} · request only
              </span>
            </label>
          ))}
        </>
      )}
    </section>
  );
}
