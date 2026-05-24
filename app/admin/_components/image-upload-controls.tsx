"use client";

import { useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";

type ImageUploadFieldProps = {
  help: string;
  label: string;
};

type UploadPreview = {
  name: string;
  size: string;
  url: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageUploadField({ help, label }: ImageUploadFieldProps) {
  const inputId = useId();
  const [previews, setPreviews] = useState<UploadPreview[]>([]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  return (
    <div className="admin-upload-field">
      <label className="admin-field admin-field-wide" htmlFor={inputId}>
        <span>{label}</span>
        <input
          accept="image/jpeg,image/png,image/webp,image/avif"
          id={inputId}
          multiple
          name="imageFile"
          required
          type="file"
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            previews.forEach((preview) => URL.revokeObjectURL(preview.url));
            setPreviews(
              files.map((file) => ({
                name: file.name,
                size: formatBytes(file.size),
                url: URL.createObjectURL(file)
              }))
            );
          }}
        />
        <small>{help}</small>
      </label>

      {previews.length > 0 ? (
        <div className="admin-upload-preview-grid" aria-live="polite">
          {previews.map((preview) => (
            <figure className="admin-upload-preview" key={preview.url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" src={preview.url} />
              <figcaption>
                <span>{preview.name}</span>
                <small>{preview.size}</small>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type UploadSubmitButtonProps = {
  children: string;
  className?: string;
  pendingLabel?: string;
};

export function UploadSubmitButton({
  children,
  className = "btn btn-primary admin-settings-submit",
  pendingLabel = "Uploading and optimizing..."
}: UploadSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? pendingLabel : children}
    </button>
  );
}
