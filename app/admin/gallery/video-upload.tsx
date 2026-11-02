"use client";
import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
export function VideoUpload() {
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState(""),
    [url, setUrl] = useState("");
  return (
    <section className="desk-panel">
      <h2>Homepage video</h2>
      <p>
        Upload an authentic property video as MP4 or WebM, up to 20 MB. Use a
        short compressed clip without audio. Uploading stores the asset; publish
        its URL with a static image fallback under Website content → home.
        Public media must not contain guest personal information without
        permission.
      </p>
      <form
        className="desk-editor"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const file = form.get("video");
          if (!(file instanceof File) || !file.size) return;
          setPending(true);
          setMessage("");
          setUrl("");
          try {
            const response = await fetch("/api/admin/media", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ type: file.type, size: file.size }),
            });
            const body = await response.json();
            if (!response.ok) throw Error(body.error);
            const client = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              { auth: { persistSession: false, autoRefreshToken: false } },
            );
            const result = await client.storage
              .from("tifawave-media")
              .uploadToSignedUrl(body.path, body.token, file, {
                contentType: file.type,
                cacheControl: "31536000",
              });
            if (result.error)
              throw Error(
                "Video upload failed. Check file type, size and your connection.",
              );
            setUrl(body.publicUrl);
            setMessage(
              "Video uploaded. Copy its URL into the home document; it remains unpublished until you publish that document.",
            );
          } catch (error) {
            setMessage(
              error instanceof Error ? error.message : "Upload failed.",
            );
          } finally {
            setPending(false);
          }
        }}
      >
        <label className="admin-field">
          <span>Video file</span>
          <input
            name="video"
            type="file"
            accept="video/mp4,video/webm"
            required
          />
        </label>
        <button className="btn btn-secondary" disabled={pending}>
          {pending ? "Uploading video…" : "Upload video"}
        </button>
      </form>
      {message && <p role="status">{message}</p>}
      {url && (
        <label className="admin-field">
          <span>Uploaded video URL</span>
          <input readOnly value={url} onFocus={(e) => e.target.select()} />
        </label>
      )}
    </section>
  );
}
