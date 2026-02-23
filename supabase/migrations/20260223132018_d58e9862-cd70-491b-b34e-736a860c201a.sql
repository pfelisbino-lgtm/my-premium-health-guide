-- Update favorites RLS policies to remove subscription check
DROP POLICY "Users can add favorites" ON public.favorites;
DROP POLICY "Users can remove favorites" ON public.favorites;
DROP POLICY "Users can view own favorites" ON public.favorites;

CREATE POLICY "Users can view own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id);