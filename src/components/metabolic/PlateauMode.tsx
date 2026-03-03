import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateBMR, calculateTDEE, calculateAge } from '@/lib/bmr-utils';
import { AlertTriangle, ArrowDown } from 'lucide-react';

interface Props { userId: string; }

const PlateauMode = ({ userId }: Props) => {
  const [data, setData] = useState<{ tdee: number; plateau: boolean } | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: profile } = await supabase.from('profiles').select('current_weight, height_cm, birth_date, activity_level, adaptive_metabolism').eq('user_id', userId).single();
      if (!profile?.current_weight || !profile?.height_cm || !profile?.birth_date) return;

      // Check for plateau: compare last 3 body comp logs
      const { data: logs } = await supabase
        .from('body_composition_logs')
        .select('weight')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false })
        .limit(3);

      let isPlateauing = false;
      if (logs && logs.length >= 3) {
        const weights = logs.map((l) => l.weight).filter(Boolean) as number[];
        if (weights.length >= 3) {
          const range = Math.max(...weights) - Math.min(...weights);
          isPlateauing = range < 0.5; // Less than 0.5 kg change in last 3 entries
        }
      }

      const age = calculateAge(profile.birth_date);
      const bmr = calculateBMR(profile.current_weight, profile.height_cm, age);
      const tdee = calculateTDEE(bmr, profile.activity_level || 'sedentary', profile.adaptive_metabolism);

      setData({ tdee, plateau: isPlateauing });
    };
    load();
  }, [userId]);

  if (!data) return null;

  const suggestions = [
    { label: 'Moderate cut', calories: Math.round(data.tdee * 0.85), desc: '15% reduction' },
    { label: 'Aggressive cut', calories: Math.round(data.tdee * 0.75), desc: '25% reduction' },
    { label: 'Refeed day', calories: data.tdee, desc: 'Maintenance calories' },
  ];

  return (
    <Card className={data.plateau ? 'border-warning/30 bg-warning/5' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className={`h-4 w-4 ${data.plateau ? 'text-warning' : 'text-muted-foreground'}`} />
          Plateau Mode
          {data.plateau && <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full ml-auto">Active</span>}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {data.plateau
            ? 'Weight stall detected. Consider adjusting your caloric intake.'
            : 'No plateau detected. Keep up the great work!'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {suggestions.map((s) => (
            <div key={s.label} className="flex items-center justify-between rounded-lg border border-border p-2.5">
              <div>
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-primary">
                <ArrowDown className="h-3 w-3" />
                {s.calories} kcal
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlateauMode;
