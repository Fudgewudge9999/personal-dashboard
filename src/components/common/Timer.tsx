import { useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
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
    soundEnabled,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setDuration,
    setupTimerInterval,
    updateDocumentTitle,
    toggleSound
  } = useTimerStore();

  // Ensure the timer interval is set up when the component mounts
  useEffect(() => {
    if (isActive && !isPaused) {
      setupTimerInterval();
    }
    
    // Update document title when component mounts
    updateDocumentTitle();
    
    // Reset document title when component unmounts
    return () => {
      document.title = 'Reflection Nook';
    };
  }, [isActive, isPaused, setupTimerInterval, updateDocumentTitle]);

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

  // Calculate progress percentage
  const calculateProgress = () => {
    const totalSeconds = selectedDuration * 60;
    const remainingSeconds = minutes * 60 + seconds;
    const elapsedSeconds = totalSeconds - remainingSeconds;
    return Math.min(100, (elapsedSeconds / totalSeconds) * 100);
  };

  const progressPercentage = calculateProgress();

  return (
    <div className="flex flex-col items-center justify-center w-full relative">
      <div className={cn(
        "font-medium tracking-wider mb-4",
        size === "lg" ? "text-6xl" : "text-4xl"
      )}>
        {formatTime(minutes, seconds)}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-secondary rounded-full mb-6">
        <div 
          className={cn(
            "h-full rounded-full transition-all",
            isActive ? (isPaused ? "bg-amber-500" : "bg-primary") : "bg-muted"
          )}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Sound Toggle Button */}
      <button
        onClick={toggleSound}
        className="absolute top-0 right-0 p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
        title={soundEnabled ? "Mute completion sound" : "Enable completion sound"}
      >
        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>

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