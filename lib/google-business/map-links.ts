/** Accept Maps' public embed delivery only. Never fetch or resolve these URLs on the server. */
export function approvedGoogleMapsEmbedUrl(value: string): string | null {
  if (
    !value ||
    value.length > 8192 ||
    /[\u0000-\u0020\u007f]/.test(value.trim())
  )
    return null;
  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.hash ||
      !["www.google.com", "maps.google.com"].includes(url.hostname)
    )
      return null;
    if (
      /^\/maps\/embed\/?$/.test(url.pathname) &&
      url.searchParams.get("pb") &&
      [...url.searchParams.keys()].every((k) => ["pb", "hl"].includes(k)) &&
      url.searchParams.getAll("pb").length === 1
    )
      return url.toString();
    if (
      /^\/maps\/?$/.test(url.pathname) &&
      url.searchParams.get("output") === "embed" &&
      url.searchParams.get("q") &&
      [...url.searchParams.keys()].every((k) =>
        ["q", "output", "hl", "z"].includes(k),
      )
    )
      return url.toString();
  } catch {
    /* Invalid links render the existing location fallback. */
  }
  return null;
}
