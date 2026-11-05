"use client";
import { MediaPicker } from "./media-picker";
import { CmsPhoto } from "@/components/content/cms-photo";
export type PhotoChoice = {
  imageUrl: string;
  mobileImage: string;
  alt: string;
  focal: "top" | "center" | "bottom";
  mobileFocal: "top" | "center" | "bottom";
};
export const blankPhoto: PhotoChoice = {
  imageUrl: "",
  mobileImage: "",
  alt: "",
  focal: "center",
  mobileFocal: "center",
};
export function PhotoChoiceEditor({
  label,
  value,
  onChange,
  hero = false,
  inherited,
}: {
  label: string;
  value: PhotoChoice;
  onChange: (v: PhotoChoice) => void;
  hero?: boolean;
  inherited?: { imageUrl: string; alt: string };
}) {
  return (
    <div className="owner-photo-choice">
      {!value.imageUrl && inherited && (
        <div className="owner-inherited-photo">
          <p>
            Current website photograph · unchanged until you choose and publish
            a replacement
          </p>
          <CmsPhoto
            src={inherited.imageUrl}
            alt={inherited.alt}
            className="media-preview-desktop"
          />
        </div>
      )}
      <MediaPicker
        label={label + " · desktop"}
        value={value.imageUrl}
        onChange={(v) => onChange({ ...value, imageUrl: v })}
        preset={hero ? "2400 × 1350 · 16:9" : "1200 × 900 · 4:3"}
      />
      <details>
        <summary>Mobile image & crop previews</summary>
        <MediaPicker
          label={label + " · mobile (optional)"}
          value={value.mobileImage}
          onChange={(v) => onChange({ ...value, mobileImage: v })}
          preset="1080 × 1350 · 4:5"
        />
        <p>
          Blank mobile image uses the desktop photograph. These previews show
          the actual responsive focal choices.
        </p>
        <div className="admin-settings-grid">
          {(["focal", "mobileFocal"] as const).map((k) => (
            <label className="admin-field" key={k}>
              {k === "focal" ? "Desktop focal point" : "Mobile focal point"}
              <select
                value={value[k]}
                onChange={(e) =>
                  onChange({
                    ...value,
                    [k]: e.target.value as PhotoChoice[typeof k],
                  })
                }
              >
                {["top", "center", "bottom"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="media-preview-pair">
          {value.imageUrl && (
            <figure>
              <figcaption>Desktop crop</figcaption>
              <CmsPhoto
                key={value.imageUrl}
                src={value.imageUrl}
                alt={value.alt}
                position={value.focal}
                className="media-preview-desktop"
              />
            </figure>
          )}
          {(value.mobileImage || value.imageUrl) && (
            <figure>
              <figcaption>Mobile crop</figcaption>
              <CmsPhoto
                key={value.mobileImage || value.imageUrl}
                src={value.mobileImage || value.imageUrl}
                alt={value.alt}
                position={value.mobileFocal}
                mobilePosition={value.mobileFocal}
                className="media-preview-mobile"
              />
            </figure>
          )}
        </div>
      </details>
      <label className="admin-field">
        Photograph description
        <input
          value={value.alt}
          maxLength={300}
          onChange={(e) => onChange({ ...value, alt: e.target.value })}
        />
      </label>
      <button
        type="button"
        onClick={() => onChange({ ...blankPhoto })}
        disabled={!value.imageUrl && !value.mobileImage}
      >
        Use existing website image
      </button>
    </div>
  );
}
