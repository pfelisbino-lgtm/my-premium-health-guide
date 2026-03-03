import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateBMR, calculateTDEE, calculateAge, projectWeight } from '@/lib/bmr-utils';
import { TrendingDown, Calendar } from 'lucide-react';

interface Props { userId: string; }

const WeightProjection = ({ userId }: Props) => {
  const [projections, setProjections] = useState<{ weeks: number; weight: number }[]>([]);
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [tdee, setTdee] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('profiles').select('current_weight, height_cm, birth_date, activity_level, adaptive_metabolism, goal_weight').eq('user_id', userId).single();
      if (!data?.current_weight || !data?.height_cm || !data?.birth_date) return;

      const age = calculateAge(data.birth_date);
      const bmr = calculateBMR(data.current_weight, data.height_cm, age);
      const calculatedTdee = calculateTDEE(bmr, data.activity_level || 'sedentary', data.adaptive_metabolism);
      const deficit = calculatedTdee - 500; // Moderate 500 kcal deficit

      setCurrentWeight(data.current_weight);
      setTdee(calculatedTdee);
      setProjections([
        { weeks: 4, weight: parseFloat(projectWeight(data.current_weight, calculatedTdee, deficit, 4).toFixed(1)) },
        { weeks: 8, weight: parseFloat(projectWeight(data.current_weight, calculatedTdee, deficit, 8).toFixed(1)) },
        { weeks: 12, weight: parseFloat(projectWeight(data.current_weight, calculatedTdee, deficit, 12).toFixed(1)) },
      ]);
    };
    load();
  }, [userId]);

  if (projections.length === 0) return null;

  const maxLoss = currentWeight - projections[2].weight;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingDown className="h-4 w-4 text-primary" />
          Weight Projection
        </CardTitle>
        <p className="text-xs text-muted-foreground">Based on 500 kcal/day deficit from {tdee} TDEE</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {projections.map(({ weeks, weight }) => {
            const lost = currentWeight - weight;
            const pct = maxLoss > 0 ? (lost / maxLoss) * 100 : 0;
            return (
              <div key={weeks} className="relative rounded-lg border border-border p-3 text-center overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 bg-primary/10 transition-all" style={{ height: `${pct}%` }} />
                <div className="relative z-10">
                  <Calendar className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">{weeks} weeks</p>
                  <p className="text-xl font-bold text-foreground">{weight}</p>
                  <p className="text-xs text-primary font-medium">-{lost.toFixed(1)} kg</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeightProjection;
