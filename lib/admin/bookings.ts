import "server-only";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
const fields =
  "id,reference,status,version,locale,booking_source,external_reference,booking_type,guest_name,guest_email,guest_phone,guests,check_in,check_out,notes,surf_level,group_size,room_preference,package_id,preferred_kind,preferred_listing_id,retreat_name,airport_transfer,board_rental,wetsuit_rental,meals_needed,yoga_interest,private_coaching,coworking_interest,booking_com_checked_at,airbnb_checked_at,decision_at,created_at" as const;
export const bookingStatuses = [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
  "completed",
  "no_show",
] as const;
export async function getAdminBookings(
  params: {
    status?: string;
    q?: string;
    source?: string;
    page?: string;
    sort?: string;
    arrival?: string;
    departure?: string;
    type?: string;
  } = {},
) {
  const client = await createSupabaseStaffClient();
  const page = Math.min(
    Math.max(Number.parseInt(params.page || "1") || 1, 1),
    10000,
  );
  const q = (params.q || "").replace(/[^\p{L}\p{N}@._ -]/gu, "").slice(0, 100);
  let query = client.from("bookings").select(fields, { count: "exact" });
  const status = bookingStatuses.find((x) => x === params.status);
  if (status) query = query.eq("status", status);
  for (const [key, column] of [
    ["arrival", "check_in"],
    ["departure", "check_out"],
  ] as const) {
    const value = params[key];
    if (
      value &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value
    )
      query = query.eq(column, value);
  }
  if (
    ["stay_only", "surf_package", "group_request"].includes(params.type || "")
  )
    query = query.eq("booking_type", params.type as "stay_only");
  if (
    [
      "website",
      "booking_com",
      "airbnb",
      "direct",
      "walk_in",
      "legacy",
    ].includes(params.source || "")
  )
    query = query.eq("booking_source", params.source as "website");
  if (q)
    query = query.or(
      "guest_name.ilike.%" +
        q +
        "%,guest_email.ilike.%" +
        q +
        "%,reference.ilike.%" +
        q +
        "%",
    );
  const sort = ["created_at", "check_in", "guest_name"].includes(
    params.sort || "",
  )
    ? (params.sort as "created_at")
    : "created_at";
  const { data, error, count } = await query
    .order(sort, { ascending: sort !== "created_at" })
    .order("id")
    .range((page - 1) * 25, page * 25 - 1);
  if (error)
    throw new Error(
      "Reservations could not be loaded. Check staff permissions and migrations.",
    );
  return { bookings: data || [], count: count || 0, page };
}
export async function getReservation(id: string) {
  const client = await createSupabaseStaffClient();
  const { data: booking, error } = await client
    .from("bookings")
    .select(fields)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Reservation could not be loaded.");
  if (!booking) return null;
  const results = await Promise.all([
    client
      .from("reservation_activity")
      .select("*")
      .eq("booking_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
    client
      .from("reservation_allocations")
      .select("*")
      .eq("booking_id", id)
      .order("created_at", { ascending: false }),
    client.from("inventory_units").select("*").order("code"),
    client.from("physical_rooms").select("*").order("code"),
    client
      .from("reservation_allocations")
      .select("unit_id,booking_id,check_in,check_out")
      .eq("active", true),
    client
      .from("email_outbox")
      .select(
        "id,event,status,attempts,last_error,created_at,sent_at,needs_review",
      )
      .eq("booking_id", id)
      .order("created_at", { ascending: false }),
  ]);
  for (const result of results)
    if (result.error)
      throw new Error("Operational detail could not be loaded.");
  return {
    booking,
    activity: results[0].data!,
    allocations: results[1].data!,
    units: results[2].data!,
    rooms: results[3].data!,
    busy: results[4].data!,
    emails: results[5].data!,
  };
}
export function operationError(error: { code?: string; message?: string }) {
  if (error.code === "23P01")
    return "Those rooms or beds conflict with a reservation or maintenance block. Nothing was changed.";
  if (error.code === "42501")
    return "Your current staff identity is not authorized for this action.";
  if (error.code === "40001")
    return "This record changed. Refresh and review before trying again.";
  if (error.code === "23514" || error.code === "22023") {
    const safe = [
      "Record both manual",
      "Allocated rooms",
      "Select distinct",
      "Reconcile overlapping",
      "Only pending",
      "Choose a confirmed",
      "Invalid reservation",
      "Arrival cannot",
      "Add a decision",
      "Invalid maintenance",
    ];
    if (safe.some((prefix) => error.message?.startsWith(prefix)))
      return error.message!;
    return "Dates, capacity, status, or allocations are invalid. Nothing was changed.";
  }
  return "The operation could not be saved. Nothing was changed.";
}
