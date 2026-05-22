import type { ReactNode } from "react";
import { Container } from "@/components/primitives/container";

type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PagePlaceholder({
  eyebrow,
  title,
  description,
  children
}: PagePlaceholderProps) {
  return (
    <main className="placeholder-page">
      <Container className="placeholder-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="placeholder-copy">{description}</p>
        {children ? <div className="placeholder-notes">{children}</div> : null}
      </Container>
    </main>
  );
}
