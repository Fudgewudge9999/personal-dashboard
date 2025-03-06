import { CardContainer } from "../common/CardContainer";
import { cn } from "@/lib/utils";
import { ProgressBar } from "../common/ProgressBar";
import { Check, X, Edit, Trash2, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Habit as HabitType } from "@/types/supabase";
import { AppButton } from "../common/AppButton";
import { Modal } from "../common/Modal";

interface HabitWidgetProps {
  className?: string;
}

interface HabitProps {
  id: string;
  name: string;
  targetDays: number;
  currentStreak: number;
  completedToday: boolean;
  lastCompletedDate?: string;
  onEdit: (habit: HabitProps) => void;
  onDelete: (habit: HabitProps) => void;
}

function Habit({ 
  id, 
  name, 
  targetDays, 
  currentStreak, 
  completedToday: initialCompleted,
  onEdit,
  onDelete
}: HabitProps) {
  const [completedToday, setCompletedToday] = useState(initialCompleted);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const toggleHabit = async () => {
    try {
      setIsUpdating(true);
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Optimistically update UI
      setCompletedToday(!completedToday);
      
      if (completedToday) {
        // If we're unchecking a habit, just set completedToday to false
        const { error } = await supabase
          .from('habits')
          .update({ completed_today: false })
          .eq('id', id);
        
        if (error) {
          throw error;
        }
        
        toast.success(`Habit "${name}" marked as incomplete`);
      } else {
        // If we're checking a habit, fetch its current data first to check lastCompletedDate
        const { data: habitData, error: fetchError } = await supabase
          .from('habits')
          .select('last_completed_date')
          .eq('id', id)
          .single();
        
        if (fetchError) {
          throw fetchError;
        }
        
        // If lastCompletedDate is today, we've already counted this in the streak
        if ((habitData as any).last_completed_date === today) {
          const { error } = await supabase
            .from('habits')
            .update({ completed_today: true })
            .eq('id', id);
          
          if (error) {
            throw error;
          }
          
          toast.success(`Habit "${name}" marked as complete`);
        } else {
          // If lastCompletedDate is not today, increment the streak
          const { error } = await supabase
            .from('habits')
            .update({ 
              completed_today: true,
              current_streak: currentStreak + 1,
              last_completed_date: today
            })
            .eq('id', id);
          
          if (error) {
            throw error;
          }
          
          toast.success(`Habit "${name}" completed! Streak: ${currentStreak + 1} days`);
        }
      }
    } catch (error) {
      console.error('Error updating habit:', error);
      toast.error('Failed to update habit');
      
      // Revert the optimistic update
      setCompletedToday(!completedToday);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Calculate streak percentage
  const progress = Math.round((currentStreak / targetDays) * 100);
  
  return (
    <div className="border-b last:border-b-0 py-3 first:pt-0 last:pb-0 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-primary" />
          <span className="font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">
            {currentStreak}/{targetDays} days
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleHabit}
            disabled={isUpdating}
            className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors
              ${completedToday 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "bg-secondary text-secondary-foreground hover:bg-secondary/90"}`}
            aria-label={completedToday ? "Mark as incomplete" : "Mark as complete"}
            title={completedToday ? "Mark as incomplete" : "Mark as complete"}
          >
            {isUpdating ? (
              <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
            ) : completedToday ? (
              <Check size={14} />
            ) : (
              <X size={14} />
            )}
          </button>
          <button
            onClick={() => onEdit({ id, name, targetDays, currentStreak, completedToday: initialCompleted, lastCompletedDate: undefined, onEdit, onDelete })}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
            aria-label="Edit habit"
            title="Edit habit"
          >
            <Edit size={12} />
          </button>
          <button
            onClick={() => onDelete({ id, name, targetDays, currentStreak, completedToday: initialCompleted, lastCompletedDate: undefined, onEdit, onDelete })}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            aria-label="Delete habit"
            title="Delete habit"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      
      <div className="flex items-center">
        <ProgressBar
          value={currentStreak}
          max={targetDays}
          size="sm"
          className="flex-1 mr-3"
        />
      </div>
    </div>
  );
}

interface EditHabitData {
  name: string;
  targetDays: number;
  currentStreak: number;
}

export function HabitWidget({ className }: HabitWidgetProps) {
  const [habits, setHabits] = useState<HabitProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditHabitModalOpen, setIsEditHabitModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentHabit, setCurrentHabit] = useState<HabitProps | null>(null);
  const [editHabitData, setEditHabitData] = useState<EditHabitData>({
    name: '',
    targetDays: 21,
    currentStreak: 0
  });
  
  useEffect(() => {
    fetchHabits();
  }, []);
  
  const fetchHabits = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('habits')
        .select('id, name, target_days, current_streak, completed_today, last_completed_date')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) {
        throw error;
      }
      
      // Transform the data to match our HabitProps interface
      const transformedHabits: HabitProps[] = (data as any[]).map(habit => ({
        id: habit.id,
        name: habit.name,
        targetDays: habit.target_days,
        currentStreak: habit.current_streak,
        completedToday: habit.completed_today,
        lastCompletedDate: habit.last_completed_date,
        onEdit: handleEditHabit,
        onDelete: handleDeleteHabit
      }));
      
      setHabits(transformedHabits);
    } catch (error) {
      console.error('Error fetching habits:', error);
      // Don't show toast here to avoid cluttering the dashboard
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditHabit = (habit: HabitProps) => {
    setCurrentHabit(habit);
    setEditHabitData({
      name: habit.name,
      targetDays: habit.targetDays,
      currentStreak: habit.currentStreak
    });
    setIsEditHabitModalOpen(true);
  };
  
  const handleDeleteHabit = (habit: HabitProps) => {
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
              targetDays: editHabitData.targetDays,
              currentStreak: editHabitData.currentStreak
            } 
          : habit
      ));
      
      setIsEditHabitModalOpen(false);
      setCurrentHabit(null);
      
      toast.success(`Habit "${editHabitData.name}" updated successfully`);
      
      // Refresh habits
      fetchHabits();
    } catch (error) {
      console.error('Error updating habit:', error);
      toast.error('Failed to update habit');
    }
  };

  return (
    <CardContainer className={cn("h-full", className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-lg">Habit Tracker</h3>
          <a href="/habits" className="text-sm text-primary/80 hover:text-primary transition-colors">View All</a>
        </div>
        
        {isLoading ? (
          <div className="py-4 flex justify-center">
            <div className="animate-pulse text-sm text-muted-foreground">Loading habits...</div>
          </div>
        ) : habits.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">No habits created yet</p>
            <a 
              href="/habits" 
              className="text-xs text-primary/80 hover:text-primary transition-colors mt-2 inline-block"
            >
              Create your first habit
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => (
              <Habit 
                key={habit.id}
                {...habit}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="pt-2">
        <AppButton 
          variant="ghost" 
          size="sm" 
          className="w-full justify-center text-xs"
          onClick={() => window.location.href = "/habits"}
        >
          View All Habits
        </AppButton>
      </div>
      
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
    </CardContainer>
  );
}
