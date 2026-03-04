import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NutritionResult {
  meal_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  foods_detected: string[];
  notes?: string;
}

interface MealScannerProps {
  userId: string;
}

const MealScanner = ({ userId }: MealScannerProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const PROTEIN_GOAL_MIN = 90; // grams per day for women 40+

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setResult(null);
    setSaved(false);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!imageFile) return;
    setAnalyzing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const { data, error } = await supabase.functions.invoke('analyze-meal', {
        body: { imageBase64: base64, mimeType: imageFile.type },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data as NutritionResult);
    } catch (err: any) {
      toast({
        title: 'Analysis Failed',
        description: err.message || 'Could not analyze the meal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const saveMeal = async () => {
    if (!result) return;
    setSaving(true);
    try {
      // Upload image if available
      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() || 'jpg';
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('meal-photos').upload(path, imageFile);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('meal-photos').getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from('meal_logs').insert({
        user_id: userId,
        meal_name: result.meal_name,
        calories: result.calories,
        protein_g: result.protein_g,
        carbs_g: result.carbs_g,
        fats_g: result.fats_g,
        ai_notes: result.notes || null,
        image_url: imageUrl,
      });

      if (error) throw error;

      setSaved(true);
      toast({ title: 'Meal Saved!', description: `${result.meal_name} has been logged.` });
    } catch (err: any) {
      toast({
        title: 'Save Failed',
        description: err.message || 'Could not save the meal.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setImagePreview(null);
    setImageFile(null);
    setResult(null);
    setSaved(false);
  };

  const proteinLow = result && result.protein_g < 25;

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Scan Your Meal
          </CardTitle>
          <CardDescription>
            Take a photo or upload an image to get instant nutritional analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Meal preview"
                className="w-full max-h-64 object-cover rounded-lg border"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
                onClick={reset}
              >
                <RotateCcw className="h-4 w-4 mr-1" /> New Photo
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 border-dashed border-2"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-6 w-6 text-primary" />
                <span className="text-xs">Take Photo</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 border-dashed border-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 text-primary" />
                <span className="text-xs">Upload Image</span>
              </Button>
            </div>
          )}

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {imagePreview && !result && (
            <Button onClick={analyzeImage} disabled={analyzing} className="w-full">
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                'Analyze Meal'
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{result.meal_name}</CardTitle>
            {result.foods_detected?.length > 0 && (
              <CardDescription>
                Detected: {result.foods_detected.join(', ')}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Macro Cards */}
            <div className="grid grid-cols-2 gap-3">
              <MacroCard label="Calories" value={result.calories} unit="kcal" color="text-orange-600" bgColor="bg-orange-50" />
              <MacroCard label="Protein" value={result.protein_g} unit="g" color="text-blue-600" bgColor="bg-blue-50" />
              <MacroCard label="Carbs" value={result.carbs_g} unit="g" color="text-amber-600" bgColor="bg-amber-50" />
              <MacroCard label="Fats" value={result.fats_g} unit="g" color="text-purple-600" bgColor="bg-purple-50" />
            </div>

            {/* Macro Distribution Bar */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Macro Distribution</p>
              <div className="flex h-3 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500"
                  style={{ width: `${macroPercent(result.protein_g, 4, result)}%` }}
                  title={`Protein ${macroPercent(result.protein_g, 4, result).toFixed(0)}%`}
                />
                <div
                  className="bg-amber-400"
                  style={{ width: `${macroPercent(result.carbs_g, 4, result)}%` }}
                  title={`Carbs ${macroPercent(result.carbs_g, 4, result).toFixed(0)}%`}
                />
                <div
                  className="bg-purple-400"
                  style={{ width: `${macroPercent(result.fats_g, 9, result)}%` }}
                  title={`Fats ${macroPercent(result.fats_g, 9, result).toFixed(0)}%`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-blue-500" />Protein</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber-400" />Carbs</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-purple-400" />Fats</span>
              </div>
            </div>

            {/* Protein Warning */}
            {proteinLow && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Low Protein Alert</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    This meal has only {result.protein_g}g of protein. Women 40+ need ~{PROTEIN_GOAL_MIN}g daily.
                    Consider adding 20g+ more protein (e.g. Greek yogurt, chicken, eggs) to reach your daily goal.
                  </p>
                </div>
              </div>
            )}

            {result.notes && (
              <p className="text-sm text-muted-foreground italic">{result.notes}</p>
            )}

            {/* Save Button */}
            <Button
              onClick={saveMeal}
              disabled={saving || saved}
              className="w-full"
              variant={saved ? 'secondary' : 'default'}
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : saved ? (
                '✓ Meal Saved'
              ) : (
                <><Save className="h-4 w-4" /> Save to Daily Log</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function macroPercent(grams: number, calPerGram: number, result: NutritionResult): number {
  const total = result.protein_g * 4 + result.carbs_g * 4 + result.fats_g * 9;
  if (total === 0) return 0;
  return (grams * calPerGram / total) * 100;
}

function MacroCard({ label, value, unit, color, bgColor }: {
  label: string; value: number; unit: string; color: string; bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-lg p-3 text-center`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${color}`}>
        {Math.round(value)}
        <span className="text-xs font-normal ml-0.5">{unit}</span>
      </p>
    </div>
  );
}

export default MealScanner;
