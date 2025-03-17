import { CardContainer } from "../common/CardContainer";
import { cn } from "@/lib/utils";
import { AppButton } from "../common/AppButton";
import { Play, Pause, RotateCcw, Clock, BarChart3, ArrowRight, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useTimerStore } from "@/store/useTimerStore";
import { Timer } from "../common/Timer";

interface TimerWidgetProps {
  className?: string;
}

interface TimerSession {
  date: string;
  duration: number;
  completed: boolean;
  actual_duration?: number;
}

export function TimerWidget({ className }: TimerWidgetProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [timerSessions, setTimerSessions] = useState<TimerSession[]>(() => {
    const savedSessions = localStorage.getItem('timerSessions');
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions);
      // Filter out sessions that were less than 50% complete
      return sessions.filter((session: TimerSession) => {
        // Always include completed sessions
        if (session.completed) return true;
        
        // If actual_duration is not available, include the session (backward compatibility)
        if (session.actual_duration === undefined) return true;
        
        // Calculate completion percentage
        const completionPercentage = session.actual_duration / session.duration;
        
        // Include sessions that are at least 50% complete
        return completionPercentage >= 0.5;
      });
    }
    return [];
  });
  
  const { toast } = useToast();
  const { 
    selectedDuration,
    isActive,
    isPaused,
    minutes,
    seconds
  } = useTimerStore();

  // Load timer sessions from localStorage on component mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('timerSessions');
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions);
      // Filter out sessions that were less than 50% complete
      const filteredSessions = sessions.filter((session: TimerSession) => {
        // Always include completed sessions
        if (session.completed) return true;
        
        // If actual_duration is not available, include the session (backward compatibility)
        if (session.actual_duration === undefined) return true;
        
        // Calculate completion percentage
        const completionPercentage = session.actual_duration / session.duration;
        
        // Include sessions that are at least 50% complete
        return completionPercentage >= 0.5;
      });
      setTimerSessions(filteredSessions);
    }
  }, []);

  // Save timer sessions to localStorage when they change
  useEffect(() => {
    localStorage.setItem('timerSessions', JSON.stringify(timerSessions));
  }, [timerSessions]);

  // Listen for timer completion to add to history
  useEffect(() => {
    if (minutes === 0 && seconds === 0 && isActive === false && !isPaused) {
      // Timer completed
      const newSession: TimerSession = {
        date: new Date().toISOString(),
        duration: selectedDuration,
        completed: true,
        actual_duration: selectedDuration
      };
      setTimerSessions(prev => [newSession, ...prev].slice(0, 10));
      
      // Show toast notification
      toast({
        title: "Timer completed!",
        description: `You completed a ${selectedDuration} minute focus session.`,
      });
    }
  }, [minutes, seconds, isActive, isPaused, selectedDuration, toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const deleteSession = (index: number) => {
    // Remove the session at the specified index
    const updatedSessions = [...timerSessions];
    updatedSessions.splice(index, 1);
    setTimerSessions(updatedSessions);
    
    // Show toast notification
    toast({
      title: "Session deleted",
      description: "The focus session has been removed from your history.",
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
          <Timer showDurationOptions={true} size="sm" />
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
                    <div className="text-sm font-medium">
                      {session.actual_duration !== undefined 
                        ? `${session.actual_duration}/${session.duration}m` 
                        : `${session.duration}m session`}
                    </div>
                    <div className="text-xs text-muted-foreground">{formatDate(session.date)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      session.completed 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                    )}>
                      {session.completed ? "Completed" : "Started"}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(index);
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Delete session"
                      title="Delete session"
                    >
                      <Trash2 size={14} />
                    </button>
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
