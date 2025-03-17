import { useEffect } from 'react';
import { useTimerStore } from '@/store/useTimerStore';

export function TimerInitializer() {
  const { isActive, isPaused, setupTimerInterval } = useTimerStore();

  // Initialize the timer when the app starts
  useEffect(() => {
    // If the timer is active and not paused, set up the interval
    if (isActive && !isPaused) {
      setupTimerInterval();
    }
    
    // This component doesn't render anything
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
} 