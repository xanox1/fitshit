import OpenAI from 'openai';
import type { AppSettings, WorkoutPlan, WorkoutRound, Exercise } from '../types';

function getAvailableWeights(settings: AppSettings): string {
  const { equipment } = settings;
  const parts: string[] = [];

  if (equipment.bodyweight) parts.push('bodyweight exercises');
  if (equipment.pullUpBar) parts.push('pull-up bar');
  if (equipment.resistanceBands) parts.push('resistance bands');
  if (equipment.barbell) parts.push('barbell');
  if (equipment.bench) parts.push('bench');
  if (equipment.cableMachine) parts.push('cable machine');

  if (equipment.adjustableDumbbells) {
    const { minWeight, maxWeight, increment, unit } = equipment.dumbbellConfig;
    const weights: number[] = [];
    for (let w = minWeight; w <= maxWeight; w += increment) {
      weights.push(w);
    }
    parts.push(
      `adjustable dumbbells (available weights: ${weights.join(', ')} ${unit})`
    );
  }

  if (equipment.kettlebells && equipment.kettlebellConfig.weights.length > 0) {
    const { weights, unit } = equipment.kettlebellConfig;
    parts.push(`kettlebells (available weights: ${weights.join(', ')} ${unit})`);
  }

  return parts.length > 0 ? parts.join(', ') : 'bodyweight only';
}

function getCategoryLevelsSummary(settings: AppSettings): string {
  return settings.categoryLevels
    .map((cl) => `${cl.category}: ${cl.level}`)
    .join(', ');
}

export async function generateWorkoutPlan(
  settings: AppSettings,
  focusAreas: string,
  numberOfRounds: number
): Promise<WorkoutPlan> {
  if (!settings.openAiApiKey) {
    throw new Error('Please enter your OpenAI API key in Settings.');
  }

  const client = new OpenAI({
    apiKey: settings.openAiApiKey,
    dangerouslyAllowBrowser: true,
  });

  const availableEquipment = getAvailableWeights(settings);
  const categoryLevels = getCategoryLevelsSummary(settings);

  const prompt = `You are a professional fitness coach creating a calisthenics and strength workout plan.

User equipment: ${availableEquipment}

Category fitness levels: ${categoryLevels}

Requested focus: ${focusAreas || 'full body'}

Generate a workout plan with exactly ${numberOfRounds} rounds/circuits. For each exercise, suggest specific weights if applicable based on the available equipment and user level.

Return ONLY valid JSON matching this exact structure (no markdown, no extra text):
{
  "title": "Workout title",
  "description": "Brief description",
  "totalDuration": "Estimated total time e.g. 45 min",
  "warmup": [
    { "name": "Exercise name", "sets": 1, "reps": "30 sec", "rest": "0 sec", "category": "mobility", "notes": "optional tip" }
  ],
  "rounds": [
    {
      "roundNumber": 1,
      "name": "Round name",
      "duration": "estimated duration",
      "exercises": [
        { "name": "Exercise", "sets": 3, "reps": "10-12", "weight": "15 kg", "rest": "60 sec", "category": "push", "notes": "optional" }
      ]
    }
  ],
  "cooldown": [
    { "name": "Stretch", "sets": 1, "reps": "30 sec", "rest": "0 sec", "category": "mobility" }
  ]
}

Categories must be one of: push, pull, legs, core, cardio, mobility.
Weight field should only be included when using equipment. Tailor exercise difficulty to the specified level for each category.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2500,
  });

  const content = response.choices[0]?.message?.content ?? '';

  let parsed: Partial<WorkoutPlan>;
  try {
    parsed = JSON.parse(content);
  } catch {
    // Try extracting JSON from the response if wrapped in markdown
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      parsed = JSON.parse(match[1]);
    } else {
      throw new Error('AI returned an unexpected response format. Please try again.');
    }
  }

  const plan: WorkoutPlan = {
    id: crypto.randomUUID(),
    title: parsed.title ?? 'Workout Plan',
    description: parsed.description ?? '',
    rounds: (parsed.rounds ?? []) as WorkoutRound[],
    totalDuration: parsed.totalDuration,
    warmup: (parsed.warmup ?? []) as Exercise[],
    cooldown: (parsed.cooldown ?? []) as Exercise[],
    createdAt: new Date().toISOString(),
  };

  return plan;
}
