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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achieved_on: string | null
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          is_published: boolean
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          achieved_on?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          achieved_on?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_public: boolean
          published_at: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          published_at?: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          published_at?: string
          title?: string
        }
        Relationships: []
      }
      audit_reports: {
        Row: {
          area: string | null
          audit_year: number | null
          created_at: string
          created_by: string | null
          dam_name: string | null
          document_id: string | null
          findings: string | null
          id: string
          status: string | null
          title: string
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          audit_year?: number | null
          created_at?: string
          created_by?: string | null
          dam_name?: string | null
          document_id?: string | null
          findings?: string | null
          id?: string
          status?: string | null
          title: string
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          audit_year?: number | null
          created_at?: string
          created_by?: string | null
          dam_name?: string | null
          document_id?: string | null
          findings?: string | null
          id?: string
          status?: string | null
          title?: string
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_reports_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          forwarded_to_admin: boolean | null
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          forwarded_to_admin?: boolean | null
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          forwarded_to_admin?: boolean | null
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      dams: {
        Row: {
          capacity: string | null
          created_at: string
          created_by: string | null
          description: string | null
          district: string | null
          id: string
          image_url: string | null
          is_published: boolean
          latest_news: string | null
          name: string
          taluka: string | null
          updated_at: string
          village: string | null
          water_area: string | null
        }
        Insert: {
          capacity?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          district?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          latest_news?: string | null
          name: string
          taluka?: string | null
          updated_at?: string
          village?: string | null
          water_area?: string | null
        }
        Update: {
          capacity?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          district?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          latest_news?: string | null
          name?: string
          taluka?: string | null
          updated_at?: string
          village?: string | null
          water_area?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string
          description: string | null
          file_name: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          member_id: string | null
          owner_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_at: string
          visibility: string
        }
        Insert: {
          category?: string
          description?: string | null
          file_name?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          member_id?: string | null
          owner_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_at?: string
          visibility?: string
        }
        Update: {
          category?: string
          description?: string | null
          file_name?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          member_id?: string | null
          owner_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          aadhaar_last4: string | null
          aadhaar_number: string | null
          address: string | null
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          district: string | null
          dob: string | null
          email: string | null
          eshram_number: string | null
          family_details: Json | null
          father_husband_name: string | null
          father_name: string | null
          full_name: string
          gender: string | null
          id: string
          is_public: boolean
          join_date: string | null
          membership_number: string
          notes: string | null
          occupation: string | null
          pan: string | null
          phone: string | null
          status: string
          surname: string | null
          taluka: string | null
          updated_at: string
          user_id: string | null
          village: string | null
        }
        Insert: {
          aadhaar_last4?: string | null
          aadhaar_number?: string | null
          address?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          district?: string | null
          dob?: string | null
          email?: string | null
          eshram_number?: string | null
          family_details?: Json | null
          father_husband_name?: string | null
          father_name?: string | null
          full_name: string
          gender?: string | null
          id?: string
          is_public?: boolean
          join_date?: string | null
          membership_number: string
          notes?: string | null
          occupation?: string | null
          pan?: string | null
          phone?: string | null
          status?: string
          surname?: string | null
          taluka?: string | null
          updated_at?: string
          user_id?: string | null
          village?: string | null
        }
        Update: {
          aadhaar_last4?: string | null
          aadhaar_number?: string | null
          address?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          district?: string | null
          dob?: string | null
          email?: string | null
          eshram_number?: string | null
          family_details?: Json | null
          father_husband_name?: string | null
          father_name?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_public?: boolean
          join_date?: string | null
          membership_number?: string
          notes?: string | null
          occupation?: string | null
          pan?: string | null
          phone?: string | null
          status?: string
          surname?: string | null
          taluka?: string | null
          updated_at?: string
          user_id?: string | null
          village?: string | null
        }
        Relationships: []
      }
      membership_applications: {
        Row: {
          aadhaar_number: string
          address: string | null
          created_at: string
          district: string | null
          dob: string
          email: string | null
          eshram_number: string | null
          father_husband_name: string | null
          full_name: string
          id: string
          pan: string | null
          phone: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          surname: string | null
          taluka: string | null
          updated_at: string
          user_id: string | null
          village: string | null
        }
        Insert: {
          aadhaar_number: string
          address?: string | null
          created_at?: string
          district?: string | null
          dob: string
          email?: string | null
          eshram_number?: string | null
          father_husband_name?: string | null
          full_name: string
          id?: string
          pan?: string | null
          phone: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          surname?: string | null
          taluka?: string | null
          updated_at?: string
          user_id?: string | null
          village?: string | null
        }
        Update: {
          aadhaar_number?: string
          address?: string | null
          created_at?: string
          district?: string | null
          dob?: string
          email?: string | null
          eshram_number?: string | null
          father_husband_name?: string | null
          full_name?: string
          id?: string
          pan?: string | null
          phone?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          surname?: string | null
          taluka?: string | null
          updated_at?: string
          user_id?: string | null
          village?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          category: string
          created_at: string
          created_by: string | null
          id: string
          is_broadcast: boolean
          link: string | null
          read_at: string | null
          recipient_id: string | null
          title: string
        }
        Insert: {
          body?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_broadcast?: boolean
          link?: string | null
          read_at?: string | null
          recipient_id?: string | null
          title: string
        }
        Update: {
          body?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_broadcast?: boolean
          link?: string | null
          read_at?: string | null
          recipient_id?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          district: string | null
          email: string | null
          full_name: string | null
          id: string
          membership_number: string | null
          phone: string | null
          preferred_language: string | null
          taluka: string | null
          updated_at: string
          village: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          membership_number?: string | null
          phone?: string | null
          preferred_language?: string | null
          taluka?: string | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          membership_number?: string | null
          phone?: string | null
          preferred_language?: string | null
          taluka?: string | null
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      promo_images: {
        Row: {
          caption: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      schemes: {
        Row: {
          body: string | null
          category: string | null
          created_at: string
          created_by: string | null
          external_url: string | null
          id: string
          image_url: string | null
          is_published: boolean
          sort_order: number
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          sort_order?: number
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          sort_order?: number
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          body: string | null
          image_url: string | null
          key: string
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string | null
          image_url?: string | null
          key: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string | null
          image_url?: string | null
          key?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
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
    }
    Views: {
      members_public: {
        Row: {
          district: string | null
          full_name: string | null
          id: string | null
          join_date: string | null
          membership_number: string | null
          surname: string | null
          taluka: string | null
          village: string | null
        }
        Insert: {
          district?: string | null
          full_name?: string | null
          id?: string | null
          join_date?: string | null
          membership_number?: string | null
          surname?: string | null
          taluka?: string | null
          village?: string | null
        }
        Update: {
          district?: string | null
          full_name?: string | null
          id?: string | null
          join_date?: string | null
          membership_number?: string | null
          surname?: string | null
          taluka?: string | null
          village?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "member"
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
      app_role: ["super_admin", "admin", "member"],
    },
  },
} as const
