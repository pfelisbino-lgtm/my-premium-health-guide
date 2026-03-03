import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { calculateProteinRange } from '@/lib/bmr-utils';
import { Ruler, Plus, Droplets } from 'lucide-react';

interface Props { userId: string; }

interface LogEntry {
  id: string;
  weight: number | null;
  body_fat_pct: number | null;
  lean_mass: number | null;
  waist_cm: number | null;
  water_retention: number | null;
  logged_at: string;
}

const BodyCompositionTracker = ({ userId }: Props) => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [leanMass, setLeanMass] = useState('');
  const [waist, setWaist] = useState('');
  const [waterRetention, setWaterRetention] = useState([3]);
  const [saving, setSaving] = useState(false);

  const loadLogs = async () => {
    const { data } = await supabase
      .from('body_composition_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(10);
    if (data) setLogs(data);
  };

  useEffect(() => { loadLogs(); }, [userId]);

  const handleSubmit = async () => {
    setSaving(true);
    const { error } = await supabase.from('body_composition_logs').insert({
      user_id: userId,
      weight: parseFloat(weight) || null,
      body_fat_pct: parseFloat(bodyFat) || null,
      lean_mass: parseFloat(leanMass) || null,
      waist_cm: parseFloat(waist) || null,
      water_retention: waterRetention[0],
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Error saving log', variant: 'destructive' });
    } else {
      toast({ title: 'Body composition logged! +10 points 🎉' });
      // Award points
      await supabase.from('profiles').update({
        points: (await supabase.from('profiles').select('points').eq('user_id', userId).single()).data?.points! + 10,
      }).eq('user_id', userId);
      setWeight(''); setBodyFat(''); setLeanMass(''); setWaist(''); setWaterRetention([3]);
      loadLogs();
    }
  };

  const w = parseFloat(weight);
  const protein = w > 0 ? calculateProteinRange(w) : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Ruler className="h-4 w-4 text-primary" />
            40+ Body Composition Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Weight (kg)</Label>
              <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="65" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Body Fat %</Label>
              <Input type="number" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} placeholder="25" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Lean Mass (kg)</Label>
              <Input type="number" value={leanMass} onChange={(e) => setLeanMass(e.target.value)} placeholder="48" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Waist (cm)</Label>
              <Input type="number" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="80" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1">
                <Droplets className="h-3 w-3" /> Water Retention
              </Label>
              <span className="text-xs font-medium text-primary">{waterRetention[0]}/5</span>
            </div>
            <Slider value={waterRetention} onValueChange={setWaterRetention} min={1} max={5} step={1} />
          </div>

          {protein && (
            <div className="rounded-lg bg-primary/10 p-3">
              <p className="text-xs text-muted-foreground">Ideal Protein Intake (40+)</p>
              <p className="text-lg font-bold text-primary">{protein.min}g – {protein.max}g / day</p>
              <p className="text-xs text-muted-foreground">Based on 1.6–2.2g per kg body weight</p>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full" size="sm" disabled={saving}>
            <Plus className="h-4 w-4 mr-1" />
            {saving ? 'Logging...' : 'Log Entry'}
          </Button>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
                  <span className="text-xs text-muted-foreground">{new Date(log.logged_at).toLocaleDateString()}</span>
                  <div className="flex gap-3 text-xs">
                    {log.weight && <span>{log.weight} kg</span>}
                    {log.body_fat_pct && <span>{log.body_fat_pct}%</span>}
                    {log.waist_cm && <span>{log.waist_cm} cm</span>}
                    {log.water_retention && <span>💧{log.water_retention}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BodyCompositionTracker;
