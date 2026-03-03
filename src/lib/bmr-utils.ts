// Mifflin-St Jeor BMR Calculator
// For women: BMR = 10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161

export const ACTIVITY_MULTIPLIERS: Record<string, { label: string; factor: number }> = {
  sedentary: { label: 'Sedentary (office job)', factor: 1.2 },
  light: { label: 'Lightly Active (1-3 days/week)', factor: 1.375 },
  moderate: { label: 'Moderately Active (3-5 days/week)', factor: 1.55 },
  active: { label: 'Very Active (6-7 days/week)', factor: 1.725 },
  extreme: { label: 'Extremely Active (athlete)', factor: 1.9 },
};

export function calculateBMR(weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

export function calculateTDEE(bmr: number, activityLevel: string, adaptiveMetabolism: boolean): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel]?.factor ?? 1.2;
  let tdee = bmr * multiplier;
  if (adaptiveMetabolism) {
    tdee *= 0.9; // 10% reduction for plateau
  }
  return Math.round(tdee);
}

export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function projectWeight(
  currentWeight: number,
  tdee: number,
  targetCalories: number,
  weeks: number
): number {
  // 1 kg of fat ≈ 7700 kcal deficit
  const dailyDeficit = tdee - targetCalories;
  const totalDeficit = dailyDeficit * weeks * 7;
  const weightLoss = totalDeficit / 7700;
  return Math.max(currentWeight - weightLoss, 40);
}

export function calculateProteinRange(weightKg: number): { min: number; max: number } {
  return {
    min: Math.round(weightKg * 1.6),
    max: Math.round(weightKg * 2.2),
  };
}

export function getLevel(points: number): { level: number; name: string; nextThreshold: number } {
  const levels = [
    { level: 1, name: 'Start', threshold: 0 },
    { level: 2, name: 'Foundation', threshold: 50 },
    { level: 3, name: 'Building', threshold: 150 },
    { level: 4, name: 'Momentum', threshold: 300 },
    { level: 5, name: 'Metabolism Activated', threshold: 500 },
    { level: 6, name: 'Consistency', threshold: 750 },
    { level: 7, name: 'Strength', threshold: 1050 },
    { level: 8, name: 'Transformation', threshold: 1400 },
    { level: 9, name: 'Elite', threshold: 1800 },
    { level: 10, name: 'Definition Phase', threshold: 2500 },
  ];

  let current = levels[0];
  for (const l of levels) {
    if (points >= l.threshold) current = l;
    else break;
  }

  const nextIdx = levels.findIndex((l) => l.level === current.level) + 1;
  const nextThreshold = nextIdx < levels.length ? levels[nextIdx].threshold : current.threshold;

  return { ...current, nextThreshold };
}

export const HUNGER_MESSAGES: Record<string, string> = {
  physical: "This sounds like genuine physical hunger. Listen to your body and nourish it with a balanced meal rich in protein and fiber.",
  emotional_low: "Your hunger seems more emotional than physical. Try a 5-minute breathing exercise or a short walk. The craving usually passes within 15 minutes.",
  emotional_mid: "This appears to be moderate emotional hunger. Ask yourself: What am I really feeling right now? Stress, boredom, or tiredness often masquerade as hunger.",
  emotional_high: "Strong emotional hunger detected. This is a great opportunity to practice cognitive restructuring. Write down what triggered this feeling, then choose one self-care activity instead.",
};
