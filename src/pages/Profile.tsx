import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-utils';
import { Save } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const dietaryKeys = ['dietVegetarian', 'dietVegan', 'dietGlutenFree', 'dietLactoseFree', 'dietSugarFree'] as const;
const dietaryValues = ['vegetariano', 'vegano', 'sem glúten', 'sem lactose', 'sem açúcar'];

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [dietary, setDietary] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const faqs = [
    { q: t('faq1q'), a: t('faq1a') },
    { q: t('faq2q'), a: t('faq2a') },
    { q: t('faq3q'), a: t('faq3a') },
    { q: t('faq4q'), a: t('faq4a') },
  ];

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: p } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      if (p) {
        setFullName(p.full_name || '');
        setCurrentWeight(p.current_weight?.toString() || '');
        setGoalWeight(p.goal_weight?.toString() || '');
        setDietary((p.dietary_preferences as string[]) || []);
      }
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    const cw = currentWeight ? parseFloat(currentWeight) : null;
    const gw = goalWeight ? parseFloat(goalWeight) : null;

    if (cw !== null && (cw <= 0 || cw > 500)) {
      toast({ title: t('profileInvalidWeight'), description: t('profileInvalidWeightDesc'), variant: 'destructive' });
      return;
    }
    if (gw !== null && (gw <= 0 || gw > 500)) {
      toast({ title: t('profileInvalidGoal'), description: t('profileInvalidGoalDesc'), variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      current_weight: cw,
      goal_weight: gw,
      dietary_preferences: dietary,
    }).eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: t('profileSaveError'), description: getFriendlyError(error), variant: 'destructive' });
    } else {
      toast({ title: t('profileUpdated') });
    }
  };

  const toggleDietary = (option: string) => {
    setDietary((prev) => prev.includes(option) ? prev.filter((d) => d !== option) : [...prev, option]);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">{t('profileTitle')}</h1>


      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('profilePersonalData')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('profileName')}</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('profileEmail')}</Label>
            <Input value={user?.email || ''} disabled className="opacity-60" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cw">{t('profileCurrentWeight')}</Label>
              <Input id="cw" type="number" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gw">{t('profileGoalWeight')}</Label>
              <Input id="gw" type="number" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('profileDietaryPrefs')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {dietaryKeys.map((key, i) => (
              <Badge
                key={key}
                variant={dietary.includes(dietaryValues[i]) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleDietary(dietaryValues[i])}
              >
                {t(key)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full" disabled={saving}>
        <Save className="h-4 w-4 mr-2" />
        {saving ? t('profileSaving') : t('profileSave')}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('profileFAQ')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={signOut} className="w-full text-destructive">
        {t('profileSignOut')}
      </Button>
    </div>
  );
};

export default Profile;
