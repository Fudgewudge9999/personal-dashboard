import { useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { AppButton } from "./AppButton";
import { useTimerStore } from "@/store/useTimerStore";
import { cn } from "@/lib/utils";

interface TimerProps {
  showControls?: boolean;
  showDurationOptions?: boolean;
  size?: "sm" | "lg";
}

export function Timer({ showControls = true, showDurationOptions = true, size = "lg" }: TimerProps) {
  const {
    minutes,
    seconds,
    isActive,
    isPaused,
    selectedDuration,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setDuration,
    tick
  } = useTimerStore();

  // Set up the timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, tick]);

  const toggleTimer = () => {
    if (!isActive) {
      startTimer();
    } else if (isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
  };

  const formatTime = (min: number, sec: number) => {
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={cn(
        "font-medium tracking-wider mb-4",
        size === "lg" ? "text-6xl" : "text-4xl"
      )}>
        {formatTime(minutes, seconds)}
      </div>

      {showDurationOptions && (
        <div className="flex gap-3 mb-4">
          {[15, 25, 45, 60].map((duration) => (
            <button
              key={duration}
              className={cn(
                "px-4 py-2 rounded text-sm transition-colors",
                selectedDuration === duration
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              )}
              onClick={() => setDuration(duration)}
              disabled={isActive}
            >
              {duration}m
            </button>
          ))}
          <input
            type="number"
            min="1"
            max="180"
            className={cn(
              "w-16 px-2 py-2 rounded text-sm transition-colors bg-secondary",
              "focus:outline-none focus:ring-2 focus:ring-ring",
              selectedDuration !== 15 && selectedDuration !== 25 && selectedDuration !== 45 && selectedDuration !== 60
                ? "ring-2 ring-primary"
                : ""
            )}
            placeholder="Custom"
            value={selectedDuration !== 15 && selectedDuration !== 25 && selectedDuration !== 45 && selectedDuration !== 60 ? selectedDuration : ''}
            onChange={(e) => setDuration(parseInt(e.target.value) || selectedDuration)}
            disabled={isActive}
          />
        </div>
      )}

      {showControls && (
        <div className="flex gap-3">
          <AppButton
            onClick={toggleTimer}
            variant="primary"
            size={size}
            icon={isActive && !isPaused ? <Pause size={size === "lg" ? 20 : 16} /> : <Play size={size === "lg" ? 20 : 16} />}
          >
            {isActive && !isPaused ? "Pause" : "Start"}
          </AppButton>
          <AppButton
            onClick={resetTimer}
            variant="outline"
            size={size}
            icon={<RotateCcw size={size === "lg" ? 20 : 16} />}
          >
            Reset
          </AppButton>
        </div>
      )}
    </div>
  );
} 