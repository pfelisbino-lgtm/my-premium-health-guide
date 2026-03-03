
-- Add BMR-related columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS height_cm numeric NULL,
  ADD COLUMN IF NOT EXISTS birth_date date NULL,
  ADD COLUMN IF NOT EXISTS activity_level text NULL DEFAULT 'sedentary',
  ADD COLUMN IF NOT EXISTS adaptive_metabolism boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS streak_days integer NOT NULL DEFAULT 0;

-- Body composition logs
CREATE TABLE public.body_composition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  weight numeric NULL,
  body_fat_pct numeric NULL,
  lean_mass numeric NULL,
  waist_cm numeric NULL,
  water_retention integer NULL CHECK (water_retention >= 1 AND water_retention <= 5),
  logged_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.body_composition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON public.body_composition_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.body_composition_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON public.body_composition_logs FOR DELETE USING (auth.uid() = user_id);

-- Daily check-ins
CREATE TABLE public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sleep_quality integer NOT NULL CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  energy_level integer NOT NULL CHECK (energy_level >= 1 AND energy_level <= 5),
  appetite integer NOT NULL CHECK (appetite >= 1 AND appetite <= 5),
  mood integer NOT NULL CHECK (mood >= 1 AND mood <= 5),
  logged_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, logged_at)
);
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own checkins" ON public.daily_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkins" ON public.daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checkins" ON public.daily_checkins FOR UPDATE USING (auth.uid() = user_id);

-- Hunger assessments
CREATE TABLE public.hunger_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  would_eat_chicken boolean NOT NULL,
  hunger_index integer NULL CHECK (hunger_index >= 1 AND hunger_index <= 10),
  notes text NULL,
  logged_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.hunger_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own assessments" ON public.hunger_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assessments" ON public.hunger_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
