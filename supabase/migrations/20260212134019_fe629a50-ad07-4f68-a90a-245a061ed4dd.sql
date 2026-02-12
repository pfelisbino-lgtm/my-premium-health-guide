
-- Add validation trigger for weight fields (using trigger instead of CHECK for flexibility)
CREATE OR REPLACE FUNCTION public.validate_profile_weights()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_weight IS NOT NULL AND (NEW.current_weight <= 0 OR NEW.current_weight > 500) THEN
    RAISE EXCEPTION 'current_weight must be between 0 and 500';
  END IF;
  IF NEW.goal_weight IS NOT NULL AND (NEW.goal_weight <= 0 OR NEW.goal_weight > 500) THEN
    RAISE EXCEPTION 'goal_weight must be between 0 and 500';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_profile_weights_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_profile_weights();
