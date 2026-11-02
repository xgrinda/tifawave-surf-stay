import type { StaffRole } from "@/types/operations";
const all: StaffRole[] = [
  "owner",
  "reception",
  "housekeeping",
  "content_editor",
];
/** Early HTTP redirects complement server actions and authoritative database RLS. */
export function adminRouteRoles(path: string): StaffRole[] {
  const section = path.split("/")[2] || "";
  if (["mfa", "access"].includes(section)) return all;
  if (
    ["staff", "settings", "reports", "activity", "reviews", "pricing"].includes(
      section,
    )
  )
    return ["owner"];
  if (
    ["inventory", "rooms", "packages", "gallery", "content"].includes(section)
  )
    return ["owner", "content_editor"];
  if (section === "housekeeping") return ["owner", "reception", "housekeeping"];
  if (section === "search") return ["owner", "reception", "content_editor"];
  return ["owner", "reception"];
}
