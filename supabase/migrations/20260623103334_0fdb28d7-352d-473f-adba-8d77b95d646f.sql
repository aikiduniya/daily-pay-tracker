
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'half_day');

CREATE TABLE public.workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  daily_wage NUMERIC(12,2) NOT NULL CHECK (daily_wage >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workers TO authenticated;
GRANT ALL ON public.workers TO service_role;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages workers" ON public.workers FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages projects" ON public.projects FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.attendance_status NOT NULL,
  daily_wage_snapshot NUMERIC(12,2) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (worker_id, project_id, work_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages attendance" ON public.attendance FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE INDEX attendance_project_date_idx ON public.attendance(project_id, work_date);
CREATE INDEX attendance_worker_date_idx ON public.attendance(worker_id, work_date);
