export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attribution_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      commission_ledger: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          commission_rate: number
          created_at: string
          event_id: string
          id: string
          paid_at: string | null
          promoter_id: string
          registrations_count: number
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          commission_rate?: number
          created_at?: string
          event_id: string
          id?: string
          paid_at?: string | null
          promoter_id: string
          registrations_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          commission_rate?: number
          created_at?: string
          event_id?: string
          id?: string
          paid_at?: string | null
          promoter_id?: string
          registrations_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_ledger_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_ledger_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      event_table_allocations: {
        Row: {
          created_at: string
          event_id: string
          guest_name: string | null
          id: string
          notes: string | null
          seating_area_id: string
          status: Database["public"]["Enums"]["table_allocation_status"]
          table_config_id: string | null
          table_number: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_name?: string | null
          id?: string
          notes?: string | null
          seating_area_id: string
          status?: Database["public"]["Enums"]["table_allocation_status"]
          table_config_id?: string | null
          table_number?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_name?: string | null
          id?: string
          notes?: string | null
          seating_area_id?: string
          status?: Database["public"]["Enums"]["table_allocation_status"]
          table_config_id?: string | null
          table_number?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_table_allocations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_table_allocations_seating_area_id_fkey"
            columns: ["seating_area_id"]
            isOneToOne: false
            referencedRelation: "seating_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_table_allocations_table_config_id_fkey"
            columns: ["table_config_id"]
            isOneToOne: false
            referencedRelation: "table_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number
          created_at: string
          date: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          status: Database["public"]["Enums"]["event_status"]
          table_allocation_notes: string | null
          time: string
          updated_at: string
          venue: string
          venue_id: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string
          date: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          status?: Database["public"]["Enums"]["event_status"]
          table_allocation_notes?: string | null
          time: string
          updated_at?: string
          venue: string
          venue_id?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          status?: Database["public"]["Enums"]["event_status"]
          table_allocation_notes?: string | null
          time?: string
          updated_at?: string
          venue?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          attended: boolean
          created_at: string
          date_of_birth: string | null
          email: string | null
          event_id: string | null
          full_name: string
          id: string
          nationality: string | null
          promoter_id: string | null
          registration_date: string
          whatsapp_number: string | null
        }
        Insert: {
          attended?: boolean
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          event_id?: string | null
          full_name: string
          id?: string
          nationality?: string | null
          promoter_id?: string | null
          registration_date?: string
          whatsapp_number?: string | null
        }
        Update: {
          attended?: boolean
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          event_id?: string | null
          full_name?: string
          id?: string
          nationality?: string | null
          promoter_id?: string | null
          registration_date?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category: Database["public"]["Enums"]["menu_category"]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_idr: number
          subcategory: string | null
          updated_at: string
          venue_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["menu_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_idr: number
          subcategory?: string | null
          updated_at?: string
          venue_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["menu_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_idr?: number
          subcategory?: string | null
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_by: string | null
          id: string
          message: string
          sent_at: string
          target_type: string
          target_value: string | null
          title: string
        }
        Insert: {
          created_by?: string | null
          id?: string
          message: string
          sent_at?: string
          target_type?: string
          target_value?: string | null
          title: string
        }
        Update: {
          created_by?: string | null
          id?: string
          message?: string
          sent_at?: string
          target_type?: string
          target_value?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promoter_event_qr: {
        Row: {
          created_at: string
          event_id: string
          id: string
          promoter_id: string
          qr_code_identifier: string
          registrations_count: number
          scans_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          promoter_id: string
          qr_code_identifier: string
          registrations_count?: number
          scans_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          promoter_id?: string
          qr_code_identifier?: string
          registrations_count?: number
          scans_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promoter_event_qr_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promoter_event_qr_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      promoters: {
        Row: {
          commission_percentage: number
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          payout_details: Json | null
          phone: string | null
          qr_code_identifier: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          commission_percentage?: number
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          payout_details?: Json | null
          phone?: string | null
          qr_code_identifier: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          commission_percentage?: number
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          payout_details?: Json | null
          phone?: string | null
          qr_code_identifier?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      qr_scans: {
        Row: {
          event_id: string | null
          id: string
          promoter_id: string
          scanned_at: string
        }
        Insert: {
          event_id?: string | null
          id?: string
          promoter_id: string
          scanned_at?: string
        }
        Update: {
          event_id?: string | null
          id?: string
          promoter_id?: string
          scanned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_scans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_scans_promoter_id_fkey"
            columns: ["promoter_id"]
            isOneToOne: false
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
        ]
      }
      seating_areas: {
        Row: {
          capacity: number
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
          venue_id: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          venue_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seating_areas_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      table_configurations: {
        Row: {
          count: number
          created_at: string
          id: string
          min_spend: number | null
          notes: string | null
          seating_area_id: string
          table_type: Database["public"]["Enums"]["table_type"]
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          min_spend?: number | null
          notes?: string | null
          seating_area_id: string
          table_type: Database["public"]["Enums"]["table_type"]
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          min_spend?: number | null
          notes?: string | null
          seating_area_id?: string
          table_type?: Database["public"]["Enums"]["table_type"]
        }
        Relationships: [
          {
            foreignKeyName: "table_configurations_seating_area_id_fkey"
            columns: ["seating_area_id"]
            isOneToOne: false
            referencedRelation: "seating_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venue_files: {
        Row: {
          file_name: string | null
          file_type: Database["public"]["Enums"]["venue_file_type"]
          file_url: string
          id: string
          uploaded_at: string
          venue_id: string
        }
        Insert: {
          file_name?: string | null
          file_type: Database["public"]["Enums"]["venue_file_type"]
          file_url: string
          id?: string
          uploaded_at?: string
          venue_id: string
        }
        Update: {
          file_name?: string | null
          file_type?: Database["public"]["Enums"]["venue_file_type"]
          file_url?: string
          id?: string
          uploaded_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_files_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          contact_person: string | null
          contact_whatsapp: string | null
          created_at: string
          google_maps_link: string | null
          id: string
          is_archived: boolean
          name: string
          notes: string | null
          total_capacity: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          google_maps_link?: string | null
          id?: string
          is_archived?: boolean
          name: string
          notes?: string | null
          total_capacity?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          google_maps_link?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          notes?: string | null
          total_capacity?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_promoter_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_promoter: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "promoter"
      event_status: "upcoming" | "live" | "past"
      menu_category: "food" | "drink"
      table_allocation_status: "available" | "reserved" | "held" | "confirmed"
      table_type: "booth" | "high_table" | "standard" | "standing"
      venue_file_type: "drinks_menu" | "food_menu" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "promoter"],
      event_status: ["upcoming", "live", "past"],
      menu_category: ["food", "drink"],
      table_allocation_status: ["available", "reserved", "held", "confirmed"],
      table_type: ["booth", "high_table", "standard", "standing"],
      venue_file_type: ["drinks_menu", "food_menu", "other"],
    },
  },
} as const
