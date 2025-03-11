import { useState, useEffect, useMemo } from "react";
import { CardContainer } from "../common/CardContainer";
import { AppButton } from "../common/AppButton";
import { Plus, Edit, Trash2, CheckCircle2, Circle, Target, Database, HardDrive, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/types/supabase-generated";
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from "react-beautiful-dnd";

// Define the Subgoal type based on the Database schema
interface Subgoal {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at?: string;
  goal_id: string;
  position: number;
}

// Define the Goal type based on the Database schema
interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  subgoals?: Subgoal[];
}

export function GoalsView() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [newGoalTargetDate, setNewGoalTargetDate] = useState("");
  const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false);
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  const [addingSubgoalForGoalId, setAddingSubgoalForGoalId] = useState<string | null>(null);
  const [newSubgoalTitle, setNewSubgoalTitle] = useState("");
  const { toast } = useToast();

  // Initialize from localStorage if Supabase is not available
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        console.log("Checking Supabase connection and auth...");
        
        // Try to get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log("Auth session check:", { 
          hasSession: !!session, 
          error: sessionError ? 'Error occurred' : 'No error',
          userId: session?.user?.id
        });
        
        if (!session || !session.user) {
          console.warn("No active session found");
          setIsUsingLocalStorage(true);
          toast({
            title: "Authentication Required",
            description: "Please sign in to save goals to the database",
            variant: "destructive",
          });
          // Only set loading to false here since we won't be fetching goals
          setIsLoading(false);
          return;
        }

        console.log("User authenticated, using database");
        setIsUsingLocalStorage(false);
        // Don't set loading to false here - fetchGoals will handle that
        fetchGoals();
      } catch (error) {
        console.error("Error checking auth status:", error);
        setIsUsingLocalStorage(true);
        toast({
          title: "Connection Error",
          description: "Unable to connect to the database. Using local storage instead.",
          variant: "destructive",
        });
        // Set loading to false since we won't be fetching goals
        setIsLoading(false);
      }
      // Remove the finally block as loading state is now handled elsewhere
    };
    
    checkSupabase();
  }, []);

  // Fetch goals from the database if not using localStorage
  useEffect(() => {
    if (!isUsingLocalStorage) {
      fetchGoals();
    } else {
      // If using localStorage, get goals from localStorage and set loading to false
      const savedGoals = localStorage.getItem('goals');
      if (savedGoals) {
        try {
          const parsedGoals = JSON.parse(savedGoals);
          setGoals(parsedGoals);
        } catch (error) {
          console.error("Error parsing goals from localStorage:", error);
        }
      }
      setIsLoading(false);
    }
  }, [isUsingLocalStorage]);

  // Save goals to localStorage when they change
  useEffect(() => {
    if (isUsingLocalStorage && goals.length > 0) {
      localStorage.setItem('goals', JSON.stringify(goals));
    }
  }, [goals, isUsingLocalStorage]);

  const fetchGoals = async () => {
    if (isUsingLocalStorage) return;
    
    try {
      setIsLoading(true);
      
      // First verify authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn("No authenticated user found during fetch");
        setIsUsingLocalStorage(true);
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST301') {
          // Invalid auth credentials
          setIsUsingLocalStorage(true);
          setIsLoading(false);
          return;
        }
        throw error;
      }

      // Now fetch subgoals for each goal
      const goalsWithSubgoals = await Promise.all(data.map(async (goal) => {
        try {
          const { data: subgoals, error: subgoalsError } = await supabase
            .from('subgoals')
            .select('*')
            .eq('goal_id', goal.id)
            .order('position', { ascending: true });
            
          if (subgoalsError) {
            console.error("Error fetching subgoals:", subgoalsError);
            return { ...goal, subgoals: [] };
          }
          
          return { ...goal, subgoals: subgoals || [] };
        } catch (error) {
          console.error("Error processing subgoals:", error);
          return { ...goal, subgoals: [] };
        }
      }));

      setGoals(goalsWithSubgoals || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast({
        title: "Error",
        description: "Failed to load goals. Using local storage instead.",
        variant: "destructive",
      });
      setIsUsingLocalStorage(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Sort function to move completed items to the bottom
  const sortByCompletion = <T extends { completed: boolean }>(items: T[]): T[] => {
    return [...items].sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1; // Move completed items to the bottom
    });
  };

  // Sort goals and subgoals before rendering
  const sortedGoals = useMemo(() => {
    // First sort the goals by completion status
    const sorted = sortByCompletion(goals);
    
    // Then sort the subgoals within each goal
    return sorted.map(goal => ({
      ...goal,
      subgoals: goal.subgoals ? sortByCompletion(goal.subgoals) : []
    }));
  }, [goals]);

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) {
      toast({
        title: "Error",
        description: "Goal title cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      // First verify authentication
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Current user:", user);
      
      if (!user) {
        console.warn("No authenticated user found during add");
        setIsUsingLocalStorage(true);
        toast({
          title: "Authentication Error",
          description: "Please sign in to save goals to the database",
          variant: "destructive",
        });
        return;
      }

      if (isUsingLocalStorage) {
        const localGoal: Goal = {
          id: `local-${Date.now()}`,
          title: newGoalTitle,
          description: newGoalDescription || null,
          target_date: newGoalTargetDate || null,
          completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: user.id
        };

        console.log("Using localStorage to add goal:", localGoal);
        setGoals([localGoal, ...goals]);
        resetForm();
        setIsAddingGoal(false);
        
        toast({
          title: "Success",
          description: "Goal added to local storage",
        });
        return;
      }

      // Try to add to Supabase
      console.log("Attempting to add goal to database...");
      
      const goalData = {
        title: newGoalTitle,
        description: newGoalDescription || null,
        target_date: newGoalTargetDate || null,
        completed: false,
        user_id: user.id
      };
      
      console.log("Goal data to insert:", goalData);

      const { data, error } = await supabase
        .from('goals')
        .insert([goalData])
        .select()
        .single();

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Database error details:", {
          code: error.code,
          msg: error.message,
          details: error.details,
          hint: error.hint
        });

        if (error.code === 'PGRST301' || error.code === '42501') {
          toast({
            title: "Permission Error",
            description: "You don't have permission to add goals. Please check your login status.",
            variant: "destructive",
          });
          setIsUsingLocalStorage(true);
        } else {
          throw error;
        }
      } else if (data) {
        console.log("Successfully added goal:", data);
        setGoals([data, ...goals]);
        toast({
          title: "Success",
          description: "Goal added to database",
        });
        resetForm();
        setIsAddingGoal(false);
      }
    } catch (error) {
      console.error("Error adding goal:", error);
      toast({
        title: "Error",
        description: "Failed to add goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateGoal = async (goalId: string) => {
    if (!newGoalTitle.trim()) {
      toast({
        title: "Error",
        description: "Goal title cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const updates = {
        title: newGoalTitle,
        description: newGoalDescription || null,
        target_date: newGoalTargetDate || null,
        updated_at: new Date().toISOString()
      };

      if (isUsingLocalStorage || goalId.startsWith('local-')) {
        // Update in local state only
        const updatedGoals = goals.map((goal) => {
          if (goal.id === goalId) {
            return { ...goal, ...updates };
          }
          return goal;
        });
        
        setGoals(updatedGoals);
        resetForm();
        setEditingGoalId(null);
        
        toast({
          title: "Success",
          description: "Goal updated in local storage",
        });
        return;
      }

      // Try to update in Supabase
      const { error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId);

      if (error) {
        console.error("Supabase update error:", error);
        // Fall back to local storage
        setIsUsingLocalStorage(true);
        
        const updatedGoals = goals.map((goal) => {
          if (goal.id === goalId) {
            return { ...goal, ...updates };
          }
          return goal;
        });
        
        setGoals(updatedGoals);
        
        toast({
          title: "Database Error",
          description: "Goal updated in local storage instead",
          variant: "destructive",
        });
      } else {
        // Update local state
        const updatedGoals = goals.map((goal) => {
          if (goal.id === goalId) {
            return { ...goal, ...updates };
          }
          return goal;
        });
        
        setGoals(updatedGoals);
        
        toast({
          title: "Success",
          description: "Goal updated successfully",
        });
      }
      
      resetForm();
      setEditingGoalId(null);
    } catch (error) {
      console.error("Error updating goal:", error);
      toast({
        title: "Error",
        description: "Failed to update goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      if (isUsingLocalStorage || goalId.startsWith('local-')) {
        // Delete from local state only
        const updatedGoals = goals.filter((goal) => goal.id !== goalId);
        setGoals(updatedGoals);
        
        toast({
          title: "Success",
          description: "Goal deleted from local storage",
        });
        return;
      }

      // Delete subgoals first if using Supabase
      const { error: subgoalsError } = await supabase
        .from('subgoals')
        .delete()
        .eq('goal_id', goalId);
        
      if (subgoalsError) {
        console.error("Error deleting subgoals:", subgoalsError);
      }

      // Try to delete goal from Supabase
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) {
        console.error("Supabase delete error:", error);
        // Fall back to local storage
        setIsUsingLocalStorage(true);
        
        const updatedGoals = goals.filter((goal) => goal.id !== goalId);
        setGoals(updatedGoals);
        
        toast({
          title: "Database Error",
          description: "Goal deleted from local storage",
          variant: "destructive",
        });
      } else {
        // Update local state
        const updatedGoals = goals.filter((goal) => goal.id !== goalId);
        setGoals(updatedGoals);
        
        toast({
          title: "Success",
          description: "Goal deleted successfully",
        });
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({
        title: "Error",
        description: "Failed to delete goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleComplete = async (goalId: string) => {
    try {
      // Find the goal to toggle
      const goalToToggle = goals.find((g) => g.id === goalId);
      if (!goalToToggle) return;

      const newCompletedState = !goalToToggle.completed;

      if (isUsingLocalStorage || goalId.startsWith('local-')) {
        // Update in local state only
        const updatedGoals = goals.map((goal) => {
          if (goal.id === goalId) {
            return {
              ...goal,
              completed: newCompletedState,
              updated_at: new Date().toISOString()
            };
          }
          return goal;
        });
        
        setGoals(updatedGoals);
        
        toast({
          title: newCompletedState ? "Goal completed!" : "Goal marked as incomplete",
          description: goalToToggle.title,
        });
        return;
      }

      // Try to update in Supabase
      const { error } = await supabase
        .from('goals')
        .update({ 
          completed: newCompletedState,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);

      if (error) {
        console.error("Supabase toggle error:", error);
        // Fall back to local storage
        setIsUsingLocalStorage(true);
        
        const updatedGoals = goals.map((goal) => {
          if (goal.id === goalId) {
            return {
              ...goal,
              completed: newCompletedState,
              updated_at: new Date().toISOString()
            };
          }
          return goal;
        });
        
        setGoals(updatedGoals);
        
        toast({
          title: newCompletedState ? "Goal completed!" : "Goal marked as incomplete",
          description: "Saved to local storage",
        });
      } else {
        // Update local state
        const updatedGoals = goals.map((goal) => {
          if (goal.id === goalId) {
            return {
              ...goal,
              completed: newCompletedState,
              updated_at: new Date().toISOString()
            };
          }
          return goal;
        });
        
        setGoals(updatedGoals);
        
        toast({
          title: newCompletedState ? "Goal completed!" : "Goal marked as incomplete",
          description: goalToToggle.title,
        });
      }
    } catch (error) {
      console.error("Error toggling goal completion:", error);
      toast({
        title: "Error",
        description: "Failed to update goal status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startEditing = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setNewGoalTitle(goal.title);
    setNewGoalDescription(goal.description || "");
    setNewGoalTargetDate(goal.target_date || "");
  };

  const resetForm = () => {
    setNewGoalTitle("");
    setNewGoalDescription("");
    setNewGoalTargetDate("");
  };

  const cancelForm = () => {
    resetForm();
    setIsAddingGoal(false);
    setEditingGoalId(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Function to reset the storage mode
  const resetStorageMode = async () => {
    try {
      setIsLoading(true);
      
      // First, let's check if the subgoals table exists
      const { data: tableExists, error: tableError } = await supabase
        .from('subgoals')
        .select('id')
        .limit(1);
        
      if (tableError && tableError.code === '42P01') {
        toast({
          title: "Database Error",
          description: "The subgoals table doesn't exist. Please run the SQL setup.",
          variant: "destructive",
        });
        setIsUsingLocalStorage(true);
        setIsLoading(false);
        return;
      }
      
      // Clear the isUsingLocalStorage flag
      setIsUsingLocalStorage(false);
      
      // Try to connect to Supabase
      const { data, error } = await supabase.from('goals').select('count');
      console.log("Storage mode reset check:", { data, error });
      
      if (error) {
        console.warn("Still can't connect to Supabase:", error);
        setIsUsingLocalStorage(true);
        toast({
          title: "Database Connection Failed",
          description: "Still using local storage for goals",
          variant: "destructive",
        });
      } else {
        console.log("Successfully connected to Supabase");
        // Fetch goals from database
        fetchGoals();
        toast({
          title: "Success",
          description: "Now using database for goals",
        });
      }
    } catch (error) {
      console.error("Error resetting storage mode:", error);
      setIsUsingLocalStorage(true);
      toast({
        title: "Error",
        description: "Failed to connect to database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to toggle expand/collapse for a goal
  const toggleGoalExpanded = (goalId: string) => {
    setExpandedGoals(prev => ({
      ...prev,
      [goalId]: !prev[goalId]
    }));
  };

  // Function to add a subgoal
  const handleAddSubgoal = async (goalId: string) => {
    if (!newSubgoalTitle.trim()) {
      toast({
        title: "Error",
        description: "Subgoal title cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      // First verify the goal exists in Supabase
      if (!isUsingLocalStorage) {
        const { data: goalExists, error: goalCheckError } = await supabase
          .from('goals')
          .select('id')
          .eq('id', goalId)
          .single();

        if (goalCheckError || !goalExists) {
          console.error("Error verifying goal existence:", goalCheckError);
          toast({
            title: "Error",
            description: "Could not verify parent goal in database",
            variant: "destructive",
          });
          return;
        }
      }

      // Get the current goal and its subgoals
      const currentGoal = goals.find(g => g.id === goalId);
      const currentPosition = currentGoal?.subgoals?.length || 0;

      const newSubgoal = {
        title: newSubgoalTitle,
        completed: false,
        goal_id: goalId,
        position: currentPosition // Set position to the end of the list
      };

      if (isUsingLocalStorage || goalId.startsWith('local-')) {
        // Local storage handling...
        const localSubgoal: Subgoal = {
          id: `local-sub-${Date.now()}`,
          ...newSubgoal,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        const updatedGoals = goals.map(goal => {
          if (goal.id === goalId) {
            return {
              ...goal,
              subgoals: [...(goal.subgoals || []), localSubgoal]
            };
          }
          return goal;
        });
        
        setGoals(updatedGoals);
        setNewSubgoalTitle("");
        setAddingSubgoalForGoalId(null);
        
        toast({
          title: "Success",
          description: "Subgoal added to local storage",
        });
        return;
      }

      console.log("Attempting to add subgoal to Supabase:", {
        ...newSubgoal,
        goal_id: goalId
      });

      // Try to add to Supabase with explicit error handling
      const { data, error } = await supabase
        .from('subgoals')
        .insert([newSubgoal])
        .select()
        .single();

      if (error) {
        console.error("Supabase error details:", {
          code: error.code,
          msg: error.message,
          details: error.details,
          hint: error.hint
        });

        if (error.code === '42501') {
          toast({
            title: "Permission Error",
            description: "You don't have permission to add subgoals. Please check database policies.",
            variant: "destructive",
          });
        } else if (error.code === '23503') {
          toast({
            title: "Reference Error",
            description: "The parent goal doesn't exist in the database.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Database Error",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (data) {
        console.log("Successfully added subgoal:", data);
        // Update local state with the new subgoal from Supabase
        const updatedGoals = goals.map(goal => {
          if (goal.id === goalId) {
            return {
              ...goal,
              subgoals: [...(goal.subgoals || []), data]
            };
          }
          return goal;
        });
        
        setGoals(updatedGoals);
        setNewSubgoalTitle("");
        setAddingSubgoalForGoalId(null);
        
        toast({
          title: "Success",
          description: "Subgoal added to database",
        });
      }
    } catch (error) {
      console.error("Error adding subgoal:", error);
      toast({
        title: "Error",
        description: "Failed to add subgoal. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to toggle a subgoal's completion status
  const handleToggleSubgoalComplete = async (goalId: string, subgoalId: string) => {
    try {
      // Find the subgoal to toggle
      const goal = goals.find(g => g.id === goalId);
      if (!goal || !goal.subgoals) return;
      
      const subgoal = goal.subgoals.find(s => s.id === subgoalId);
      if (!subgoal) return;

      const newCompletedState = !subgoal.completed;

      if (isUsingLocalStorage || subgoalId.startsWith('local-') || goalId.startsWith('local-')) {
        // Update in local state only
        const updatedGoals = goals.map(g => {
          if (g.id === goalId) {
            const updatedSubgoals = (g.subgoals || []).map(s => {
              if (s.id === subgoalId) {
                return {
                  ...s,
                  completed: newCompletedState,
                  updated_at: new Date().toISOString()
                };
              }
              return s;
            });
            
            return {
              ...g,
              subgoals: updatedSubgoals
            };
          }
          return g;
        });
        
        setGoals(updatedGoals);
        
        toast({
          title: newCompletedState ? "Subgoal completed!" : "Subgoal marked as incomplete",
          description: subgoal.title,
        });
        return;
      }

      // Try to update in Supabase
      const { error } = await supabase
        .from('subgoals')
        .update({ 
          completed: newCompletedState,
          updated_at: new Date().toISOString()
        })
        .eq('id', subgoalId);

      if (error) {
        console.error("Supabase toggle subgoal error:", error);
        // Fall back to local storage
        setIsUsingLocalStorage(true);
        
        const updatedGoals = goals.map(g => {
          if (g.id === goalId) {
            const updatedSubgoals = (g.subgoals || []).map(s => {
              if (s.id === subgoalId) {
                return {
                  ...s,
                  completed: newCompletedState,
                  updated_at: new Date().toISOString()
                };
              }
              return s;
            });
            
            return {
              ...g,
              subgoals: updatedSubgoals
            };
          }
          return g;
        });
        
        setGoals(updatedGoals);
        
        toast({
          title: newCompletedState ? "Subgoal completed!" : "Subgoal marked as incomplete",
          description: "Saved to local storage",
        });
      } else {
        // Update local state
        const updatedGoals = goals.map(g => {
          if (g.id === goalId) {
            const updatedSubgoals = (g.subgoals || []).map(s => {
              if (s.id === subgoalId) {
                return {
                  ...s,
                  completed: newCompletedState,
                  updated_at: new Date().toISOString()
                };
              }
              return s;
            });
            
            return {
              ...g,
              subgoals: updatedSubgoals
            };
          }
          return g;
        });
        
        setGoals(updatedGoals);
        
        toast({
          title: newCompletedState ? "Subgoal completed!" : "Subgoal marked as incomplete",
          description: subgoal.title,
        });
      }
    } catch (error) {
      console.error("Error toggling subgoal completion:", error);
      toast({
        title: "Error",
        description: "Failed to update subgoal status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to delete a subgoal
  const handleDeleteSubgoal = async (goalId: string, subgoalId: string) => {
    try {
      if (isUsingLocalStorage || subgoalId.startsWith('local-') || goalId.startsWith('local-')) {
        // Delete from local state only
        const updatedGoals = goals.map(g => {
          if (g.id === goalId) {
            return {
              ...g,
              subgoals: (g.subgoals || []).filter(s => s.id !== subgoalId)
            };
          }
          return g;
        });
        
        setGoals(updatedGoals);
        
        toast({
          title: "Success",
          description: "Subgoal deleted from local storage",
        });
        return;
      }

      // Try to delete from Supabase
      const { error } = await supabase
        .from('subgoals')
        .delete()
        .eq('id', subgoalId);

      if (error) {
        console.error("Supabase delete subgoal error:", error);
        // Fall back to local storage
        setIsUsingLocalStorage(true);
        
        const updatedGoals = goals.map(g => {
          if (g.id === goalId) {
            return {
              ...g,
              subgoals: (g.subgoals || []).filter(s => s.id !== subgoalId)
            };
          }
          return g;
        });
        
        setGoals(updatedGoals);
        
        toast({
          title: "Database Error",
          description: "Subgoal deleted from local storage",
          variant: "destructive",
        });
      } else {
        // Update local state
        const updatedGoals = goals.map(g => {
          if (g.id === goalId) {
            return {
              ...g,
              subgoals: (g.subgoals || []).filter(s => s.id !== subgoalId)
            };
          }
          return g;
        });
        
        setGoals(updatedGoals);
        
        toast({
          title: "Success",
          description: "Subgoal deleted successfully",
        });
      }
    } catch (error) {
      console.error("Error deleting subgoal:", error);
      toast({
        title: "Error",
        description: "Failed to delete subgoal. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update the handleReorderSubgoals function to handle batch updates more efficiently
  const handleReorderSubgoals = async (goalId: string, startIndex: number, endIndex: number) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal || !goal.subgoals) return;

      // Create a copy of the subgoals array
      const newSubgoals = Array.from(goal.subgoals);
      const [removed] = newSubgoals.splice(startIndex, 1);
      newSubgoals.splice(endIndex, 0, removed);

      // Update local state first for immediate feedback
      const updatedGoals = goals.map(g => {
        if (g.id === goalId) {
          return {
            ...g,
            subgoals: newSubgoals
          };
        }
        return g;
      });
      setGoals(updatedGoals);

      if (!isUsingLocalStorage && !goalId.startsWith('local-')) {
        // Batch update all positions in a single query
        const { error } = await supabase.rpc('reorder_subgoals', {
          goal_id_param: goalId,
          subgoal_positions: newSubgoals.map((subgoal, index) => ({
            id: subgoal.id,
            position: index
          }))
        });

        if (error) {
          console.error("Error updating subgoal positions:", error);
          throw error;
        }
      }
    } catch (error) {
      console.error("Error reordering subgoals:", error);
      toast({
        title: "Error",
        description: "Failed to reorder subgoals",
        variant: "destructive",
      });
      // Refresh goals to ensure consistency
      if (!isUsingLocalStorage) {
        fetchGoals();
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-medium">Goals</h1>
        <div className="flex gap-2">
          {isUsingLocalStorage && (
            <AppButton
              onClick={resetStorageMode}
              variant="outline"
              icon={<Database size={16} />}
              title="Try to use database instead of local storage"
            >
              Try Database
            </AppButton>
          )}
          <AppButton
            onClick={() => setIsAddingGoal(true)}
            variant="primary"
            icon={<Plus size={16} />}
          >
            Add Goal
          </AppButton>
        </div>
      </div>

      {isUsingLocalStorage && (
        <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-md flex items-center gap-2 text-sm">
          <HardDrive size={16} />
          <span>Using local storage for goals. Data is only stored in this browser.</span>
        </div>
      )}

      {(isAddingGoal || editingGoalId) && (
        <CardContainer>
          <div className="space-y-4">
            <h2 className="text-xl font-medium">
              {editingGoalId ? "Edit Goal" : "Add New Goal"}
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Goal Title *
                </label>
                <Input
                  id="title"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="Enter goal title..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={newGoalDescription}
                  onChange={(e) => setNewGoalDescription(e.target.value)}
                  placeholder="Enter goal description..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="targetDate" className="text-sm font-medium">
                  Target Date
                </label>
                <Input
                  id="targetDate"
                  type="date"
                  value={newGoalTargetDate}
                  onChange={(e) => setNewGoalTargetDate(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <AppButton
                  onClick={cancelForm}
                  variant="outline"
                >
                  Cancel
                </AppButton>
                <AppButton
                  onClick={() => editingGoalId ? handleUpdateGoal(editingGoalId) : handleAddGoal()}
                  variant="primary"
                >
                  {editingGoalId ? "Update Goal" : "Add Goal"}
                </AppButton>
              </div>
            </div>
          </div>
        </CardContainer>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <Target size={48} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-medium mb-2">No Goals Yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first goal to start tracking your progress.
          </p>
          <AppButton
            onClick={() => setIsAddingGoal(true)}
            variant="primary"
          >
            Add Your First Goal
          </AppButton>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedGoals.map((goal) => (
            <CardContainer key={goal.id}>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleComplete(goal.id)}
                    className="mt-1 flex-shrink-0 text-primary hover:text-primary/80 transition-colors"
                    aria-label={goal.completed ? "Mark as incomplete" : "Mark as complete"}
                  >
                    {goal.completed ? (
                      <CheckCircle2 size={20} className="text-green-500" />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>
                  
                  <div className="flex-grow">
                    <div className="flex items-center">
                      {(goal.subgoals && goal.subgoals.length > 0) && (
                        <button 
                          onClick={() => toggleGoalExpanded(goal.id)}
                          className="mr-1 text-gray-500 hover:text-primary transition-colors"
                          aria-label={expandedGoals[goal.id] ? "Collapse goal" : "Expand goal"}
                        >
                          {expandedGoals[goal.id] ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                      )}
                      <h3 className={cn(
                        "text-lg font-medium mb-1",
                        goal.completed && "line-through text-gray-500"
                      )}>
                        {goal.title}
                      </h3>
                    </div>
                    
                    {goal.description && (
                      <p className={cn(
                        "text-gray-600 dark:text-gray-300 mb-2",
                        goal.completed && "text-gray-400 dark:text-gray-500"
                      )}>
                        {goal.description}
                      </p>
                    )}
                    
                    {goal.target_date && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Target: {formatDate(goal.target_date)}
                      </div>
                    )}
                    
                    {/* Show subgoal count */}
                    {goal.subgoals && goal.subgoals.length > 0 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {goal.subgoals.filter(s => s.completed).length} of {goal.subgoals.length} subgoals completed
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEditing(goal)}
                      className="text-gray-500 hover:text-primary transition-colors"
                      aria-label="Edit goal"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                      aria-label="Delete goal"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                {/* Subgoals section */}
                {(goal.subgoals && goal.subgoals.length > 0 && expandedGoals[goal.id]) && (
                  <div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                    <DragDropContext
                      onDragEnd={(result: DropResult) => {
                        if (!result.destination) return;
                        handleReorderSubgoals(
                          goal.id,
                          result.source.index,
                          result.destination.index
                        );
                      }}
                    >
                      <Droppable droppableId={`subgoals-${goal.id}`}>
                        {(provided: DroppableProvided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="space-y-2"
                          >
                            {goal.subgoals.map((subgoal, index) => (
                              <Draggable
                                key={subgoal.id}
                                draggableId={subgoal.id}
                                index={index}
                              >
                                {(provided: DraggableProvided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="flex items-center justify-between group bg-background rounded-md p-1 hover:bg-accent/50 transition-colors"
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <GripVertical size={14} />
                                      </div>
                                      <button
                                        onClick={() => handleToggleSubgoalComplete(goal.id, subgoal.id)}
                                        className="flex-shrink-0 text-primary hover:text-primary/80 transition-colors"
                                        aria-label={subgoal.completed ? "Mark as incomplete" : "Mark as complete"}
                                      >
                                        {subgoal.completed ? (
                                          <CheckCircle2 size={16} className="text-green-500" />
                                        ) : (
                                          <Circle size={16} />
                                        )}
                                      </button>
                                      <span className={cn(
                                        "text-sm flex-1",
                                        subgoal.completed && "line-through text-gray-500"
                                      )}>
                                        {subgoal.title}
                                      </span>
                                      <button
                                        onClick={() => handleDeleteSubgoal(goal.id, subgoal.id)}
                                        className="flex-shrink-0 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        aria-label="Delete subgoal"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                )}
                
                {/* Add subgoal button and form */}
                {!addingSubgoalForGoalId || addingSubgoalForGoalId !== goal.id ? (
                  <div className="ml-8">
                    <button
                      onClick={() => {
                        setAddingSubgoalForGoalId(goal.id);
                        setExpandedGoals(prev => ({ ...prev, [goal.id]: true }));
                      }}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <Plus size={14} />
                      <span>Add Subgoal</span>
                    </button>
                  </div>
                ) : (
                  <div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                    <div className="flex items-center gap-2">
                      <Input
                        value={newSubgoalTitle}
                        onChange={(e) => setNewSubgoalTitle(e.target.value)}
                        placeholder="Enter subgoal title..."
                        className="text-sm h-8"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddSubgoal(goal.id);
                          }
                        }}
                      />
                      <AppButton
                        onClick={() => handleAddSubgoal(goal.id)}
                        variant="primary"
                        size="sm"
                      >
                        Add
                      </AppButton>
                      <AppButton
                        onClick={() => {
                          setAddingSubgoalForGoalId(null);
                          setNewSubgoalTitle("");
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </AppButton>
                    </div>
                  </div>
                )}
              </div>
            </CardContainer>
          ))}
        </div>
      )}
    </div>
  );
} 