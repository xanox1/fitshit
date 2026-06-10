# fitshit

A web-based AI-powered calisthenics & strength workout planner.

## Features

- **AI Workout Generation** — Describe your focus areas and the AI generates a full workout plan with sets, reps, and weights matched to your equipment.
- **Equipment Configuration**
  - Toggle individual equipment on/off (bodyweight, pull-up bar, resistance bands, barbell, bench, cable machine)
  - **Adjustable Dumbbells** — Set a min weight, max weight, and increment. The app derives all available weight steps and passes them to the AI.
  - **Kettlebells** — Add or remove individual kettlebell weights (e.g. 8 kg, 12 kg, 16 kg). Switch between kg / lbs.
- **Fitness Levels per Category** — Set Beginner / Intermediate / Advanced independently for Push, Pull, Legs, Core, Cardio, and Mobility. The AI tailors exercise difficulty for each category.
- **Scrollable Rounds Preview** — All generated rounds are shown in a scrollable, collapsible list — no cap on the number of rounds.
- **Weekly Schedule** — Add any generated workout to a day of the week and manage your training week visually.
- **Interval Timer** — Configurable rounds, work time, and rest time with a visual progress bar.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Configuration

1. Navigate to **Settings** and enter your OpenAI API key (`sk-...`).
   Your key is stored only in your browser's `localStorage` — it is never sent to any server other than OpenAI directly.
2. Go to **Equipment** and configure your available gear, including dumbbell weight ranges and kettlebell weights.
3. Go to **Levels** and set your current fitness level for each exercise category.
4. Go to **Generate** and click **Generate Workout**.

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- OpenAI SDK (`gpt-4o-mini`)
- Lucide React icons
