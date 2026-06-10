import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'
type DifficultyMap<T> = Record<Difficulty, T>

type Station = {
  id: string
  name: string
  equipmentKey: string
  equipmentLabel: string
  exercises: DifficultyMap<string[]>
}

type RoundExercise = {
  stationId: string
  stationName: string
  equipmentKey: string
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
  equipmentConfig: Record<string, number>
  createdAt: string
}

type ScheduleItem = {
  id: string
  workoutId: string
  scheduledAt: string
}

type SessionState = {
  workoutId: string
  roundIndex: number
  phase: 'work' | 'transition' | 'done'
  remaining: number
  running: boolean
}

const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced']

const EQUIPMENT_DEFS = [
  { key: 'pullup_rig', label: 'Pull-up Rig / Bar', defaultCount: 1 },
  { key: 'dumbbells', label: 'Dumbbell Set', defaultCount: 2 },
  { key: 'kettlebell', label: 'Kettlebell', defaultCount: 1 },
  { key: 'bands', label: 'Resistance Bands', defaultCount: 2 },
  { key: 'box', label: 'Plyo Box', defaultCount: 1 },
  { key: 'bench', label: 'Bench', defaultCount: 1 },
  { key: 'jump_rope', label: 'Jump Rope', defaultCount: 2 },
  { key: 'rings', label: 'Gym Rings', defaultCount: 1 },
] as const

const STATIONS: Station[] = [
  {
    id: 'bodyweight-flow',
    name: 'Bodyweight Flow',
    equipmentKey: 'bodyweight',
    equipmentLabel: 'Bodyweight',
    exercises: {
      Beginner: ['Incline Push-ups', 'Air Squats', 'Dead Bug Hold', 'Glute Bridge'],
      Intermediate: ['Push-ups', 'Split Squats', 'Mountain Climbers', 'Hollow Hold'],
      Advanced: ['Pike Push-ups', 'Jump Squats', 'Burpee Broad Jump', 'L-Sit Tuck'],
    },
  },
  {
    id: 'pull-station',
    name: 'Pull Strength',
    equipmentKey: 'pullup_rig',
    equipmentLabel: 'Pull-up Rig / Bar',
    exercises: {
      Beginner: ['Band Assisted Rows', 'Scapular Pulls', 'Hanging Knee Raise'],
      Intermediate: ['Australian Pull-ups', 'Chin-ups', 'Toes to Bar Prep'],
      Advanced: ['Strict Pull-ups', 'Chest to Bar Pull-ups', 'Toes to Bar'],
    },
  },
  {
    id: 'dumbbell-station',
    name: 'Dumbbell Engine',
    equipmentKey: 'dumbbells',
    equipmentLabel: 'Dumbbell Set',
    exercises: {
      Beginner: ['DB Goblet Squat', 'DB Floor Press', 'DB Romanian Deadlift'],
      Intermediate: ['DB Thruster', 'DB Push Press', 'DB Reverse Lunge'],
      Advanced: ['DB Devil Press', 'DB Snatch Alternating', 'DB Front Squat Complex'],
    },
  },
  {
    id: 'kettlebell-station',
    name: 'Kettlebell Power',
    equipmentKey: 'kettlebell',
    equipmentLabel: 'Kettlebell',
    exercises: {
      Beginner: ['KB Deadlift', 'KB Halo', 'KB Suitcase Carry'],
      Intermediate: ['KB Swing', 'KB Clean', 'KB Front Rack March'],
      Advanced: ['KB Swing to High Pull', 'KB Clean and Press', 'KB Snatch'],
    },
  },
  {
    id: 'band-station',
    name: 'Band Control',
    equipmentKey: 'bands',
    equipmentLabel: 'Resistance Bands',
    exercises: {
      Beginner: ['Band Pull Apart', 'Band Squat', 'Band Overhead Press'],
      Intermediate: ['Band Row', 'Band Push-up Plus', 'Band Face Pull'],
      Advanced: ['Band Speed Press', 'Band Resisted Lunge', 'Band Rotational Pull'],
    },
  },
  {
    id: 'box-station',
    name: 'Plyo Box Conditioning',
    equipmentKey: 'box',
    equipmentLabel: 'Plyo Box',
    exercises: {
      Beginner: ['Step-up', 'Box Supported Squat', 'Seated Box Stand'],
      Intermediate: ['Box Step-over', 'Box Jump Low', 'Box Lateral Step'],
      Advanced: ['Box Jump Overs', 'Depth Drop to Jump', 'Explosive Step-over Sprint'],
    },
  },
  {
    id: 'bench-station',
    name: 'Bench Core + Strength',
    equipmentKey: 'bench',
    equipmentLabel: 'Bench',
    exercises: {
      Beginner: ['Bench Incline Push-up', 'Bench Hip Thrust', 'Bench Knee Tuck'],
      Intermediate: ['Bench Dips', 'Bench Bulgarian Split Squat', 'Bench Toe Touch'],
      Advanced: ['Bench Decline Push-up', 'Bench Plyo Split Squat', 'Bench V-up'],
    },
  },
  {
    id: 'rope-station',
    name: 'Rope Cardio',
    equipmentKey: 'jump_rope',
    equipmentLabel: 'Jump Rope',
    exercises: {
      Beginner: ['Basic Bounce', 'Alternating Step Rope', 'Rope March'],
      Intermediate: ['Single Unders', 'High Knees Rope', 'Side Swing to Jump'],
      Advanced: ['Double Unders', 'Cross Over Rope', 'Sprint Single Under'],
    },
  },
  {
    id: 'rings-station',
    name: 'Rings Stability',
    equipmentKey: 'rings',
    equipmentLabel: 'Gym Rings',
    exercises: {
      Beginner: ['Ring Row Hold', 'Ring Support Lean', 'Ring Assisted Squat'],
      Intermediate: ['Ring Rows', 'Ring Push-up', 'Ring Knee Raise'],
      Advanced: ['Ring Archer Row', 'Ring Dip', 'Ring L-sit Tuck'],
    },
  },
]

const WORKOUT_STORAGE = 'fitshit.workouts'
const SCHEDULE_STORAGE = 'fitshit.schedule'

const defaultEquipmentConfig = EQUIPMENT_DEFS.reduce<Record<string, number>>(
  (acc, current) => {
    acc[current.key] = current.defaultCount
    return acc
  },
  {},
)

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const loadJSON = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

const beep = (frequency = 880, duration = 0.12) => {
  const AudioContextClass = window.AudioContext
  if (!AudioContextClass) {
    return
  }

  const context = new AudioContextClass()
  const oscillator = context.createOscillator()
  const gainNode = context.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  gainNode.gain.value = 0.12

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)

  oscillator.start()
  oscillator.stop(context.currentTime + duration)
  oscillator.onended = () => {
    void context.close()
  }
}

const monthName = (date: Date) =>
  date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

function App() {
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>(() =>
    loadJSON<WorkoutPlan[]>(WORKOUT_STORAGE, []),
  )
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() =>
    loadJSON<ScheduleItem[]>(SCHEDULE_STORAGE, []),
  )

  const [equipmentConfig, setEquipmentConfig] =
    useState<Record<string, number>>(defaultEquipmentConfig)
  const [workoutName, setWorkoutName] = useState('Team Session Alpha')
  const [durationMin, setDurationMin] = useState(36)
  const [workSeconds, setWorkSeconds] = useState(45)
  const [transitionSeconds, setTransitionSeconds] = useState(15)
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlan | null>(null)
  const [generatorNote, setGeneratorNote] = useState('')

  const [scheduleWorkoutId, setScheduleWorkoutId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [calendarDate, setCalendarDate] = useState(() => new Date())

  const [session, setSession] = useState<SessionState | null>(null)

  useEffect(() => {
    localStorage.setItem(WORKOUT_STORAGE, JSON.stringify(workouts))
  }, [workouts])

  useEffect(() => {
    localStorage.setItem(SCHEDULE_STORAGE, JSON.stringify(schedule))
  }, [schedule])

  useEffect(() => {
    if (!session?.running) {
      return
    }

    const timer = window.setInterval(() => {
      setSession((current) => {
        if (!current || !current.running || current.phase === 'done') {
          return current
        }

        const workout = workouts.find((item) => item.id === current.workoutId)
        if (!workout) {
          return { ...current, running: false, phase: 'done', remaining: 0 }
        }

        if (current.remaining > 1) {
          if (current.remaining <= 4) {
            beep(660, 0.07)
          }
          return { ...current, remaining: current.remaining - 1 }
        }

        if (current.phase === 'work') {
          beep(1046, 0.14)
          return {
            ...current,
            phase: 'transition',
            remaining: workout.transitionSeconds,
          }
        }

        if (current.roundIndex + 1 >= workout.rounds.length) {
          beep(1318, 0.2)
          return {
            ...current,
            phase: 'done',
            running: false,
            remaining: 0,
          }
        }

        beep(880, 0.14)
        return {
          ...current,
          phase: 'work',
          roundIndex: current.roundIndex + 1,
          remaining: workout.workSeconds,
        }
      })
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [session?.running, workouts])

  const selectedSessionWorkout = useMemo(
    () => workouts.find((workout) => workout.id === session?.workoutId),
    [session?.workoutId, workouts],
  )

  const calendarGrid = useMemo(() => {
    const monthStart = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1)
    const monthEnd = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0)
    const days: Date[] = []

    const startWeekday = monthStart.getDay()
    for (let i = 0; i < startWeekday; i += 1) {
      const date = new Date(monthStart)
      date.setDate(date.getDate() - (startWeekday - i))
      days.push(date)
    }

    for (let day = 1; day <= monthEnd.getDate(); day += 1) {
      days.push(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day))
    }

    while (days.length % 7 !== 0) {
      const date = new Date(days[days.length - 1])
      date.setDate(date.getDate() + 1)
      days.push(date)
    }

    return days
  }, [calendarDate])

  const scheduleByDay = useMemo(() => {
    const grouped = new Map<string, Array<ScheduleItem & { workoutName: string }>>()
    for (const item of schedule) {
      const key = item.scheduledAt.slice(0, 10)
      const workout = workouts.find((entry) => entry.id === item.workoutId)
      if (!workout) {
        continue
      }
      const current = grouped.get(key) ?? []
      current.push({ ...item, workoutName: workout.name })
      grouped.set(key, current)
    }
    return grouped
  }, [schedule, workouts])

  const generatePlan = () => {
    const stationInstances: Station[] = []
    const bodyweightStation = STATIONS.find((station) => station.equipmentKey === 'bodyweight')

    if (bodyweightStation) {
      stationInstances.push(bodyweightStation)
      stationInstances.push({ ...bodyweightStation, id: `${bodyweightStation.id}-2` })
    }

    for (const station of STATIONS) {
      if (station.equipmentKey === 'bodyweight') {
        continue
      }
      const count = equipmentConfig[station.equipmentKey] ?? 0
      for (let i = 0; i < count; i += 1) {
        stationInstances.push({ ...station, id: `${station.id}-${i + 1}` })
      }
    }

    if (stationInstances.length < 3) {
      setGeneratorNote(
        'Add more equipment. The planner needs at least 3 parallel station slots to keep all difficulties active without conflict.',
      )
      setGeneratedPlan(null)
      return
    }

    const roundLength = Math.max(20, workSeconds + transitionSeconds)
    const roundsCount = Math.max(1, Math.floor((durationMin * 60) / roundLength))
    const rounds: Array<DifficultyMap<RoundExercise>> = []

    for (let round = 0; round < roundsCount; round += 1) {
      const roundPlan = {} as DifficultyMap<RoundExercise>
      const usageCounter: Record<string, number> = {}

      DIFFICULTIES.forEach((difficulty, index) => {
        const station = stationInstances[(round + index) % stationInstances.length]
        const exerciseList = station.exercises[difficulty]
        const exercise = exerciseList[round % exerciseList.length]

        usageCounter[station.equipmentKey] = (usageCounter[station.equipmentKey] ?? 0) + 1

        roundPlan[difficulty] = {
          stationId: station.id,
          stationName: station.name,
          equipmentKey: station.equipmentKey,
          equipmentLabel: station.equipmentLabel,
          exercise,
        }
      })

      const hasConflict = Object.entries(usageCounter).some(([equipmentKey, used]) => {
        if (equipmentKey === 'bodyweight') {
          return false
        }
        return used > (equipmentConfig[equipmentKey] ?? 0)
      })

      if (hasConflict) {
        setGeneratorNote(
          'Conflict detected in station assignment. Increase available equipment or reduce overlapping station types.',
        )
        setGeneratedPlan(null)
        return
      }

      rounds.push(roundPlan)
    }

    const plan: WorkoutPlan = {
      id: uid(),
      name: workoutName.trim() || 'Untitled Team Workout',
      totalDurationMin: durationMin,
      workSeconds,
      transitionSeconds,
      rounds,
      equipmentConfig: { ...equipmentConfig },
      createdAt: new Date().toISOString(),
    }

    setGeneratedPlan(plan)
    setGeneratorNote(
      `AI planner generated ${roundsCount} rounds across ${stationInstances.length} station slots with no equipment conflicts.`,
    )
  }

  const saveGeneratedWorkout = () => {
    if (!generatedPlan) {
      return
    }

    setWorkouts((current) => [generatedPlan, ...current])
    setScheduleWorkoutId(generatedPlan.id)
    setGeneratorNote('Workout saved. You can now schedule it in the calendar or start it live.')
  }

  const scheduleWorkout = () => {
    if (!scheduleWorkoutId || !scheduledAt) {
      return
    }

    setSchedule((current) => [
      {
        id: uid(),
        workoutId: scheduleWorkoutId,
        scheduledAt: new Date(scheduledAt).toISOString(),
      },
      ...current,
    ])
    setScheduledAt('')
  }

  const startWorkout = (workoutId: string) => {
    const workout = workouts.find((item) => item.id === workoutId)
    if (!workout) {
      return
    }

    beep(784, 0.09)
    setSession({
      workoutId,
      roundIndex: 0,
      phase: 'work',
      remaining: workout.workSeconds,
      running: true,
    })
  }

  const pauseOrResume = () => {
    setSession((current) =>
      current ? { ...current, running: !current.running && current.phase !== 'done' } : current,
    )
  }

  const stopSession = () => {
    setSession(null)
  }

  return (
    <div className="app-shell">
      <header className="hero-panel">
        <p className="eyebrow">FITSHIT AI TRAINING BUILDER</p>
        <h1>Conflict-Free Group Calisthenics Planner</h1>
        <p>
          Build AI-generated multi-level workouts that share equipment, rotate through stations,
          and run together in real time.
        </p>
      </header>

      <section className="panel grid-two">
        <div>
          <h2>1. Workout Generator</h2>
          <label>
            Workout Name
            <input
              value={workoutName}
              onChange={(event) => setWorkoutName(event.target.value)}
              placeholder="Saturday Team Grind"
            />
          </label>

          <div className="inline-inputs">
            <label>
              Duration (minutes)
              <input
                type="number"
                min={10}
                max={180}
                value={durationMin}
                onChange={(event) => setDurationMin(Number(event.target.value))}
              />
            </label>
            <label>
              Work (seconds)
              <input
                type="number"
                min={20}
                max={120}
                value={workSeconds}
                onChange={(event) => setWorkSeconds(Number(event.target.value))}
              />
            </label>
            <label>
              Switch/Rest (seconds)
              <input
                type="number"
                min={5}
                max={60}
                value={transitionSeconds}
                onChange={(event) => setTransitionSeconds(Number(event.target.value))}
              />
            </label>
          </div>

          <h3>Equipment Configuration</h3>
          <div className="equipment-grid">
            {EQUIPMENT_DEFS.map((equipment) => (
              <label key={equipment.key}>
                {equipment.label}
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={equipmentConfig[equipment.key] ?? 0}
                  onChange={(event) =>
                    setEquipmentConfig((current) => ({
                      ...current,
                      [equipment.key]: Math.max(0, Number(event.target.value)),
                    }))
                  }
                />
              </label>
            ))}
          </div>

          <div className="button-row">
            <button onClick={generatePlan}>Generate AI Workout</button>
            <button
              className="secondary"
              onClick={saveGeneratedWorkout}
              disabled={!generatedPlan}
            >
              Save Workout
            </button>
          </div>
          <p className="note">{generatorNote}</p>
        </div>

        <div>
          <h2>2. Generated Rounds Preview</h2>
          {!generatedPlan ? (
            <p className="empty">Generate a plan to preview rounds and stations.</p>
          ) : (
            <div className="rounds-preview">
              <p>
                <strong>{generatedPlan.name}</strong> • {generatedPlan.rounds.length} rounds •{' '}
                {generatedPlan.totalDurationMin} min
              </p>
              {generatedPlan.rounds.slice(0, 5).map((round, index) => (
                <div className="round-card" key={`round-${index}`}>
                  <h4>Round {index + 1}</h4>
                  {DIFFICULTIES.map((difficulty) => (
                    <p key={`${difficulty}-${index}`}>
                      <span>{difficulty}:</span> {round[difficulty].exercise} ({round[difficulty].stationName})
                    </p>
                  ))}
                </div>
              ))}
              {generatedPlan.rounds.length > 5 && (
                <p className="small-note">
                  Preview shows first 5 rounds. Full schedule is used in live session.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="panel grid-two">
        <div>
          <h2>3. Schedule in Calendar</h2>
          <label>
            Saved Workout
            <select
              value={scheduleWorkoutId}
              onChange={(event) => setScheduleWorkoutId(event.target.value)}
            >
              <option value="">Select workout</option>
              {workouts.map((workout) => (
                <option key={workout.id} value={workout.id}>
                  {workout.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date & Time
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </label>
          <button onClick={scheduleWorkout} disabled={!scheduleWorkoutId || !scheduledAt}>
            Add to Calendar
          </button>

          <h3>Saved Workouts</h3>
          <div className="saved-list">
            {workouts.length === 0 && <p className="empty">No workouts saved yet.</p>}
            {workouts.map((workout) => (
              <article key={workout.id} className="saved-item">
                <div>
                  <strong>{workout.name}</strong>
                  <p>
                    {workout.rounds.length} rounds • {workout.totalDurationMin} min
                  </p>
                </div>
                <button className="secondary" onClick={() => startWorkout(workout.id)}>
                  Start
                </button>
              </article>
            ))}
          </div>
        </div>

        <div>
          <h2>Calendar View</h2>
          <div className="calendar-head">
            <button
              className="secondary"
              onClick={() =>
                setCalendarDate(
                  new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1),
                )
              }
            >
              Prev
            </button>
            <strong>{monthName(calendarDate)}</strong>
            <button
              className="secondary"
              onClick={() =>
                setCalendarDate(
                  new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1),
                )
              }
            >
              Next
            </button>
          </div>

          <div className="calendar-grid">
            {calendarGrid.map((date) => {
              const key = date.toISOString().slice(0, 10)
              const events = scheduleByDay.get(key) ?? []
              const isCurrentMonth = date.getMonth() === calendarDate.getMonth()

              return (
                <article
                  key={key}
                  className={`day-cell ${isCurrentMonth ? 'current' : 'outside'}`}
                >
                  <span className="day-number">{date.getDate()}</span>
                  {events.slice(0, 2).map((item) => (
                    <p key={item.id} className="event-pill">
                      {new Date(item.scheduledAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      {item.workoutName}
                    </p>
                  ))}
                  {events.length > 2 && <p className="event-pill">+{events.length - 2} more</p>}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>4. Live Workout Session</h2>
        {!session || !selectedSessionWorkout ? (
          <p className="empty">Start a saved workout to launch the timer and station guide.</p>
        ) : (
          <div className="session-layout">
            <div className="session-main">
              <p className="phase">
                {session.phase === 'done'
                  ? 'Workout Complete'
                  : session.phase === 'work'
                    ? 'WORK'
                    : 'SWITCH STATIONS'}
              </p>
              <h3>{selectedSessionWorkout.name}</h3>
              <p>
                Round {Math.min(session.roundIndex + 1, selectedSessionWorkout.rounds.length)} of{' '}
                {selectedSessionWorkout.rounds.length}
              </p>
              <p className="countdown">{session.remaining}s</p>

              <div className="button-row">
                <button
                  onClick={pauseOrResume}
                  disabled={session.phase === 'done'}
                  className="secondary"
                >
                  {session.running ? 'Pause' : 'Resume'}
                </button>
                <button className="secondary" onClick={stopSession}>
                  Stop Session
                </button>
              </div>
            </div>

            <div className="session-cards">
              {DIFFICULTIES.map((difficulty) => {
                const current = selectedSessionWorkout.rounds[session.roundIndex]?.[difficulty]
                const next = selectedSessionWorkout.rounds[session.roundIndex + 1]?.[difficulty]

                if (!current) {
                  return null
                }

                return (
                  <article key={difficulty} className="difficulty-card">
                    <h4>{difficulty}</h4>
                    <p className="exercise-name">{current.exercise}</p>
                    <p className="station">Current: {current.stationName}</p>
                    <p className="equipment">Equipment: {current.equipmentLabel}</p>
                    <p className="next-preview">
                      Next: {next ? `${next.exercise} (${next.stationName})` : 'Session complete'}
                    </p>
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default App
