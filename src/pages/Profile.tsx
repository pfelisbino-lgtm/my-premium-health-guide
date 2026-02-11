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
import { Save } from 'lucide-react';

const dietaryOptions = ['vegetariano', 'vegano', 'sem glúten', 'sem lactose', 'sem açúcar'];

const faqs = [
  { q: 'Como funciona o acesso premium?', a: 'Após a compra na Hotmart, o teu acesso é ativado automaticamente via webhook. Basta fazer login com o email usado na compra.' },
  { q: 'Posso cancelar a minha assinatura?', a: 'Sim, podes cancelar a qualquer momento pela plataforma Hotmart. O acesso permanece ativo até o fim do período pago.' },
  { q: 'Como altero as minhas metas?', a: 'Na secção de Perfil, podes editar o teu peso atual e meta de peso a qualquer momento.' },
  { q: 'Onde encontro suporte?', a: 'Envia um email para suporte@healthjourney.com e responderemos em até 24 horas.' },
];

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [dietary, setDietary] = useState<string[]>([]);
  const [subStatus, setSubStatus] = useState('inactive');
  const [saving, setSaving] = useState(false);

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
      const { data: s } = await supabase.from('subscriptions').select('status').eq('user_id', user.id).single();
      if (s) setSubStatus(s.status);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      current_weight: currentWeight ? parseFloat(currentWeight) : null,
      goal_weight: goalWeight ? parseFloat(goalWeight) : null,
      dietary_preferences: dietary,
    }).eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao guardar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Perfil atualizado ✅' });
    }
  };

  const toggleDietary = (option: string) => {
    setDietary((prev) => prev.includes(option) ? prev.filter((d) => d !== option) : [...prev, option]);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Perfil</h1>

      {/* Subscription status */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <span className="text-sm font-medium">Estado da Assinatura</span>
          <Badge variant={subStatus === 'active' ? 'default' : 'secondary'}>
            {subStatus === 'active' ? '✅ Ativa' : '⏸️ Inativa'}
          </Badge>
        </CardContent>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled className="opacity-60" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cw">Peso Atual (kg)</Label>
              <Input id="cw" type="number" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gw">Meta de Peso (kg)</Label>
              <Input id="gw" type="number" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dietary preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferências Alimentares</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map((option) => (
              <Badge
                key={option}
                variant={dietary.includes(option) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleDietary(option)}
              >
                {option}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full" disabled={saving}>
        <Save className="h-4 w-4 mr-2" />
        {saving ? 'A guardar...' : 'Guardar Alterações'}
      </Button>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perguntas Frequentes</CardTitle>
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
        Terminar Sessão
      </Button>
    </div>
  );
};

export default Profile;
