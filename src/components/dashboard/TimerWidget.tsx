import { CardContainer } from "../common/CardContainer";
import { cn } from "@/lib/utils";
import { AppButton } from "../common/AppButton";
import { Play, Pause, RotateCcw, Clock, BarChart3, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface TimerWidgetProps {
  className?: string;
}

interface TimerSession {
  date: string;
  duration: number;
  completed: boolean;
}

export function TimerWidget({ className }: TimerWidgetProps) {
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [timerSessions, setTimerSessions] = useState<TimerSession[]>(() => {
    const savedSessions = localStorage.getItem('timerSessions');
    return savedSessions ? JSON.parse(savedSessions) : [];
  });
  
  const { toast } = useToast();

  // Load timer sessions from localStorage on component mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('timerSessions');
    if (savedSessions) {
      setTimerSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Save timer sessions to localStorage when they change
  useEffect(() => {
    localStorage.setItem('timerSessions', JSON.stringify(timerSessions));
  }, [timerSessions]);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && !isPaused) {
      interval = window.setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            clearInterval(interval);
            setIsActive(false);
            
            // Add completed session to history
            const newSession: TimerSession = {
              date: new Date().toISOString(),
              duration: selectedDuration,
              completed: true
            };
            setTimerSessions(prev => [newSession, ...prev].slice(0, 10));
            
            // Show toast notification
            toast({
              title: "Timer completed!",
              description: `You completed a ${selectedDuration} minute focus session.`,
            });
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, minutes, seconds, selectedDuration, toast]);

  const toggleTimer = () => {
    if (!isActive) {
      setIsActive(true);
      setIsPaused(false);
      // Record starting a new session if it's a fresh start
      if (minutes === selectedDuration && seconds === 0) {
        const newSession: TimerSession = {
          date: new Date().toISOString(),
          duration: selectedDuration,
          completed: false
        };
        setTimerSessions(prev => [newSession, ...prev].slice(0, 10));
      }
    } else {
      setIsPaused(!isPaused);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setMinutes(selectedDuration);
    setSeconds(0);
  };

  const changeTimerDuration = (duration: number | string) => {
    const newDuration = typeof duration === 'string' ? parseInt(duration) || selectedDuration : duration;
    if (newDuration > 0 && newDuration <= 180) { // Limit to 3 hours max
      setSelectedDuration(newDuration);
      if (!isActive) {
        setMinutes(newDuration);
        setSeconds(0);
      }
    }
  };

  const formatTime = (min: number, sec: number) => {
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <CardContainer className={cn("h-full", className)}>
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-lg">Focus Timer</h3>
          <div className="flex items-center gap-2">
            <AppButton
              onClick={() => setShowHistory(!showHistory)}
              variant="ghost"
              size="sm"
              icon={showHistory ? <Clock size={16} /> : <BarChart3 size={16} />}
            >
              {showHistory ? "Timer" : "History"}
            </AppButton>
            <Link to="/focus">
              <AppButton
                variant="ghost"
                size="sm"
                icon={<ArrowRight size={16} />}
              >
                Full View
              </AppButton>
            </Link>
          </div>
        </div>
        
        {!showHistory ? (
          <div className="flex flex-col items-center justify-center">
            <div className="text-4xl font-medium mb-6 tracking-wider">
              {formatTime(minutes, seconds)}
            </div>
            
            <div className="flex gap-2 mb-4">
              {[15, 25, 45, 60].map((duration) => (
                <button
                  key={duration}
                  className={cn(
                    "px-3 py-1 rounded text-sm transition-colors",
                    selectedDuration === duration 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                  onClick={() => changeTimerDuration(duration)}
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
                  "w-14 px-2 py-1 rounded text-sm transition-colors bg-secondary",
                  "focus:outline-none focus:ring-2 focus:ring-ring",
                  selectedDuration !== 15 && selectedDuration !== 25 && selectedDuration !== 45 && selectedDuration !== 60
                    ? "ring-2 ring-primary"
                    : ""
                )}
                placeholder="Custom"
                value={selectedDuration !== 15 && selectedDuration !== 25 && selectedDuration !== 45 && selectedDuration !== 60 ? selectedDuration : ''}
                onChange={(e) => changeTimerDuration(e.target.value)}
                disabled={isActive}
              />
            </div>
            
            <div className="flex gap-2">
              <AppButton
                onClick={toggleTimer}
                variant="primary"
                icon={isActive && !isPaused ? <Pause size={18} /> : <Play size={18} />}
              >
                {isActive && !isPaused ? "Pause" : "Start"}
              </AppButton>
              <AppButton
                onClick={resetTimer}
                variant="outline"
                icon={<RotateCcw size={18} />}
              >
                Reset
              </AppButton>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Sessions</h4>
            {timerSessions.length > 0 ? (
              timerSessions.map((session, index) => (
                <div 
                  key={index}
                  className="p-2 rounded-md border border-border flex justify-between items-center"
                >
                  <div>
                    <div className="text-sm font-medium">{session.duration}m session</div>
                    <div className="text-xs text-muted-foreground">{formatDate(session.date)}</div>
                  </div>
                  <div className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    session.completed 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  )}>
                    {session.completed ? "Completed" : "Started"}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No sessions recorded yet
              </div>
            )}
          </div>
        )}
      </div>
    </CardContainer>
  );
}
