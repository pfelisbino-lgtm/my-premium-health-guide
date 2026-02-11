import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { recipes, categoryLabels, type Recipe } from '@/data/recipes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Heart, Clock, Flame, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const categories = ['all', 'breakfast', 'lunch', 'dinner', 'snack', 'dessert'] as const;

const Recipes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [favIds, setFavIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('favorites').select('recipe_id').eq('user_id', user.id).then(({ data }) => {
      if (data) setFavIds(data.map((f) => f.recipe_id));
    });
  }, [user]);

  const toggleFav = async (recipeId: string) => {
    if (!user) return;
    if (favIds.includes(recipeId)) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('recipe_id', recipeId);
      setFavIds((prev) => prev.filter((id) => id !== recipeId));
      toast({ title: 'Removido dos favoritos' });
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, recipe_id: recipeId });
      setFavIds((prev) => [...prev, recipeId]);
      toast({ title: 'Adicionado aos favoritos ❤️' });
    }
  };

  const filtered = recipes.filter((r) => {
    const matchCat = category === 'all' || r.category === category;
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Receitas</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar receitas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategory(cat)}
            className="shrink-0"
          >
            {cat === 'all' ? 'Todas' : categoryLabels[cat]}
          </Button>
        ))}
      </div>

      {/* Recipe grid */}
      <div className="grid gap-3">
        {filtered.map((recipe) => (
          <Card key={recipe.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(recipe)}>
            <CardContent className="flex items-center gap-4 p-4">
              <span className="text-4xl">{recipe.image}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{recipe.title}</p>
                <p className="text-xs text-muted-foreground truncate">{recipe.description}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{recipe.prepTime} min</span>
                  <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" />{recipe.calories} kcal</span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFav(recipe.id); }}
                className="shrink-0 p-2"
              >
                <Heart className={`h-5 w-5 ${favIds.includes(recipe.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
              </button>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhuma receita encontrada.</p>
        )}
      </div>

      {/* Recipe detail sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-2xl">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-left">{selected.image} {selected.title}</SheetTitle>
                </div>
                <SheetDescription>{selected.description}</SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{categoryLabels[selected.category]}</Badge>
                  <Badge variant="outline">{selected.difficulty}</Badge>
                  {selected.restrictions.map((r) => (
                    <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                  ))}
                </div>

                {/* Nutrition */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Calorias', value: `${selected.calories}`, unit: 'kcal' },
                    { label: 'Proteína', value: `${selected.protein}`, unit: 'g' },
                    { label: 'Carbos', value: `${selected.carbs}`, unit: 'g' },
                    { label: 'Gordura', value: `${selected.fat}`, unit: 'g' },
                  ].map((n) => (
                    <div key={n.label} className="rounded-lg bg-muted p-2">
                      <p className="text-lg font-bold text-foreground">{n.value}</p>
                      <p className="text-[10px] text-muted-foreground">{n.unit}</p>
                      <p className="text-[10px] text-muted-foreground">{n.label}</p>
                    </div>
                  ))}
                </div>

                {/* Ingredients */}
                <div>
                  <h3 className="font-semibold mb-2">Ingredientes</h3>
                  <ul className="space-y-1">
                    {selected.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-0.5">•</span> {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Steps */}
                <div>
                  <h3 className="font-semibold mb-2">Modo de Preparo</h3>
                  <ol className="space-y-2">
                    {selected.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{i + 1}</span>
                        <span className="text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Recipes;
