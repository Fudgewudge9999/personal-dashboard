import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/supabase-generated';

type FocusSession = Database['public']['Tables']['focus_sessions']['Row'];
type FocusSessionInsert = Database['public']['Tables']['focus_sessions']['Insert'];
type FocusTask = Database['public']['Tables']['focus_tasks']['Row'];

interface TimerState {
  selectedDuration: number;
  minutes: number;
  seconds: number;
  isActive: boolean;
  isPaused: boolean;
  currentTasks: FocusTask[];
  currentNotes: string;
  currentSessionId: string | null;
  sessionStartTime: number | null;
  totalPausedTime: number;
  lastPauseTime: number | null;
  timerInterval: number | null;

  // Actions
  startTimer: (duration?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  setTime: (minutes: number, seconds: number) => void;
  setDuration: (duration: number) => void;
  setCurrentTasks: (tasks: FocusTask[]) => void;
  setCurrentNotes: (notes: string) => void;
  saveSession: (completed: boolean) => Promise<void>;
  tick: () => void;
  setupTimerInterval: () => void;
  clearTimerInterval: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  selectedDuration: 25,
  minutes: 25,
  seconds: 0,
  isActive: false,
  isPaused: false,
  currentTasks: [],
  currentNotes: '',
  currentSessionId: null,
  sessionStartTime: null,
  totalPausedTime: 0,
  lastPauseTime: null,
  timerInterval: null,

  startTimer: (duration) => {
    const state = get();
    // Clear any existing interval first
    state.clearTimerInterval();
    
    const newDuration = duration || state.selectedDuration;
    set({
      isActive: true,
      isPaused: false,
      selectedDuration: newDuration,
      minutes: newDuration,
      seconds: 0,
      sessionStartTime: Date.now(),
      totalPausedTime: 0,
      lastPauseTime: null
    });
    
    // Set up the interval
    state.setupTimerInterval();
    
    // Save the session
    get().saveSession(false);
  },

  pauseTimer: () => {
    const state = get();
    state.clearTimerInterval();
    
    set({ 
      isPaused: true,
      lastPauseTime: Date.now()
    });
  },

  resumeTimer: () => {
    const state = get();
    if (state.lastPauseTime) {
      set(state => ({ 
        isPaused: false,
        totalPausedTime: state.totalPausedTime + (Date.now() - (state.lastPauseTime || 0)),
        lastPauseTime: null
      }));
      
      // Set up the interval again
      state.setupTimerInterval();
    }
  },

  resetTimer: () => {
    const state = get();
    state.clearTimerInterval();
    
    // If the timer was active, save the session as interrupted
    if (state.isActive) {
      state.saveSession(false);
    }
    
    set({
      isActive: false,
      isPaused: false,
      minutes: get().selectedDuration,
      seconds: 0,
      currentSessionId: null,
      sessionStartTime: null,
      totalPausedTime: 0,
      lastPauseTime: null,
      timerInterval: null
    });
  },

  setTime: (minutes, seconds) => {
    set({ minutes, seconds });
  },

  setDuration: (duration) => {
    if (duration > 0 && duration <= 180) {
      set({ selectedDuration: duration });
      if (!get().isActive) {
        set({ minutes: duration, seconds: 0 });
      }
    }
  },

  setCurrentTasks: (tasks) => {
    set({ currentTasks: tasks });
  },

  setCurrentNotes: (notes) => {
    set({ currentNotes: notes });
  },

  setupTimerInterval: () => {
    const state = get();
    // Only set up interval if timer is active and not paused
    if (state.isActive && !state.isPaused && !state.timerInterval) {
      const interval = window.setInterval(() => {
        get().tick();
      }, 1000);
      
      set({ timerInterval: interval });
    }
  },

  clearTimerInterval: () => {
    const state = get();
    if (state.timerInterval) {
      window.clearInterval(state.timerInterval);
      set({ timerInterval: null });
    }
  },

  saveSession: async (completed) => {
    const state = get();
    try {
      let actualDuration = 0;
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        console.error('No authenticated user found when saving session');
        return;
      }
      
      if (state.sessionStartTime) {
        // For completed timers, use the selectedDuration as the actual duration
        if (completed) {
          actualDuration = state.selectedDuration;
        } else {
          // For interrupted timers, calculate the actual time spent
          const totalTime = Date.now() - state.sessionStartTime;
          const activeTime = totalTime - state.totalPausedTime - (state.lastPauseTime ? (Date.now() - state.lastPauseTime) : 0);
          actualDuration = Math.floor(activeTime / 1000 / 60); // Convert to minutes
        }
      }

      // If we already have a session ID, update it
      if (state.currentSessionId) {
        const { error: updateError } = await supabase
          .from('focus_sessions')
          .update({ 
            completed,
            actual_duration: actualDuration,
            notes: state.currentNotes || null // Ensure notes are saved
          })
          .eq('id', state.currentSessionId);

        if (updateError) throw updateError;
        return;
      }

      // Otherwise create a new session
      const sessionData: FocusSessionInsert = {
        duration: state.selectedDuration,
        actual_duration: actualDuration,
        completed,
        notes: state.currentNotes || null,
        user_id: user.id  // Add user_id to the session data
      };

      const { data: newSession, error: sessionError } = await supabase
        .from('focus_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Save the session ID
      set({ currentSessionId: newSession.id });

      // Create task associations
      if (state.currentTasks.length > 0) {
        const sessionTasks = state.currentTasks.map(task => ({
          session_id: newSession.id,
          task_id: task.id
        }));

        const { error: tasksError } = await supabase
          .from('focus_session_tasks')
          .insert(sessionTasks);

        if (tasksError) throw tasksError;
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  },

  tick: () => {
    const state = get();
    if (state.seconds === 0) {
      if (state.minutes === 0) {
        // Timer completed
        state.clearTimerInterval();
        set({ isActive: false });
        state.saveSession(true);
      } else {
        set({ minutes: state.minutes - 1, seconds: 59 });
      }
    } else {
      set({ seconds: state.seconds - 1 });
    }
  }
})); 