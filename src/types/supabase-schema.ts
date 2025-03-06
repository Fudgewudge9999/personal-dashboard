export type Database = {
  public: {
    Tables: {
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          target_date: string | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title: string
          description?: string | null
          target_date?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          target_date?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          location: string | null
          created_at: string
          category_id: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          location?: string | null
          created_at?: string
          category_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          location?: string | null
          created_at?: string
          category_id?: string | null
        }
      }
      habits: {
        Row: {
          id: string
          name: string
          description: string | null
          target_days: number
          current_streak: number
          completed_today: boolean
          start_date: string
          created_at: string
          last_completed_date: string | null
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          target_days: number
          current_streak?: number
          completed_today?: boolean
          start_date: string
          created_at?: string
          last_completed_date?: string | null
          user_id?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          target_days?: number
          current_streak?: number
          completed_today?: boolean
          start_date?: string
          created_at?: string
          last_completed_date?: string | null
          user_id?: string
        }
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string | null
          type: string
          url: string | null
          category_id: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          type: string
          url?: string | null
          category_id?: string | null
          created_at?: string
          user_id?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: string
          url?: string | null
          category_id?: string | null
          created_at?: string
          user_id?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          priority: string | null
          due_date: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string
          priority?: string | null
          due_date?: string | null
          created_at?: string
          user_id?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string | null
          due_date?: string | null
          created_at?: string
          user_id?: string
        }
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
  }
} 