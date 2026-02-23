import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UtensilsCrossed, User, Target, Lightbulb } from 'lucide-react';
import { recipes } from '@/data/recipes';
import { useLanguage } from '@/i18n/LanguageContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<{ full_name: string; current_weight: number | null; goal_weight: number | null } | null>(null);
  const tips = [t('tip1'), t('tip2'), t('tip3'), t('tip4'), t('tip5')];
  const dailyTip = tips[new Date().getDate() % tips.length];
  const dailyRecipe = recipes[new Date().getDate() % recipes.length];

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: p } = await supabase.from('profiles').select('full_name, current_weight, goal_weight').eq('user_id', user.id).single();
      if (p) setProfile(p);
    };
    load();
  }, [user]);

  const firstName = profile?.full_name?.split(' ')[0] || 'User';
  const weightProgress = profile?.current_weight && profile?.goal_weight
    ? Math.min(100, Math.max(0, ((profile.current_weight - profile.goal_weight) / profile.current_weight) * 100))
    : 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('dashGreeting', { name: firstName })}</h1>
        <p className="text-muted-foreground">{t('dashSubtitle')}</p>
      </div>

      {profile?.goal_weight && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" /> {t('dashWeightGoal')}
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

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 py-4">
          <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-foreground">{t('dashTipOfDay')}</p>
            <p className="text-sm text-muted-foreground">{dailyTip}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('dashRecipeOfDay')}</CardTitle>
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

      <div className="grid grid-cols-2 gap-3">
        <Link to="/recipes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex flex-col items-center gap-2 py-6">
              <UtensilsCrossed className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">{t('dashRecipes')}</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/profile">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex flex-col items-center gap-2 py-6">
              <User className="h-8 w-8 text-accent" />
              <span className="text-sm font-medium">{t('dashProfile')}</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
