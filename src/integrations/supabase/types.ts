export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          start_time: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          start_time: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          start_time?: string
          title?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          id: string
          title: string
          description: string | null
          target_date: string | null
          completed: boolean
          created_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          target_date?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          target_date?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subgoals: {
        Row: {
          id: string
          title: string
          completed: boolean
          created_at: string
          updated_at: string
          goal_id: string
        }
        Insert: {
          id?: string
          title: string
          completed?: boolean
          created_at?: string
          updated_at?: string
          goal_id: string
        }
        Update: {
          id?: string
          title?: string
          completed?: boolean
          created_at?: string
          updated_at?: string
          goal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subgoals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          }
        ]
      }
      habits: {
        Row: {
          completed_today: boolean
          created_at: string
          current_streak: number
          description: string | null
          id: string
          name: string
          start_date: string
          target_days: number
        }
        Insert: {
          completed_today?: boolean
          created_at?: string
          current_streak?: number
          description?: string | null
          id?: string
          name: string
          start_date: string
          target_days: number
        }
        Update: {
          completed_today?: boolean
          created_at?: string
          current_streak?: number
          description?: string | null
          id?: string
          name?: string
          start_date?: string
          target_days?: number
        }
        Relationships: []
      }
      resources: {
        Row: {
          id: string
          title: string
          type: string
          category_id: string
          url: string | null
          description: string | null
          created_at: string
          file_path: string | null
          file_size: number | null
          file_type: string | null
        }
        Insert: {
          id?: string
          title: string
          type: string
          category_id: string
          url?: string | null
          description?: string | null
          created_at?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
        }
        Update: {
          id?: string
          title?: string
          type?: string
          category_id?: string
          url?: string | null
          description?: string | null
          created_at?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      focus_tasks: {
        Row: {
          id: string;
          user_id: string | null;
          text: string;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          text: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          text?: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      }
      focus_sessions: {
        Row: {
          id: string
          user_id: string | null
          duration: number
          actual_duration: number
          completed: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          duration: number
          actual_duration?: number
          completed?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          duration?: number
          actual_duration?: number
          completed?: boolean
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      focus_session_tasks: {
        Row: {
          id: string
          session_id: string
          task_id: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          task_id: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          task_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_session_tasks_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "focus_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_session_tasks_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "focus_tasks"
            referencedColumns: ["id"]
          }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
