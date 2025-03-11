import { CardContainer } from "../common/CardContainer";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TasksWidgetProps {
  className?: string;
  refreshTrigger?: number;
}

interface TaskProps {
  id: string;
  title: string;
  status: "pending" | "completed";
  priority: "high" | "medium" | "low";
  due_date?: string;
  completed_at?: string | null;
}

function Task({ id, title, status, priority }: TaskProps) {
  const [isCompleted, setIsCompleted] = useState(status === "completed");
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleTask = async () => {
    setIsUpdating(true);
    const newStatus = isCompleted ? "pending" : "completed";
    const now = new Date().toISOString();
    
    try {
      const updateData = {
        status: newStatus,
        // Set completed_at to current timestamp when completing, or null when marking as pending
        completed_at: newStatus === 'completed' ? now : null
      };
      
      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id);
        
      if (error) throw error;
      
      setIsCompleted(!isCompleted);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setIsUpdating(false);
    }
  };

  const priorityClasses = {
    high: "before:bg-rose-500",
    medium: "before:bg-amber-500",
    low: "before:bg-blue-500",
  };

  return (
    <div className={cn(
      "flex items-center p-3 border-b last:border-b-0 group transition-colors",
      "before:content-[''] before:block before:w-1.5 before:h-1.5 before:rounded-full before:mr-3",
      priorityClasses[priority],
      isCompleted ? "opacity-60" : ""
    )}>
      <button 
        onClick={toggleTask} 
        className="flex-shrink-0 mr-2 text-muted-foreground hover:text-primary transition-colors"
        disabled={isUpdating}
      >
        {isCompleted ? <CheckCircle2 size={18} className="text-primary" /> : <Circle size={18} />}
      </button>
      <p className={cn(
        "text-sm transition-all",
        isCompleted ? "line-through text-muted-foreground" : ""
      )}>
        {title}
      </p>
    </div>
  );
}

export function TasksWidget({ className, refreshTrigger }: TasksWidgetProps) {
  const [tasks, setTasks] = useState<TaskProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchTodaysTasks();
  }, [refreshTrigger]);
  
  const fetchTodaysTasks = async () => {
    setIsLoading(true);
    try {
      // Get today's date bounds for comparison
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
      
      // Query tasks due today using a range query
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .gte('due_date', startOfDay)
        .lt('due_date', endOfDay)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      console.log('Today\'s tasks fetched:', data?.length || 0);
      
      // Cast the data to the correct type
      const typedTasks = (data?.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status as "pending" | "completed",
        priority: task.priority as "high" | "medium" | "low",
        due_date: task.due_date,
        completed_at: task.completed_at
      })) || []).sort((a, b) => {
        // First sort by completion status
        if (a.status === 'completed' && b.status === 'pending') return 1;
        if (a.status === 'pending' && b.status === 'completed') return -1;
        // Then sort by created_at date within each status group
        return 0; // Maintain the existing order from the query
      });
      
      setTasks(typedTasks);
    } catch (error) {
      console.error('Error fetching today\'s tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CardContainer className={cn("h-full", className)}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-lg">Today's Tasks</h3>
          <a href="/tasks" className="text-sm text-primary/80 hover:text-primary transition-colors">View All</a>
        </div>
        
        <div className="flex-1 overflow-hidden animate-fade-in">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No tasks due today</div>
          ) : (
            <div className="overflow-y-auto max-h-[250px] custom-scrollbar">
              {tasks.map((task) => (
                <Task 
                  key={task.id} 
                  id={task.id} 
                  title={task.title} 
                  status={task.status} 
                  priority={task.priority} 
                />
              ))}
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {tasks.length > 0 && `Showing ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
        </div>
      </div>
    </CardContainer>
  );
}
