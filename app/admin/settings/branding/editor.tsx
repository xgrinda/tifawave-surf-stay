"use client";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { contentSchema } from "@/lib/content/schema";
import { brandingSchema, type Branding } from "@/lib/content/branding-schema";
import type { ContentDocument } from "@/types/modules";
import { saveContent } from "../../content/actions";
import { MediaPicker } from "../../_components/media-picker";
import { CmsPhoto } from "@/components/content/cms-photo";
import {
  EditorWorkspace,
  EditorPanel,
  useUnsavedChanges,
} from "../../_components/editor-workspace";
const assets = [
  [
    "logo",
    "Main brand logo",
    "At least 112 × 112; transparent PNG recommended",
  ],
  [
    "headerLogo",
    "Header variant · optional",
    "At least 112 px tall; blank uses main logo",
  ],
  [
    "footerLogo",
    "Footer variant · optional",
    "At least 112 px tall; blank uses main logo",
  ],
  ["favicon", "Browser icon", "Square 512 × 512 recommended; minimum 96 × 96"],
  [
    "appleIcon",
    "Apple touch icon · optional",
    "Square 180 × 180 or larger; blank uses browser icon",
  ],
  ["socialImage", "Social sharing image", "1200 × 630 recommended"],
] as const;
export function BrandingEditor({
  document,
}: {
  document: ContentDocument | null;
}) {
  const router = useRouter();
  const base = contentSchema.parse(
    document?.draft || { title: "Tifawave branding" },
  );
  const [b, setB] = useState(() => brandingSchema.parse(base.branding || {}));
  const [dirty, setDirty] = useState(false);
  useUnsavedChanges(dirty);
  const [state, action, pending] = useActionState(saveContent, {});
  useEffect(() => {
    if (state.id) {
      router.refresh();
    }
  }, [state, router]);
  function update(patch: Partial<Branding>) {
    setB({ ...b, ...patch });
    setDirty(true);
  }
  return (
    <EditorWorkspace
      sections={[
        { id: "artwork", label: "Logo & icons" },
        { id: "search", label: "English & French SEO" },
        { id: "review", label: "Preview & Publish" },
      ]}
    >
      <form action={action}>
        <input type="hidden" name="id" value={document?.id || ""} />
        <input type="hidden" name="version" value={document?.version || 0} />
        <input type="hidden" name="kind" value="page" />
        <input type="hidden" name="slug" value="branding" />
        <input type="hidden" name="locale" value="en" />
        <input
          type="hidden"
          name="draft"
          value={JSON.stringify({ ...base, branding: b })}
        />
        <p className="owner-state">
          {document?.published
            ? "Published branding · separate draft"
            : "Draft · current text wordmark remains"}
          {dirty ? " · Unsaved changes" : ""}
        </p>
        <EditorPanel id="artwork" title="Your approved Tifawave artwork">
          <p>
            Select only your real, approved logo and icon from the media
            library. No artwork is selected automatically. Blank fields preserve
            the text wordmark and omit unconfigured icons.
          </p>
          {assets.map(([key, label, preset]) => (
            <details
              className="owner-photo-slot"
              key={key}
              open={key === "logo"}
            >
              <summary>
                {label}
                <small>{b[key] ? "Artwork selected" : "Not selected"}</small>
              </summary>
              <MediaPicker
                label={label}
                value={b[key]}
                onChange={(v) => update({ [key]: v })}
                preset={preset}
              />
            </details>
          ))}
        </EditorPanel>
        <EditorPanel id="search" title="Help guests recognize Tifawave">
          <p>
            The canonical website is https://tifawave.com. Page-specific CMS
            search text takes priority. Blank fields keep the existing search
            wording.
          </p>
          {(["En", "Fr"] as const).map((l) => (
            <fieldset key={l}>
              <legend>{l === "En" ? "English" : "Français"}</legend>
              <label className="admin-field">
                {l === "En" ? "Site title" : "Titre du site"}
                <input
                  value={b[`title${l}`]}
                  maxLength={180}
                  onChange={(e) => update({ [`title${l}`]: e.target.value })}
                />
              </label>
              <label className="admin-field">
                {l === "En" ? "Site description" : "Description du site"}
                <textarea
                  rows={4}
                  maxLength={320}
                  value={b[`description${l}`]}
                  onChange={(e) =>
                    update({ [`description${l}`]: e.target.value })
                  }
                />
              </label>
              <small>
                {b[`title${l}`] && b[`description${l}`]
                  ? "Custom search text ready"
                  : "Using existing localized search text for blank fields"}
              </small>
            </fieldset>
          ))}
          <p>
            Business name, contact details, Instagram and Google Maps are
            managed in Settings → Contact & Social / Business Details.
          </p>
        </EditorPanel>
        <EditorPanel id="review" title="Preview your brand choices">
          <p>
            These previews include your unsaved choices. Save Draft preserves
            the public version. Publish validates image access, dimensions and
            square icons before applying changes to staging.
          </p>
          <div className="owner-brand-preview">
            <strong>{b.titleEn || "Tifawave Surf Stay"}</strong>
            <p>{b.descriptionEn || "Existing English search description"}</p>
            {b.logo && (
              <CmsPhoto
                key={b.logo}
                src={b.logo}
                alt="Selected Tifawave brand artwork"
                className="owner-logo-preview"
              />
            )}
          </div>
          <p>
            Configured icon outputs: 96, 192 and 512 px PNG; Apple icon 180 px.
            Generated icons contain the full artwork, without cropping. No icon
            is advertised until genuine artwork is published.
          </p>
          <p>
            Production public pages remain indexable. Staging, draft previews
            and private admin pages are noindex. Google decides when branding
            changes appear in search.
          </p>
        </EditorPanel>
        {state.error && (
          <p role="alert" className="ops-error">
            {state.error}
          </p>
        )}
        {state.id && (
          <p role="status" className="ops-success">
            Branding saved. Only published branding appears on public pages.
          </p>
        )}
        <div className="owner-save-bar">
          <button
            className="btn btn-primary"
            name="action"
            value="draft"
            disabled={pending}
          >
            {pending ? "Saving…" : "Save draft"}
          </button>
          <button
            className="btn btn-secondary"
            name="action"
            value="publish"
            disabled={pending}
            onClick={(e) => {
              if (
                !confirm(
                  "Publish these approved brand assets and search text to staging?",
                )
              )
                e.preventDefault();
            }}
          >
            Publish branding
          </button>
        </div>
      </form>
    </EditorWorkspace>
  );
}
