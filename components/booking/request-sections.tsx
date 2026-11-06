import type { ReactNode } from "react";

export function RequestSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="request-step">
      <header className="request-step-heading">
        <span className="request-step-number" aria-hidden="true">
          {number}
        </span>
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </header>
      <div className="request-step-fields">{children}</div>
    </section>
  );
}
