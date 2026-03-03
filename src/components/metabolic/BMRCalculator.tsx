import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { calculateBMR, calculateTDEE, calculateAge, ACTIVITY_MULTIPLIERS } from '@/lib/bmr-utils';
import { Flame, Zap, Save } from 'lucide-react';

interface Props { userId: string; }

const BMRCalculator = ({ userId }: Props) => {
  const { toast } = useToast();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [adaptive, setAdaptive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bmr, setBmr] = useState<number | null>(null);
  const [tdee, setTdee] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('profiles').select('current_weight, height_cm, birth_date, activity_level, adaptive_metabolism').eq('user_id', userId).single();
      if (data) {
        setWeight(data.current_weight?.toString() || '');
        setHeight(data.height_cm?.toString() || '');
        setBirthDate(data.birth_date || '');
        setActivityLevel(data.activity_level || 'sedentary');
        setAdaptive(data.adaptive_metabolism || false);
      }
    };
    load();
  }, [userId]);

  useEffect(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (w > 0 && h > 0 && birthDate) {
      const age = calculateAge(birthDate);
      if (age > 0 && age < 120) {
        const b = calculateBMR(w, h, age);
        setBmr(Math.round(b));
        setTdee(calculateTDEE(b, activityLevel, adaptive));
      }
    } else {
      setBmr(null);
      setTdee(null);
    }
  }, [weight, height, birthDate, activityLevel, adaptive]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      current_weight: parseFloat(weight) || null,
      height_cm: parseFloat(height) || null,
      birth_date: birthDate || null,
      activity_level: activityLevel,
      adaptive_metabolism: adaptive,
    }).eq('user_id', userId);
    setSaving(false);
    if (error) toast({ title: 'Error saving', variant: 'destructive' });
    else toast({ title: 'Metabolic profile saved!' });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-4 w-4 text-primary" />
          Smart BMR Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="bmr-weight" className="text-xs">Weight (kg)</Label>
            <Input id="bmr-weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="65" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bmr-height" className="text-xs">Height (cm)</Label>
            <Input id="bmr-height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="165" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bmr-birth" className="text-xs">Date of Birth</Label>
          <Input id="bmr-birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Activity Level</Label>
          <Select value={activityLevel} onValueChange={setActivityLevel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ACTIVITY_MULTIPLIERS).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Adaptive Metabolism</p>
            <p className="text-xs text-muted-foreground">10% reduction for plateau adjustment</p>
          </div>
          <Switch checked={adaptive} onCheckedChange={setAdaptive} />
        </div>

        {bmr !== null && tdee !== null && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <Flame className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-primary">{bmr}</p>
              <p className="text-xs text-muted-foreground">BMR (kcal/day)</p>
            </div>
            <div className="rounded-lg bg-accent/10 p-3 text-center">
              <Zap className="h-5 w-5 text-accent mx-auto mb-1" />
              <p className="text-2xl font-bold text-accent">{tdee}</p>
              <p className="text-xs text-muted-foreground">TDEE (kcal/day)</p>
            </div>
          </div>
        )}

        <Button onClick={handleSave} className="w-full" size="sm" disabled={saving}>
          <Save className="h-4 w-4 mr-1" />
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BMRCalculator;
