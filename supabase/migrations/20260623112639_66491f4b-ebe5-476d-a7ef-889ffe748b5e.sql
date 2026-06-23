
DO $$ BEGIN
  CREATE TYPE public.wage_type AS ENUM ('daily', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.workers
  ADD COLUMN IF NOT EXISTS wage_type public.wage_type NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS monthly_wage numeric NOT NULL DEFAULT 0,
  ALTER COLUMN daily_wage SET DEFAULT 0;
