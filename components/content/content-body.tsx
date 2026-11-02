import Link from "next/link";
import type { Content } from "@/lib/content/schema";
export function ContentBody({ content }: { content: Content | null }) {
  if (!content) return null;
  return (
    <div className="published-content">
      {content.body && <p style={{ whiteSpace: "pre-wrap" }}>{content.body}</p>}
      {content.sections.map((s, i) => (
        <section key={i}>
          <h2>{s.heading}</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{s.body}</p>
        </section>
      ))}
      {content.faqs.map((f, i) => (
        <details key={i}>
          <summary>{f.question}</summary>
          <p>{f.answer}</p>
        </details>
      ))}
      {content.ctaLabel && content.ctaPath && (
        <Link className="btn btn-primary" href={content.ctaPath}>
          {content.ctaLabel}
        </Link>
      )}
    </div>
  );
}
