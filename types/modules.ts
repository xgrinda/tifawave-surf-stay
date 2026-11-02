import type { Json } from "./database";
type Row = {
  id: string;
  version: number;
  archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
type Table<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};
export type GuestProfile = Row & {
  full_name: string;
  email: string;
  phone: string;
  notes: string;
  dedupe_key: string | null;
};
export type Enquiry = Row & {
  reference: string;
  kind: string;
  contact_name: string;
  email: string;
  phone: string;
  organization: string;
  message: string;
  notes: string;
  stage: string;
  check_in: string | null;
  check_out: string | null;
  group_size: number | null;
  booking_id: string | null;
  offer_cents: number | null;
  currency: string | null;
  follow_up: string | null;
  locale: string;
  request_key: string | null;
  request_hash: string | null;
};
export type WorkItem = Row & {
  kind: string;
  title: string;
  notes: string;
  status: string;
  room_id: string | null;
  booking_id: string | null;
  enquiry_id: string | null;
  assigned_to: string | null;
  due_date: string | null;
  priority: string;
};
export type RoomDetails = Row & {
  description_en: string;
  description_fr: string;
  amenities: string[];
};
export type RoomReadiness = Row & { status: string; room_notes: string };
export type SeasonRate = Row & {
  unit_id: string;
  label: string;
  starts_on: string;
  ends_on: string;
  nightly_cents: number;
  currency: string;
};
export type PackageActivity = Row & {
  package_id: string;
  title: string;
  description: string;
  duration_minutes: number | null;
  sort_order: number;
};
export type PackagePhoto = Row & {
  package_id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
};
export type ModuleTables = {
  guest_profiles: Table<GuestProfile>;
  guest_reservations: Table<{ booking_id: string; guest_id: string }>;
  enquiries: Table<Enquiry>;
  work_items: Table<WorkItem>;
  property_room_details: Table<RoomDetails>;
  room_readiness: Table<RoomReadiness>;
  season_rates: Table<SeasonRate>;
  package_activities: Table<PackageActivity>;
  package_photos: Table<PackagePhoto>;
  workspace_audit: Table<{
    id: string;
    actor_id: string | null;
    entity: string;
    record_id: string;
    event: string;
    before_data: Json;
    after_data: Json;
    created_at: string;
  }>;
  stay_progress: Table<{
    id: string;
    checked_in_at: string | null;
    checked_out_at: string | null;
    version: number;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  }>;
};
export type WorkspaceEntity = Exclude<
  keyof ModuleTables,
  "guest_reservations" | "workspace_audit" | "stay_progress"
>;
export type ModuleFunctions = {
  update_physical_inventory: {
    Args: {
      p_id: string;
      p_unit: boolean;
      p_active: boolean;
      p_name: string | null;
      p_listing: string | null;
    };
    Returns: undefined;
  };
  save_workspace_record: {
    Args: {
      p_entity: WorkspaceEntity;
      p_id: string | null;
      p_version: number;
      p_data: Json;
    };
    Returns: string;
  };
  staff_directory: {
    Args: Record<string, never>;
    Returns: { user_id: string; display_name: string; role: string }[];
  };
  set_reservation_quote: {
    Args: {
      p_booking_id: string;
      p_version: number;
      p_amount: number | null;
      p_currency: string | null;
    };
    Returns: undefined;
  };
  record_stay_progress: {
    Args: { p_booking_id: string; p_checkout: boolean };
    Returns: undefined;
  };
};
