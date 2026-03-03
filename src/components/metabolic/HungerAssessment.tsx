import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { HUNGER_MESSAGES } from '@/lib/bmr-utils';
import { Brain, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Props { userId: string; }

const HungerAssessment = ({ userId }: Props) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'question' | 'index' | 'result'>('question');
  const [wouldEat, setWouldEat] = useState<boolean | null>(null);
  const [hungerIndex, setHungerIndex] = useState([5]);
  const [message, setMessage] = useState('');

  const handleAnswer = async (answer: boolean) => {
    setWouldEat(answer);
    if (answer) {
      setMessage(HUNGER_MESSAGES.physical);
      setStep('result');
      await saveAssessment(answer, 8);
    } else {
      setStep('index');
    }
  };

  const handleIndexSubmit = async () => {
    const idx = hungerIndex[0];
    let msg = HUNGER_MESSAGES.emotional_low;
    if (idx >= 4 && idx <= 6) msg = HUNGER_MESSAGES.emotional_mid;
    if (idx >= 7) msg = HUNGER_MESSAGES.emotional_high;
    setMessage(msg);
    setStep('result');
    await saveAssessment(false, idx);
  };

  const saveAssessment = async (chicken: boolean, idx: number) => {
    await supabase.from('hunger_assessments').insert({
      user_id: userId,
      would_eat_chicken: chicken,
      hunger_index: idx,
    });
    // Award points
    const { data } = await supabase.from('profiles').select('points').eq('user_id', userId).single();
    if (data) {
      await supabase.from('profiles').update({ points: data.points + 5 }).eq('user_id', userId);
    }
  };

  const reset = () => {
    setStep('question');
    setWouldEat(null);
    setHungerIndex([5]);
    setMessage('');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4 text-primary" />
          Physical vs. Emotional Hunger
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === 'question' && (
          <div className="space-y-4 text-center">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium text-foreground">Would you eat a plain grilled chicken breast right now?</p>
              <p className="text-xs text-muted-foreground mt-1">This test helps distinguish physical from emotional hunger</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => handleAnswer(true)} variant="outline" className="flex-1 h-14 flex-col gap-1">
                <ThumbsUp className="h-5 w-5 text-primary" />
                <span className="text-xs">Yes, I would</span>
              </Button>
              <Button onClick={() => handleAnswer(false)} variant="outline" className="flex-1 h-14 flex-col gap-1">
                <ThumbsDown className="h-5 w-5 text-destructive" />
                <span className="text-xs">No, not really</span>
              </Button>
            </div>
          </div>
        )}

        {step === 'index' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium text-foreground">How intense is your craving right now?</p>
              <p className="text-xs text-muted-foreground mt-1">Rate your hunger on a scale of 1–10</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mild</span>
                <span className="font-bold text-primary text-lg">{hungerIndex[0]}</span>
                <span>Intense</span>
              </div>
              <Slider value={hungerIndex} onValueChange={setHungerIndex} min={1} max={10} step={1} />
            </div>
            <Button onClick={handleIndexSubmit} className="w-full" size="sm">Get My Analysis</Button>
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-4">
            <div className={`rounded-lg p-4 ${wouldEat ? 'bg-primary/10 border-primary/20' : 'bg-accent/10 border-accent/20'} border`}>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {wouldEat ? '🟢 Physical Hunger Detected' : `🔵 Emotional Hunger · Index: ${hungerIndex[0]}/10`}
              </p>
              <p className="text-sm text-foreground">{message}</p>
            </div>
            <Button onClick={reset} variant="outline" className="w-full" size="sm">Take Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HungerAssessment;
