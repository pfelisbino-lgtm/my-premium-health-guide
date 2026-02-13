
-- Create a SECURITY DEFINER function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Drop existing favorites INSERT policy and recreate with subscription check
DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
CREATE POLICY "Users can add favorites"
ON public.favorites
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_active_subscription(auth.uid()));

-- Drop existing favorites SELECT policy and recreate with subscription check
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites"
ON public.favorites
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND public.has_active_subscription(auth.uid()));

-- Drop existing favorites DELETE policy and recreate with subscription check
DROP POLICY IF EXISTS "Users can remove favorites" ON public.favorites;
CREATE POLICY "Users can remove favorites"
ON public.favorites
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.has_active_subscription(auth.uid()));
