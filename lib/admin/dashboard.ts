import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminDashboardStats = {
  pendingBookings: number;
  confirmedUpcomingStays: number;
  groupRequests: number;
  blockedDates: number;
};

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function exactCount(count: number | null): number {
  return count ?? 0;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = createSupabaseAdminClient();
  const today = todayDateInput();

  const [
    pendingBookings,
    confirmedUpcomingStays,
    groupRequests,
    blockedDates
  ] = await Promise.all([
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
      .from("blocked_dates")
      .select("id", { count: "exact", head: true })
      .gte("end_date", today)
  ]);

  for (const result of [
    pendingBookings,
    confirmedUpcomingStays,
    groupRequests,
    blockedDates
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  return {
    pendingBookings: exactCount(pendingBookings.count),
    confirmedUpcomingStays: exactCount(confirmedUpcomingStays.count),
    groupRequests: exactCount(groupRequests.count),
    blockedDates: exactCount(blockedDates.count)
  };
}
