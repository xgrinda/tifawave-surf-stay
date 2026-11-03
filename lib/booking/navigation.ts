/** Only deliberate booking context survives a language switch; never contact/message data. */
export function requestContextQuery(search: string) {
  const source = new URLSearchParams(search),
    target = new URLSearchParams();
  for (const key of ["packageId", "roomId"]) {
    const value = source.get(key) || "";
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      )
    )
      target.set(key, value);
  }
  const variant = source.get("variantId") || "";
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(variant) && variant.length <= 64)
    target.set("variantId", variant);
  const type = source.get("type") || "";
  if (["stay_only", "surf_package", "group_request"].includes(type))
    target.set("type", type);
  for (const key of ["checkIn", "checkOut"]) {
    const value = source.get(key) || "";
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value
    )
      target.set(key, value);
  }
  const guests = Number(source.get("guests"));
  if (Number.isInteger(guests) && guests >= 1 && guests <= 23)
    target.set("guests", String(guests));
  return target.toString();
}
