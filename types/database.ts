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
