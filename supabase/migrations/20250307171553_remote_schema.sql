create table "public"."categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "created_at" timestamp with time zone default now()
);
create table "public"."events" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "start_time" timestamp with time zone not null,
    "end_time" timestamp with time zone not null,
    "location" text,
    "created_at" timestamp with time zone default now(),
    "category" text not null default 'work'::text
);
create table "public"."focus_session_tasks" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" uuid,
    "task_id" uuid,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);
alter table "public"."focus_session_tasks" enable row level security;
create table "public"."focus_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "date" timestamp with time zone not null default timezone('utc'::text, now()),
    "duration" integer not null,
    "completed" boolean default false,
    "notes" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "actual_duration" integer default 0
);
alter table "public"."focus_sessions" enable row level security;
create table "public"."focus_tasks" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "text" text not null,
    "completed" boolean default false,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);
alter table "public"."focus_tasks" enable row level security;
create table "public"."goals" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "title" text not null,
    "description" text,
    "target_date" date,
    "completed" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);
create table "public"."habits" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "start_date" timestamp with time zone not null,
    "target_days" integer not null,
    "current_streak" integer default 0,
    "completed_today" boolean default false,
    "created_at" timestamp with time zone default now(),
    "last_completed_date" date
);
create table "public"."resources" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "type" text not null,
    "category_id" uuid,
    "url" text,
    "description" text,
    "created_at" timestamp with time zone default now(),
    "file_path" text,
    "file_size" bigint,
    "file_type" text
);
create table "public"."subgoals" (
    "id" uuid not null default uuid_generate_v4(),
    "title" text not null,
    "completed" boolean not null default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "goal_id" uuid not null,
    "position" integer not null default 0
);
alter table "public"."subgoals" enable row level security;
create table "public"."tasks" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "due_date" timestamp with time zone,
    "priority" text,
    "status" text not null,
    "created_at" timestamp with time zone default now(),
    "user_id" uuid
);
alter table "public"."tasks" enable row level security;
CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);
CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);
CREATE UNIQUE INDEX focus_session_tasks_pkey ON public.focus_session_tasks USING btree (id);
CREATE UNIQUE INDEX focus_session_tasks_session_id_task_id_key ON public.focus_session_tasks USING btree (session_id, task_id);
CREATE UNIQUE INDEX focus_sessions_pkey ON public.focus_sessions USING btree (id);
CREATE UNIQUE INDEX focus_tasks_pkey ON public.focus_tasks USING btree (id);
CREATE UNIQUE INDEX goals_pkey ON public.goals USING btree (id);
CREATE INDEX goals_user_id_idx ON public.goals USING btree (user_id);
CREATE UNIQUE INDEX habits_pkey ON public.habits USING btree (id);
CREATE INDEX idx_tasks_user_id ON public.tasks USING btree (user_id);
CREATE INDEX resources_category_id_idx ON public.resources USING btree (category_id);
CREATE UNIQUE INDEX resources_pkey ON public.resources USING btree (id);
CREATE INDEX subgoals_goal_id_idx ON public.subgoals USING btree (goal_id);
CREATE UNIQUE INDEX subgoals_pkey ON public.subgoals USING btree (id);
CREATE INDEX subgoals_position_idx ON public.subgoals USING btree ("position");
CREATE INDEX tasks_due_date_idx ON public.tasks USING btree (due_date);
CREATE UNIQUE INDEX tasks_pkey ON public.tasks USING btree (id);
CREATE INDEX tasks_user_id_idx ON public.tasks USING btree (user_id);
alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";
alter table "public"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";
alter table "public"."focus_session_tasks" add constraint "focus_session_tasks_pkey" PRIMARY KEY using index "focus_session_tasks_pkey";
alter table "public"."focus_sessions" add constraint "focus_sessions_pkey" PRIMARY KEY using index "focus_sessions_pkey";
alter table "public"."focus_tasks" add constraint "focus_tasks_pkey" PRIMARY KEY using index "focus_tasks_pkey";
alter table "public"."goals" add constraint "goals_pkey" PRIMARY KEY using index "goals_pkey";
alter table "public"."habits" add constraint "habits_pkey" PRIMARY KEY using index "habits_pkey";
alter table "public"."resources" add constraint "resources_pkey" PRIMARY KEY using index "resources_pkey";
alter table "public"."subgoals" add constraint "subgoals_pkey" PRIMARY KEY using index "subgoals_pkey";
alter table "public"."tasks" add constraint "tasks_pkey" PRIMARY KEY using index "tasks_pkey";
alter table "public"."events" add constraint "events_category_check" CHECK ((category = ANY (ARRAY['tutoring'::text, 'work'::text, 'personal'::text]))) not valid;
alter table "public"."events" validate constraint "events_category_check";
alter table "public"."focus_session_tasks" add constraint "focus_session_tasks_session_id_fkey" FOREIGN KEY (session_id) REFERENCES focus_sessions(id) ON DELETE CASCADE not valid;
alter table "public"."focus_session_tasks" validate constraint "focus_session_tasks_session_id_fkey";
alter table "public"."focus_session_tasks" add constraint "focus_session_tasks_session_id_task_id_key" UNIQUE using index "focus_session_tasks_session_id_task_id_key";
alter table "public"."focus_session_tasks" add constraint "focus_session_tasks_task_id_fkey" FOREIGN KEY (task_id) REFERENCES focus_tasks(id) ON DELETE CASCADE not valid;
alter table "public"."focus_session_tasks" validate constraint "focus_session_tasks_task_id_fkey";
alter table "public"."focus_sessions" add constraint "focus_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;
alter table "public"."focus_sessions" validate constraint "focus_sessions_user_id_fkey";
alter table "public"."focus_tasks" add constraint "focus_tasks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;
alter table "public"."focus_tasks" validate constraint "focus_tasks_user_id_fkey";
alter table "public"."goals" add constraint "goals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."goals" validate constraint "goals_user_id_fkey";
alter table "public"."resources" add constraint "resources_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) not valid;
alter table "public"."resources" validate constraint "resources_category_id_fkey";
alter table "public"."subgoals" add constraint "subgoals_goal_id_fkey" FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE not valid;
alter table "public"."subgoals" validate constraint "subgoals_goal_id_fkey";
alter table "public"."tasks" add constraint "tasks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."tasks" validate constraint "tasks_user_id_fkey";
set check_function_bodies = off;

-- Define the type first
create type "public"."subgoal_position_update" as ("id" uuid, "position" integer);

-- Then create the function that uses it
CREATE OR REPLACE FUNCTION public.reorder_subgoals(goal_id_param uuid, subgoal_positions subgoal_position_update[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Verify that the goal exists and belongs to the user
    IF NOT EXISTS (
        SELECT 1 
        FROM goals g
        JOIN subgoals s ON s.goal_id = g.id
        WHERE g.id = goal_id_param 
        AND (g.user_id = auth.uid() OR g.user_id IS NULL)
        LIMIT 1
    ) THEN
        RAISE EXCEPTION 'Access denied or invalid goal ID';
    END IF;

    -- Update positions in a single transaction
    UPDATE subgoals
    SET 
        position = sp.position,
        updated_at = NOW()
    FROM unnest(subgoal_positions) AS sp(id, position)
    WHERE subgoals.id = sp.id
    AND subgoals.goal_id = goal_id_param;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;
grant delete on table "public"."categories" to "anon";
grant insert on table "public"."categories" to "anon";
grant references on table "public"."categories" to "anon";
grant select on table "public"."categories" to "anon";
grant trigger on table "public"."categories" to "anon";
grant truncate on table "public"."categories" to "anon";
grant update on table "public"."categories" to "anon";
grant delete on table "public"."categories" to "authenticated";
grant insert on table "public"."categories" to "authenticated";
grant references on table "public"."categories" to "authenticated";
grant select on table "public"."categories" to "authenticated";
grant trigger on table "public"."categories" to "authenticated";
grant truncate on table "public"."categories" to "authenticated";
grant update on table "public"."categories" to "authenticated";
grant delete on table "public"."categories" to "service_role";
grant insert on table "public"."categories" to "service_role";
grant references on table "public"."categories" to "service_role";
grant select on table "public"."categories" to "service_role";
grant trigger on table "public"."categories" to "service_role";
grant truncate on table "public"."categories" to "service_role";
grant update on table "public"."categories" to "service_role";
grant delete on table "public"."events" to "anon";
grant insert on table "public"."events" to "anon";
grant references on table "public"."events" to "anon";
grant select on table "public"."events" to "anon";
grant trigger on table "public"."events" to "anon";
grant truncate on table "public"."events" to "anon";
grant update on table "public"."events" to "anon";
grant delete on table "public"."events" to "authenticated";
grant insert on table "public"."events" to "authenticated";
grant references on table "public"."events" to "authenticated";
grant select on table "public"."events" to "authenticated";
grant trigger on table "public"."events" to "authenticated";
grant truncate on table "public"."events" to "authenticated";
grant update on table "public"."events" to "authenticated";
grant delete on table "public"."events" to "service_role";
grant insert on table "public"."events" to "service_role";
grant references on table "public"."events" to "service_role";
grant select on table "public"."events" to "service_role";
grant trigger on table "public"."events" to "service_role";
grant truncate on table "public"."events" to "service_role";
grant update on table "public"."events" to "service_role";
grant delete on table "public"."focus_session_tasks" to "anon";
grant insert on table "public"."focus_session_tasks" to "anon";
grant references on table "public"."focus_session_tasks" to "anon";
grant select on table "public"."focus_session_tasks" to "anon";
grant trigger on table "public"."focus_session_tasks" to "anon";
grant truncate on table "public"."focus_session_tasks" to "anon";
grant update on table "public"."focus_session_tasks" to "anon";
grant delete on table "public"."focus_session_tasks" to "authenticated";
grant insert on table "public"."focus_session_tasks" to "authenticated";
grant references on table "public"."focus_session_tasks" to "authenticated";
grant select on table "public"."focus_session_tasks" to "authenticated";
grant trigger on table "public"."focus_session_tasks" to "authenticated";
grant truncate on table "public"."focus_session_tasks" to "authenticated";
grant update on table "public"."focus_session_tasks" to "authenticated";
grant delete on table "public"."focus_session_tasks" to "service_role";
grant insert on table "public"."focus_session_tasks" to "service_role";
grant references on table "public"."focus_session_tasks" to "service_role";
grant select on table "public"."focus_session_tasks" to "service_role";
grant trigger on table "public"."focus_session_tasks" to "service_role";
grant truncate on table "public"."focus_session_tasks" to "service_role";
grant update on table "public"."focus_session_tasks" to "service_role";
grant delete on table "public"."focus_sessions" to "anon";
grant insert on table "public"."focus_sessions" to "anon";
grant references on table "public"."focus_sessions" to "anon";
grant select on table "public"."focus_sessions" to "anon";
grant trigger on table "public"."focus_sessions" to "anon";
grant truncate on table "public"."focus_sessions" to "anon";
grant update on table "public"."focus_sessions" to "anon";
grant delete on table "public"."focus_sessions" to "authenticated";
grant insert on table "public"."focus_sessions" to "authenticated";
grant references on table "public"."focus_sessions" to "authenticated";
grant select on table "public"."focus_sessions" to "authenticated";
grant trigger on table "public"."focus_sessions" to "authenticated";
grant truncate on table "public"."focus_sessions" to "authenticated";
grant update on table "public"."focus_sessions" to "authenticated";
grant delete on table "public"."focus_sessions" to "service_role";
grant insert on table "public"."focus_sessions" to "service_role";
grant references on table "public"."focus_sessions" to "service_role";
grant select on table "public"."focus_sessions" to "service_role";
grant trigger on table "public"."focus_sessions" to "service_role";
grant truncate on table "public"."focus_sessions" to "service_role";
grant update on table "public"."focus_sessions" to "service_role";
grant delete on table "public"."focus_tasks" to "anon";
grant insert on table "public"."focus_tasks" to "anon";
grant references on table "public"."focus_tasks" to "anon";
grant select on table "public"."focus_tasks" to "anon";
grant trigger on table "public"."focus_tasks" to "anon";
grant truncate on table "public"."focus_tasks" to "anon";
grant update on table "public"."focus_tasks" to "anon";
grant delete on table "public"."focus_tasks" to "authenticated";
grant insert on table "public"."focus_tasks" to "authenticated";
grant references on table "public"."focus_tasks" to "authenticated";
grant select on table "public"."focus_tasks" to "authenticated";
grant trigger on table "public"."focus_tasks" to "authenticated";
grant truncate on table "public"."focus_tasks" to "authenticated";
grant update on table "public"."focus_tasks" to "authenticated";
grant delete on table "public"."focus_tasks" to "service_role";
grant insert on table "public"."focus_tasks" to "service_role";
grant references on table "public"."focus_tasks" to "service_role";
grant select on table "public"."focus_tasks" to "service_role";
grant trigger on table "public"."focus_tasks" to "service_role";
grant truncate on table "public"."focus_tasks" to "service_role";
grant update on table "public"."focus_tasks" to "service_role";
grant delete on table "public"."goals" to "anon";
grant insert on table "public"."goals" to "anon";
grant references on table "public"."goals" to "anon";
grant select on table "public"."goals" to "anon";
grant trigger on table "public"."goals" to "anon";
grant truncate on table "public"."goals" to "anon";
grant update on table "public"."goals" to "anon";
grant delete on table "public"."goals" to "authenticated";
grant insert on table "public"."goals" to "authenticated";
grant references on table "public"."goals" to "authenticated";
grant select on table "public"."goals" to "authenticated";
grant trigger on table "public"."goals" to "authenticated";
grant truncate on table "public"."goals" to "authenticated";
grant update on table "public"."goals" to "authenticated";
grant delete on table "public"."goals" to "service_role";
grant insert on table "public"."goals" to "service_role";
grant references on table "public"."goals" to "service_role";
grant select on table "public"."goals" to "service_role";
grant trigger on table "public"."goals" to "service_role";
grant truncate on table "public"."goals" to "service_role";
grant update on table "public"."goals" to "service_role";
grant delete on table "public"."habits" to "anon";
grant insert on table "public"."habits" to "anon";
grant references on table "public"."habits" to "anon";
grant select on table "public"."habits" to "anon";
grant trigger on table "public"."habits" to "anon";
grant truncate on table "public"."habits" to "anon";
grant update on table "public"."habits" to "anon";
grant delete on table "public"."habits" to "authenticated";
grant insert on table "public"."habits" to "authenticated";
grant references on table "public"."habits" to "authenticated";
grant select on table "public"."habits" to "authenticated";
grant trigger on table "public"."habits" to "authenticated";
grant truncate on table "public"."habits" to "authenticated";
grant update on table "public"."habits" to "authenticated";
grant delete on table "public"."habits" to "service_role";
grant insert on table "public"."habits" to "service_role";
grant references on table "public"."habits" to "service_role";
grant select on table "public"."habits" to "service_role";
grant trigger on table "public"."habits" to "service_role";
grant truncate on table "public"."habits" to "service_role";
grant update on table "public"."habits" to "service_role";
grant delete on table "public"."resources" to "anon";
grant insert on table "public"."resources" to "anon";
grant references on table "public"."resources" to "anon";
grant select on table "public"."resources" to "anon";
grant trigger on table "public"."resources" to "anon";
grant truncate on table "public"."resources" to "anon";
grant update on table "public"."resources" to "anon";
grant delete on table "public"."resources" to "authenticated";
grant insert on table "public"."resources" to "authenticated";
grant references on table "public"."resources" to "authenticated";
grant select on table "public"."resources" to "authenticated";
grant trigger on table "public"."resources" to "authenticated";
grant truncate on table "public"."resources" to "authenticated";
grant update on table "public"."resources" to "authenticated";
grant delete on table "public"."resources" to "service_role";
grant insert on table "public"."resources" to "service_role";
grant references on table "public"."resources" to "service_role";
grant select on table "public"."resources" to "service_role";
grant trigger on table "public"."resources" to "service_role";
grant truncate on table "public"."resources" to "service_role";
grant update on table "public"."resources" to "service_role";
grant delete on table "public"."subgoals" to "anon";
grant insert on table "public"."subgoals" to "anon";
grant references on table "public"."subgoals" to "anon";
grant select on table "public"."subgoals" to "anon";
grant trigger on table "public"."subgoals" to "anon";
grant truncate on table "public"."subgoals" to "anon";
grant update on table "public"."subgoals" to "anon";
grant delete on table "public"."subgoals" to "authenticated";
grant insert on table "public"."subgoals" to "authenticated";
grant references on table "public"."subgoals" to "authenticated";
grant select on table "public"."subgoals" to "authenticated";
grant trigger on table "public"."subgoals" to "authenticated";
grant truncate on table "public"."subgoals" to "authenticated";
grant update on table "public"."subgoals" to "authenticated";
grant delete on table "public"."subgoals" to "service_role";
grant insert on table "public"."subgoals" to "service_role";
grant references on table "public"."subgoals" to "service_role";
grant select on table "public"."subgoals" to "service_role";
grant trigger on table "public"."subgoals" to "service_role";
grant truncate on table "public"."subgoals" to "service_role";
grant update on table "public"."subgoals" to "service_role";
grant delete on table "public"."tasks" to "anon";
grant insert on table "public"."tasks" to "anon";
grant references on table "public"."tasks" to "anon";
grant select on table "public"."tasks" to "anon";
grant trigger on table "public"."tasks" to "anon";
grant truncate on table "public"."tasks" to "anon";
grant update on table "public"."tasks" to "anon";
grant delete on table "public"."tasks" to "authenticated";
grant insert on table "public"."tasks" to "authenticated";
grant references on table "public"."tasks" to "authenticated";
grant select on table "public"."tasks" to "authenticated";
grant trigger on table "public"."tasks" to "authenticated";
grant truncate on table "public"."tasks" to "authenticated";
grant update on table "public"."tasks" to "authenticated";
grant delete on table "public"."tasks" to "service_role";
grant insert on table "public"."tasks" to "service_role";
grant references on table "public"."tasks" to "service_role";
grant select on table "public"."tasks" to "service_role";
grant trigger on table "public"."tasks" to "service_role";
grant truncate on table "public"."tasks" to "service_role";
grant update on table "public"."tasks" to "service_role";
create policy "Allow public delete access"
on "public"."focus_session_tasks"
as permissive
for delete
to public
using (true);
create policy "Allow public insert access"
on "public"."focus_session_tasks"
as permissive
for insert
to public
with check (true);
create policy "Allow public view access"
on "public"."focus_session_tasks"
as permissive
for select
to public
using (true);
create policy "Allow public delete access"
on "public"."focus_sessions"
as permissive
for delete
to public
using (true);
create policy "Allow public insert access"
on "public"."focus_sessions"
as permissive
for insert
to public
with check (true);
create policy "Allow public update access"
on "public"."focus_sessions"
as permissive
for update
to public
using (true);
create policy "Allow public view access"
on "public"."focus_sessions"
as permissive
for select
to public
using (true);
create policy "Allow public delete access"
on "public"."focus_tasks"
as permissive
for delete
to public
using (true);
create policy "Allow public insert access"
on "public"."focus_tasks"
as permissive
for insert
to public
with check (true);
create policy "Allow public update access"
on "public"."focus_tasks"
as permissive
for update
to public
using (true);
create policy "Allow public view access"
on "public"."focus_tasks"
as permissive
for select
to public
using (true);
create policy "Users can delete their own goals"
on "public"."goals"
as permissive
for delete
to public
using ((auth.uid() = user_id));
create policy "Users can insert their own goals"
on "public"."goals"
as permissive
for insert
to public
with check ((auth.uid() = user_id));
create policy "Users can update their own goals"
on "public"."goals"
as permissive
for update
to public
using ((auth.uid() = user_id));
create policy "Users can view their own goals"
on "public"."goals"
as permissive
for select
to public
using ((auth.uid() = user_id));
create policy "Enable access to subgoals"
on "public"."subgoals"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM goals g
  WHERE (g.id = subgoals.goal_id))))
with check ((EXISTS ( SELECT 1
   FROM goals g
  WHERE (g.id = subgoals.goal_id))));
create policy "Allow users to delete their own tasks"
on "public"."tasks"
as permissive
for delete
to public
using (true);
create policy "Allow users to insert tasks"
on "public"."tasks"
as permissive
for insert
to public
with check (true);
create policy "Allow users to update their own tasks"
on "public"."tasks"
as permissive
for update
to public
using (true);
create policy "Allow users to view all tasks"
on "public"."tasks"
as permissive
for select
to public
using (true);
create policy "Users can delete their own tasks"
on "public"."tasks"
as permissive
for delete
to public
using ((auth.uid() = user_id));
create policy "Users can insert their own tasks"
on "public"."tasks"
as permissive
for insert
to public
with check ((auth.uid() = user_id));
create policy "Users can update their own tasks"
on "public"."tasks"
as permissive
for update
to public
using ((auth.uid() = user_id));
create policy "Users can view their own tasks"
on "public"."tasks"
as permissive
for select
to public
using ((auth.uid() = user_id));
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
