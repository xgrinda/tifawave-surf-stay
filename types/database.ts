export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          max_guests: number;
          is_active: boolean;
          base_price_cents: number;
          external_ical_urls: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          max_guests?: number;
          is_active?: boolean;
          base_price_cents?: number;
          external_ical_urls?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          max_guests?: number;
          is_active?: boolean;
          base_price_cents?: number;
          external_ical_urls?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          room_id: string;
          reference: string | null;
          status: Database["public"]["Enums"]["booking_status"];
          check_in: string;
          check_out: string;
          stay_range: string;
          guests: number;
          guest_name: string | null;
          guest_email: string | null;
          guest_phone: string | null;
          notes: string | null;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          deposit_amount_cents: number | null;
          deposit_currency: string;
          payment_status: "unpaid" | "checkout_open" | "paid" | "failed";
          deposit_paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          reference?: string | null;
          status?: Database["public"]["Enums"]["booking_status"];
          check_in: string;
          check_out: string;
          guests?: number;
          guest_name?: string | null;
          guest_email?: string | null;
          guest_phone?: string | null;
          notes?: string | null;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          deposit_amount_cents?: number | null;
          deposit_currency?: string;
          payment_status?: "unpaid" | "checkout_open" | "paid" | "failed";
          deposit_paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          reference?: string | null;
          status?: Database["public"]["Enums"]["booking_status"];
          check_in?: string;
          check_out?: string;
          guests?: number;
          guest_name?: string | null;
          guest_email?: string | null;
          guest_phone?: string | null;
          notes?: string | null;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          deposit_amount_cents?: number | null;
          deposit_currency?: string;
          payment_status?: "unpaid" | "checkout_open" | "paid" | "failed";
          deposit_paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blocked_dates: {
        Row: {
          id: string;
          room_id: string;
          start_date: string;
          end_date: string;
          blocked_range: string;
          reason: string;
          note: string | null;
          source: "admin" | "ical";
          source_uid: string | null;
          source_url: string | null;
          source_hash: string | null;
          imported_at: string | null;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          start_date: string;
          end_date: string;
          reason: string;
          note?: string | null;
          source?: "admin" | "ical";
          source_uid?: string | null;
          source_url?: string | null;
          source_hash?: string | null;
          imported_at?: string | null;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          start_date?: string;
          end_date?: string;
          reason?: string;
          note?: string | null;
          source?: "admin" | "ical";
          source_uid?: string | null;
          source_url?: string | null;
          source_hash?: string | null;
          imported_at?: string | null;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      booking_holds: {
        Row: {
          id: string;
          room_id: string;
          check_in: string;
          check_out: string;
          hold_range: string;
          guests: number;
          session_id: string | null;
          expires_at: string;
          released_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          check_in: string;
          check_out: string;
          guests?: number;
          session_id?: string | null;
          expires_at: string;
          released_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          check_in?: string;
          check_out?: string;
          guests?: number;
          session_id?: string | null;
          expires_at?: string;
          released_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          id: boolean;
          business_name: string;
          contact_email: string;
          whatsapp_number: string;
          address: string;
          google_maps_url: string;
          instagram_url: string;
          default_currency: string;
          stripe_deposit_amount_display: string;
          support_phone: string;
          booking_notice_text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          business_name?: string;
          contact_email?: string;
          whatsapp_number?: string;
          address?: string;
          google_maps_url?: string;
          instagram_url?: string;
          default_currency?: string;
          stripe_deposit_amount_display?: string;
          support_phone?: string;
          booking_notice_text?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: boolean;
          business_name?: string;
          contact_email?: string;
          whatsapp_number?: string;
          address?: string;
          google_maps_url?: string;
          instagram_url?: string;
          default_currency?: string;
          stripe_deposit_amount_display?: string;
          support_phone?: string;
          booking_notice_text?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show";
    };
    CompositeTypes: Record<string, never>;
  };
};
