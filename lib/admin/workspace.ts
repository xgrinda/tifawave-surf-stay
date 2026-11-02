import "server-only";
import { z } from "zod";
import { createSupabaseStaffClient } from "@/lib/supabase/staff";
const row = z.object({
  id: z.string(),
  reference: z.string().nullable(),
  guest_name: z.string().nullable(),
  guests: z.number(),
  check_in: z.string(),
  check_out: z.string(),
  booking_type: z.string(),
  created_at: z.string(),
});
const schema = z.object({
  today: z.string(),
  arrivals: z.number(),
  departures: z.number(),
  pending: z.number(),
  groups: z.number(),
  unmapped: z.number(),
  occupancy: z.array(
    z.object({
      kind: z.string(),
      total: z.number(),
      blocked: z.number(),
      occupied: z.number(),
    }),
  ),
  units: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      kind: z.string(),
      capacity: z.number(),
      active: z.boolean(),
      room_name: z.string(),
      room_code: z.string(),
    }),
  ),
  allocations: z.array(
    z.object({
      id: z.string(),
      unit_id: z.string(),
      booking_id: z.string().nullable(),
      check_in: z.string(),
      check_out: z.string(),
      block_reason: z.string().nullable(),
      guest_name: z.string().nullable(),
      reference: z.string().nullable(),
      booking_source: z.string().nullable(),
    }),
  ),
  queue: z.array(row),
  upcoming: z.array(row),
});
export async function getWorkspace(start: string, end: string) {
  const client = await createSupabaseStaffClient();
  const { data, error } = await client.rpc("operations_workspace", {
    p_start: start,
    p_end: end,
  });
  if (error)
    throw Error(
      "Operations data is unavailable. No estimated figures are displayed.",
    );
  return schema.parse(data);
}
