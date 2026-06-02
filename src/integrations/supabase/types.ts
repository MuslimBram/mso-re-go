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
      favorites: {
        Row: {
          created_at: string
          heading: number | null
          id: string
          lat: number
          lng: number
          name: string
          pano_id: string | null
          pitch: number | null
          thumbnail_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          heading?: number | null
          id?: string
          lat: number
          lng: number
          name: string
          pano_id?: string | null
          pitch?: number | null
          thumbnail_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          name?: string
          pano_id?: string | null
          pitch?: number | null
          thumbnail_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      history: {
        Row: {
          id: string
          lat: number
          lng: number
          name: string | null
          pano_id: string | null
          user_id: string
          visited_at: string
        }
        Insert: {
          id?: string
          lat: number
          lng: number
          name?: string | null
          pano_id?: string | null
          user_id: string
          visited_at?: string
        }
        Update: {
          id?: string
          lat?: number
          lng?: number
          name?: string | null
          pano_id?: string | null
          user_id?: string
          visited_at?: string
        }
        Relationships: []
      }
      place_suggestions: {
        Row: {
          comment: string | null
          contact: string | null
          created_at: string
          id: string
          image_url: string | null
          lat: number | null
          link_url: string | null
          lng: number | null
          name: string | null
          place_query: string
        }
        Insert: {
          comment?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          lat?: number | null
          link_url?: string | null
          lng?: number | null
          name?: string | null
          place_query: string
        }
        Update: {
          comment?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          lat?: number | null
          link_url?: string | null
          lng?: number | null
          name?: string | null
          place_query?: string
        }
        Relationships: []
      }
      showcase_products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          featured: boolean
          id: string
          model_url: string | null
          published: boolean
          sketchfab_url: string | null
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          model_url?: string | null
          published?: boolean
          sketchfab_url?: string | null
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          model_url?: string | null
          published?: boolean
          sketchfab_url?: string | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tour_hotspots: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link_url: string | null
          media_url: string | null
          pitch: number
          scene_id: string
          target_scene_id: string | null
          title: string | null
          type: string
          yaw: number
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link_url?: string | null
          media_url?: string | null
          pitch?: number
          scene_id: string
          target_scene_id?: string | null
          title?: string | null
          type?: string
          yaw?: number
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link_url?: string | null
          media_url?: string | null
          pitch?: number
          scene_id?: string
          target_scene_id?: string | null
          title?: string | null
          type?: string
          yaw?: number
        }
        Relationships: [
          {
            foreignKeyName: "tour_hotspots_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "tour_scenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_hotspots_target_scene_id_fkey"
            columns: ["target_scene_id"]
            isOneToOne: false
            referencedRelation: "tour_scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          order_index: number
          tour_id: string
          type: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          order_index?: number
          tour_id: string
          type?: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          order_index?: number
          tour_id?: string
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_media_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_scenes: {
        Row: {
          created_at: string
          id: string
          initial_fov: number
          initial_pitch: number
          initial_yaw: number
          name: string
          order_index: number
          panorama_url: string | null
          source: string
          street_view_lat: number | null
          street_view_lng: number | null
          street_view_pano_id: string | null
          tour_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          initial_fov?: number
          initial_pitch?: number
          initial_yaw?: number
          name: string
          order_index?: number
          panorama_url?: string | null
          source?: string
          street_view_lat?: number | null
          street_view_lng?: number | null
          street_view_pano_id?: string | null
          tour_id: string
        }
        Update: {
          created_at?: string
          id?: string
          initial_fov?: number
          initial_pitch?: number
          initial_yaw?: number
          name?: string
          order_index?: number
          panorama_url?: string | null
          source?: string
          street_view_lat?: number | null
          street_view_lng?: number | null
          street_view_pano_id?: string | null
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_scenes_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          featured: boolean
          id: string
          lat: number | null
          lng: number | null
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          featured?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          featured?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
