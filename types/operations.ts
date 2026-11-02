import type { Json } from "./database";

type Table<R> = {
  Row: R;
  Insert: Partial<R>;
  Update: Partial<R>;
  Relationships: [];
};
export type StaffRole =
  | "owner"
  | "reception"
  | "housekeeping"
  | "content_editor";
export type StaffMember = {
  user_id: string;
  display_name: string;
  role: StaffRole;
  is_active: boolean;
  created_at: string;
};
export type PhysicalRoom = {
  id: string;
  code: string;
  name: string;
  kind: string;
  capacity: number;
  listing_id: string | null;
  is_active: boolean;
  created_at: string;
};
export type InventoryUnit = {
  id: string;
  physical_room_id: string;
  code: string;
  kind: "private_room" | "dorm_bed";
  capacity: number;
  is_active: boolean;
};
export type Allocation = {
  id: string;
  booking_id: string | null;
  unit_id: string;
  check_in: string;
  check_out: string;
  stay_range: string;
  block_reason: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
  legacy_block_id: string | null;
};
export type Activity = {
  id: string;
  booking_id: string;
  actor_id: string | null;
  event: string;
  note: string | null;
  details: Json;
  created_at: string;
};
export type Notification = {
  id: string;
  booking_id: string;
  event: string;
  created_at: string;
};
export type OutboxEmail = {
  id: string;
  booking_id: string;
  event:
    | "received"
    | "owner_alert"
    | "confirmed"
    | "declined"
    | "changed"
    | "cancelled";
  version: number;
  payload: Json;
  status: "queued" | "processing" | "sent" | "failed";
  attempts: number;
  available_at: string;
  lease_token: string | null;
  lease_until: string | null;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
};
export type BookingOperations = {
  booking_source:
    | "legacy"
    | "website"
    | "booking_com"
    | "airbnb"
    | "direct"
    | "walk_in";
  external_reference: string | null;
  preferred_listing_id: string | null;
  preferred_kind: string | null;
  locale: "en" | "fr";
  internal_notes: string | null;
  request_key: string | null;
  request_hash: string | null;
  version: number;
  decision_by: string | null;
  decision_at: string | null;
  booking_com_checked_at: string | null;
  airbnb_checked_at: string | null;
};
export type OperationTables = {
  staff_members: Table<StaffMember>;
  physical_rooms: Table<PhysicalRoom>;
  inventory_units: Table<InventoryUnit>;
  reservation_allocations: Table<Allocation>;
  reservation_activity: Table<Activity>;
  operation_notifications: Table<Notification>;
  notification_reads: Table<{
    notification_id: string;
    user_id: string;
    read_at: string;
  }>;
  email_outbox: Table<OutboxEmail>;
  inventory_activity: Table<{
    id: string;
    actor_id: string;
    action: string;
    unit_ids: string[];
    check_in: string;
    check_out: string;
    reason: string;
    created_at: string;
  }>;
};
export type OperationFunctions = {
  unit_calendar_events: { Args: { p_unit_id: string }; Returns: Allocation[] };
  staff_role: { Args: Record<string, never>; Returns: StaffRole | null };
  submit_booking_request: {
    Args: { p_input: Json; p_request_key: string; p_rate_key: string };
    Returns: string;
  };
  create_manual_request: {
    Args: { p_input: Json; p_source: string; p_request_key?: string };
    Returns: string;
  };
  manage_reservation: {
    Args: {
      p_booking_id: string;
      p_command: string;
      p_data: Json;
      p_expected_version: number;
    };
    Returns: undefined;
  };
  manage_inventory_block: {
    Args: {
      p_unit_ids: string[];
      p_check_in: string;
      p_check_out: string;
      p_reason: string;
      p_legacy_block_id?: string;
    };
    Returns: undefined;
  };
  release_inventory_block: { Args: { p_id: string }; Returns: undefined };
  claim_booking_emails: {
    Args: { p_booking_id?: string };
    Returns: OutboxEmail[];
  };
  retry_failed_booking_emails: {
    Args: { p_booking_id: string };
    Returns: undefined;
  };
  finish_booking_email: {
    Args: { p_id: string; p_lease_token: string; p_success: boolean };
    Returns: undefined;
  };
};
