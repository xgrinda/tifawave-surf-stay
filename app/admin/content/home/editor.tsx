"use client";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { contentSchema, type Content } from "@/lib/content/schema";
import { homeMediaSlots, defaultRoomOrder } from "@/lib/content/home-slots";
import { homeSectionOrder } from "@/lib/homepage";
import type { ContentDocument } from "@/types/modules";
import { saveContent } from "../actions";
import {
  EditorWorkspace,
  EditorPanel,
  useUnsavedChanges,
} from "../../_components/editor-workspace";
import { PhotoChoiceEditor, blankPhoto } from "../../_components/photo-choice";
const tabs = [
  { id: "hero", label: "Hero photograph & video" },
  { id: "photos", label: "Section photographs" },
  { id: "copy", label: "Text & search appearance" },
  { id: "publish", label: "Preview & Publish" },
];
export function HomepageEditor({
  document,
  locale,
  inherited,
}: {
  document: ContentDocument | null;
  locale: "en" | "fr";
  inherited: Record<string, { imageUrl: string; alt: string }>;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Content>(() =>
    contentSchema.parse(document?.draft || {}),
  );
  const [state, action, pending] = useActionState(saveContent, {});
  const [dirty, setDirty] = useState(false);
  useUnsavedChanges(dirty);
  useEffect(() => {
    if (state.id) {
      router.replace("/admin/content/home?locale=" + locale + "&saved=1");
      router.refresh();
    }
  }, [state, router, locale]);
  function update(patch: Partial<Content>) {
    setDraft({ ...draft, ...patch });
    setDirty(true);
  }
  const order = [
    ...draft.roomOrder,
    ...defaultRoomOrder.filter(
      (k) => !draft.roomOrder.includes(k as (typeof draft.roomOrder)[number]),
    ),
  ] as Content["roomOrder"];
  return (
    <EditorWorkspace sections={tabs}>
      <form action={action}>
        <input type="hidden" name="id" value={document?.id || ""} />
        <input type="hidden" name="version" value={document?.version || 0} />
        <input type="hidden" name="kind" value="page" />
        <input type="hidden" name="slug" value="home" />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="returnTo" value="home" />
        <input type="hidden" name="draft" value={JSON.stringify(draft)} />
        <p className="owner-state" role="status">
          {document?.published
            ? "Published · draft available"
            : "Draft · existing homepage stays unchanged"}
          {dirty ? " · Unsaved changes" : ""}
        </p>
        <EditorPanel id="hero" title="A first impression, on every screen">
          <p>
            Choose your own genuine Tifawave photograph. Leaving a choice blank
            preserves the existing website image. Uploads stay unassigned until
            you publish this content.
          </p>
          <PhotoChoiceEditor
            label="Homepage hero"
            hero
            inherited={inherited.hero}
            value={{
              imageUrl: draft.heroImage,
              mobileImage: draft.heroMobileImage,
              alt: draft.heroAlt,
              focal: draft.heroFocal,
              mobileFocal: draft.heroMobileFocal,
            }}
            onChange={(v) =>
              update({
                heroImage: v.imageUrl,
                heroMobileImage: v.mobileImage,
                heroAlt: v.alt,
                heroFocal: v.focal,
                heroMobileFocal: v.mobileFocal,
              })
            }
          />
          <details>
            <summary>Optional cinematic video</summary>
            <label className="admin-field">
              Real Tifawave video URL
              <input
                type="url"
                value={draft.heroVideo}
                maxLength={2000}
                onChange={(e) => update({ heroVideo: e.target.value })}
              />
            </label>
            <p>
              Use an MP4 or WebM in the property media library. A desktop image
              is required before publishing video. Mobile and reduced-motion
              visitors receive the photograph.
            </p>
          </details>
        </EditorPanel>
        <EditorPanel id="photos" title="Your photographs, in the right places">
          <p>
            Each named position is independent. No selection here changes a room
            gallery or public page until you publish. Blank choices keep
            existing images or the established illustration.
          </p>
          <details className="owner-photo-slot">
            <summary>Room highlight order</summary>
            <ol className="owner-sort-list">
              {order.map((k, i) => (
                <li key={k}>
                  <span>{homeMediaSlots[k]}</span>
                  {[-1, 1].map((d) => (
                    <button
                      key={d}
                      type="button"
                      disabled={i + d < 0 || i + d >= order.length}
                      aria-label={
                        (d < 0 ? "Move up " : "Move down ") + homeMediaSlots[k]
                      }
                      onClick={() => {
                        const a = [...order];
                        [a[i], a[i + d]] = [a[i + d], a[i]];
                        update({ roomOrder: a });
                      }}
                    >
                      {d < 0 ? "↑" : "↓"}
                    </button>
                  ))}
                </li>
              ))}
            </ol>
          </details>
          {Object.entries(homeMediaSlots).map(([key, label]) => {
            const slot = key as keyof typeof homeMediaSlots;
            const chosen = draft.homeMedia.find((v) => v.slot === slot);
            const old =
              draft.sections[
                homeSectionOrder.indexOf(
                  slot as (typeof homeSectionOrder)[number],
                )
              ];
            const value = chosen || {
              ...blankPhoto,
              imageUrl: old?.imageUrl || "",
              alt: old?.imageAlt || "",
              focal: old?.focalPosition || "center",
            };
            return (
              <details className="owner-photo-slot" key={slot}>
                <summary>
                  <span>{label}</span>
                  <small>
                    {value.imageUrl
                      ? "Photograph selected"
                      : "Uses existing website choice"}
                  </small>
                </summary>
                <PhotoChoiceEditor
                  label={label}
                  value={value}
                  inherited={inherited[slot]}
                  onChange={(v) =>
                    update({
                      homeMedia: [
                        ...draft.homeMedia.filter((x) => x.slot !== slot),
                        { ...v, slot },
                      ],
                    })
                  }
                />
              </details>
            );
          })}
        </EditorPanel>
        <EditorPanel
          id="copy"
          title={locale === "fr" ? "Textes français" : "English text"}
        >
          <p>
            Blank fields keep the approved homepage wording. Use the language
            links above to edit English and French separately.
          </p>
          {(
            [
              ["title", "Hero headline"],
              ["summary", "Hero introduction"],
              ["body", "Experience introduction"],
              ["seoTitle", "Search title"],
              ["seoDescription", "Search description"],
            ] as const
          ).map(([k, label]) => (
            <label className="admin-field" key={k}>
              {label}
              {k === "title" || k === "seoTitle" ? (
                <input
                  value={draft[k]}
                  maxLength={180}
                  onChange={(e) => update({ [k]: e.target.value })}
                />
              ) : (
                <textarea
                  value={draft[k]}
                  maxLength={
                    k === "seoDescription"
                      ? 320
                      : k === "summary"
                        ? 1000
                        : 12000
                  }
                  rows={3}
                  onChange={(e) => update({ [k]: e.target.value })}
                />
              )}
            </label>
          ))}
          {homeSectionOrder.map((k, i) => {
            const s = draft.sections[i] || { heading: "", body: "" };
            return (
              <details className="owner-photo-slot" key={k}>
                <summary>{homeMediaSlots[k]} · text</summary>
                {(["heading", "body"] as const).map((f) => (
                  <label className="admin-field" key={f}>
                    {f === "heading" ? "Heading" : "Supporting text"}
                    <textarea
                      rows={f === "heading" ? 2 : 4}
                      maxLength={f === "heading" ? 180 : 5000}
                      value={s[f]}
                      onChange={(e) =>
                        update({
                          sections: homeSectionOrder.map((_, n) =>
                            n === i
                              ? { ...s, [f]: e.target.value }
                              : draft.sections[n] || { heading: "", body: "" },
                          ),
                        })
                      }
                    />
                  </label>
                ))}
              </details>
            );
          })}
          <Link
            href={
              document ? "/admin/content?id=" + document.id : "/admin/content"
            }
          >
            Questions, links and complete revision history →
          </Link>
        </EditorPanel>
        <EditorPanel id="publish" title="Review before publishing">
          <p>
            Save your draft, then open its protected preview. Only Publish
            changes this staging website. The production website stays
            untouched.
          </p>
          {document ? (
            <Link
              className="btn btn-secondary"
              target="_blank"
              href={"/admin/content/home/preview?locale=" + locale}
            >
              Preview saved homepage draft ↗
            </Link>
          ) : (
            <p>Save a draft first to enable the full homepage preview.</p>
          )}
          <p>
            To publish, provide a headline in Text & search appearance and
            confirm your photographs and copy are ready.
          </p>
        </EditorPanel>
        {state.error && (
          <p role="alert" className="ops-error">
            {state.error}
          </p>
        )}
        {state.id && (
          <p role="status" className="ops-success">
            Homepage saved. Public content changes only when published.
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
          {document && (
            <Link
              href={"/admin/content/home/preview?locale=" + locale}
              target="_blank"
            >
              Preview saved draft ↗
            </Link>
          )}
          <button
            className="btn btn-secondary"
            name="action"
            value="publish"
            disabled={pending}
            onClick={(e) => {
              if (!confirm("Publish this homepage draft to staging?"))
                e.preventDefault();
            }}
          >
            Publish homepage
          </button>
        </div>
      </form>
    </EditorWorkspace>
  );
}
