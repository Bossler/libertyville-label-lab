export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      analysis_reports: {
        Row: {
          chatgpt_prompt: string
          company_id: string | null
          created_at: string | null
          id: string
          key_insights: string | null
          report_date: string | null
          report_type: string | null
        }
        Insert: {
          chatgpt_prompt: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          key_insights?: string | null
          report_date?: string | null
          report_type?: string | null
        }
        Update: {
          chatgpt_prompt?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          key_insights?: string | null
          report_date?: string | null
          report_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          homepage: string
          id: string
          name: string
          social_media: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          homepage: string
          id?: string
          name: string
          social_media?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          homepage?: string
          id?: string
          name?: string
          social_media?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ratio_coffee_recipes: {
        Row: {
          created_at: string
          id: string
          ingredient_1_name: string | null
          ingredient_1_percentage: number | null
          ingredient_2_name: string | null
          ingredient_2_percentage: number | null
          ingredient_3_name: string | null
          ingredient_3_percentage: number | null
          ingredient_4_name: string | null
          ingredient_4_percentage: number | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_1_name?: string | null
          ingredient_1_percentage?: number | null
          ingredient_2_name?: string | null
          ingredient_2_percentage?: number | null
          ingredient_3_name?: string | null
          ingredient_3_percentage?: number | null
          ingredient_4_name?: string | null
          ingredient_4_percentage?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_1_name?: string | null
          ingredient_1_percentage?: number | null
          ingredient_2_name?: string | null
          ingredient_2_percentage?: number | null
          ingredient_3_name?: string | null
          ingredient_3_percentage?: number | null
          ingredient_4_name?: string | null
          ingredient_4_percentage?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      scan_results: {
        Row: {
          company_id: string | null
          content: string | null
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          scan_date: string | null
          source_type: string
          source_url: string
          success: boolean | null
          title: string | null
        }
        Insert: {
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          scan_date?: string | null
          source_type: string
          source_url: string
          success?: boolean | null
          title?: string | null
        }
        Update: {
          company_id?: string | null
          content?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          scan_date?: string | null
          source_type?: string
          source_url?: string
          success?: boolean | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_results_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
