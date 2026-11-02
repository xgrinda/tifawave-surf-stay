-- Additive only. Keep existing booking/payment records and historical migrations.
alter type public.booking_status add value if not exists 'declined';
