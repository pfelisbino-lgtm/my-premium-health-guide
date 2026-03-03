import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Sun, Moon, Battery, Utensils, Smile } from 'lucide-react';

interface Props { userId: string; }

const metrics = [
  { key: 'sleep_quality', label: 'Sleep Quality', icon: Moon, emoji: ['😫', '😴', '😐', '😊', '🌟'] },
  { key: 'energy_level', label: 'Energy Level', icon: Battery, emoji: ['🪫', '😮‍💨', '😐', '⚡', '🔥'] },
  { key: 'appetite', label: 'Appetite', icon: Utensils, emoji: ['😶', '🤏', '😐', '😋', '🍽️'] },
  { key: 'mood', label: 'Mood', icon: Smile, emoji: ['😢', '😟', '😐', '😊', '🤩'] },
] as const;

const DailyCheckin = ({ userId }: Props) => {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, number>>({
    sleep_quality: 3, energy_level: 3, appetite: 3, mood: 3,
  });
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const check = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .eq('logged_at', today)
        .maybeSingle();
      if (data) {
        setAlreadyDone(true);
        setValues({
          sleep_quality: data.sleep_quality,
          energy_level: data.energy_level,
          appetite: data.appetite,
          mood: data.mood,
        });
      }
    };
    check();
  }, [userId]);

  const handleSubmit = async () => {
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('daily_checkins').upsert({
      user_id: userId,
      logged_at: today,
      sleep_quality: values.sleep_quality,
      energy_level: values.energy_level,
      appetite: values.appetite,
      mood: values.mood,
    }, { onConflict: 'user_id,logged_at' });
    setSaving(false);
    if (error) {
      toast({ title: 'Error saving check-in', variant: 'destructive' });
    } else {
      toast({ title: 'Daily check-in complete! +15 points 🎉' });
      setAlreadyDone(true);
      // Award points
      const { data } = await supabase.from('profiles').select('points').eq('user_id', userId).single();
      if (data) {
        await supabase.from('profiles').update({ points: data.points + 15 }).eq('user_id', userId);
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sun className="h-4 w-4 text-primary" />
          Daily Check-in
          {alreadyDone && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">✓ Done</span>}
        </CardTitle>
        <p className="text-xs text-muted-foreground">30-second wellness check · Rate 1–5</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map(({ key, label, icon: Icon, emoji }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                {label}
              </Label>
              <span className="text-lg">{emoji[values[key] - 1]}</span>
            </div>
            <Slider
              value={[values[key]]}
              onValueChange={([v]) => setValues((prev) => ({ ...prev, [key]: v }))}
              min={1} max={5} step={1}
            />
          </div>
        ))}
        <Button onClick={handleSubmit} className="w-full" size="sm" disabled={saving}>
          {saving ? 'Saving...' : alreadyDone ? 'Update Check-in' : 'Complete Check-in'}
        </Button>
      </CardContent>
    </Card>
  );
};

// Label helper
const Label = ({ className, children, ...props }: React.HTMLAttributes<HTMLLabelElement>) => (
  <label className={className} {...props}>{children}</label>
);

export default DailyCheckin;
