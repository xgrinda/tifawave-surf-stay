import { createSupabaseStaffClient } from "@/lib/supabase/staff";
import { propertyToday } from "@/lib/booking/schema";

export type AdminDashboardStats = {
  pendingBookings: number;
  confirmedUpcomingStays: number;
  groupRequests: number;
  blockedDates: number;
};

function todayDateInput(): string {
  return propertyToday();
}

function exactCount(count: number | null): number {
  return count ?? 0;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = await createSupabaseStaffClient();
  const today = todayDateInput();

  const [pendingBookings, confirmedUpcomingStays, groupRequests, blockedDates] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "confirmed")
        .gte("check_in", today),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("booking_type", "group_request"),
      supabase
        .from("reservation_allocations")
        .select("id", { count: "exact", head: true })
        .is("booking_id", null)
        .eq("active", true)
        .gte("check_out", today),
    ]);

  for (const result of [
    pendingBookings,
    confirmedUpcomingStays,
    groupRequests,
    blockedDates,
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  return {
    pendingBookings: exactCount(pendingBookings.count),
    confirmedUpcomingStays: exactCount(confirmedUpcomingStays.count),
    groupRequests: exactCount(groupRequests.count),
    blockedDates: exactCount(blockedDates.count),
  };
}
