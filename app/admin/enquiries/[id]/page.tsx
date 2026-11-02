import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { moduleRecord } from "@/lib/admin/modules";
export default async function Enquiry({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("reservations");
  const e = await moduleRecord("enquiries", (await params).id);
  if (!e) notFound();
  redirect(
    (e.kind === "group" || e.kind === "retreat"
      ? "/admin/groups"
      : "/admin/partners") +
      "?id=" +
      e.id,
  );
}
