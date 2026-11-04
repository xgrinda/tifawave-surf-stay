"use client";

import { useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";

export async function optimizedFile(file: File): Promise<File> {
  if (
    !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
      file.type,
    ) ||
    file.size > 8 * 1024 * 1024
  )
    throw Error("Choose JPG, PNG, WebP or AVIF files up to 8 MB each.");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 48000000)
      throw Error("Choose images smaller than 48 megapixels.");
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context)
      throw Error("Image optimization is unavailable in this browser.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (v) => (v ? resolve(v) : reject(Error("Image optimization failed."))),
        "image/webp",
        0.82,
      ),
    );
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
      type: "image/webp",
    });
  } finally {
    bitmap.close();
  }
}

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
  const [message, setMessage] = useState("");

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
          onChange={async (event) => {
            const input = event.currentTarget;
            const files = Array.from(input.files ?? []);
            input.setCustomValidity("Please wait while images are optimized.");
            setMessage("Optimizing images before upload…");
            try {
              const optimized = await Promise.all(files.map(optimizedFile));
              if (optimized.reduce((n, f) => n + f.size, 0) > 3.5 * 1024 * 1024)
                throw Error(
                  "Upload fewer images at once (3.5 MB total after optimization).",
                );
              const transfer = new DataTransfer();
              optimized.forEach((f) => transfer.items.add(f));
              input.files = transfer.files;
              input.setCustomValidity("");
              previews.forEach((p) => URL.revokeObjectURL(p.url));
              setPreviews(
                optimized.map((file) => ({
                  name: file.name,
                  size: formatBytes(file.size),
                  url: URL.createObjectURL(file),
                })),
              );
              setMessage("Images optimized and ready to upload.");
            } catch (error) {
              const text =
                error instanceof Error
                  ? error.message
                  : "Image optimization failed.";
              input.value = "";
              input.setCustomValidity(text);
              setMessage(text);
              setPreviews([]);
            }
          }}
        />
        <small>
          {help} Images are compressed in your browser before upload.
        </small>
        {message && <small role="status">{message}</small>}
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
  pendingLabel = "Uploading and optimizing...",
}: UploadSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? pendingLabel : children}
    </button>
  );
}
