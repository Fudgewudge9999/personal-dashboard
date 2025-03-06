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
}

function Task({ id, title, status, priority }: TaskProps) {
  const [isCompleted, setIsCompleted] = useState(status === "completed");
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleTask = async () => {
    setIsUpdating(true);
    const newStatus = isCompleted ? "pending" : "completed";
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
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
      // Get today's date in ISO format (YYYY-MM-DD)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      // Query tasks due today
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('due_date', todayStr)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Cast the data to the correct type
      const typedTasks = data?.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status as "pending" | "completed",
        priority: task.priority as "high" | "medium" | "low",
        due_date: task.due_date
      })) || [];
      
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
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-lg">Today's Tasks</h3>
          <a href="/tasks" className="text-sm text-primary/80 hover:text-primary transition-colors">View All</a>
        </div>
        
        <div className="animate-fade-in">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No tasks due today</div>
          ) : (
            tasks.map((task) => (
              <Task 
                key={task.id} 
                id={task.id} 
                title={task.title} 
                status={task.status} 
                priority={task.priority} 
              />
            ))
          )}
        </div>
      </div>
    </CardContainer>
  );
}
