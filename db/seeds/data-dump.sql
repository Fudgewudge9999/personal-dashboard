

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."subgoal_position_update" AS (
	"id" "uuid",
	"position" integer
);


ALTER TYPE "public"."subgoal_position_update" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reorder_subgoals"("goal_id_param" "uuid", "subgoal_positions" "public"."subgoal_position_update"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."reorder_subgoals"("goal_id_param" "uuid", "subgoal_positions" "public"."subgoal_position_update"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "category" "text" DEFAULT 'work'::"text" NOT NULL,
    CONSTRAINT "events_category_check" CHECK (("category" = ANY (ARRAY['tutoring'::"text", 'work'::"text", 'personal'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


COMMENT ON COLUMN "public"."events"."category" IS 'Event category: tutoring, work, or personal';



CREATE TABLE IF NOT EXISTS "public"."focus_session_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "task_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."focus_session_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."focus_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "date" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "duration" integer NOT NULL,
    "completed" boolean DEFAULT false,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "actual_duration" integer DEFAULT 0
);


ALTER TABLE "public"."focus_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."focus_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "text" "text" NOT NULL,
    "completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."focus_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "target_date" "date",
    "completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "start_date" timestamp with time zone NOT NULL,
    "target_days" integer NOT NULL,
    "current_streak" integer DEFAULT 0,
    "completed_today" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_completed_date" "date"
);


ALTER TABLE "public"."habits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "type" "text" NOT NULL,
    "category_id" "uuid",
    "url" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "file_path" "text",
    "file_size" bigint,
    "file_type" "text"
);


ALTER TABLE "public"."resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subgoals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "goal_id" "uuid" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."subgoals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "due_date" timestamp with time zone,
    "priority" "text",
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid"
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."focus_session_tasks"
    ADD CONSTRAINT "focus_session_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."focus_session_tasks"
    ADD CONSTRAINT "focus_session_tasks_session_id_task_id_key" UNIQUE ("session_id", "task_id");



ALTER TABLE ONLY "public"."focus_sessions"
    ADD CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."focus_tasks"
    ADD CONSTRAINT "focus_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subgoals"
    ADD CONSTRAINT "subgoals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



CREATE INDEX "goals_user_id_idx" ON "public"."goals" USING "btree" ("user_id");



CREATE INDEX "idx_tasks_user_id" ON "public"."tasks" USING "btree" ("user_id");



CREATE INDEX "resources_category_id_idx" ON "public"."resources" USING "btree" ("category_id");



CREATE INDEX "subgoals_goal_id_idx" ON "public"."subgoals" USING "btree" ("goal_id");



CREATE INDEX "subgoals_position_idx" ON "public"."subgoals" USING "btree" ("position");



CREATE INDEX "tasks_due_date_idx" ON "public"."tasks" USING "btree" ("due_date");



CREATE INDEX "tasks_user_id_idx" ON "public"."tasks" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_goals_updated_at" BEFORE UPDATE ON "public"."goals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."focus_session_tasks"
    ADD CONSTRAINT "focus_session_tasks_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."focus_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."focus_session_tasks"
    ADD CONSTRAINT "focus_session_tasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."focus_tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."focus_sessions"
    ADD CONSTRAINT "focus_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."focus_tasks"
    ADD CONSTRAINT "focus_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."subgoals"
    ADD CONSTRAINT "subgoals_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow public delete access" ON "public"."focus_session_tasks" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access" ON "public"."focus_sessions" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access" ON "public"."focus_tasks" FOR DELETE USING (true);



CREATE POLICY "Allow public insert access" ON "public"."focus_session_tasks" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access" ON "public"."focus_sessions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access" ON "public"."focus_tasks" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public update access" ON "public"."focus_sessions" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access" ON "public"."focus_tasks" FOR UPDATE USING (true);



CREATE POLICY "Allow public view access" ON "public"."focus_session_tasks" FOR SELECT USING (true);



CREATE POLICY "Allow public view access" ON "public"."focus_sessions" FOR SELECT USING (true);



CREATE POLICY "Allow public view access" ON "public"."focus_tasks" FOR SELECT USING (true);



CREATE POLICY "Allow users to delete their own tasks" ON "public"."tasks" FOR DELETE USING (true);



CREATE POLICY "Allow users to insert tasks" ON "public"."tasks" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow users to update their own tasks" ON "public"."tasks" FOR UPDATE USING (true);



CREATE POLICY "Allow users to view all tasks" ON "public"."tasks" FOR SELECT USING (true);



CREATE POLICY "Enable access to subgoals" ON "public"."subgoals" USING ((EXISTS ( SELECT 1
   FROM "public"."goals" "g"
  WHERE ("g"."id" = "subgoals"."goal_id")))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."goals" "g"
  WHERE ("g"."id" = "subgoals"."goal_id"))));



CREATE POLICY "Users can delete their own goals" ON "public"."goals" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own tasks" ON "public"."tasks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own goals" ON "public"."goals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own tasks" ON "public"."tasks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own goals" ON "public"."goals" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own tasks" ON "public"."tasks" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own goals" ON "public"."goals" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own tasks" ON "public"."tasks" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."focus_session_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."focus_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."focus_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subgoals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































REVOKE ALL ON FUNCTION "public"."reorder_subgoals"("goal_id_param" "uuid", "subgoal_positions" "public"."subgoal_position_update"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reorder_subgoals"("goal_id_param" "uuid", "subgoal_positions" "public"."subgoal_position_update"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."reorder_subgoals"("goal_id_param" "uuid", "subgoal_positions" "public"."subgoal_position_update"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reorder_subgoals"("goal_id_param" "uuid", "subgoal_positions" "public"."subgoal_position_update"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."focus_session_tasks" TO "anon";
GRANT ALL ON TABLE "public"."focus_session_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."focus_session_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."focus_sessions" TO "anon";
GRANT ALL ON TABLE "public"."focus_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."focus_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."focus_tasks" TO "anon";
GRANT ALL ON TABLE "public"."focus_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."focus_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."goals" TO "anon";
GRANT ALL ON TABLE "public"."goals" TO "authenticated";
GRANT ALL ON TABLE "public"."goals" TO "service_role";



GRANT ALL ON TABLE "public"."habits" TO "anon";
GRANT ALL ON TABLE "public"."habits" TO "authenticated";
GRANT ALL ON TABLE "public"."habits" TO "service_role";



GRANT ALL ON TABLE "public"."resources" TO "anon";
GRANT ALL ON TABLE "public"."resources" TO "authenticated";
GRANT ALL ON TABLE "public"."resources" TO "service_role";



GRANT ALL ON TABLE "public"."subgoals" TO "anon";
GRANT ALL ON TABLE "public"."subgoals" TO "authenticated";
GRANT ALL ON TABLE "public"."subgoals" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
