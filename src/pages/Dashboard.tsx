import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UtensilsCrossed, User, Target, Lightbulb } from 'lucide-react';
import { recipes } from '@/data/recipes';

const tips = [
  'Beba pelo menos 2 litros de água por dia 💧',
  'Coma devagar — leva 20 min para o cérebro registar saciedade 🧠',
  'Prefira alimentos integrais aos refinados 🌾',
  'Durma 7-8 horas por noite para melhor metabolismo 😴',
  'Faça pelo menos 30 min de exercício por dia 🏃',
];

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string; current_weight: number | null; goal_weight: number | null } | null>(null);
  const [subscription, setSubscription] = useState<string>('inactive');

  const dailyTip = tips[new Date().getDate() % tips.length];
  const dailyRecipe = recipes[new Date().getDate() % recipes.length];

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: p } = await supabase.from('profiles').select('full_name, current_weight, goal_weight').eq('user_id', user.id).single();
      if (p) setProfile(p);
      const { data: s } = await supabase.from('subscriptions').select('status').eq('user_id', user.id).single();
      if (s) setSubscription(s.status);
    };
    load();
  }, [user]);

  const firstName = profile?.full_name?.split(' ')[0] || 'Utilizador';
  const weightProgress = profile?.current_weight && profile?.goal_weight
    ? Math.min(100, Math.max(0, ((profile.current_weight - profile.goal_weight) / profile.current_weight) * 100))
    : 0;

  if (subscription === 'inactive') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <span className="text-6xl mb-4">🔒</span>
        <h2 className="text-xl font-bold text-foreground mb-2">Acesso Premium Necessário</h2>
        <p className="text-muted-foreground max-w-sm">
          Para aceder ao conteúdo premium, é necessário adquirir o plano My Glowfit. Após a compra, o teu acesso será ativado automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olá, {firstName} 👋</h1>
        <p className="text-muted-foreground">Vamos continuar a tua jornada!</p>
      </div>

      {/* Weight goal */}
      {profile?.goal_weight && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" /> Meta de Peso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm mb-2">
              <span>{profile.current_weight ?? '—'} kg</span>
              <span className="text-primary font-semibold">{profile.goal_weight} kg</span>
            </div>
            <Progress value={weightProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Daily tip */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 py-4">
          <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-foreground">Dica do Dia</p>
            <p className="text-sm text-muted-foreground">{dailyTip}</p>
          </div>
        </CardContent>
      </Card>

      {/* Daily recipe */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Receita do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <Link to="/recipes" className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
            <span className="text-3xl">{dailyRecipe.image}</span>
            <div>
              <p className="font-medium text-foreground">{dailyRecipe.title}</p>
              <p className="text-xs text-muted-foreground">{dailyRecipe.calories} kcal · {dailyRecipe.prepTime} min</p>
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Quick access */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/recipes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex flex-col items-center gap-2 py-6">
              <UtensilsCrossed className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Receitas</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/profile">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex flex-col items-center gap-2 py-6">
              <User className="h-8 w-8 text-accent" />
              <span className="text-sm font-medium">Perfil</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
