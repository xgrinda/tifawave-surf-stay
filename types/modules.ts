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
  is_published: boolean;
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
export type ContentDocument = {
  id: string;
  kind: "page" | "room" | "package" | "email";
  slug: string;
  locale: "en" | "fr";
  draft: Json;
  published: Json | null;
  version: number;
  published_version: number | null;
  published_at: string | null;
  updated_at: string;
};
export type ModuleTables = {
  content_documents: Table<ContentDocument>;
  content_revisions: Table<{
    id: string;
    document_id: string;
    version: number;
    action: string;
    payload: Json;
    actor_id: string;
    created_at: string;
  }>;
  operations_settings: Table<{
    id: boolean;
    minimum_nights: number;
    maximum_nights: number;
    notice_days: number;
    retention_review_days: number;
    version: number;
    updated_at: string;
  }>;
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
  | "guest_reservations"
  | "workspace_audit"
  | "stay_progress"
  | "content_documents"
  | "content_revisions"
  | "operations_settings"
>;
export type ModuleFunctions = {
  room_listing_details: {
    Args: { p_listing: string; p_locale: string };
    Returns: Json;
  };
  staff_recovery_allowed: {
    Args: { p_email: string; p_rate_key: string };
    Returns: boolean;
  };
  staff_session_active: { Args: Record<string, never>; Returns: boolean };
  save_operations_settings: {
    Args: {
      p_version: number;
      p_minimum: number;
      p_maximum: number;
      p_notice: number;
      p_retention: number;
    };
    Returns: undefined;
  };
  save_content_document: {
    Args: {
      p_id: string | null;
      p_version: number;
      p_kind: string;
      p_slug: string;
      p_locale: string;
      p_draft: Json;
      p_action: string;
    };
    Returns: string;
  };
  restore_content_revision: {
    Args: { p_revision: string; p_version: number };
    Returns: undefined;
  };
  manage_staff_member: {
    Args: { p_user: string; p_name: string; p_role: string; p_active: boolean };
    Returns: undefined;
  };
  submit_enquiry: {
    Args: { p_input: Json; p_request_key: string; p_rate_key: string };
    Returns: string;
  };
  reservation_from_enquiry: {
    Args: { p_id: string; p_version: number };
    Returns: string;
  };
  operations_report: {
    Args: { p_start: string; p_end: string };
    Returns: Json;
  };
  export_workspace: {
    Args: { p_kind: string; p_start: string; p_end: string };
    Returns: Json;
  };
  retention_review: { Args: Record<string, never>; Returns: Json };

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
