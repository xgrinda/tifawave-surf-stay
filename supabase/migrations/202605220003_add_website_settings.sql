-- Tifawave website settings foundation.
-- Scope: singleton editable operational settings only. No CMS, rooms, or package content.

create table public.settings (
  id boolean primary key default true check (id),
  business_name text not null default 'Tifawave Surf Stay',
  contact_email text not null default 'hello@tifawave.com',
  whatsapp_number text not null default '',
  address text not null default 'Tamraght, Morocco',
  google_maps_url text not null default '',
  instagram_url text not null default '',
  default_currency text not null default 'USD',
  stripe_deposit_amount_display text not null default 'Deposit due at checkout',
  support_phone text not null default '',
  booking_notice_text text not null default 'Your booking is confirmed after the deposit is received.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settings_contact_email_format check (contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
  constraint settings_default_currency_format check (default_currency = upper(default_currency) and default_currency ~ '^[A-Z]{3}$')
);

alter table public.settings enable row level security;

insert into public.settings (id)
values (true)
on conflict (id) do nothing;

comment on table public.settings is
  'Singleton website settings row. Access is server-side only for now.';
