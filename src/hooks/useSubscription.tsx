import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useSubscription = () => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsActive(null);
      setLoading(false);
      return;
    }

    const check = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, expires_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Subscription check failed:', error);
        setIsActive(false);
      } else if (data) {
        const notExpired = !data.expires_at || new Date(data.expires_at) > new Date();
        setIsActive(notExpired);
      } else {
        setIsActive(false);
      }
      setLoading(false);
    };

    check();
  }, [user]);

  return { isActive, loading };
};
