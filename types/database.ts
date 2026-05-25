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
      room_images: {
        Row: {
          id: string;
          room_id: string;
          image_url: string;
          alt_text: string;
          focal_position: "center" | "top" | "bottom";
          sort_order: number;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          image_url: string;
          alt_text?: string;
          focal_position?: "center" | "top" | "bottom";
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          image_url?: string;
          alt_text?: string;
          focal_position?: "center" | "top" | "bottom";
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      packages: {
        Row: {
          id: string;
          slug: string;
          name: string;
          short_description: string;
          full_description: string;
          price_cents: number;
          duration: string;
          surf_level: string;
          inclusions: string[];
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          short_description?: string;
          full_description?: string;
          price_cents?: number;
          duration?: string;
          surf_level?: string;
          inclusions?: string[];
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          short_description?: string;
          full_description?: string;
          price_cents?: number;
          duration?: string;
          surf_level?: string;
          inclusions?: string[];
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      gallery_images: {
        Row: {
          id: string;
          image_url: string;
          caption: string;
          alt_text: string;
          category: string;
          focal_position: "center" | "top" | "bottom";
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          caption?: string;
          alt_text?: string;
          category?: string;
          focal_position?: "center" | "top" | "bottom";
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          image_url?: string;
          caption?: string;
          alt_text?: string;
          category?: string;
          focal_position?: "center" | "top" | "bottom";
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          room_id: string | null;
          package_id: string | null;
          reference: string | null;
          booking_type: "stay_only" | "surf_package" | "group_request";
          status: Database["public"]["Enums"]["booking_status"];
          check_in: string;
          check_out: string;
          stay_range: string;
          guests: number;
          guest_name: string | null;
          guest_email: string | null;
          guest_phone: string | null;
          notes: string | null;
          surf_level: string | null;
          group_size: number | null;
          airport_transfer: boolean;
          board_rental: boolean;
          wetsuit_rental: boolean;
          coworking_interest: boolean;
          room_preference: string | null;
          private_coaching: boolean;
          yoga_interest: boolean;
          meals_needed: boolean;
          retreat_name: string | null;
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
          room_id?: string | null;
          package_id?: string | null;
          reference?: string | null;
          booking_type?: "stay_only" | "surf_package" | "group_request";
          status?: Database["public"]["Enums"]["booking_status"];
          check_in: string;
          check_out: string;
          guests?: number;
          guest_name?: string | null;
          guest_email?: string | null;
          guest_phone?: string | null;
          notes?: string | null;
          surf_level?: string | null;
          group_size?: number | null;
          airport_transfer?: boolean;
          board_rental?: boolean;
          wetsuit_rental?: boolean;
          coworking_interest?: boolean;
          room_preference?: string | null;
          private_coaching?: boolean;
          yoga_interest?: boolean;
          meals_needed?: boolean;
          retreat_name?: string | null;
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
          room_id?: string | null;
          package_id?: string | null;
          reference?: string | null;
          booking_type?: "stay_only" | "surf_package" | "group_request";
          status?: Database["public"]["Enums"]["booking_status"];
          check_in?: string;
          check_out?: string;
          guests?: number;
          guest_name?: string | null;
          guest_email?: string | null;
          guest_phone?: string | null;
          notes?: string | null;
          surf_level?: string | null;
          group_size?: number | null;
          airport_transfer?: boolean;
          board_rental?: boolean;
          wetsuit_rental?: boolean;
          coworking_interest?: boolean;
          room_preference?: string | null;
          private_coaching?: boolean;
          yoga_interest?: boolean;
          meals_needed?: boolean;
          retreat_name?: string | null;
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
