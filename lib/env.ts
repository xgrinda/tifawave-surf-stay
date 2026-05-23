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

type StripeEnv = {
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripeDepositAmountCents: number;
  stripeDepositCurrency: string;
};

type AnalyticsEnv = {
  gaMeasurementId: string;
};

type BookingFlowEnv = {
  depositsEnabled: boolean;
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

function readPositiveIntegerEnv(name: string): number {
  const value = readRequiredEnv(name);
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer.`);
  }

  return parsed;
}

function readBooleanEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) {
    return defaultValue;
  }

  if (["1", "true", "yes", "on"].includes(value)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(value)) {
    return false;
  }

  throw new Error(
    `Environment variable ${name} must be true or false when set.`
  );
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

export function getStripeEnv(): StripeEnv {
  const stripeDepositCurrency = readRequiredEnv("STRIPE_DEPOSIT_CURRENCY")
    .trim()
    .toLowerCase();

  if (!/^[a-z]{3,10}$/.test(stripeDepositCurrency)) {
    throw new Error(
      "Environment variable STRIPE_DEPOSIT_CURRENCY must be a lowercase currency code."
    );
  }

  return {
    stripeSecretKey: readRequiredEnv("STRIPE_SECRET_KEY"),
    stripeWebhookSecret: readRequiredEnv("STRIPE_WEBHOOK_SECRET"),
    stripeDepositAmountCents: readPositiveIntegerEnv(
      "STRIPE_DEPOSIT_AMOUNT_CENTS"
    ),
    stripeDepositCurrency
  };
}

export function getAnalyticsEnv(): AnalyticsEnv {
  return {
    gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? ""
  };
}

export function getBookingFlowEnv(): BookingFlowEnv {
  return {
    depositsEnabled: readBooleanEnv("ENABLE_DEPOSITS", false)
  };
}
