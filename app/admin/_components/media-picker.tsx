"use client";
/* eslint-disable @next/next/no-img-element */
import { useState, useId } from "react";
import { isPublicImageUrl } from "@/lib/image-url";
import { optimizedFile } from "./image-upload-controls";
import { uploadPickerImage } from "../gallery/picker-actions";
export function MediaPicker({
  name,
  label,
  value,
  defaultValue = "",
  onChange,
  preset = "1200 × 900 · 4:3",
  required = false,
}: {
  name?: string;
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  preset?: string;
  required?: boolean;
}) {
  const [local, setLocal] = useState(defaultValue),
    [open, setOpen] = useState(false),
    [images, setImages] = useState<{ url: string; alt: string }[]>([]),
    [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [broken, setBroken] = useState(false),
    [alt, setAlt] = useState("");
  const id = useId(),
    selected = value ?? local;
  function choose(url: string) {
    setLocal(url);
    onChange?.(url);
    setBroken(false);
  }
  async function library() {
    setOpen(true);
    setError("");
    try {
      const r = await fetch("/api/admin/media");
      const d = await r.json();
      if (!r.ok) throw Error(d.message);
      setImages(d.images);
    } catch {
      setError("Media library unavailable. Check your sign-in and try again.");
    }
  }
  return (
    <div className="media-picker">
      <label className="admin-field" htmlFor={id}>
        <span>{label}</span>
        <input
          id={id}
          name={name}
          type="url"
          value={selected}
          required={required}
          maxLength={2048}
          onChange={(e) => choose(e.target.value)}
          placeholder="https://…"
        />
        <small>
          Recommended: {preset}. Preserve aspect ratio. Approved HTTPS hosts:
          this media library, res.cloudinary.com/dytykwtc/image/upload/,
          images.unsplash.com and images.pexels.com. Use
          only photographs you have permission to use.
        </small>
      </label>
      {selected &&
        (isPublicImageUrl(selected) ? (
          <div className="media-picker-preview">
            {broken ? (
              <p>Image could not load. Choose a replacement before saving.</p>
            ) : (
              <img
                src={selected}
                alt="Selected image preview"
                onError={() => setBroken(true)}
              />
            )}
          </div>
        ) : (
          <p role="alert">Choose an approved HTTPS image URL.</p>
        ))}
      <button type="button" className="btn btn-secondary" onClick={library}>
        Choose from media library / upload
      </button>
      {open && (
        <section className="media-picker-panel" aria-label={label + " library"}>
          <div className="ops-toolbar">
            <input
              aria-label="Search media"
              placeholder="Search image descriptions"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="button" onClick={() => setOpen(false)}>
              Close library
            </button>
          </div>
          <p>
            Selecting an image changes this form only. Saving a CMS draft does
            not change published content. Uploads here are unassigned and hidden
            from the public gallery.
          </p>
          <h4>Upload a photograph</h4>
          <label className="admin-field">
            New photograph description
            <input
              value={alt}
              maxLength={180}
              onChange={(e) => setAlt(e.target.value)}
            />
          </label>
          <label className="admin-field">
            Upload a new photograph · up to 8 MB
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              disabled={busy}
              onChange={async (e) => {
                const f = e.currentTarget.files?.[0];
                if (!f) return;
                setBusy(true);
                setError("");
                try {
                  const form = new FormData();
                  const optimized = await optimizedFile(f);
                  if (optimized.size > 3.5 * 1024 * 1024)
                    throw Error(
                      "Choose a smaller photograph (3.5 MB after optimization).",
                    );
                  form.set("file", optimized);
                  form.set("alt", alt);
                  const r = await uploadPickerImage(form);
                  if (r.error) throw Error(r.error);
                  if (r.url) {
                    choose(r.url);
                    setOpen(false);
                  }
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Upload failed");
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
          {busy && <p role="status">Optimizing and uploading…</p>}
          <h4>Choose an existing photograph</h4>
          <div className="media-picker-grid">
            {images
              .filter((i) => i.alt.toLowerCase().includes(query.toLowerCase()))
              .map((i) => (
                <button
                  type="button"
                  key={i.url}
                  onClick={() => {
                    choose(i.url);
                    setOpen(false);
                  }}
                >
                  <img src={i.url} alt={i.alt} loading="lazy" />
                  <span>{i.alt}</span>
                </button>
              ))}
          </div>
        </section>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
