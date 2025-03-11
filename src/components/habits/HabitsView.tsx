import { CardContainer } from "../common/CardContainer";
import { AppButton } from "../common/AppButton";
import { Plus, Target, Check, X, RefreshCw, Edit, Trash2, Calendar } from "lucide-react";
import { ProgressBar } from "../common/ProgressBar";
import { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { AddHabitForm } from "./AddHabitForm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Habit as HabitType } from "@/types/supabase";
import { addUserIdToData } from "@/utils/supabase-utils";

interface Habit {
  id: string;
  name: string;
  description?: string;
  targetDays: number;
  currentStreak: number;
  completedToday: boolean;
  startDate: string;
  lastCompletedDate?: string;
}

interface EditHabitData {
  name: string;
  description?: string;
  targetDays: number;
  currentStreak: number;
}

export function HabitsView() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [isEditHabitModalOpen, setIsEditHabitModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentHabit, setCurrentHabit] = useState<Habit | null>(null);
  const [editHabitData, setEditHabitData] = useState<EditHabitData>({
    name: '',
    description: '',
    targetDays: 21,
    currentStreak: 0
  });
  
  useEffect(() => {
    checkAndResetHabits();
  }, []);
  
  // Check if habits need to be reset for a new day
  const checkAndResetHabits = async () => {
    try {
      setIsLoading(true);
      
      // Get the last reset date from localStorage
      const lastResetDate = localStorage.getItem('lastHabitResetDate');
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // If we haven't reset today, reset all habits
      if (lastResetDate !== today) {
        // First, fetch all habits with their completion status and last completed date
        const { data: habitsData, error: fetchError } = await supabase
          .from('habits')
          .select('id, completed_today, current_streak, last_completed_date');
        
        if (fetchError) {
          throw fetchError;
        }
        
        // Process each habit
        if (habitsData && habitsData.length > 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          for (const habit of habitsData as any[]) {
            let updateData: any = { completed_today: false };
            
            if (habit.completed_today) {
              // If it was completed on the previous day, preserve that completion
              // by setting last_completed_date to yesterday
              updateData = {
                ...updateData,
                last_completed_date: yesterdayStr
              };
            } else if (habit.last_completed_date !== yesterdayStr) {
              // If it wasn't completed yesterday, reset the streak
              updateData = {
                ...updateData,
                current_streak: 0
              };
            }
            
            const { error: updateError } = await supabase
              .from('habits')
              .update(updateData)
              .eq('id', habit.id);
            
            if (updateError) {
              console.error('Error updating habit:', updateError);
            }
          }
          
          // Save today's date as the last reset date
          localStorage.setItem('lastHabitResetDate', today);
          
          // Show a toast notification
          toast.info('Habits have been reset for a new day');
        }
        
        // Fetch habits after potential reset
        await fetchHabits();
      } else {
        // Even if we don't need to reset, still fetch habits
        await fetchHabits();
      }
    } catch (error) {
      console.error('Error checking/resetting habits:', error);
      // Still try to fetch habits even if reset failed
      fetchHabits();
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchHabits = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Transform the data to match our Habit interface
      const transformedHabits: Habit[] = (data as any[]).map(habit => ({
        id: habit.id,
        name: habit.name,
        description: habit.description || undefined,
        targetDays: habit.target_days,
        currentStreak: habit.current_streak,
        completedToday: habit.completed_today,
        startDate: habit.start_date,
        lastCompletedDate: habit.last_completed_date
      }));
      
      setHabits(transformedHabits);
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast.error('Failed to load habits');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetDailyHabits = async () => {
    try {
      setIsResetting(true);
      
      // First, fetch all habits with their completion status
      const { data: habitsData, error: fetchError } = await supabase
        .from('habits')
        .select('id, completed_today');
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Process each habit
      if (habitsData && habitsData.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        
        for (const habit of habitsData as any[]) {
          let updateData: any = { completed_today: false };
          
          // If the habit was completed today, save the completion date
          // This ensures we don't lose streak information when resetting
          if (habit.completed_today) {
            updateData = {
              ...updateData,
              last_completed_date: today
            };
          }
          
          const { error: updateError } = await supabase
            .from('habits')
            .update(updateData)
            .eq('id', habit.id);
          
          if (updateError) {
            console.error('Error updating habit:', updateError);
          }
        }
        
        // Refresh the habits list
        await fetchHabits();
        
        toast.success('All habits have been reset for a new day');
      } else {
        toast.info('No habits to reset');
      }
    } catch (error) {
      console.error('Error resetting habits:', error);
      toast.error('Failed to reset habits');
    } finally {
      setIsResetting(false);
    }
  };
  
  const toggleHabitCompletion = async (habitId: string) => {
    try {
      // Find the habit to toggle
      const habitToToggle = habits.find(h => h.id === habitId);
      if (!habitToToggle) return;
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Optimistically update UI
      setHabits(habits.map(habit => {
        if (habit.id === habitId) {
          if (habit.completedToday) {
            // If unchecking, update completedToday and potentially decrease streak
            return { 
              ...habit, 
              completedToday: false,
              currentStreak: Math.max(0, habit.currentStreak - 1),
              lastCompletedDate: null
            };
          } else {
            // If checking, update completedToday and potentially currentStreak
            const wasCompletedYesterday = habit.lastCompletedDate === yesterdayStr;
            const newStreak = wasCompletedYesterday ? habit.currentStreak + 1 : 1;
            
            return { 
              ...habit, 
              completedToday: true,
              currentStreak: newStreak,
              lastCompletedDate: today
            };
          }
        }
        return habit;
      }));
      
      if (habitToToggle.completedToday) {
        // If we're unchecking a habit
        const { error } = await supabase
          .from('habits')
          .update({ 
            completed_today: false,
            current_streak: Math.max(0, habitToToggle.currentStreak - 1),
            last_completed_date: null
          })
          .eq('id', habitId);
        
        if (error) {
          throw error;
        }
        
        toast.success(`Habit "${habitToToggle.name}" marked as incomplete. Streak adjusted.`);
      } else {
        // We're checking a habit
        const wasCompletedYesterday = habitToToggle.lastCompletedDate === yesterdayStr;
        const newStreak = wasCompletedYesterday ? habitToToggle.currentStreak + 1 : 1;
        
        const { error } = await supabase
          .from('habits')
          .update({ 
            completed_today: true,
            current_streak: newStreak,
            last_completed_date: today
          })
          .eq('id', habitId);
        
        if (error) {
          throw error;
        }
        
        toast.success(`Habit "${habitToToggle.name}" completed! Streak: ${newStreak} days`);
      }
    } catch (error) {
      console.error('Error updating habit:', error);
      toast.error('Failed to update habit');
      
      // Revert the optimistic update
      fetchHabits();
    }
  };
  
  const handleAddHabit = async (habitData: {
    name: string;
    description?: string;
    targetDays: number;
    startDate: string;
  }) => {
    try {
      // Prepare habit data with user ID
      const habitWithUserId = await addUserIdToData({
        name: habitData.name,
        description: habitData.description || null,
        target_days: habitData.targetDays,
        start_date: habitData.startDate,
        current_streak: 0,
        completed_today: false,
        last_completed_date: null
      });
      
      // Insert the new habit into Supabase
      const { data, error } = await supabase
        .from('habits')
        .insert(habitWithUserId)
        .select();
      
      if (error) {
        throw error;
      }
      
      // Transform the returned data to match our Habit interface
      const newHabit: Habit = {
        id: (data as any[])[0].id,
        name: (data as any[])[0].name,
        description: (data as any[])[0].description || undefined,
        targetDays: (data as any[])[0].target_days,
        currentStreak: (data as any[])[0].current_streak,
        completedToday: (data as any[])[0].completed_today,
        startDate: (data as any[])[0].start_date,
        lastCompletedDate: (data as any[])[0].last_completed_date
      };
      
      // Update the local state
      setHabits([newHabit, ...habits]);
      setIsAddHabitModalOpen(false);
      toast.success(`New habit "${habitData.name}" created successfully`);
    } catch (error) {
      console.error('Error creating habit:', error);
      toast.error('Failed to create habit');
    }
  };
  
  // Calculate habit completion stats
  const calculateHabitStats = () => {
    if (habits.length === 0) return { total: 0, completed: 0, percentage: 0 };
    
    const total = habits.length;
    const completed = habits.filter(habit => habit.completedToday).length;
    const percentage = Math.round((completed / total) * 100);
    
    return { total, completed, percentage };
  };
  
  const habitStats = calculateHabitStats();
  
  const handleEditHabit = (habit: Habit) => {
    setCurrentHabit(habit);
    setEditHabitData({
      name: habit.name,
      description: habit.description || '',
      targetDays: habit.targetDays,
      currentStreak: habit.currentStreak
    });
    setIsEditHabitModalOpen(true);
  };
  
  const handleDeleteHabit = (habit: Habit) => {
    setCurrentHabit(habit);
    setIsDeleteConfirmOpen(true);
  };
  
  const confirmDeleteHabit = async () => {
    if (!currentHabit) return;
    
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', currentHabit.id);
      
      if (error) {
        throw error;
      }
      
      // Remove the habit from the local state
      setHabits(habits.filter(h => h.id !== currentHabit.id));
      setIsDeleteConfirmOpen(false);
      setCurrentHabit(null);
      
      toast.success(`Habit "${currentHabit.name}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast.error('Failed to delete habit');
    }
  };
  
  const saveHabitChanges = async () => {
    if (!currentHabit) return;
    
    try {
      const { error } = await supabase
        .from('habits')
        .update({
          name: editHabitData.name,
          description: editHabitData.description || null,
          target_days: editHabitData.targetDays,
          current_streak: editHabitData.currentStreak
        })
        .eq('id', currentHabit.id);
      
      if (error) {
        throw error;
      }
      
      // Update the habit in the local state
      setHabits(habits.map(habit => 
        habit.id === currentHabit.id 
          ? { 
              ...habit, 
              name: editHabitData.name,
              description: editHabitData.description,
              targetDays: editHabitData.targetDays,
              currentStreak: editHabitData.currentStreak
            } 
          : habit
      ));
      
      setIsEditHabitModalOpen(false);
      setCurrentHabit(null);
      
      toast.success(`Habit "${editHabitData.name}" updated successfully`);
    } catch (error) {
      console.error('Error updating habit:', error);
      toast.error('Failed to update habit');
    }
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-medium">Habits</h1>
        <div className="flex gap-2">
          <AppButton
            onClick={() => setIsAddHabitModalOpen(true)}
            variant="primary"
            icon={<Plus size={16} />}
          >
            Add Habit
          </AppButton>
        </div>
      </div>
      
      {!isLoading && habits.length > 0 && (
        <CardContainer className="animate-scale-in">
          <div className="space-y-4">
            <h3 className="font-medium">Today's Progress</h3>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {habitStats.completed} of {habitStats.total} habits completed
              </span>
              <span className="text-sm font-medium">
                {habitStats.percentage}%
              </span>
            </div>
            
            <ProgressBar 
              value={habitStats.completed} 
              max={habitStats.total} 
              size="md"
              variant={habitStats.percentage === 100 ? "success" : "default"}
            />
            
            {habitStats.percentage === 100 && (
              <div className="text-sm text-primary font-medium mt-2">
                🎉 Congratulations! You've completed all your habits for today.
              </div>
            )}
          </div>
        </CardContainer>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse text-muted-foreground">Loading habits...</div>
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-card">
          <p className="text-muted-foreground">No habits created yet</p>
          <AppButton 
            className="mt-4"
            icon={<Plus size={18} />}
            onClick={() => setIsAddHabitModalOpen(true)}
          >
            Create Your First Habit
          </AppButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {habits.map(habit => (
            <CardContainer key={habit.id} className="animate-scale-in">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target size={18} className="text-primary" />
                    <h3 className="font-medium">{habit.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleHabitCompletion(habit.id)}
                      className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors
                        ${habit.completedToday 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/90"}`}
                      aria-label={habit.completedToday ? "Mark as incomplete" : "Mark as complete"}
                      title={habit.completedToday ? "Mark as incomplete" : "Mark as complete"}
                    >
                      {habit.completedToday ? <Check size={16} /> : <X size={16} />}
                    </button>
                    <button
                      onClick={() => handleEditHabit(habit)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                      aria-label="Edit habit"
                      title="Edit habit"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteHabit(habit)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      aria-label="Delete habit"
                      title="Delete habit"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                {habit.description && (
                  <p className="text-sm text-muted-foreground">{habit.description}</p>
                )}
                
                <div className="pt-2">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span className="font-medium">
                      {habit.currentStreak}/{habit.targetDays} days
                    </span>
                  </div>
                  <ProgressBar 
                    value={habit.currentStreak} 
                    max={habit.targetDays} 
                    size="md"
                    variant={habit.currentStreak === habit.targetDays ? "success" : "default"}
                  />
                </div>
                
                <div className="pt-2 text-xs text-muted-foreground">
                  Started: {new Date(habit.startDate).toLocaleDateString('en-GB')}
                </div>
              </div>
            </CardContainer>
          ))}
        </div>
      )}
      
      <Modal
        isOpen={isAddHabitModalOpen}
        onClose={() => setIsAddHabitModalOpen(false)}
        title="Create New Habit"
      >
        <AddHabitForm
          onSubmit={handleAddHabit}
          onCancel={() => setIsAddHabitModalOpen(false)}
        />
      </Modal>
      
      <Modal
        isOpen={isEditHabitModalOpen}
        onClose={() => setIsEditHabitModalOpen(false)}
        title="Edit Habit"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-habit-name" className="text-sm font-medium">
              Habit Name
            </label>
            <input
              id="edit-habit-name"
              type="text"
              value={editHabitData.name}
              onChange={(e) => setEditHabitData({...editHabitData, name: e.target.value})}
              placeholder="e.g., Daily Reading"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="edit-habit-description" className="text-sm font-medium">
              Description (Optional)
            </label>
            <textarea
              id="edit-habit-description"
              value={editHabitData.description}
              onChange={(e) => setEditHabitData({...editHabitData, description: e.target.value})}
              placeholder="e.g., Read for at least 30 minutes every day"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="edit-target-days" className="text-sm font-medium">
              Target Days
            </label>
            <input
              id="edit-target-days"
              type="number"
              min={1}
              max={365}
              value={editHabitData.targetDays}
              onChange={(e) => setEditHabitData({...editHabitData, targetDays: Number(e.target.value)})}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <p className="text-xs text-muted-foreground">
              Number of days to complete this habit to make it stick
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="edit-current-streak" className="text-sm font-medium">
              Current Streak
            </label>
            <div className="flex items-center gap-2">
              <input
                id="edit-current-streak"
                type="number"
                min={0}
                max={999}
                value={editHabitData.currentStreak}
                onChange={(e) => setEditHabitData({...editHabitData, currentStreak: Number(e.target.value)})}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Manually adjust the current streak count
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <AppButton type="button" variant="outline" onClick={() => setIsEditHabitModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton type="button" onClick={saveHabitChanges} disabled={!editHabitData.name.trim()}>
              Save Changes
            </AppButton>
          </div>
        </div>
      </Modal>
      
      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Delete Habit"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete the habit "{currentHabit?.name}"? This action cannot be undone.
          </p>
          
          <div className="flex justify-end gap-2 pt-4">
            <AppButton type="button" variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </AppButton>
            <AppButton type="button" variant="destructive" onClick={confirmDeleteHabit}>
              Delete Habit
            </AppButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
