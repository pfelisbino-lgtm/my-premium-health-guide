import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface MealLog {
  id: string;
  meal_name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  image_url: string | null;
  logged_at: string;
}

interface MealHistoryProps {
  userId: string;
}

const MealHistory = ({ userId }: MealHistoryProps) => {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeals = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', today.toISOString())
      .order('logged_at', { ascending: false });

    setMeals((data as MealLog[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchMeals(); }, [userId]);

  const deleteMeal = async (id: string) => {
    await supabase.from('meal_logs').delete().eq('id', id);
    setMeals(prev => prev.filter(m => m.id !== id));
  };

  const totalCalories = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProtein = meals.reduce((s, m) => s + (m.protein_g || 0), 0);
  const totalCarbs = meals.reduce((s, m) => s + (m.carbs_g || 0), 0);
  const totalFats = meals.reduce((s, m) => s + (m.fats_g || 0), 0);

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Today's Meals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {meals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No meals logged today. Scan your first meal above!</p>
        ) : (
          <>
            {/* Daily totals */}
            <div className="grid grid-cols-4 gap-2 p-3 bg-muted rounded-lg text-center">
              <div>
                <p className="text-xs text-muted-foreground">Calories</p>
                <p className="font-bold text-sm">{Math.round(totalCalories)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Protein</p>
                <p className="font-bold text-sm">{Math.round(totalProtein)}g</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Carbs</p>
                <p className="font-bold text-sm">{Math.round(totalCarbs)}g</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fats</p>
                <p className="font-bold text-sm">{Math.round(totalFats)}g</p>
              </div>
            </div>

            {/* Meal list */}
            {meals.map(meal => (
              <div key={meal.id} className="flex items-center gap-3 p-2 rounded-lg border">
                {meal.image_url && (
                  <img src={meal.image_url} alt={meal.meal_name} className="w-12 h-12 rounded-md object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{meal.meal_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(meal.calories || 0)} kcal · {Math.round(meal.protein_g || 0)}g P · {Math.round(meal.carbs_g || 0)}g C · {Math.round(meal.fats_g || 0)}g F
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMeal(meal.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MealHistory;
