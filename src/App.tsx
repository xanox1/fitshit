import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Session = {
  day: string
  rounds: string[]
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const GOAL_EXERCISES: Record<string, string[]> = {
  Strength: ['Push-ups', 'Goblet Squats', 'Rows', 'Overhead Press'],
  Conditioning: ['Burpees', 'Mountain Climbers', 'Jump Squats', 'Fast High Knees'],
  Mobility: ["World's Greatest Stretch", 'Cossack Squats', 'Dead Bugs', 'Thoracic Rotations'],
}

function App() {
  const [goal, setGoal] = useState('Strength')
  const [level, setLevel] = useState('Beginner')
  const [duration, setDuration] = useState(35)
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Wednesday', 'Friday'])
  const [rounds, setRounds] = useState(3)

  const [hasDumbbells, setHasDumbbells] = useState(true)
  const [dumbbellMin, setDumbbellMin] = useState(10)
  const [dumbbellMax, setDumbbellMax] = useState(50)

  const [hasKettlebell, setHasKettlebell] = useState(false)
  const [kettlebellMin, setKettlebellMin] = useState(15)
  const [kettlebellMax, setKettlebellMax] = useState(35)

  const [hasPullupBar, setHasPullupBar] = useState(false)
  const [hasTimer, setHasTimer] = useState(true)
  const [roundSeconds, setRoundSeconds] = useState(45)
  const [timerSeconds, setTimerSeconds] = useState(45)
  const [timerRunning, setTimerRunning] = useState(false)

  const [plan, setPlan] = useState<Session[]>([])
  const [completedSessions, setCompletedSessions] = useState<string[]>([])

  useEffect(() => {
    if (!timerRunning || !hasTimer) {
      return
    }

    const id = window.setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(id)
          setTimerRunning(false)
          return roundSeconds
        }

        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(id)
  }, [timerRunning, hasTimer, roundSeconds])

  const weightNotes = useMemo(() => {
    const notes: string[] = ['Bodyweight']

    if (hasDumbbells) {
      notes.push(`${dumbbellMin}-${dumbbellMax} lb adjustable dumbbells`)
    }

    if (hasKettlebell) {
      notes.push(`${kettlebellMin}-${kettlebellMax} lb kettlebell`)
    }

    if (hasPullupBar) {
      notes.push('Pull-up bar')
    }

    return notes.join(' • ')
  }, [dumbbellMax, dumbbellMin, hasDumbbells, hasKettlebell, hasPullupBar, kettlebellMax, kettlebellMin])

  const previewRounds = useMemo(() => {
    const pool = GOAL_EXERCISES[goal]
    return Array.from({ length: rounds }, (_, index) => `${index + 1}. ${pool[index % pool.length]}`)
  }, [goal, rounds])

  const toggleDay = (day: string) => {
    setSelectedDays((previousDays) => {
      if (previousDays.includes(day)) {
        return previousDays.filter((value) => value !== day)
      }

      return [...previousDays, day]
    })
  }

  const generatePlan = () => {
    const plannedDays = (selectedDays.length ? selectedDays : WEEK_DAYS).slice(0, daysPerWeek)
    const pool = GOAL_EXERCISES[goal]
    const nextPlan = plannedDays.map((day, sessionIndex) => ({
      day,
      rounds: Array.from({ length: rounds }, (_, roundIndex) => {
        const exerciseA = pool[(sessionIndex + roundIndex) % pool.length]
        const exerciseB = pool[(sessionIndex + roundIndex + 1) % pool.length]
        return `Round ${roundIndex + 1}: ${exerciseA} + ${exerciseB} (${Math.round(duration / rounds)} min)`
      }),
    }))

    setPlan(nextPlan)
    setCompletedSessions([])
  }

  const toggleComplete = (day: string) => {
    setCompletedSessions((previous) =>
      previous.includes(day) ? previous.filter((value) => value !== day) : [...previous, day],
    )
  }

  return (
    <main className="app">
      <header>
        <h1>Fitshit Workout Planner</h1>
        <p>Create AI-style workout plans with schedule, equipment, round preview, and timer support.</p>
      </header>

      <section className="card">
        <h2>Plan setup</h2>

        <div className="grid">
          <label>
            Goal
            <select value={goal} onChange={(event) => setGoal(event.target.value)}>
              <option>Strength</option>
              <option>Conditioning</option>
              <option>Mobility</option>
            </select>
          </label>

          <label>
            Level
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>

          <label>
            Workout duration (minutes)
            <input type="number" min={10} max={90} value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
          </label>

          <label>
            Workouts / week
            <input type="number" min={1} max={7} value={daysPerWeek} onChange={(event) => setDaysPerWeek(Number(event.target.value))} />
          </label>

          <label>
            Preview rounds
            <input type="number" min={1} max={8} value={rounds} onChange={(event) => setRounds(Number(event.target.value))} />
          </label>
        </div>

        <fieldset>
          <legend>Schedule</legend>
          <div className="chips">
            {WEEK_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                className={selectedDays.includes(day) ? 'chip active' : 'chip'}
                onClick={() => toggleDay(day)}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Equipment</legend>

          <div className="equipment">
            <label><input type="checkbox" checked={hasDumbbells} onChange={(event) => setHasDumbbells(event.target.checked)} /> Adjustable dumbbells</label>
            {hasDumbbells ? (
              <div className="inline-inputs">
                <label>
                  Min lb
                  <input type="number" min={1} value={dumbbellMin} onChange={(event) => setDumbbellMin(Number(event.target.value))} />
                </label>
                <label>
                  Max lb
                  <input type="number" min={dumbbellMin} value={dumbbellMax} onChange={(event) => setDumbbellMax(Number(event.target.value))} />
                </label>
              </div>
            ) : null}

            <label><input type="checkbox" checked={hasKettlebell} onChange={(event) => setHasKettlebell(event.target.checked)} /> Kettlebell</label>
            {hasKettlebell ? (
              <div className="inline-inputs">
                <label>
                  Min lb
                  <input type="number" min={1} value={kettlebellMin} onChange={(event) => setKettlebellMin(Number(event.target.value))} />
                </label>
                <label>
                  Max lb
                  <input type="number" min={kettlebellMin} value={kettlebellMax} onChange={(event) => setKettlebellMax(Number(event.target.value))} />
                </label>
              </div>
            ) : null}

            <label><input type="checkbox" checked={hasPullupBar} onChange={(event) => setHasPullupBar(event.target.checked)} /> Pull-up bar</label>
            <label><input type="checkbox" checked={hasTimer} onChange={(event) => setHasTimer(event.target.checked)} /> Workout timer</label>
          </div>
        </fieldset>

        <button type="button" onClick={generatePlan}>Generate workout plan</button>
      </section>

      <section className="card">
        <h2>Round preview</h2>
        <p>{goal} · {level} · {duration} min · {weightNotes}</p>
        <ul>
          {previewRounds.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      {hasTimer ? (
        <section className="card">
          <h2>Round timer</h2>
          <div className="inline-inputs">
            <label>
              Seconds / round
              <input
                type="number"
                min={10}
                max={300}
                value={roundSeconds}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  setRoundSeconds(value)
                  setTimerSeconds(value)
                }}
              />
            </label>
          </div>
          <p className="timer">{timerSeconds}s</p>
          <div className="actions">
            <button type="button" onClick={() => setTimerRunning((previous) => !previous)}>
              {timerRunning ? 'Pause' : 'Start'}
            </button>
            <button type="button" onClick={() => { setTimerRunning(false); setTimerSeconds(roundSeconds) }}>
              Reset
            </button>
          </div>
        </section>
      ) : null}

      {plan.length ? (
        <section className="card">
          <h2>Generated plan</h2>
          {plan.map((session) => (
            <article key={session.day} className="session">
              <header>
                <h3>{session.day}</h3>
                <label>
                  <input
                    type="checkbox"
                    checked={completedSessions.includes(session.day)}
                    onChange={() => toggleComplete(session.day)}
                  />
                  Mark complete
                </label>
              </header>
              <ul>
                {session.rounds.map((round) => (
                  <li key={round}>{round}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  )
}

export default App
