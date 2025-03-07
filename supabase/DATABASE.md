# Database Structure

This document provides an overview of the database structure for the Reflection Nook application.

## Tables

### Goals
- `goals`: Main goals with title, description, target date, and completion status
- `subgoals`: Sub-tasks for goals with position ordering

### Focus & Productivity
- `focus_sessions`: Pomodoro-style focus sessions with duration and notes
- `focus_tasks`: Tasks associated with focus sessions
- `focus_session_tasks`: Junction table linking tasks to sessions

### Tasks & Habits
- `tasks`: General tasks with title, description, status, priority, and due date
- `habits`: Recurring habits with streaks and completion tracking

### Resources & Knowledge
- `categories`: Categories for organizing resources
- `resources`: Various resources like links, files, notes
- `events`: Calendar events with start/end times

## Key Relations
- Goals → Subgoals (one-to-many)
- Categories → Resources (one-to-many)
- Focus Sessions → Focus Tasks (many-to-many via focus_session_tasks)

## Special Functions
- `reorder_subgoals`: Function to handle reordering subgoals while maintaining position integrity

## Row Level Security
All tables have RLS policies to ensure users can only access their own data.

## Development Guidelines

1. **Creating new tables**:
   - Always include `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` 
   - Include `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
   - Include `user_id UUID` for user-specific data
   - Consider adding `updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`

2. **Row Level Security**:
   - Always add RLS policies for new tables
   - Basic template:
     ```sql
     ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
     
     CREATE POLICY "Users can view their own data" ON table_name
       FOR SELECT USING (auth.uid() = user_id);
     
     CREATE POLICY "Users can insert their own data" ON table_name
       FOR INSERT WITH CHECK (auth.uid() = user_id);
     
     CREATE POLICY "Users can update their own data" ON table_name
       FOR UPDATE USING (auth.uid() = user_id);
     
     CREATE POLICY "Users can delete their own data" ON table_name
       FOR DELETE USING (auth.uid() = user_id);
     ```

3. **Indexes**:
   - Add indexes for frequently queried columns
   - Always index foreign keys

4. **Data Types**:
   - Use `TEXT` for strings
   - Use `TIMESTAMP WITH TIME ZONE` for dates/times
   - Use `UUID` for IDs
   - Use `BOOLEAN` for true/false values

## Type Generation

After database changes, update the TypeScript types:

```bash
npx supabase gen types typescript > src/types/supabase-generated.ts
```

Refer to the [Workflow Documentation](./WORKFLOW.md) for more details on the development process. 