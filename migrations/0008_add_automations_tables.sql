-- Create user_events table
CREATE TABLE IF NOT EXISTS "user_events" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar,
  "event_type" varchar NOT NULL,
  "event_data" jsonb,
  "created_at" timestamp DEFAULT now()
);

-- Create automations table
CREATE TABLE IF NOT EXISTS "automations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar NOT NULL,
  "description" text,
  "trigger_type" varchar NOT NULL,
  "trigger_config" jsonb NOT NULL,
  "action_type" varchar NOT NULL,
  "action_config" jsonb NOT NULL,
  "is_active" boolean DEFAULT true,
  "segment_rules" jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create automation_logs table
CREATE TABLE IF NOT EXISTS "automation_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "automation_id" varchar,
  "user_id" varchar,
  "event_id" varchar,
  "status" varchar NOT NULL,
  "result" jsonb,
  "error_message" text,
  "executed_at" timestamp DEFAULT now()
);

-- Create user_segments table
CREATE TABLE IF NOT EXISTS "user_segments" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar NOT NULL,
  "description" text,
  "rules" jsonb NOT NULL,
  "user_count" integer DEFAULT 0,
  "last_calculated_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create marketing_analytics table
CREATE TABLE IF NOT EXISTS "marketing_analytics" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "date" timestamp NOT NULL,
  "metric_type" varchar NOT NULL,
  "metric_value" integer NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now()
);

-- Add foreign key constraints (only if referenced tables exist)
DO $$
BEGIN
  -- Add foreign key for automation_logs -> automations
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'automations') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' AND constraint_name = 'automation_logs_automation_id_automations_id_fk'
    ) THEN
      ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_automation_id_automations_id_fk" 
        FOREIGN KEY ("automation_id") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
  END IF;

  -- Add foreign key for automation_logs -> user_events
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_events') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' AND constraint_name = 'automation_logs_event_id_user_events_id_fk'
    ) THEN
      ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_event_id_user_events_id_fk" 
        FOREIGN KEY ("event_id") REFERENCES "user_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
  END IF;

  -- Add foreign key for user_events -> users (only if users table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' AND constraint_name = 'user_events_user_id_users_id_fk'
    ) THEN
      ALTER TABLE "user_events" ADD CONSTRAINT "user_events_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
  END IF;

  -- Add foreign key for automation_logs -> users (only if users table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' AND constraint_name = 'automation_logs_user_id_users_id_fk'
    ) THEN
      ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_user_events_user_id" ON "user_events"("user_id");
CREATE INDEX IF NOT EXISTS "idx_user_events_event_type" ON "user_events"("event_type");
CREATE INDEX IF NOT EXISTS "idx_user_events_created_at" ON "user_events"("created_at");
CREATE INDEX IF NOT EXISTS "idx_automation_logs_automation_id" ON "automation_logs"("automation_id");
CREATE INDEX IF NOT EXISTS "idx_automation_logs_user_id" ON "automation_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_automation_logs_executed_at" ON "automation_logs"("executed_at");
CREATE INDEX IF NOT EXISTS "idx_marketing_analytics_date" ON "marketing_analytics"("date");
CREATE INDEX IF NOT EXISTS "idx_marketing_analytics_metric_type" ON "marketing_analytics"("metric_type");

