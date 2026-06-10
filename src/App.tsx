import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'
type Category = 'strength' | 'endurance' | 'mobility' | 'power' | 'core'
type DifficultyMap<T> = Record<Difficulty, T>

type ExerciseOption = { name: string; categories: Category[] }

type Station = {
  id: string
  name: string
  equipmentKey: string
  equipmentLabel: string
  exercises: DifficultyMap<ExerciseOption[]>
}

type RoundExercise = {
  stationName: string
  equipmentLabel: string
  exercise: string
}

type WorkoutPlan = {
  id: string
  name: string
  totalDurationMin: number
  workSeconds: number
  transitionSeconds: number
  rounds: Array<DifficultyMap<RoundExercise>>
  createdAt: string
}

type ScheduleItem = { id: string; workoutId: string; scheduledAt: string }

type SessionState = {
  workoutId: string
  roundIndex: number
  phase: 'work' | 'transition' | 'done'
  remaining: number
  running: boolean
}

const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced']
const CATEGORIES: Category[] = ['strength', 'endurance', 'mobility', 'power', 'core']

const WORKOUT_STORAGE = 'fitshit.workouts'
const SCHEDULE_STORAGE = 'fitshit.schedule'

const STATIONS: Station[] = [
  {
    id: 'bodyweight',
    name: 'Bodyweight Flow',
    equipmentKey: 'bodyweight',
    equipmentLabel: 'Bodyweight',
    exercises: {
      Beginner: [
        { name: 'Incline Push-ups', categories: ['strength'] },
        { name: 'Air Squats', categories: ['strength', 'endurance'] },
        { name: 'Dead Bug Hold', categories: ['core', 'mobility'] },
      ],
      Intermediate: [
        { name: 'Push-ups', categories: ['strength'] },
        { name: 'Split Squats', categories: ['strength', 'mobility'] },
        { name: 'Mountain Climbers', categories: ['endurance', 'core'] },
      ],
      Advanced: [
        { name: 'Pike Push-ups', categories: ['strength'] },
        { name: 'Jump Squats', categories: ['power', 'endurance'] },
        { name: 'L-Sit Tuck', categories: ['core', 'mobility'] },
      ],
    },
  },
  {
    id: 'pullup',
    name: 'Pull Strength',
    equipmentKey: 'pullup_rig',
    equipmentLabel: 'Pull-up Rig',
    exercises: {
      Beginner: [
        { name: 'Band Assisted Rows', categories: ['strength'] },
        { name: 'Scapular Pulls', categories: ['mobility', 'strength'] },
        { name: 'Hanging Knee Raise', categories: ['core'] },
      ],
      Intermediate: [
        { name: 'Australian Pull-ups', categories: ['strength'] },
        { name: 'Chin-ups', categories: ['strength', 'power'] },
        { name: 'Toes to Bar Prep', categories: ['core'] },
      ],
      Advanced: [
        { name: 'Strict Pull-ups', categories: ['strength'] },
        { name: 'Chest to Bar Pull-ups', categories: ['power', 'strength'] },
        { name: 'Toes to Bar', categories: ['core'] },
      ],
    },
  },
  {
    id: 'bands',
    name: 'Band Control',
    equipmentKey: 'bands',
    equipmentLabel: 'Bands',
    exercises: {
      Beginner: [
        { name: 'Band Pull Apart', categories: ['mobility', 'strength'] },
        { name: 'Band Squat', categories: ['strength'] },
        { name: 'Band Press', categories: ['strength'] },
      ],
      Intermediate: [
        { name: 'Band Row', categories: ['strength'] },
        { name: 'Band Push-up Plus', categories: ['strength', 'core'] },
        { name: 'Band Face Pull', categories: ['mobility'] },
      ],
      Advanced: [
        { name: 'Band Speed Press', categories: ['power'] },
        { name: 'Band Resisted Lunge', categories: ['strength'] },
        { name: 'Band Rotational Pull', categories: ['core', 'mobility'] },
      ],
    },
  },
]

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const loadJSON = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

const parseKettlebells = (input: string) =>
  [...new Set(input.split(',').map((x) => Number(x.trim())).filter((x) => Number.isFinite(x) && x > 0))].sort(
    (a, b) => a - b,
  )

const score = (option: ExerciseOption, levels: Record<Category, 1 | 2 | 3>) =>
  option.categories.reduce((sum, cat) => sum + levels[cat], 0)

const monthName = (date: Date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

function App() {
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>(() => loadJSON(WORKOUT_STORAGE, []))
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => loadJSON(SCHEDULE_STORAGE, []))

  const [name, setName] = useState('Team Session Alpha')
  const [duration, setDuration] = useState(36)
  const [workSec, setWorkSec] = useState(45)
  const [transitionSec, setTransitionSec] = useState(15)
  const [pullups, setPullups] = useState(1)
  const [bands, setBands] = useState(2)
  const [dbPairs, setDbPairs] = useState(2)
  const [dbMin, setDbMin] = useState(5)
  const [dbMax, setDbMax] = useState(25)
  const [kbInput, setKbInput] = useState('8,12,16')
  const [levels, setLevels] = useState<Record<Category, 1 | 2 | 3>>({
    strength: 3,
    endurance: 2,
    mobility: 2,
    power: 2,
    core: 2,
  })

  const [generated, setGenerated] = useState<WorkoutPlan | null>(null)
  const [note, setNote] = useState('')
  const [scheduleWorkoutId, setScheduleWorkoutId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [session, setSession] = useState<SessionState | null>(null)

  useEffect(() => localStorage.setItem(WORKOUT_STORAGE, JSON.stringify(workouts)), [workouts])
  useEffect(() => localStorage.setItem(SCHEDULE_STORAGE, JSON.stringify(schedule)), [schedule])

  useEffect(() => {
    if (!session?.running) return
    const id = window.setInterval(() => {
      setSession((cur) => {
        if (!cur || !cur.running || cur.phase === 'done') return cur
        const workout = workouts.find((w) => w.id === cur.workoutId)
        if (!workout) return { ...cur, phase: 'done', running: false, remaining: 0 }
        if (cur.remaining > 1) return { ...cur, remaining: cur.remaining - 1 }
        if (cur.phase === 'work') return { ...cur, phase: 'transition', remaining: workout.transitionSeconds }
        if (cur.roundIndex + 1 >= workout.rounds.length) return { ...cur, phase: 'done', running: false, remaining: 0 }
        return { ...cur, phase: 'work', roundIndex: cur.roundIndex + 1, remaining: workout.workSeconds }
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [session?.running, workouts])

  const selectedSessionWorkout = useMemo(() => workouts.find((w) => w.id === session?.workoutId), [session?.workoutId, workouts])

  const scheduleByDay = useMemo(() => {
    const grouped = new Map<string, Array<ScheduleItem & { workoutName: string }>>()
    schedule.forEach((s) => {
      const key = s.scheduledAt.slice(0, 10)
      const workout = workouts.find((w) => w.id === s.workoutId)
      if (!workout) return
      const list = grouped.get(key) ?? []
      list.push({ ...s, workoutName: workout.name })
      grouped.set(key, list)
    })
    return grouped
  }, [schedule, workouts])

  const calendarGrid = useMemo(() => {
    const start = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1)
    const end = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0)
    const days: Date[] = []
    for (let i = 0; i < start.getDay(); i += 1) {
      const d = new Date(start)
      d.setDate(d.getDate() - (start.getDay() - i))
      days.push(d)
    }
    for (let d = 1; d <= end.getDate(); d += 1) days.push(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), d))
    while (days.length % 7 !== 0) {
      const d = new Date(days[days.length - 1])
      d.setDate(d.getDate() + 1)
      days.push(d)
    }
    return days
  }, [calendarDate])

  const generatePlan = () => {
    if (dbMax <= dbMin) return setNote('Dumbbell max must be greater than min.')
    const kbWeights = parseKettlebells(kbInput)
    if (kbWeights.length === 0) return setNote('Add kettlebell weights, for example: 8,12,16.')

    const bodyweight = STATIONS.find((s) => s.id === 'bodyweight')!
    const pull = STATIONS.find((s) => s.id === 'pullup')!
    const band = STATIONS.find((s) => s.id === 'bands')!

    const instances: Station[] = [
      { ...bodyweight, id: 'bw-1', equipmentLabel: 'Bodyweight Lane 1' },
      { ...bodyweight, id: 'bw-2', equipmentLabel: 'Bodyweight Lane 2' },
      ...Array.from({ length: pullups }, (_, i) => ({ ...pull, id: `pull-${i + 1}`, equipmentLabel: `Pull-up Rig ${i + 1}` })),
      ...Array.from({ length: bands }, (_, i) => ({ ...band, id: `band-${i + 1}`, equipmentLabel: `Band Set ${i + 1}` })),
      ...Array.from({ length: dbPairs }, (_, i) => ({ ...bodyweight, id: `db-${i + 1}`, name: 'Dumbbell Engine', equipmentKey: 'dumbbells', equipmentLabel: `Adjustable DB ${i + 1} (${dbMin}-${dbMax}kg)` })),
      ...kbWeights.map((w, i) => ({ ...bodyweight, id: `kb-${i + 1}`, name: 'Kettlebell Power', equipmentKey: 'kettlebell', equipmentLabel: `Kettlebell ${w}kg` })),
    ]

    if (instances.length < 3) return setNote('Need at least 3 station slots to avoid conflicts.')

    const roundsCount = Math.max(1, Math.floor((duration * 60) / Math.max(20, workSec + transitionSec)))
    const rounds: Array<DifficultyMap<RoundExercise>> = []

    for (let r = 0; r < roundsCount; r += 1) {
      const usage: Record<string, number> = {}
      const round = {} as DifficultyMap<RoundExercise>
      DIFFICULTIES.forEach((difficulty, idx) => {
        const station = instances[(r + idx) % instances.length]
        const list = station.exercises[difficulty]
          .map((opt) => ({ opt, s: score(opt, levels) }))
          .sort((a, b) => b.s - a.s)
          .map((x) => x.opt)
        usage[station.equipmentKey] = (usage[station.equipmentKey] ?? 0) + 1
        round[difficulty] = {
          stationName: station.name,
          equipmentLabel: station.equipmentLabel,
          exercise: list[r % list.length].name,
        }
      })
      const conflict = Object.entries(usage).some(([k, used]) =>
        k === 'dumbbells' ? used > dbPairs : k === 'kettlebell' ? used > kbWeights.length : k === 'pullup_rig' ? used > pullups : k === 'bands' ? used > bands : false,
      )
      if (conflict) return setNote('Conflict detected. Increase equipment counts.')
      rounds.push(round)
    }

    const plan: WorkoutPlan = { id: uid(), name, totalDurationMin: duration, workSeconds: workSec, transitionSeconds: transitionSec, rounds, createdAt: new Date().toISOString() }
    setGenerated(plan)
    setNote(`Generated ${roundsCount} rounds with category-prioritized AI selection.`)
  }

  return (
    <div className="app-shell">
      <header className="hero-panel"><h1>Fitshit Planner</h1><p>Configure weights, AI category levels, and generate non-conflicting rounds.</p></header>
      <section className="panel grid-two">
        <div>
          <h2>Generator</h2>
          <label>Workout Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <div className="inline-inputs">
            <label>Duration<input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></label>
            <label>Work<input type="number" value={workSec} onChange={(e) => setWorkSec(Number(e.target.value))} /></label>
            <label>Transition<input type="number" value={transitionSec} onChange={(e) => setTransitionSec(Number(e.target.value))} /></label>
          </div>
          <div className="inline-inputs">
            <label>DB Pairs<input type="number" value={dbPairs} onChange={(e) => setDbPairs(Number(e.target.value))} /></label>
            <label>DB Min kg<input type="number" value={dbMin} onChange={(e) => setDbMin(Number(e.target.value))} /></label>
            <label>DB Max kg<input type="number" value={dbMax} onChange={(e) => setDbMax(Number(e.target.value))} /></label>
          </div>
          <label>Kettlebell Weights (kg)<input value={kbInput} onChange={(e) => setKbInput(e.target.value)} /></label>
          <div className="inline-inputs">
            <label>Pull-up Rigs<input type="number" value={pullups} onChange={(e) => setPullups(Number(e.target.value))} /></label>
            <label>Band Sets<input type="number" value={bands} onChange={(e) => setBands(Number(e.target.value))} /></label>
            <span></span>
          </div>
          <h3>AI Category Levels</h3>
          <div className="equipment-grid">
            {CATEGORIES.map((cat) => (
              <label key={cat}>{cat}<select value={levels[cat]} onChange={(e) => setLevels((cur) => ({ ...cur, [cat]: Number(e.target.value) as 1 | 2 | 3 }))}><option value={1}>Low</option><option value={2}>Medium</option><option value={3}>High</option></select></label>
            ))}
          </div>
          <div className="button-row"><button onClick={generatePlan}>Generate AI Workout</button><button className="secondary" disabled={!generated} onClick={() => generated && setWorkouts((cur) => [generated, ...cur])}>Save Workout</button></div>
          <p className="note">{note}</p>
        </div>
        <div>
          <h2>Rounds Preview</h2>
          <div className="rounds-scroll">
            {generated?.rounds.map((round, i) => (
              <div className="round-card" key={i}><h4>Round {i + 1}</h4>{DIFFICULTIES.map((d) => <p key={d}><span>{d}:</span> {round[d].exercise} ({round[d].equipmentLabel})</p>)}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel grid-two">
        <div>
          <h2>Schedule</h2>
          <label>Workout<select value={scheduleWorkoutId} onChange={(e) => setScheduleWorkoutId(e.target.value)}><option value="">Select workout</option>{workouts.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
          <label>Date & Time<input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></label>
          <button disabled={!scheduleWorkoutId || !scheduledAt} onClick={() => { setSchedule((cur) => [{ id: uid(), workoutId: scheduleWorkoutId, scheduledAt: new Date(scheduledAt).toISOString() }, ...cur]); setScheduledAt('') }}>Add to Calendar</button>
          <div className="saved-list">{workouts.map((w) => <article key={w.id} className="saved-item"><div><strong>{w.name}</strong><p>{w.rounds.length} rounds</p></div><button className="secondary" onClick={() => setSession({ workoutId: w.id, roundIndex: 0, phase: 'work', remaining: w.workSeconds, running: true })}>Start</button></article>)}</div>
        </div>
        <div>
          <h2>{monthName(calendarDate)}</h2>
          <div className="calendar-head"><button className="secondary" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}>Prev</button><button className="secondary" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}>Next</button></div>
          <div className="calendar-grid">{calendarGrid.map((d) => { const key = d.toISOString().slice(0, 10); const events = scheduleByDay.get(key) ?? []; return <article key={key} className={`day-cell ${d.getMonth() === calendarDate.getMonth() ? 'current' : 'outside'}`}><span className="day-number">{d.getDate()}</span>{events.slice(0, 2).map((e) => <p key={e.id} className="event-pill">{e.workoutName}</p>)}</article> })}</div>
        </div>
      </section>

      <section className="panel">
        <h2>Live Session</h2>
        {!session || !selectedSessionWorkout ? <p className="empty">Start a workout.</p> : (
          <div className="session-layout">
            <div className="session-main"><p className="phase">{session.phase.toUpperCase()}</p><p className="countdown">{session.remaining}s</p><div className="button-row"><button className="secondary" disabled={session.phase === 'done'} onClick={() => setSession((c) => c ? { ...c, running: !c.running } : c)}>{session.running ? 'Pause' : 'Resume'}</button><button className="secondary" onClick={() => setSession(null)}>Stop</button></div></div>
            <div className="session-cards">{DIFFICULTIES.map((d) => { const cur = selectedSessionWorkout.rounds[session.roundIndex]?.[d]; const next = selectedSessionWorkout.rounds[session.roundIndex + 1]?.[d]; if (!cur) return null; return <article key={d} className="difficulty-card"><h4>{d}</h4><p className="exercise-name">{cur.exercise}</p><p className="station">Current: {cur.stationName}</p><p className="equipment">Equipment: {cur.equipmentLabel}</p><p className="next-preview">Next: {next ? `${next.exercise} (${next.stationName})` : 'Session complete'}</p></article> })}</div>
          </div>
        )}
      </section>
    </div>
  )
}

export default App
