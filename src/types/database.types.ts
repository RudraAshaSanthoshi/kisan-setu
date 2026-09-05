export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "FARMER" | "CENTRE_STAFF" | "ADMIN";
export type SlotStatus = "BOOKED" | "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type QueueStatus = "WAITING" | "WEIGHING" | "GRADING" | "COMPLETED" | "SKIPPED";
export type QualityGrade = "GRADE_A" | "FAQ" | "REJECTED";
export type PaymentStatus = "PENDING" | "PROCESSING" | "DISBURSED" | "FAILED";
export type NotifChannel = "IN_APP" | "SMS" | "PUSH";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone_number: string;
          role: UserRole;
          preferred_language: string | null;
          aadhaar_last4: string | null;
          assigned_centre_id: string | null;
          district: string | null;
          state: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone_number: string;
          role?: UserRole;
          preferred_language?: string | null;
          aadhaar_last4?: string | null;
          assigned_centre_id?: string | null;
          district?: string | null;
          state?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone_number?: string;
          role?: UserRole;
          preferred_language?: string | null;
          aadhaar_last4?: string | null;
          assigned_centre_id?: string | null;
          district?: string | null;
          state?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      procurement_centres: {
        Row: {
          id: string;
          centre_code: string;
          name: string;
          district: string;
          state: string;
          address: string;
          latitude: number | null;
          longitude: number | null;
          daily_capacity_quintals: number;
          operating_start_time: string;
          operating_end_time: string;
          hourly_slot_capacity: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          centre_code: string;
          name: string;
          district: string;
          state: string;
          address: string;
          latitude?: number | null;
          longitude?: number | null;
          daily_capacity_quintals?: number;
          operating_start_time?: string;
          operating_end_time?: string;
          hourly_slot_capacity?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          centre_code?: string;
          name?: string;
          district?: string;
          state?: string;
          address?: string;
          latitude?: number | null;
          longitude?: number | null;
          daily_capacity_quintals?: number;
          operating_start_time?: string;
          operating_end_time?: string;
          hourly_slot_capacity?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      crops: {
        Row: {
          id: string;
          crop_code: string;
          name_en: string;
          name_hi: string;
          season: string;
          msp_per_quintal: number;
          max_moisture_percentage: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          crop_code: string;
          name_en: string;
          name_hi: string;
          season: string;
          msp_per_quintal: number;
          max_moisture_percentage?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          crop_code?: string;
          name_en?: string;
          name_hi?: string;
          season?: string;
          msp_per_quintal?: number;
          max_moisture_percentage?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      produce_declarations: {
        Row: {
          id: string;
          farmer_id: string;
          crop_id: string;
          estimated_quantity_quintals: number;
          harvest_date: string;
          village: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          farmer_id: string;
          crop_id: string;
          estimated_quantity_quintals: number;
          harvest_date: string;
          village: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          farmer_id?: string;
          crop_id?: string;
          estimated_quantity_quintals?: number;
          harvest_date?: string;
          village?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      slot_bookings: {
        Row: {
          id: string;
          token_code: string;
          declaration_id: string | null;
          farmer_id: string;
          centre_id: string;
          booking_date: string;
          slot_start_time: string;
          slot_end_time: string;
          estimated_quantity_quintals: number;
          vehicle_type: string;
          vehicle_number: string | null;
          status: SlotStatus;
          qr_code_hash: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          token_code: string;
          declaration_id?: string | null;
          farmer_id: string;
          centre_id: string;
          booking_date: string;
          slot_start_time: string;
          slot_end_time: string;
          estimated_quantity_quintals: number;
          vehicle_type?: string;
          vehicle_number?: string | null;
          status?: SlotStatus;
          qr_code_hash: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          token_code?: string;
          declaration_id?: string | null;
          farmer_id?: string;
          centre_id?: string;
          booking_date?: string;
          slot_start_time?: string;
          slot_end_time?: string;
          estimated_quantity_quintals?: number;
          vehicle_type?: string;
          vehicle_number?: string | null;
          status?: SlotStatus;
          qr_code_hash?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      queue_entries: {
        Row: {
          id: string;
          booking_id: string;
          centre_id: string;
          queue_number: number;
          status: QueueStatus;
          check_in_time: string;
          called_time: string | null;
          completed_time: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          centre_id: string;
          queue_number: number;
          status?: QueueStatus;
          check_in_time?: string;
          called_time?: string | null;
          completed_time?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          centre_id?: string;
          queue_number?: number;
          status?: QueueStatus;
          check_in_time?: string;
          called_time?: string | null;
          completed_time?: string | null;
          created_at?: string;
        };
      };
      procurement_records: {
        Row: {
          id: string;
          queue_entry_id: string | null;
          farmer_id: string;
          centre_id: string;
          crop_id: string;
          gross_weight_kg: number;
          tare_weight_kg: number;
          net_weight_quintals: number;
          moisture_percentage: number;
          grade: QualityGrade;
          rate_per_quintal: number;
          total_payout_amount: number;
          staff_id: string | null;
          remarks: string | null;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          queue_entry_id?: string | null;
          farmer_id: string;
          centre_id: string;
          crop_id: string;
          gross_weight_kg: number;
          tare_weight_kg: number;
          net_weight_quintals: number;
          moisture_percentage: number;
          grade?: QualityGrade;
          rate_per_quintal: number;
          total_payout_amount: number;
          staff_id?: string | null;
          remarks?: string | null;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          queue_entry_id?: string | null;
          farmer_id?: string;
          centre_id?: string;
          crop_id?: string;
          gross_weight_kg?: number;
          tare_weight_kg?: number;
          net_weight_quintals?: number;
          moisture_percentage?: number;
          grade?: QualityGrade;
          rate_per_quintal?: number;
          total_payout_amount?: number;
          staff_id?: string | null;
          remarks?: string | null;
          recorded_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          procurement_record_id: string;
          farmer_id: string;
          amount: number;
          transaction_ref: string | null;
          payment_status: PaymentStatus;
          disbursed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          procurement_record_id: string;
          farmer_id: string;
          amount: number;
          transaction_ref?: string | null;
          payment_status?: PaymentStatus;
          disbursed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          procurement_record_id?: string;
          farmer_id?: string;
          amount?: number;
          transaction_ref?: string | null;
          payment_status?: PaymentStatus;
          disbursed_at?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title_key: string;
          body_key: string;
          params: Json | null;
          channel: NotifChannel;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title_key: string;
          body_key: string;
          params?: Json | null;
          channel?: NotifChannel;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title_key?: string;
          body_key?: string;
          params?: Json | null;
          channel?: NotifChannel;
          is_read?: boolean;
          created_at?: string;
        };
      };
      centre_capacity_logs: {
        Row: {
          id: string;
          centre_id: string;
          log_timestamp: string;
          active_vehicles_count: number;
          hourly_throughput_quintals: number;
          estimated_wait_duration_mins: number;
          congestion_level: string;
        };
        Insert: {
          id?: string;
          centre_id: string;
          log_timestamp?: string;
          active_vehicles_count?: number;
          hourly_throughput_quintals?: number;
          estimated_wait_duration_mins?: number;
          congestion_level?: string;
        };
        Update: {
          id?: string;
          centre_id?: string;
          log_timestamp?: string;
          active_vehicles_count?: number;
          hourly_throughput_quintals?: number;
          estimated_wait_duration_mins?: number;
          congestion_level?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      user_role: UserRole;
      slot_status: SlotStatus;
      queue_status: QueueStatus;
      quality_grade: QualityGrade;
      payment_status: PaymentStatus;
      notif_channel: NotifChannel;
    };
  };
}
