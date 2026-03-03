import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getLevel } from '@/lib/bmr-utils';
import { Trophy, Star } from 'lucide-react';

interface Props { userId: string; }

const PointsLevel = ({ userId }: Props) => {
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('profiles').select('points').eq('user_id', userId).single();
      if (data) setPoints(data.points);
    };
    load();

    const channel = supabase
      .channel('points-update')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${userId}` }, (payload) => {
        if (payload.new && 'points' in payload.new) setPoints((payload.new as any).points);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const { level, name, nextThreshold } = getLevel(points);
  const prevThreshold = level > 1 ? getLevel(points).nextThreshold : 0;
  const progress = nextThreshold > 0
    ? Math.min(100, ((points - (nextThreshold === prevThreshold ? 0 : 0)) / nextThreshold) * 100)
    : 100;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Trophy className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">Level {level}</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Star className="h-3 w-3" /> {points}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PointsLevel;
