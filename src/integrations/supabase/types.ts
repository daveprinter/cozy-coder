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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          audience: string
          author_id: string | null
          created_at: string
          id: string
          message: string
          property_id: string
          title: string
        }
        Insert: {
          audience?: string
          author_id?: string | null
          created_at?: string
          id?: string
          message: string
          property_id: string
          title: string
        }
        Update: {
          audience?: string
          author_id?: string | null
          created_at?: string
          id?: string
          message?: string
          property_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          details: Json | null
          entity: string | null
          entity_id: string | null
          id: string
          property_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          property_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          code: string | null
          created_at: string
          floors_count: number
          id: string
          name: string
          property_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          floors_count?: number
          id?: string
          name: string
          property_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          floors_count?: number
          id?: string
          name?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          property_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          property_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          created_at: string
          deposit_amount: number
          end_date: string | null
          id: string
          property_id: string
          rent_amount: number
          start_date: string | null
          status: string
          tenant_id: string
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          deposit_amount?: number
          end_date?: string | null
          id?: string
          property_id: string
          rent_amount?: number
          start_date?: string | null
          status?: string
          tenant_id: string
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          deposit_amount?: number
          end_date?: string | null
          id?: string
          property_id?: string
          rent_amount?: number
          start_date?: string | null
          status?: string
          tenant_id?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          assigned_to: string | null
          category: string
          cost: number
          created_at: string
          description: string | null
          id: string
          priority: string
          property_id: string
          reported_by: string | null
          resolved_at: string | null
          status: string
          tenant_id: string | null
          title: string
          unit_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          property_id: string
          reported_by?: string | null
          resolved_at?: string | null
          status?: string
          tenant_id?: string | null
          title: string
          unit_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          property_id?: string
          reported_by?: string | null
          resolved_at?: string | null
          status?: string
          tenant_id?: string | null
          title?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          method: string
          note: string | null
          paid_at: string
          period: string | null
          property_id: string
          receipt_no: string | null
          recorded_by: string | null
          reference: string | null
          status: string
          tenant_id: string
          unit_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          method?: string
          note?: string | null
          paid_at?: string
          period?: string | null
          property_id: string
          receipt_no?: string | null
          recorded_by?: string | null
          reference?: string | null
          status?: string
          tenant_id: string
          unit_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          method?: string
          note?: string | null
          paid_at?: string
          period?: string | null
          property_id?: string
          receipt_no?: string | null
          recorded_by?: string | null
          reference?: string | null
          status?: string
          tenant_id?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "rent_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          course: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_student: boolean
          national_id: string | null
          phone: string | null
          reg_number: string | null
          role: Database["public"]["Enums"]["app_role"]
          university: string | null
          updated_at: string
          year_of_study: string | null
        }
        Insert: {
          course?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          is_student?: boolean
          national_id?: string | null
          phone?: string | null
          reg_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          university?: string | null
          updated_at?: string
          year_of_study?: string | null
        }
        Update: {
          course?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_student?: boolean
          national_id?: string | null
          phone?: string | null
          reg_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          university?: string | null
          updated_at?: string
          year_of_study?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          amenities: string[]
          caretaker_id: string | null
          code: string | null
          county: string | null
          created_at: string
          description: string | null
          id: string
          landlord_id: string
          name: string
          nearby_university: string | null
          property_type: string
          town: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[]
          caretaker_id?: string | null
          code?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          id?: string
          landlord_id: string
          name: string
          nearby_university?: string | null
          property_type?: string
          town?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[]
          caretaker_id?: string | null
          code?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          id?: string
          landlord_id?: string
          name?: string
          nearby_university?: string | null
          property_type?: string
          town?: string | null
        }
        Relationships: []
      }
      rent_invoices: {
        Row: {
          amount: number
          amount_paid: number
          created_at: string
          due_date: string | null
          id: string
          period: string
          property_id: string
          status: string
          tenant_id: string
          unit_id: string | null
        }
        Insert: {
          amount?: number
          amount_paid?: number
          created_at?: string
          due_date?: string | null
          id?: string
          period: string
          property_id: string
          status?: string
          tenant_id: string
          unit_id?: string | null
        }
        Update: {
          amount?: number
          amount_paid?: number
          created_at?: string
          due_date?: string | null
          id?: string
          period?: string
          property_id?: string
          status?: string
          tenant_id?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rent_invoices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rent_invoices_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          course: string | null
          created_at: string
          deposit_amount: number
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          id: string
          is_student: boolean
          move_in_date: string | null
          move_out_date: string | null
          national_id: string | null
          phone: string | null
          property_id: string
          reg_number: string | null
          rent_amount: number
          status: string
          unit_id: string | null
          university: string | null
          user_id: string | null
          year_of_study: string | null
        }
        Insert: {
          course?: string | null
          created_at?: string
          deposit_amount?: number
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          id?: string
          is_student?: boolean
          move_in_date?: string | null
          move_out_date?: string | null
          national_id?: string | null
          phone?: string | null
          property_id: string
          reg_number?: string | null
          rent_amount?: number
          status?: string
          unit_id?: string | null
          university?: string | null
          user_id?: string | null
          year_of_study?: string | null
        }
        Update: {
          course?: string | null
          created_at?: string
          deposit_amount?: number
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          id?: string
          is_student?: boolean
          move_in_date?: string | null
          move_out_date?: string | null
          national_id?: string | null
          phone?: string | null
          property_id?: string
          reg_number?: string | null
          rent_amount?: number
          status?: string
          unit_id?: string | null
          university?: string | null
          user_id?: string | null
          year_of_study?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          building_id: string | null
          created_at: string
          deposit_amount: number
          electricity_meter_no: string | null
          floor: string | null
          furnished: boolean
          id: string
          max_occupants: number
          notes: string | null
          property_id: string
          rent_amount: number
          status: string
          unit_number: string
          unit_type: string
          water_meter_no: string | null
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          deposit_amount?: number
          electricity_meter_no?: string | null
          floor?: string | null
          furnished?: boolean
          id?: string
          max_occupants?: number
          notes?: string | null
          property_id: string
          rent_amount?: number
          status?: string
          unit_number: string
          unit_type?: string
          water_meter_no?: string | null
        }
        Update: {
          building_id?: string | null
          created_at?: string
          deposit_amount?: number
          electricity_meter_no?: string | null
          floor?: string | null
          furnished?: boolean
          id?: string
          max_occupants?: number
          notes?: string | null
          property_id?: string
          rent_amount?: number
          status?: string
          unit_number?: string
          unit_type?: string
          water_meter_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "landlord" | "caretaker" | "tenant"
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
      app_role: ["admin", "landlord", "caretaker", "tenant"],
    },
  },
} as const
