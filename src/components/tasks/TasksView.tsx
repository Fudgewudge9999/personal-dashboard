import { CardContainer } from "../common/CardContainer";
import { AppButton } from "../common/AppButton";
import { Plus, Search, Filter, CheckCircle2, Circle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "../common/Badge";
import { Modal } from "../common/Modal";
import { AddTaskForm } from "./AddTaskForm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "completed";
  created_at: string;
}

export function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  
  useEffect(() => {
    fetchTasks();
  }, []);
  
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Cast the data to the correct type
      const typedTasks = data?.map(task => ({
        ...task,
        priority: task.priority as "high" | "medium" | "low",
        status: task.status as "pending" | "completed"
      })) || [];
      
      setTasks(typedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleTaskCompletion = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
        
      if (error) throw error;
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus } 
          : task
      ));
      
      toast.success(`Task marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };
  
  const handleAddTask = async (taskData: {
    title: string;
    description?: string;
    dueDate?: string;
    priority: "high" | "medium" | "low";
  }) => {
    try {
      // Prepare the task data for Supabase
      const newTask = {
        title: taskData.title,
        description: taskData.description,
        due_date: taskData.dueDate,
        priority: taskData.priority,
        status: 'pending' as const,
        // Get user ID if we're using auth
        user_id: (await supabase.auth.getUser()).data.user?.id
      };
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select();
        
      if (error) throw error;
      
      // Cast the returned data to the correct type
      const typedTask = {
        ...data[0],
        priority: data[0].priority as "high" | "medium" | "low",
        status: data[0].status as "pending" | "completed"
      };
      
      // Update local state
      setTasks([typedTask, ...tasks]);
      setIsAddTaskModalOpen(false);
      toast.success("Task added successfully");
      return true; // Return true to indicate success
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
      return false; // Return false to indicate failure
    }
  };
  
  const handleDeleteTask = async (taskId: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
        
      if (error) throw error;
      
      // Update local state
      setTasks(tasks.filter(task => task.id !== taskId));
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };
  
  const priorityLabels = {
    high: { label: "High", class: "bg-rose-100 text-rose-800" },
    medium: { label: "Medium", class: "bg-amber-100 text-amber-800" },
    low: { label: "Low", class: "bg-slate-100 text-slate-800" }
  };
  
  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    task.priority.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    // First sort by completion status
    if (a.status === 'completed' && b.status === 'pending') return 1;
    if (a.status === 'pending' && b.status === 'completed') return -1;
    // Then sort by created_at date within each status group
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-medium">Tasks</h1>
        <AppButton 
          icon={<Plus size={18} />}
          onClick={() => setIsAddTaskModalOpen(true)}
        >
          Add Task
        </AppButton>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <input 
            type="text" 
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <AppButton variant="outline" icon={<Filter size={16} />}>Filter</AppButton>
      </div>
      
      <CardContainer className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? "No tasks match your search" : "No tasks available"}
          </div>
        ) : (
          <div className="divide-y">
            {filteredTasks.map(task => (
              <div key={task.id} className="py-4 flex items-start gap-3 animate-slide-up">
                <button
                  onClick={() => toggleTaskCompletion(task.id, task.status)}
                  className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                >
                  {task.status === 'completed' 
                    ? <CheckCircle2 size={20} className="text-primary" /> 
                    : <Circle size={20} />
                  }
                </button>
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </h3>
                    <Badge 
                      variant="secondary" 
                      className={priorityLabels[task.priority as keyof typeof priorityLabels].class}
                    >
                      {priorityLabels[task.priority as keyof typeof priorityLabels].label}
                    </Badge>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.description}
                    </p>
                  )}
                  
                  {task.due_date && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label={`Delete ${task.title} task`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContainer>
      
      <Modal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        title="Add New Task"
      >
        <AddTaskForm
          onSubmit={handleAddTask}
          onCancel={() => setIsAddTaskModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
