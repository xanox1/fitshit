import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

interface WorkoutTimerProps {
  rounds?: number;
  workSeconds?: number;
  restSeconds?: number;
}

type Phase = 'idle' | 'work' | 'rest' | 'done';

export default function WorkoutTimer({
  rounds = 4,
  workSeconds = 40,
  restSeconds = 20,
}: WorkoutTimerProps) {
  const [totalRounds, setTotalRounds] = useState(rounds);
  const [workTime, setWorkTime] = useState(workSeconds);
  const [restTime, setRestTime] = useState(restSeconds);

  const [phase, setPhase] = useState<Phase>('idle');
  const [currentRound, setCurrentRound] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(workSeconds);
  const [running, setRunning] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const advance = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev > 1) return prev - 1;

      // Time's up — transition
      setPhase((currentPhase) => {
        if (currentPhase === 'work') {
          setSecondsLeft(restTime);
          return 'rest';
        } else if (currentPhase === 'rest') {
          setCurrentRound((r) => {
            if (r >= totalRounds) {
              setRunning(false);
              setSecondsLeft(0);
              return r;
            }
            setSecondsLeft(workTime);
            return r + 1;
          });
          return currentRound >= totalRounds ? 'done' : 'work';
        }
        return currentPhase;
      });

      return prev;
    });
  }, [restTime, workTime, totalRounds, currentRound]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(advance, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [running, advance]);

  function start() {
    if (phase === 'idle' || phase === 'done') {
      setCurrentRound(1);
      setPhase('work');
      setSecondsLeft(workTime);
    }
    setRunning(true);
  }

  function pause() {
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setPhase('idle');
    setCurrentRound(1);
    setSecondsLeft(workTime);
  }

  function skipPhase() {
    if (phase === 'work') {
      setPhase('rest');
      setSecondsLeft(restTime);
    } else if (phase === 'rest') {
      if (currentRound >= totalRounds) {
        setPhase('done');
        setRunning(false);
      } else {
        setCurrentRound((r) => r + 1);
        setPhase('work');
        setSecondsLeft(workTime);
      }
    }
  }

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const displayTime = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const totalSeconds = phase === 'work' ? workTime : restTime;
  const progress =
    totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  const phaseColor =
    phase === 'work'
      ? 'text-violet-600'
      : phase === 'rest'
        ? 'text-green-600'
        : phase === 'done'
          ? 'text-gray-400'
          : 'text-gray-600';

  const barColor =
    phase === 'work' ? 'bg-violet-600' : phase === 'rest' ? 'bg-green-500' : 'bg-gray-300';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">⏱️ Interval Timer</h2>

      {/* Config — only editable when idle */}
      {phase === 'idle' && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Rounds
            </label>
            <input
              type="number"
              min={1}
              max={99}
              value={totalRounds}
              onChange={(e) => setTotalRounds(parseInt(e.target.value) || 1)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Work (sec)
            </label>
            <input
              type="number"
              min={5}
              max={600}
              value={workTime}
              onChange={(e) => {
                const v = parseInt(e.target.value) || 5;
                setWorkTime(v);
                setSecondsLeft(v);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Rest (sec)
            </label>
            <input
              type="number"
              min={0}
              max={600}
              value={restTime}
              onChange={(e) => setRestTime(parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
      )}

      {/* Display */}
      <div className="flex flex-col items-center gap-4">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${barColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Phase label */}
        <p className={`text-sm font-semibold uppercase tracking-widest ${phaseColor}`}>
          {phase === 'idle' && 'Ready'}
          {phase === 'work' && `Work — Round ${currentRound} / ${totalRounds}`}
          {phase === 'rest' && `Rest — Round ${currentRound} / ${totalRounds}`}
          {phase === 'done' && '🎉 Workout Complete!'}
        </p>

        {/* Timer */}
        <p className={`text-7xl font-black tabular-nums ${phaseColor}`}>
          {displayTime}
        </p>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="p-3 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {running ? (
            <button
              onClick={pause}
              className="p-4 rounded-full bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-lg"
              title="Pause"
            >
              <Pause className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={start}
              className="p-4 rounded-full bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-lg"
              title="Start"
            >
              <Play className="w-6 h-6 ml-0.5" />
            </button>
          )}

          {phase !== 'idle' && phase !== 'done' && (
            <button
              onClick={skipPhase}
              className="p-3 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
              title="Skip phase"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
