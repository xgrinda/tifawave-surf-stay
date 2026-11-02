import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { pageSlugs, emailSlugs, contentSchema } from "@/lib/content/schema";
import { AdminShell } from "../_components/admin-shell";
import { ContentEditor } from "./editor";
import { restoreContent } from "./actions";
export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{
    id?: string;
    page?: string;
    error?: string;
    restored?: string;
  }>;
}) {
  const staff = await requireAdmin("content");
  const client = await createSupabaseStaffClient();
  const p = await searchParams;
  const page = Math.max(1, Math.min(10000, Number(p.page) || 1));
  const [docs, room, packages, selected] = await Promise.all([
    client
      .from("content_documents")
      .select("*", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range((page - 1) * 25, page * 25 - 1),
    client.from("rooms").select("slug,name").order("name"),
    client.from("packages").select("slug,name").order("name"),
    p.id
      ? client
          .from("content_documents")
          .select("*")
          .eq("id", p.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (docs.error || room.error || packages.error || selected.error)
    throw new Error("Content workspace unavailable");
  const document = selected.data;
  const revisions = document
    ? await client
        .from("content_revisions")
        .select("id,version,action,created_at")
        .eq("document_id", document.id)
        .order("version", { ascending: false })
        .limit(25)
    : null;
  const choices = [
    ...pageSlugs.map((slug) => ({ kind: "page", slug, label: slug })),
    ...(room.data || []).map((r) => ({
      kind: "room",
      slug: r.slug,
      label: r.name,
    })),
    ...(packages.data || []).map((r) => ({
      kind: "package",
      slug: r.slug,
      label: r.name,
    })),
    ...(staff.role === "owner"
      ? emailSlugs.map((slug) => ({ kind: "email", slug, label: slug }))
      : []),
  ];
  const preview = contentSchema.safeParse(document?.draft);
  return (
    <AdminShell
      active="content"
      title="Website content"
      description="English and French drafts, explicit publication and recoverable revision history."
    >
      <section className="desk-panel">
        <div className="desk-section-title">
          <h2>Documents ({docs.count || 0})</h2>
          <Link href="/admin/content">New document</Link>
        </div>
        <div className="desk-table-scroll">
          <table className="desk-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Language</th>
                <th>State</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {docs.data?.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link href={"/admin/content?id=" + d.id}>
                      {d.kind} / {d.slug}
                    </Link>
                  </td>
                  <td>{d.locale}</td>
                  <td>
                    {d.published
                      ? "Published v" + d.published_version
                      : "Unpublished"}{" "}
                    · draft v{d.version}
                  </td>
                  <td>{d.updated_at.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="desk-actions">
          {page > 1 && <Link href={"?page=" + (page - 1)}>Previous</Link>}
          {page * 25 < (docs.count || 0) && (
            <Link href={"?page=" + (page + 1)}>Next</Link>
          )}
        </div>
      </section>
      <section className="desk-panel">
        <h2>
          {document ? document.kind + " / " + document.slug : "New draft"}
        </h2>
        {p.error && <p role="alert">{p.error}</p>}
        {p.restored && (
          <p role="status">
            Revision restored to draft. Review before publishing.
          </p>
        )}
        <ContentEditor
          key={document?.id + ":" + document?.version}
          document={document}
          choices={choices}
        />
      </section>
      {document && (
        <section className="desk-panel">
          <h2>Recent revisions</h2>
          <p>Last 25 revisions. Restoring preserves the current publication.</p>
          {revisions?.data?.map((r) => (
            <form action={restoreContent} key={r.id} className="desk-actions">
              <span>
                v{r.version} · {r.action} ·{" "}
                {r.created_at.slice(0, 16).replace("T", " ")} UTC
              </span>
              <input type="hidden" name="id" value={document.id} />
              <input type="hidden" name="revision" value={r.id} />
              <input type="hidden" name="version" value={document.version} />
              <button>Restore to draft</button>
            </form>
          ))}
        </section>
      )}
      {preview.success && document?.kind !== "email" && (
        <section className="desk-panel">
          <h2>Draft text preview</h2>
          <h3>{preview.data.title}</h3>
          <p>{preview.data.summary}</p>
          <div style={{ whiteSpace: "pre-wrap" }}>{preview.data.body}</div>
          {preview.data.sections.map((s, i) => (
            <div key={i}>
              <h3>{s.heading}</h3>
              <p style={{ whiteSpace: "pre-wrap" }}>{s.body}</p>
            </div>
          ))}
          {preview.data.faqs.map((f, i) => (
            <details key={i}>
              <summary>{f.question}</summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </section>
      )}
    </AdminShell>
  );
}
