"use client";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
const SectionContext = createContext({
  active: "",
  select: (_id: string) => {},
});
export function EditorWorkspace({
  sections,
  children,
}: {
  sections: { id: string; label: string }[];
  children: ReactNode;
}) {
  const [active, select] = useState(sections[0].id);
  return (
    <SectionContext.Provider value={{ active, select }}>
      <div
        className="owner-editor"
        onInvalidCapture={(e) => {
          const el = e.target as HTMLElement;
          const panel = el.closest<HTMLElement>("[data-editor-panel]");
          if (panel) {
            select(panel.dataset.editorPanel!);
            requestAnimationFrame(() => el.focus());
          }
        }}
      >
        <nav className="owner-editor-nav" aria-label="Editor sections">
          {sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={active === s.id}
              onClick={() => select(s.id)}
            >
              <small>{String(i + 1).padStart(2, "0")}</small>
              {s.label}
            </button>
          ))}
        </nav>
        <div className="owner-editor-body">{children}</div>
      </div>
    </SectionContext.Provider>
  );
}
export function EditorPanel({
  id,
  title,
  children,
}: {
  id: string;
  title?: string;
  children: ReactNode;
}) {
  const { active } = useContext(SectionContext);
  const key = useId();
  return (
    <section
      hidden={active !== id}
      data-editor-panel={id}
      aria-labelledby={title ? key : undefined}
      className="owner-editor-panel"
    >
      {title && <h2 id={key}>{title}</h2>}
      {children}
    </section>
  );
}
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const leave = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target === "_blank" || a.getAttribute("href")?.startsWith("#") || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (!confirm("You have unsaved changes. Leave without saving?")) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        // The explicit discard decision also permits full document navigation.
        window.removeEventListener("beforeunload", unload);
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", leave, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", leave, true);
    };
  }, [dirty]);
}
