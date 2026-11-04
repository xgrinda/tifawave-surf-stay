"use client";
import { MediaPicker } from "../_components/media-picker";
import { CmsPhoto } from "@/components/content/cms-photo";
import { ContentBody } from "@/components/content/content-body";
import { homeSectionOrder } from "@/lib/homepage";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveContent } from "./actions";
import { contentSchema, type Content } from "@/lib/content/schema";
import type { ContentDocument } from "@/types/modules";
export function ContentEditor({
  document,
  choices,
}: {
  document: ContentDocument | null;
  choices: { kind: string; slug: string; label: string }[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveContent, {});
  const [draft, setDraft] = useState<Content>(() =>
    contentSchema.parse(document?.draft || {}),
  );
  const [kind, setKind] = useState(document?.kind || "page");
  useEffect(() => {
    if (state.id) {
      router.replace("/admin/content?id=" + state.id);
      router.refresh();
    }
  }, [state.id, router]);
  function field(key: keyof Content, label: string, textarea = false) {
    const value = draft[key];
    if (typeof value !== "string") return null;
    return (
      <label className="admin-field" key={key}>
        <span>{label}</span>
        {textarea ? (
          <textarea
            rows={key === "body" ? 8 : 3}
            value={value}
            onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          />
        )}
      </label>
    );
  }
  return (
    <form action={action} className="desk-editor">
      <input type="hidden" name="id" value={document?.id || ""} />
      <input type="hidden" name="version" value={document?.version || 0} />
      <input type="hidden" name="draft" value={JSON.stringify(draft)} />
      <div className="admin-settings-grid">
        <label className="admin-field">
          <span>Content type</span>
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            disabled={Boolean(document)}
          >
            {[...new Set(choices.map((c) => c.kind))].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          {document && <input type="hidden" name="kind" value={kind} />}
        </label>
        <label className="admin-field">
          <span>Page or template</span>
          <select
            name="slug"
            defaultValue={document?.slug}
            disabled={Boolean(document)}
          >
            {choices
              .filter((c) => c.kind === kind)
              .map((c) => (
                <option value={c.slug} key={c.slug}>
                  {c.label}
                </option>
              ))}
          </select>
          {document && (
            <input type="hidden" name="slug" value={document.slug} />
          )}
        </label>
        <label className="admin-field">
          <span>Language</span>
          <select
            name="locale"
            defaultValue={document?.locale || "en"}
            disabled={Boolean(document)}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
          {document && (
            <input type="hidden" name="locale" value={document.locale} />
          )}
        </label>
      </div>
      <p className="desk-muted">
        Saving a draft keeps the published version unchanged. Restore also
        restores a draft. Publish only verified property information.
      </p>
      {kind === "email" ? (
        <>
          <p>
            The booking state and manual approval wording are fixed. Add
            optional information below the standard message.
          </p>
          {field("body", "Additional message", true)}
        </>
      ) : (
        <>
          {field("title", "Title")}
          {field("summary", "Introduction", true)}
          {field("body", "Main text", true)}
          <details>
            <summary>Search appearance</summary>
            {field("seoTitle", "Search title")}
            {field("seoDescription", "Search description", true)}
          </details>
          <details>
            <summary>Hero image, video and link</summary>
            <p>
              Use a property media URL from the media library. Video requires an
              image fallback. Leave blank when original media is unavailable.
            </p>
            <MediaPicker
              label="Desktop hero image"
              value={draft.heroImage}
              onChange={(v) => setDraft({ ...draft, heroImage: v })}
              preset="2400 × 1350 · 16:9"
            />
            <MediaPicker
              label="Mobile hero image · optional"
              value={draft.heroMobileImage}
              onChange={(v) => setDraft({ ...draft, heroMobileImage: v })}
              preset="1080 × 1350 · 4:5"
            />
            {(["heroFocal", "heroMobileFocal"] as const).map((k) => (
              <label className="admin-field" key={k}>
                {k === "heroFocal"
                  ? "Desktop focal point"
                  : "Mobile focal point"}
                <select
                  value={draft[k]}
                  onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                >
                  {["top", "center", "bottom"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            ))}
            {field("heroAlt", "Image description")}
            {field("heroVideo", "Video URL (MP4 or WebM)")}
            {field("ctaLabel", "Link label")}
            {field("ctaPath", "Local page path")}
          </details>
          <fieldset>
            <legend>Page sections</legend>
            {document?.slug === "home" && (
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    sections: homeSectionOrder.map(
                      (key, i) =>
                        draft.sections[i] || { heading: "", body: "" },
                    ),
                  })
                }
              >
                Show all homepage section image controls
              </button>
            )}
            {draft.sections.map((s, i) => (
              <div key={i} className="desk-panel">
                <p>
                  {document?.slug === "home"
                    ? homeSectionOrder[i]
                    : "Section " + (i + 1)}
                </p>
                <MediaPicker
                  label="Section photograph · optional"
                  value={s.imageUrl || ""}
                  onChange={(v) =>
                    setDraft({
                      ...draft,
                      sections: draft.sections.map((x, n) =>
                        n === i ? { ...x, imageUrl: v } : x,
                      ),
                    })
                  }
                />
                <label className="admin-field">
                  Image alt text / caption
                  <input
                    value={s.imageAlt || ""}
                    maxLength={300}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        sections: draft.sections.map((x, n) =>
                          n === i ? { ...x, imageAlt: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </label>
                <label className="admin-field">
                  Crop focal point
                  <select
                    value={s.focalPosition || "center"}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        sections: draft.sections.map((x, n) =>
                          n === i
                            ? {
                                ...x,
                                focalPosition: e.target.value as
                                  | "top"
                                  | "center"
                                  | "bottom",
                              }
                            : x,
                        ),
                      })
                    }
                  >
                    {["top", "center", "bottom"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  <span>Heading</span>
                  <input
                    value={s.heading}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        sections: draft.sections.map((v, n) =>
                          n === i ? { ...v, heading: e.target.value } : v,
                        ),
                      })
                    }
                  />
                </label>
                <label className="admin-field">
                  <span>Text</span>
                  <textarea
                    rows={4}
                    value={s.body}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        sections: draft.sections.map((v, n) =>
                          n === i ? { ...v, body: e.target.value } : v,
                        ),
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      sections: draft.sections.filter((_, n) => n !== i),
                    })
                  }
                >
                  Remove section
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={draft.sections.length >= 12}
              onClick={() =>
                setDraft({
                  ...draft,
                  sections: [...draft.sections, { heading: "", body: "" }],
                })
              }
            >
              Add section
            </button>
          </fieldset>
          <fieldset>
            <legend>Questions and answers</legend>
            {draft.faqs.map((s, i) => (
              <div key={i} className="desk-panel">
                <label className="admin-field">
                  <span>Question</span>
                  <input
                    value={s.question}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        faqs: draft.faqs.map((v, n) =>
                          n === i ? { ...v, question: e.target.value } : v,
                        ),
                      })
                    }
                  />
                </label>
                <label className="admin-field">
                  <span>Answer</span>
                  <textarea
                    rows={3}
                    value={s.answer}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        faqs: draft.faqs.map((v, n) =>
                          n === i ? { ...v, answer: e.target.value } : v,
                        ),
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      faqs: draft.faqs.filter((_, n) => n !== i),
                    })
                  }
                >
                  Remove question
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={draft.faqs.length >= 30}
              onClick={() =>
                setDraft({
                  ...draft,
                  faqs: [...draft.faqs, { question: "", answer: "" }],
                })
              }
            >
              Add question
            </button>
          </fieldset>
        </>
      )}
      {kind !== "email" && (
        <details className="desk-panel">
          <summary>Preview unsaved content and image choices</summary>
          <div className="media-preview-pair">
            {draft.heroImage && (
              <figure>
                <figcaption>Desktop hero · 16:9</figcaption>
                <CmsPhoto
                  src={draft.heroImage}
                  alt={draft.heroAlt}
                  position={draft.heroFocal}
                  className="media-preview-desktop"
                />
              </figure>
            )}
            {(draft.heroMobileImage || draft.heroImage) && (
              <figure>
                <figcaption>Mobile hero · 4:5</figcaption>
                <CmsPhoto
                  src={draft.heroMobileImage || draft.heroImage}
                  alt={draft.heroAlt}
                  position={draft.heroMobileFocal}
                  className="media-preview-mobile"
                />
              </figure>
            )}
          </div>
          <ContentBody content={draft} />
        </details>
      )}
      {state.error && <p role="alert">{state.error}</p>}
      <div className="desk-actions">
        <button
          className="btn btn-primary"
          name="action"
          value="draft"
          disabled={pending}
        >
          Save draft
        </button>
        <button
          className="btn btn-secondary"
          name="action"
          value="publish"
          disabled={pending}
          onClick={(e) => {
            if (
              !confirm("Publish this verified content to the public website?")
            )
              e.preventDefault();
          }}
        >
          Publish
        </button>
        {document?.published && (
          <button
            name="action"
            value="unpublish"
            disabled={pending}
            onClick={(e) => {
              if (
                !confirm(
                  "Remove this published content? The draft remains available.",
                )
              )
                e.preventDefault();
            }}
          >
            Unpublish
          </button>
        )}
      </div>
    </form>
  );
}
