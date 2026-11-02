function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error("Missing required environment variable: " + name);
  return value;
}
export function getSupabasePublicEnv() {
  return {
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}
export function getSupabaseAdminEnv() {
  return {
    ...getSupabasePublicEnv(),
    supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  };
}
export function getBookingEmailEnv() {
  return {
    resendApiKey: required("RESEND_API_KEY"),
    bookingEmailFrom: required("BOOKING_EMAIL_FROM"),
    bookingNotificationEmail: required("BOOKING_NOTIFICATION_EMAIL"),
  };
}
export function getAnalyticsEnv() {
  return {
    gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "",
  };
}
export function getGoogleBusinessProfileEnv() {
  const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET?.trim() || "";
  const refreshToken = process.env.GOOGLE_BUSINESS_REFRESH_TOKEN?.trim() || "";
  return {
    clientId,
    clientSecret,
    refreshToken,
    configured: Boolean(clientId && clientSecret && refreshToken),
  };
}
