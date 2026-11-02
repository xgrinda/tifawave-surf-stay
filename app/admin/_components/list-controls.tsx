import Link from "next/link";
export function ListControls({
  path,
  q,
  page,
  count,
  archived,
}: {
  path: string;
  q?: string;
  page: number;
  count: number;
  archived?: string;
}) {
  const url = (n: number) =>
    path +
    "?" +
    new URLSearchParams({
      q: q || "",
      page: String(n),
      archived: archived || "",
    });
  return (
    <>
      <form className="ops-filters">
        <label>
          Search
          <input name="q" defaultValue={q} maxLength={100} />
        </label>
        <label>
          Show
          <select name="archived" defaultValue={archived || ""}>
            <option value="">Active records</option>
            <option value="1">Archived records</option>
          </select>
        </label>
        <button className="btn btn-secondary">Apply filters</button>
        <Link href={path}>Clear</Link>
      </form>
      <nav className="ops-toolbar" aria-label="Record pages">
        {page > 1 ? <Link href={url(page - 1)}>← Previous</Link> : <span />}
        <span>
          {count} records · Page {page} · 25 per page
        </span>
        {count > page * 25 && <Link href={url(page + 1)}>Next →</Link>}
      </nav>
    </>
  );
}
