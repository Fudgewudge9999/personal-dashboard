/**
 * Simplified interface definitions for Supabase tables.
 * 
 * Note: These are simplified interfaces that may be easier to use in components.
 * For complete type definitions with Insert/Update operations, use the 
 * auto-generated types from src/types/supabase-generated.ts.
 * 
 * Important: Keep these interfaces in sync with the generated types!
 */

// Type definitions for Supabase tables

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface NoteCategory {
  id: string;
  name: string;
  created_at: string;
  user_id: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  category_id: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string | null;
  category_id: string | null;
  note_category_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// The Goal interface has been moved to use the generated types from Supabase
// See src/integrations/supabase/types.ts for the generated types 