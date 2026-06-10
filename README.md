# Fitshit

A web app for generating group calisthenics workouts with AI-style station planning.

## What it does

- Generates workouts for 3 simultaneous difficulty tracks:
  - Beginner
  - Intermediate
  - Advanced
- Uses configurable shared equipment and assigns stations with conflict checks
- Lets you set:
  - Workout name
  - Total duration
  - Work and transition intervals
- Saves workouts in browser storage
- Schedules workouts in an in-app calendar
- Runs live guided sessions with:
  - Countdown timer
  - Audible phase-change signals
  - Current exercise display
  - Next exercise preview

## Tech stack

- React
- TypeScript
- Vite

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically http://localhost:5173).

## Build

```bash
npm run build
```

## Notes

- Data persistence currently uses localStorage.
- The current "AI" planner is deterministic client-side logic that rotates non-conflicting stations.
- If you want true LLM generation, add a backend API route and call your model provider from there.
