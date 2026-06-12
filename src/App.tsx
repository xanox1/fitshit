import { useEffect, useMemo, useState } from 'react'
import './App.css'

type SkillTier = 'Beginner' | 'Intermediate' | 'Advanced'
type Category = 'strength' | 'endurance' | 'mobility' | 'power' | 'core'
type CategoryLevel = 1 | 2 | 3 | 4 | 5
type TierCategoryLevels = Record<SkillTier, Record<Category, CategoryLevel>>
type UserProfile = {
  id: string
  name: string
  tier: SkillTier
  levels: Record<Category, CategoryLevel>
}
type ConfigSettings = {
  name: string
  duration: number
  workSec: number
  transitionSec: number
  pullups: number
  bands: number
  dbPairs: number
  dbMin: number
  dbMax: number
  kbInput: string
  extraEquipmentInput: string
  users: UserProfile[]
}

type DemoCache = Record<string, { url: string; checkedAt: string }>

type ExerciseOption = { name: string; categories: Category[] }

type Station = {
  id: string
  name: string
  equipmentKey: string
  equipmentLabel: string
  exercises: Record<SkillTier, ExerciseOption[]>
}

type RoundExercise = {
  userId: string
  userName: string
  userTier: SkillTier
  stationName: string
  equipmentLabel: string
  exercise: string
  prescription: string
}

type WorkoutPlan = {
  id: string
  name: string
  totalDurationMin: number
  workSeconds: number
  transitionSeconds: number
  rounds: Array<RoundExercise[]>
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

const TIERS: SkillTier[] = ['Beginner', 'Intermediate', 'Advanced']
const CATEGORIES: Category[] = ['strength', 'endurance', 'mobility', 'power', 'core']

const WORKOUT_STORAGE = 'fitshit.workouts'
const SCHEDULE_STORAGE = 'fitshit.schedule'
const SETTINGS_STORAGE = 'fitshit.settings'
const DEMO_CACHE_STORAGE = 'fitshit.demoCache'

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

const DEFAULT_LEVELS: TierCategoryLevels = {
  Beginner: {
    strength: 2,
    endurance: 2,
    mobility: 3,
    power: 1,
    core: 2,
  },
  Intermediate: {
    strength: 3,
    endurance: 3,
    mobility: 2,
    power: 2,
    core: 3,
  },
  Advanced: {
    strength: 4,
    endurance: 4,
    mobility: 2,
    power: 4,
    core: 4,
  },
}

const DEFAULT_USERS: UserProfile[] = [
  { id: 'u-beginner', name: 'Alex', tier: 'Beginner', levels: { ...DEFAULT_LEVELS.Beginner } },
  { id: 'u-intermediate', name: 'Blake', tier: 'Intermediate', levels: { ...DEFAULT_LEVELS.Intermediate } },
  { id: 'u-advanced', name: 'Casey', tier: 'Advanced', levels: { ...DEFAULT_LEVELS.Advanced } },
]

const DEFAULT_SETTINGS: ConfigSettings = {
  name: 'Team Session Alpha',
  duration: 36,
  workSec: 45,
  transitionSec: 15,
  pullups: 1,
  bands: 2,
  dbPairs: 2,
  dbMin: 5,
  dbMax: 25,
  kbInput: '8,12,16',
  extraEquipmentInput: 'Adjustable Bench:1',
  users: DEFAULT_USERS,
}

const ALL_EXERCISE_NAMES = [...new Set(STATIONS.flatMap((station) => TIERS.flatMap((tier) => station.exercises[tier].map((x) => x.name))))]

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

const parseExtraEquipment = (input: string) => {
  const rows = input
    .split(/[\n,;]+/)
    .map((x) => x.trim())
    .filter(Boolean)

  return rows
    .map((row) => {
      const [labelRaw, countRaw] = row.split(':').map((x) => x.trim())
      const count = Number(countRaw || '1')
      const label = labelRaw || ''
      return {
        label,
        count: Number.isFinite(count) && count > 0 ? Math.floor(count) : 1,
      }
    })
    .filter((x) => x.label.length > 0)
}

const clampCategoryLevel = (value: number): CategoryLevel => Math.min(5, Math.max(1, value)) as CategoryLevel

const score = (option: ExerciseOption, levels: Record<Category, CategoryLevel>) =>
  option.categories.reduce((sum, cat) => sum + levels[cat], 0)

const normalizeLevels = (value: unknown, fallback: Record<Category, CategoryLevel>) => {
  const source = (value ?? {}) as Partial<Record<Category, number>>
  return {
    strength: clampCategoryLevel(Number(source.strength ?? fallback.strength)),
    endurance: clampCategoryLevel(Number(source.endurance ?? fallback.endurance)),
    mobility: clampCategoryLevel(Number(source.mobility ?? fallback.mobility)),
    power: clampCategoryLevel(Number(source.power ?? fallback.power)),
    core: clampCategoryLevel(Number(source.core ?? fallback.core)),
  }
}

const resolveUserTier = (tier: unknown, levels: Record<Category, CategoryLevel>): SkillTier => {
  if (tier === 'Beginner' || tier === 'Intermediate' || tier === 'Advanced') return tier

  const avg = CATEGORIES.reduce((sum, cat) => sum + levels[cat], 0) / CATEGORIES.length
  if (avg <= 2.2) return 'Beginner'
  if (avg >= 3.8) return 'Advanced'
  return 'Intermediate'
}

const migrateUsers = (value: unknown, legacyLevels?: Partial<TierCategoryLevels>) => {
  if (Array.isArray(value) && value.length > 0) {
    return value.map((item, index) => {
      const user = item as Partial<UserProfile>
      const tier: SkillTier = TIERS.includes(user.tier as SkillTier) ? (user.tier as SkillTier) : 'Intermediate'
      return {
        id: String(user.id ?? `user-${index + 1}`),
        name: String(user.name ?? `User ${index + 1}`).trim() || `User ${index + 1}`,
        tier,
        levels: normalizeLevels(user.levels, DEFAULT_LEVELS[tier]),
      }
    })
  }

  return [
    {
      id: 'user-1',
      name: 'User 1',
      tier: 'Beginner' as SkillTier,
      levels: normalizeLevels(legacyLevels?.Beginner, DEFAULT_LEVELS.Beginner),
    },
    {
      id: 'user-2',
      name: 'User 2',
      tier: 'Intermediate' as SkillTier,
      levels: normalizeLevels(legacyLevels?.Intermediate, DEFAULT_LEVELS.Intermediate),
    },
    {
      id: 'user-3',
      name: 'User 3',
      tier: 'Advanced' as SkillTier,
      levels: normalizeLevels(legacyLevels?.Advanced, DEFAULT_LEVELS.Advanced),
    },
  ]
}

const normalizeStoredWorkouts = (value: unknown): WorkoutPlan[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      const workout = item as Partial<WorkoutPlan> & {
        rounds?: Array<Partial<Record<SkillTier, Omit<RoundExercise, 'userId' | 'userName' | 'userTier'>>> | RoundExercise[]>
      }

      const rounds = (workout.rounds ?? []).map((round) => {
        if (Array.isArray(round)) {
          return round.map((entry, index) => ({
            userId: String(entry.userId ?? `user-${index + 1}`),
            userName: String(entry.userName ?? `User ${index + 1}`),
            userTier: TIERS.includes(entry.userTier) ? entry.userTier : 'Intermediate',
            stationName: String(entry.stationName ?? ''),
            equipmentLabel: String(entry.equipmentLabel ?? ''),
            exercise: String(entry.exercise ?? ''),
            prescription: String(entry.prescription ?? ''),
          }))
        }

        const legacyRound = round as Partial<Record<SkillTier, Omit<RoundExercise, 'userId' | 'userName' | 'userTier'>>>
        return TIERS.flatMap((tier) => {
          const entry = legacyRound[tier]
          if (!entry) return []
          return [
            {
              userId: `legacy-${tier.toLowerCase()}`,
              userName: tier,
              userTier: tier,
              stationName: entry.stationName ?? '',
              equipmentLabel: entry.equipmentLabel ?? '',
              exercise: entry.exercise ?? '',
              prescription: entry.prescription ?? '',
            },
          ]
        })
      })

      return {
        id: String(workout.id ?? uid()),
        name: String(workout.name ?? 'Workout'),
        totalDurationMin: Number(workout.totalDurationMin ?? 20),
        workSeconds: Number(workout.workSeconds ?? 40),
        transitionSeconds: Number(workout.transitionSeconds ?? 20),
        rounds,
        createdAt: String(workout.createdAt ?? new Date().toISOString()),
      }
    })
    .filter((w) => w.rounds.length > 0)
}

const EXERCISE_GUIDES: Record<string, string[]> = {
  'Incline Push-ups': [
    'Keep your body in a straight line from shoulders to heels.',
    'Lower under control until chest is near the support surface.',
    'Press through palms and fully lock out at the top.',
  ],
  'Air Squats': [
    'Stand with feet shoulder-width and brace your core.',
    'Sit hips back and down while keeping knees tracking over toes.',
    'Drive through mid-foot to stand tall without collapsing inward.',
  ],
  'Dead Bug Hold': [
    'Press your lower back gently into the floor.',
    'Keep ribs down and hold limbs steady without wobbling.',
    'Breathe slowly and maintain abdominal tension throughout.',
  ],
  'Push-ups': [
    'Hands just outside shoulder width and body in one line.',
    'Lower chest with elbows at roughly 45 degrees.',
    'Press up while keeping glutes and core engaged.',
  ],
  'Strict Pull-ups': [
    'Start from a dead hang with shoulders active.',
    'Pull elbows down toward ribs without swinging legs.',
    'Control the descent to full extension on each rep.',
  ],
}

const DIRECT_DEMO_LINKS: Record<string, { title: string; url: string }> = {
  'Incline Push-ups': {
    title: 'Incline Push Up Demonstration',
    url: 'https://www.youtube.com/watch?v=jWxvty2KROs',
  },
  'Air Squats': {
    title: 'Air Squat Technique Guide',
    url: 'https://www.youtube.com/watch?v=aclHkVaku9U',
  },
  'Dead Bug Hold': {
    title: 'Dead Bug Exercise Tutorial',
    url: 'https://www.youtube.com/watch?v=4XLEnwUrLZY',
  },
  'Push-ups': {
    title: 'Perfect Push Up Form',
    url: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
  },
  'Split Squats': {
    title: 'Split Squat Form Basics',
    url: 'https://www.youtube.com/watch?v=bwhl_9jN_3o',
  },
  'Mountain Climbers': {
    title: 'Mountain Climber Exercise Demo',
    url: 'https://www.youtube.com/watch?v=nmwgirgXLYM',
  },
  'Jump Squats': {
    title: 'Jump Squat Technique',
    url: 'https://www.youtube.com/watch?v=CVaEhXotL7M',
  },
  'Strict Pull-ups': {
    title: 'Strict Pull Up Form Tutorial',
    url: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
  },
  'Chest to Bar Pull-ups': {
    title: 'Chest To Bar Pull Up Technique',
    url: 'https://www.youtube.com/watch?v=8Lz4UjvE3g4',
  },
  'Band Pull Apart': {
    title: 'Band Pull Apart Tutorial',
    url: 'https://www.youtube.com/watch?v=JObYtU7Y7ag',
  },
}

const EXERCISE_DEMO_LINKS: Record<string, { title: string; url: string }> = {
  ...Object.fromEntries(
    ALL_EXERCISE_NAMES.map((name) => [
      name,
      {
        title: `${name} demonstration (top results)`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise form demonstration`)}`,
      },
    ]),
  ),
  ...DIRECT_DEMO_LINKS,
}

const defaultGuide = (exercise: string) => [
  `Set up a stable starting position for ${exercise}.`,
  'Move through a controlled full range of motion with steady breathing.',
  'Stop before form breaks and keep tempo smooth on each rep.',
]

const getExerciseDemo = (exercise: string) => {
  const searchQuery = `${exercise} exercise form demonstration`
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`
  const searchEmbedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(searchQuery)}`
  const likelyResult = EXERCISE_DEMO_LINKS[exercise] ?? {
    title: `${exercise} exercise demonstration (top results)`,
    url: searchUrl,
  }

  return {
    title: exercise,
    tips: EXERCISE_GUIDES[exercise] ?? defaultGuide(exercise),
    likelyResult,
    searchQuery,
    searchUrl,
    searchEmbedUrl,
  }
}

const extractVideoIds = (raw: string) => {
  const ids = new Set<string>()
  const re = /watch\?v=([A-Za-z0-9_-]{11})/g
  for (let match = re.exec(raw); match; match = re.exec(raw)) ids.add(match[1])
  return [...ids]
}

const isEmbeddableVideoId = async (videoId: string) => {
  try {
    const oembed = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
    )
    if (oembed.ok) return true
  } catch {
    // Continue to secondary check.
  }

  try {
    const noembed = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`,
    )
    if (!noembed.ok) return false
    const payload = (await noembed.json()) as { error?: string }
    return !payload.error
  } catch {
    return false
  }
}

const getYouTubeVideoId = (url: string) => {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace('www.', '')

    if (host === 'youtu.be') return parsed.pathname.slice(1) || null
    if (!host.endsWith('youtube.com')) return null

    if (parsed.pathname === '/watch') return parsed.searchParams.get('v')
    if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/').filter(Boolean)[1] || null
    if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/').filter(Boolean)[1] || null

    return null
  } catch {
    return null
  }
}

const getYouTubeEmbedUrl = (url: string) => {
  try {
    const id = getYouTubeVideoId(url)
    return id ? `https://www.youtube.com/embed/${id}` : null
  } catch {
    return null
  }
}

const buildPrescription = (
  option: ExerciseOption,
  tier: SkillTier,
  workSeconds: number,
  roundIndex: number,
) => {
  const shouldUseTime = option.categories.includes('endurance') || option.categories.includes('mobility')
  if (shouldUseTime) {
    return `${Math.max(20, workSeconds)}s`
  }

  const repRangeByTier: Record<SkillTier, [number, number]> = {
    Beginner: [8, 12],
    Intermediate: [10, 15],
    Advanced: [12, 18],
  }
  const [min, max] = repRangeByTier[tier]
  const span = max - min + 1
  const reps = min + ((roundIndex + option.name.length) % span)
  return `${reps} reps`
}

const displayPrescription = (exercise: RoundExercise | undefined, fallbackWorkSeconds: number) =>
  exercise?.prescription || `${fallbackWorkSeconds}s`

const monthName = (date: Date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

function App() {
  const savedSettings = useMemo(() => {
    const parsed = loadJSON<Partial<ConfigSettings> & { levelsByDifficulty?: Partial<TierCategoryLevels> }>(SETTINGS_STORAGE, {})
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      users: migrateUsers(parsed.users, parsed.levelsByDifficulty),
    }
  }, [])

  const [workouts, setWorkouts] = useState<WorkoutPlan[]>(() => normalizeStoredWorkouts(loadJSON(WORKOUT_STORAGE, [])))
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => loadJSON(SCHEDULE_STORAGE, []))

  const [name, setName] = useState(savedSettings.name)
  const [duration, setDuration] = useState(savedSettings.duration)
  const [workSec, setWorkSec] = useState(savedSettings.workSec)
  const [transitionSec, setTransitionSec] = useState(savedSettings.transitionSec)
  const [pullups, setPullups] = useState(savedSettings.pullups)
  const [bands, setBands] = useState(savedSettings.bands)
  const [dbPairs, setDbPairs] = useState(savedSettings.dbPairs)
  const [dbMin, setDbMin] = useState(savedSettings.dbMin)
  const [dbMax, setDbMax] = useState(savedSettings.dbMax)
  const [kbInput, setKbInput] = useState(savedSettings.kbInput)
  const [extraEquipmentInput, setExtraEquipmentInput] = useState(savedSettings.extraEquipmentInput)
  const [users, setUsers] = useState<UserProfile[]>(savedSettings.users)
  const [newUserName, setNewUserName] = useState('')

  const [generated, setGenerated] = useState<WorkoutPlan | null>(null)
  const [demoExercise, setDemoExercise] = useState<string | null>(null)
  const [demoEmbedUrl, setDemoEmbedUrl] = useState<string | null>(null)
  const [demoResolvedResultUrl, setDemoResolvedResultUrl] = useState<string | null>(null)
  const [demoWorkingOptions, setDemoWorkingOptions] = useState<string[]>([])
  const [demoOptionIndex, setDemoOptionIndex] = useState(0)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoStatusMessage, setDemoStatusMessage] = useState('')
  const [demoCache, setDemoCache] = useState<DemoCache>(() => loadJSON<DemoCache>(DEMO_CACHE_STORAGE, {}))
  const [note, setNote] = useState('')
  const [scheduleWorkoutId, setScheduleWorkoutId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [session, setSession] = useState<SessionState | null>(null)

  useEffect(() => localStorage.setItem(WORKOUT_STORAGE, JSON.stringify(workouts)), [workouts])
  useEffect(() => localStorage.setItem(SCHEDULE_STORAGE, JSON.stringify(schedule)), [schedule])
  useEffect(() => {
    localStorage.setItem(
      SETTINGS_STORAGE,
      JSON.stringify({
        name,
        duration,
        workSec,
        transitionSec,
        pullups,
        bands,
        dbPairs,
        dbMin,
        dbMax,
        kbInput,
        extraEquipmentInput,
        users,
      } as ConfigSettings),
    )
  }, [name, duration, workSec, transitionSec, pullups, bands, dbPairs, dbMin, dbMax, kbInput, extraEquipmentInput, users])
  useEffect(() => localStorage.setItem(DEMO_CACHE_STORAGE, JSON.stringify(demoCache)), [demoCache])

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

  const generatedSummary = useMemo(() => {
    if (!generated) return null
    const rounds = generated.rounds.length
    const cycleSeconds = generated.workSeconds + generated.transitionSeconds
    const effectiveTotalSeconds = rounds * cycleSeconds
    const equipmentUsed = new Set<string>()

    generated.rounds.forEach((round) => round.forEach((entry) => equipmentUsed.add(entry.equipmentLabel)))

    return {
      rounds,
      cycleSeconds,
      effectiveTotalMinutes: Math.round((effectiveTotalSeconds / 60) * 10) / 10,
      equipmentCount: equipmentUsed.size,
      createdTime: new Date(generated.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  }, [generated])

  const currentDemo = useMemo(() => (demoExercise ? getExerciseDemo(demoExercise) : null), [demoExercise])

  useEffect(() => {
    if (!currentDemo) {
      setDemoEmbedUrl(null)
      setDemoResolvedResultUrl(null)
      setDemoWorkingOptions([])
      setDemoOptionIndex(0)
      setDemoStatusMessage('')
      setDemoLoading(false)
      return
    }

    const cached = demoCache[currentDemo.title]
    const cachedEmbed = cached ? getYouTubeEmbedUrl(cached.url) : null
    if (cached && cachedEmbed) {
      setDemoEmbedUrl(cachedEmbed)
      setDemoResolvedResultUrl(cached.url)
      setDemoWorkingOptions([cached.url])
      setDemoOptionIndex(0)
      setDemoStatusMessage('Loaded cached working video.')
      setDemoLoading(false)
      return
    }

    let cancelled = false
    const resolveEmbed = async () => {
      setDemoLoading(true)
      setDemoStatusMessage('Checking video availability...')

      const likelyUrl = currentDemo.likelyResult.url
      const likelyVideoId = getYouTubeVideoId(likelyUrl)
      const candidateIds: string[] = []
      const addCandidate = (id: string | null) => {
        if (id && !candidateIds.includes(id)) candidateIds.push(id)
      }

      addCandidate(getYouTubeVideoId(demoCache[currentDemo.title]?.url ?? ''))
      addCandidate(likelyVideoId)

      try {
        const searchPage = await fetch(
          `https://r.jina.ai/http://www.youtube.com/results?search_query=${encodeURIComponent(currentDemo.searchQuery)}`,
        )
        const text = await searchPage.text()
        extractVideoIds(text).forEach((id) => addCandidate(id))
      } catch {
        // Continue with currently known candidates.
      }

      const workingUrls: string[] = []
      for (const id of candidateIds.slice(0, 10)) {
        if (cancelled) return
        if (await isEmbeddableVideoId(id)) {
          workingUrls.push(`https://www.youtube.com/watch?v=${id}`)
          if (workingUrls.length >= 5) break
        }
      }

      if (cancelled) return

      if (workingUrls.length > 0) {
        const firstUrl = workingUrls[0]
        const firstEmbed = getYouTubeEmbedUrl(firstUrl)
        if (firstEmbed) {
          setDemoWorkingOptions(workingUrls)
          setDemoOptionIndex(0)
          setDemoEmbedUrl(firstEmbed)
          setDemoResolvedResultUrl(firstUrl)
          setDemoStatusMessage(workingUrls.length > 1 ? 'Loaded a working video. Tap Next Video for alternatives.' : '')
          setDemoCache((cur) => {
            if (cur[currentDemo.title]?.url === firstUrl) return cur
            return {
              ...cur,
              [currentDemo.title]: { url: firstUrl, checkedAt: new Date().toISOString() },
            }
          })
          setDemoLoading(false)
          return
        }
      }

      setDemoWorkingOptions([])
      setDemoOptionIndex(0)
      setDemoEmbedUrl(currentDemo.searchEmbedUrl)
      setDemoResolvedResultUrl(currentDemo.searchUrl)
      setDemoStatusMessage('Could not verify direct videos. Showing live top-result embed.')
      setDemoLoading(false)
    }

    resolveEmbed()

    return () => {
      cancelled = true
    }
  }, [currentDemo])

  const showNextDemoVideo = () => {
    if (!currentDemo || demoWorkingOptions.length < 2) return
    const nextIndex = (demoOptionIndex + 1) % demoWorkingOptions.length
    const nextUrl = demoWorkingOptions[nextIndex]
    const nextEmbed = getYouTubeEmbedUrl(nextUrl)
    if (!nextEmbed) return

    setDemoOptionIndex(nextIndex)
    setDemoResolvedResultUrl(nextUrl)
    setDemoEmbedUrl(nextEmbed)
    setDemoStatusMessage(`Showing option ${nextIndex + 1} of ${demoWorkingOptions.length}.`)
    setDemoCache((cur) => {
      if (cur[currentDemo.title]?.url === nextUrl) return cur
      return {
        ...cur,
        [currentDemo.title]: { url: nextUrl, checkedAt: new Date().toISOString() },
      }
    })
  }

  const openExerciseDemo = (exercise: string) => {
    setDemoExercise(exercise)
  }

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

  const adjustCategoryLevel = (userId: string, category: Category, delta: -1 | 1) => {
    setUsers((current) =>
      current.map((user) =>
        user.id === userId
          ? {
              ...user,
              levels: {
                ...user.levels,
                [category]: clampCategoryLevel(user.levels[category] + delta),
              },
            }
          : user,
      ),
    )
  }

  const updateUserName = (userId: string, value: string) => {
    setUsers((current) => current.map((user) => (user.id === userId ? { ...user, name: value } : user)))
  }

  const addUser = () => {
    const nameValue = newUserName.trim()
    if (!nameValue) return setNote('Enter a user name before adding.')
    setUsers((current) => [
      ...current,
      {
        id: uid(),
        name: nameValue,
        tier: 'Intermediate',
        levels: { ...DEFAULT_LEVELS.Intermediate },
      },
    ])
    setNewUserName('')
  }

  const removeUser = (userId: string) => {
    setUsers((current) => (current.length <= 1 ? current : current.filter((user) => user.id !== userId)))
  }

  const generatePlan = () => {
    if (dbMax <= dbMin) return setNote('Dumbbell max must be greater than min.')
    const kbWeights = parseKettlebells(kbInput)
    if (kbWeights.length === 0) return setNote('Add kettlebell weights, for example: 8,12,16.')
    const extraEquipment = parseExtraEquipment(extraEquipmentInput)

    const bodyweight = STATIONS.find((s) => s.id === 'bodyweight')!
    const pull = STATIONS.find((s) => s.id === 'pullup')!
    const band = STATIONS.find((s) => s.id === 'bands')!

    const capacities: Record<string, number> = {
      pullup_rig: pullups,
      bands,
      dumbbells: dbPairs,
      kettlebell: kbWeights.length,
    }

    extraEquipment.forEach((item) => {
      const key = `custom_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
      capacities[key] = item.count
    })

    const customInstances: Station[] = extraEquipment.flatMap((item) =>
      Array.from({ length: item.count }, (_, i) => ({
        ...bodyweight,
        id: `custom-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i + 1}`,
        name: `${item.label} Station`,
        equipmentKey: `custom_${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        equipmentLabel: `${item.label} ${i + 1}`,
      })),
    )

    const defaultInstances: Station[] = [
      { ...bodyweight, id: 'bw-1', equipmentLabel: 'Bodyweight Lane 1' },
      { ...bodyweight, id: 'bw-2', equipmentLabel: 'Bodyweight Lane 2' },
      ...Array.from({ length: pullups }, (_, i) => ({ ...pull, id: `pull-${i + 1}`, equipmentLabel: `Pull-up Rig ${i + 1}` })),
      ...Array.from({ length: bands }, (_, i) => ({ ...band, id: `band-${i + 1}`, equipmentLabel: `Band Set ${i + 1}` })),
      ...Array.from({ length: dbPairs }, (_, i) => ({ ...bodyweight, id: `db-${i + 1}`, name: 'Dumbbell Engine', equipmentKey: 'dumbbells', equipmentLabel: `Adjustable DB ${i + 1} (${dbMin}-${dbMax}kg)` })),
      ...kbWeights.map((w, i) => ({ ...bodyweight, id: `kb-${i + 1}`, name: 'Kettlebell Power', equipmentKey: 'kettlebell', equipmentLabel: `Kettlebell ${w}kg` })),
    ]

    // Prioritize custom equipment early so it appears even in shorter workouts.
    const instances: Station[] = [...customInstances, ...defaultInstances]

    const activeUsers = users.map((user) => ({ ...user, name: user.name.trim() })).filter((user) => user.name.length > 0)

    if (activeUsers.length === 0) return setNote('Add at least one named user.')
    if (instances.length < 3) return setNote('Need at least 3 station slots to avoid conflicts.')

    const roundsCount = Math.max(1, Math.floor((duration * 60) / Math.max(20, workSec + transitionSec)))
    const rounds: Array<RoundExercise[]> = []

    for (let r = 0; r < roundsCount; r += 1) {
      const usage: Record<string, number> = {}
      const round: RoundExercise[] = []
      activeUsers.forEach((user, idx) => {
        const resolvedTier = resolveUserTier(user.tier, user.levels)
        const station = instances[(r + idx) % instances.length]
        const ranked = station.exercises[resolvedTier]
          .map((opt) => ({ opt, s: score(opt, user.levels) }))
          .sort((a, b) => b.s - a.s)
        const selected = ranked[r % ranked.length].opt
        usage[station.equipmentKey] = (usage[station.equipmentKey] ?? 0) + 1
        round.push({
          userId: user.id,
          userName: user.name,
          userTier: resolvedTier,
          stationName: station.name,
          equipmentLabel: station.equipmentLabel,
          exercise: selected.name,
          prescription: buildPrescription(selected, resolvedTier, workSec, r),
        })
      })
      const conflict = Object.entries(usage).some(([k, used]) => {
        const capacity = capacities[k]
        return capacity ? used > capacity : false
      })
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
      <section className="panel">
        <div>
          <h2>Generator</h2>
          <label>Workout Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <div className="inline-inputs">
            <label>Duration (minutes)<input type="number" min={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></label>
            <label>Work Interval (seconds)<input type="number" min={10} value={workSec} onChange={(e) => setWorkSec(Number(e.target.value))} /></label>
            <label>Transition (seconds)<input type="number" min={5} value={transitionSec} onChange={(e) => setTransitionSec(Number(e.target.value))} /></label>
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
          <label>
            Extra Equipment (name:count, comma-separated)
            <input
              value={extraEquipmentInput}
              onChange={(e) => setExtraEquipmentInput(e.target.value)}
              placeholder="Adjustable Bench:1, Plyo Box:2"
            />
          </label>
          <h3>Users and Category Levels</h3>
          <p className="level-help">Add users, set their names, and tune each category with +/-.</p>
          <div className="user-controls">
            <input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Add user name" />
            <button type="button" onClick={addUser}>Add User</button>
          </div>
          <div className="level-scale" aria-hidden="true">
            <span className="scale-chip level-1">1</span>
            <span className="scale-chip level-2">2</span>
            <span className="scale-chip level-3">3</span>
            <span className="scale-chip level-4">4</span>
            <span className="scale-chip level-5">5</span>
            <span className="scale-caption">Low to high category emphasis</span>
          </div>
          <div className="level-matrix" role="group" aria-label="AI category levels by user">
            <div className="level-row level-header">
              <span>User</span>
              {CATEGORIES.map((cat) => <span key={cat}>{cat}</span>)}
              <span>Action</span>
            </div>
            {users.map((user) => (
              <div key={user.id} className="level-row">
                <div className="user-row-meta">
                  <input className="user-name-input" value={user.name} onChange={(e) => updateUserName(user.id, e.target.value)} />
                </div>
                {CATEGORIES.map((cat) => (
                  <div key={cat} className="level-cell" data-cat={cat} data-level={user.levels[cat]}>
                    <span className="level-cat">{cat}</span>
                    <button
                      type="button"
                      className="level-step"
                      onClick={() => adjustCategoryLevel(user.id, cat, -1)}
                      aria-label={`Decrease ${cat} for ${user.name}`}
                    >
                      -
                    </button>
                    <span className="level-value">{user.levels[cat]}</span>
                    <button
                      type="button"
                      className="level-step"
                      onClick={() => adjustCategoryLevel(user.id, cat, 1)}
                      aria-label={`Increase ${cat} for ${user.name}`}
                    >
                      +
                    </button>
                  </div>
                ))}
                <button type="button" className="secondary" disabled={users.length <= 1} onClick={() => removeUser(user.id)}>Remove</button>
              </div>
            ))}
          </div>
          <div className="button-row"><button onClick={generatePlan}>Generate AI Workout</button><button className="secondary" disabled={!generated} onClick={() => generated && setWorkouts((cur) => [generated, ...cur])}>Save Workout</button></div>
          <p className="note">{note}</p>
        </div>
      </section>

      <section className="panel">
        <h2>Rounds Preview</h2>
        {generatedSummary ? (
          <div className="summary-strip" aria-label="Generated workout summary">
            <p className="summary-chip"><strong>Rounds:</strong> {generatedSummary.rounds}</p>
            <p className="summary-chip"><strong>Target:</strong> {generated?.totalDurationMin} min</p>
            <p className="summary-chip"><strong>Effective:</strong> {generatedSummary.effectiveTotalMinutes} min</p>
            <p className="summary-chip"><strong>Work/Transition:</strong> {generated?.workSeconds}s / {generated?.transitionSeconds}s</p>
            <p className="summary-chip"><strong>Cycle:</strong> {generatedSummary.cycleSeconds}s</p>
            <p className="summary-chip"><strong>Equipment Slots:</strong> {generatedSummary.equipmentCount}</p>
            <p className="summary-chip"><strong>Generated:</strong> {generatedSummary.createdTime}</p>
          </div>
        ) : (
          <p className="empty">Generate a workout to view the summary and rounds.</p>
        )}
        <div className="rounds-scroll">
          {generated?.rounds.map((round, i) => (
            <div className="round-card" key={i}><h4>Round {i + 1}</h4>{round.map((entry) => <p key={`${entry.userId}-${entry.stationName}-${entry.exercise}`}><span>{entry.userName}:</span> <button type="button" className="exercise-link" onClick={() => openExerciseDemo(entry.exercise)}>{entry.exercise}</button> - {displayPrescription(entry, generated.workSeconds)} ({entry.equipmentLabel})</p>)}</div>
          ))}
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
            <div className="session-cards">{selectedSessionWorkout.rounds[session.roundIndex]?.map((cur) => { const next = selectedSessionWorkout.rounds[session.roundIndex + 1]?.find((entry) => entry.userId === cur.userId); return <article key={cur.userId} className="difficulty-card"><h4>{cur.userName}</h4><p className="exercise-name"><button type="button" className="exercise-link" onClick={() => openExerciseDemo(cur.exercise)}>{cur.exercise}</button></p><p className="station">Current: {cur.stationName}</p><p className="equipment">Prescription: {displayPrescription(cur, selectedSessionWorkout.workSeconds)}</p><p className="equipment">Equipment: {cur.equipmentLabel}</p><p className="next-preview">Next: {next ? `${next.exercise} - ${displayPrescription(next, selectedSessionWorkout.workSeconds)} (${next.stationName})` : 'Session complete'}</p></article> })}</div>
          </div>
        )}
      </section>

      {currentDemo ? (
        <div className="demo-overlay" role="dialog" aria-modal="true" aria-label={`${currentDemo.title} demonstration`} onClick={() => setDemoExercise(null)}>
          <div className="demo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="demo-header">
              <h3>{currentDemo.title} Demo</h3>
              <button type="button" className="secondary" onClick={() => setDemoExercise(null)}>Close</button>
            </div>
            <p className="demo-copy">AI form checklist:</p>
            <ul className="demo-list">
              {currentDemo.tips.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
            {demoLoading ? (
              <div className="demo-loading" role="status" aria-live="polite">
                <span className="spinner" aria-hidden="true"></span>
                <span>Finding a working embed...</span>
              </div>
            ) : null}
            {demoStatusMessage ? <p className="demo-copy">{demoStatusMessage}</p> : null}
            {!demoLoading && demoEmbedUrl ? (
              <div className="demo-embed-wrap">
                <iframe
                  src={demoEmbedUrl}
                  title={`${currentDemo.title} video demonstration`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : (
              !demoLoading ? <p className="demo-copy">Inline preview is unavailable for this exercise.</p> : null
            )}
            <p className="demo-copy">Most likely result:</p>
            <a className="demo-video-link likely" href={demoResolvedResultUrl ?? currentDemo.likelyResult.url} target="_blank" rel="noreferrer">
              {demoResolvedResultUrl === currentDemo.searchUrl ? 'Open selected alternative result' : currentDemo.likelyResult.title}
            </a>
            <div className="button-row demo-controls">
              <button
                type="button"
                className="secondary"
                disabled={demoLoading || demoWorkingOptions.length < 2}
                onClick={showNextDemoVideo}
              >
                Next Video
              </button>
            </div>
            <p className="demo-copy">Need alternatives?</p>
            <a className="demo-video-link" href={currentDemo.searchUrl} target="_blank" rel="noreferrer">
              Open demonstration video search
            </a>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
