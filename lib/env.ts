type SupabasePublicEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

type SupabaseAdminEnv = SupabasePublicEnv & {
  supabaseServiceRoleKey: string;
};

type BookingEmailEnv = {
  resendApiKey: string;
  bookingEmailFrom: string;
  bookingNotificationEmail: string;
};

type AdminAuthEnv = {
  adminPassword: string;
  adminSessionSecret: string;
};

function readRequiredValue(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readRequiredEnv(name: string): string {
  return readRequiredValue(name, process.env[name]);
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  return {
    supabaseUrl: readRequiredValue(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL
    ),
    supabaseAnonKey: readRequiredValue(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  };
}

export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  return {
    ...getSupabasePublicEnv(),
    supabaseServiceRoleKey: readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")
  };
}

export function getBookingEmailEnv(): BookingEmailEnv {
  return {
    resendApiKey: readRequiredEnv("RESEND_API_KEY"),
    bookingEmailFrom: readRequiredEnv("BOOKING_EMAIL_FROM"),
    bookingNotificationEmail: readRequiredEnv("BOOKING_NOTIFICATION_EMAIL")
  };
}

export function getAdminAuthEnv(): AdminAuthEnv {
  return {
    adminPassword: readRequiredEnv("ADMIN_PASSWORD"),
    adminSessionSecret: readRequiredEnv("ADMIN_SESSION_SECRET")
  };
}
