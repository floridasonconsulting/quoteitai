/* eslint-disable @typescript-eslint/no-empty-object-type */
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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      company_settings: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string
          id: string
          insurance: string | null
          license: string | null
          logo: string | null
          logo_display_option: string | null
          name: string
          notify_email_accepted: boolean | null
          notify_email_declined: boolean | null
          onboarding_completed: boolean | null
          phone: string | null
          proposal_template: string | null
          proposal_theme: string | null
          state: string | null
          terms: string | null
          updated_at: string | null
          user_id: string
          website: string | null
          zip: string | null
          quickbooks_realm_id: string | null
          quickbooks_access_token: string | null
          quickbooks_refresh_token: string | null
          quickbooks_token_expires_at: string | null
          quickbooks_company_name: string | null
          quickbooks_connected_at: string | null
          stripe_account_id: string | null
          stripe_connected_at: string | null
          stripe_onboarding_complete: boolean | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          id?: string
          insurance?: string | null
          license?: string | null
          logo?: string | null
          logo_display_option?: string | null
          name: string
          notify_email_accepted?: boolean | null
          notify_email_declined?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          proposal_template?: string | null
          proposal_theme?: string | null
          state?: string | null
          terms?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
          zip?: string | null
          quickbooks_realm_id?: string | null
          quickbooks_access_token?: string | null
          quickbooks_refresh_token?: string | null
          quickbooks_token_expires_at?: string | null
          quickbooks_company_name?: string | null
          quickbooks_connected_at?: string | null
          stripe_account_id?: string | null
          stripe_connected_at?: string | null
          stripe_onboarding_complete?: boolean | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          id?: string
          insurance?: string | null
          license?: string | null
          logo?: string | null
          logo_display_option?: string | null
          name?: string
          notify_email_accepted?: boolean | null
          notify_email_declined?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          proposal_template?: string | null
          proposal_theme?: string | null
          state?: string | null
          terms?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
          zip?: string | null
          quickbooks_realm_id?: string | null
          quickbooks_access_token?: string | null
          quickbooks_refresh_token?: string | null
          quickbooks_token_expires_at?: string | null
          quickbooks_company_name?: string | null
          quickbooks_connected_at?: string | null
          stripe_account_id?: string | null
          stripe_connected_at?: string | null
          stripe_onboarding_complete?: boolean | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          contact_first_name: string | null
          contact_last_name: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          state: string | null
          updated_at: string | null
          user_id: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_first_name?: string | null
          contact_last_name?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          user_id: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_first_name?: string | null
          contact_last_name?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
          zip?: string | null
        }
        Relationships: []
      }
      items: {
        Row: {
          base_price: number
          category: string | null
          created_at: string | null
          description: string | null
          enhanced_description: string | null
          final_price: number
          id: string
          image_url: string | null
          markup: number | null
          markup_type: string | null
          min_quantity: number | null
          name: string
          units: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          base_price?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          enhanced_description?: string | null
          final_price?: number
          id?: string
          image_url?: string | null
          markup?: number | null
          markup_type?: string | null
          min_quantity?: number | null
          name: string
          units?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          base_price?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          enhanced_description?: string | null
          final_price?: number
          id?: string
          image_url?: string | null
          markup?: number | null
          markup_type?: string | null
          min_quantity?: number | null
          name?: string
          units?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      proposal_visuals: {
        Row: {
          cover_image: string | null
          created_at: string | null
          gallery: Json | null
          id: string
          logo_url: string | null
          quote_id: string
          section_backgrounds: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string | null
          gallery?: Json | null
          id?: string
          logo_url?: string | null
          quote_id: string
          section_backgrounds?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string | null
          gallery?: Json | null
          id?: string
          logo_url?: string | null
          quote_id?: string
          section_backgrounds?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_visuals_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_name: string
          executive_summary: string | null
          expires_at: string | null
          follow_up_date: string | null
          id: string
          items: Json | null
          notes: string | null
          quote_number: string
          sent_date: string | null
          share_token: string | null
          shared_at: string | null
          show_pricing: boolean | null
          status: string | null
          subtotal: number | null
          tax: number | null
          title: string
          total: number | null
          updated_at: string | null
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          customer_name: string
          executive_summary?: string | null
          expires_at?: string | null
          follow_up_date?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          quote_number: string
          sent_date?: string | null
          share_token?: string | null
          shared_at?: string | null
          show_pricing?: boolean | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          title: string
          total?: number | null
          updated_at?: string | null
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string
          executive_summary?: string | null
          expires_at?: string | null
          follow_up_date?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          quote_number?: string
          sent_date?: string | null
          share_token?: string | null
          shared_at?: string | null
          show_pricing?: boolean | null
          status?: string | null
          subtotal?: number | null
          tax?: number | null
          title?: string
          total?: number | null
          updated_at?: string | null
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_usage: {
        Row: {
          ai_requests_count: number | null
          created_at: string | null
          id: string
          month: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_requests_count?: number | null
          created_at?: string | null
          id?: string
          month: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_requests_count?: number | null
          created_at?: string | null
          id?: string
          month?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { _user_id: string }; Returns: string }
      list_users_with_roles: {
        Args: never
        Returns: {
          created_at: string
          email: string
          role: string
          user_id: string
        }[]
      }
      set_user_role_by_email: {
        Args: { _email: string; _role: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
