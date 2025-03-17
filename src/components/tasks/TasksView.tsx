import { CardContainer } from "../common/CardContainer";
import { AppButton } from "../common/AppButton";
import { Plus, Search, Filter, CheckCircle2, Circle, X, Clock, Pencil, CheckCheck, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Badge } from "../common/Badge";
import { Modal } from "../common/Modal";
import { TaskForm } from "./TaskForm";
import { SubtaskForm } from "./SubtaskForm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Subtask {
  id: string;
  task_id: string;
  title: string;
  status: "pending" | "completed";
  created_at: string;
  completed_at?: string | null;
  user_id: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "completed";
  created_at: string;
  completed_at?: string | null;
  subtasks?: Subtask[];
}

type TaskFilter = "all" | "overdue" | "today" | "upcoming" | "completed";
type CompletedSort = "newest" | "oldest";

export function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("all");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [activeTaskForSubtask, setActiveTaskForSubtask] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [completedSort, setCompletedSort] = useState<CompletedSort>("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    fetchTasks();
  }, []);
  
  // Handle click outside to close sort dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (tasksError) throw tasksError;

      // Fetch subtasks for all tasks
      const { data: subtasksData, error: subtasksError } = await supabase
        .from('subtasks')
        .select('*')
        .in('task_id', tasksData.map(task => task.id));

      if (subtasksError) throw subtasksError;
      
      // Group subtasks by task_id and cast to correct type
      const subtasksByTaskId = subtasksData.reduce((acc, subtask) => {
        if (!acc[subtask.task_id]) {
          acc[subtask.task_id] = [];
        }
        acc[subtask.task_id].push({
          ...subtask,
          status: subtask.status as "pending" | "completed"
        });
        return acc;
      }, {} as Record<string, Subtask[]>);

      // Cast the data to the correct type and include subtasks
      const typedTasks = tasksData?.map(task => ({
        ...task,
        priority: task.priority as "high" | "medium" | "low",
        status: task.status as "pending" | "completed",
        subtasks: subtasksByTaskId[task.id] || []
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
        .eq('id', taskId);
        
      if (error) throw error;
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, completed_at: newStatus === 'completed' ? now : null } 
          : task
      ));
      
      toast.success(`Task marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };
  
  const handleEditTask = async (taskData: {
    title: string;
    description?: string;
    dueDate?: string;
    priority: "high" | "medium" | "low";
  }) => {
    if (!editingTask) return;
    
    try {
      const updatedTask = {
        title: taskData.title,
        description: taskData.description,
        due_date: taskData.dueDate,
        priority: taskData.priority,
        // Preserve the completed_at field if it exists
        completed_at: editingTask.completed_at
      };
      
      const { data, error } = await supabase
        .from('tasks')
        .update(updatedTask)
        .eq('id', editingTask.id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Cast the returned data to the correct type
      const typedTask = {
        ...data,
        priority: data.priority as "high" | "medium" | "low",
        status: data.status as "pending" | "completed"
      };
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === editingTask.id ? typedTask : task
      ));
      
      setIsTaskModalOpen(false);
      setEditingTask(null);
      toast.success("Task updated successfully");
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      return false;
    }
  };
  
  const handleAddTask = async (taskData: {
    title: string;
    description?: string;
    dueDate?: string;
    priority: "high" | "medium" | "low";
  }) => {
    try {
      const newTask = {
        title: taskData.title,
        description: taskData.description,
        due_date: taskData.dueDate,
        priority: taskData.priority,
        status: 'pending' as const,
        completed_at: null,
        user_id: (await supabase.auth.getUser()).data.user?.id
      };
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select();
        
      if (error) throw error;
      
      const typedTask = {
        ...data[0],
        priority: data[0].priority as "high" | "medium" | "low",
        status: data[0].status as "pending" | "completed"
      };
      
      setTasks([typedTask, ...tasks]);
      setIsTaskModalOpen(false);
      toast.success("Task added successfully");
      return true;
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
      return false;
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
  
  const clearCompletedTasks = async () => {
    const completedTasks = tasks.filter(task => task.status === 'completed');
    if (completedTasks.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete all ${completedTasks.length} completed tasks?`)) {
      return;
    }
    
    try {
      const completedIds = completedTasks.map(task => task.id);
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', completedIds);
        
      if (error) throw error;
      
      // Update local state
      setTasks(tasks.filter(task => task.status !== 'completed'));
      toast.success(`${completedTasks.length} completed tasks deleted`);
      
      // If we're in the completed filter, switch back to all
      if (activeFilter === 'completed') {
        setActiveFilter('all');
      }
    } catch (error) {
      console.error('Error clearing completed tasks:', error);
      toast.error('Failed to clear completed tasks');
    }
  };
  
  const priorityLabels = {
    high: { label: "High", class: "bg-rose-100 text-rose-800" },
    medium: { label: "Medium", class: "bg-amber-100 text-amber-800" },
    low: { label: "Low", class: "bg-slate-100 text-slate-800" }
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(task.due_date) < today;
  };

  const isToday = (task: Task) => {
    if (!task.due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  };

  const isUpcoming = (task: Task) => {
    if (!task.due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(task.due_date) > today;
  };
  
  // Group completed tasks by date
  const groupTasksByCompletionDate = (tasks: Task[]) => {
    const grouped: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      if (task.status === 'completed' && task.completed_at) {
        // Format date as YYYY-MM-DD for grouping
        const completedDate = new Date(task.completed_at);
        const dateKey = completedDate.toISOString().split('T')[0];
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        
        grouped[dateKey].push(task);
      }
    });
    
    // Sort the dates based on user preference
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      if (completedSort === 'newest') {
        return new Date(b).getTime() - new Date(a).getTime();
      } else {
        return new Date(a).getTime() - new Date(b).getTime();
      }
    });
    
    // Create a new object with sorted dates
    const result: Record<string, Task[]> = {};
    sortedDates.forEach(date => {
      result[date] = grouped[date];
    });
    
    return result;
  };
  
  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      // Format as "Monday, 15 April 2023"
      return date.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }
  };
  
  const filteredTasks = tasks.filter(task => {
    // First apply search filter
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      task.priority.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // For all tabs except 'completed', exclude completed tasks
    if (activeFilter !== 'completed' && task.status === 'completed') {
      return false;
    }

    // Then apply task filter
    switch (activeFilter) {
      case 'overdue':
        return isOverdue(task);
      case 'today':
        return isToday(task);
      case 'upcoming':
        return isUpcoming(task);
      case 'completed':
        return task.status === 'completed';
      default:
        return true;
    }
  }).sort((a, b) => {
    // In completed filter, sort by completion date based on user preference
    if (activeFilter === 'completed' && a.completed_at && b.completed_at) {
      if (completedSort === 'newest') {
        return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
      } else {
        return new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
      }
    }
    
    // Then sort overdue tasks to the top for pending tasks
    if (a.status === 'pending' && b.status === 'pending') {
      const aOverdue = isOverdue(a);
      const bOverdue = isOverdue(b);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
    }
    // Then sort by due date if both have due dates
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    // Finally sort by created date
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  
  // Group completed tasks by date when in completed filter
  const isCompletedFilter = activeFilter === 'completed';
  const groupedCompletedTasks = isCompletedFilter 
    ? groupTasksByCompletionDate(filteredTasks)
    : {};

  const handleAddSubtask = async (taskId: string, subtaskData: { title: string }) => {
    try {
      const newSubtask = {
        task_id: taskId,
        title: subtaskData.title,
        status: 'pending' as const,
        user_id: (await supabase.auth.getUser()).data.user?.id
      };
      
      const { data, error } = await supabase
        .from('subtasks')
        .insert([newSubtask])
        .select();
        
      if (error) throw error;
      
      // Cast the returned data to the correct type
      const typedSubtask: Subtask = {
        ...data[0],
        status: data[0].status as "pending" | "completed"
      };
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, subtasks: [...(task.subtasks || []), typedSubtask] }
          : task
      ));
      
      setIsSubtaskModalOpen(false);
      setActiveTaskForSubtask(null);
      toast.success("Subtask added successfully");
      return true;
    } catch (error) {
      console.error('Error adding subtask:', error);
      toast.error('Failed to add subtask');
      return false;
    }
  };

  const handleEditSubtask = async (subtaskData: { title: string }) => {
    if (!editingSubtask) return;
    
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .update({ title: subtaskData.title })
        .eq('id', editingSubtask.id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Cast the returned data to the correct type
      const typedSubtask: Subtask = {
        ...data,
        status: data.status as "pending" | "completed"
      };
      
      // Update local state
      setTasks(tasks.map(task => ({
        ...task,
        subtasks: task.subtasks?.map(subtask =>
          subtask.id === editingSubtask.id ? typedSubtask : subtask
        )
      })));
      
      setIsSubtaskModalOpen(false);
      setEditingSubtask(null);
      toast.success("Subtask updated successfully");
      return true;
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast.error('Failed to update subtask');
      return false;
    }
  };

  const toggleSubtaskCompletion = async (taskId: string, subtaskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const now = new Date().toISOString();
    
    try {
      const updateData = {
        status: newStatus,
        completed_at: newStatus === 'completed' ? now : null
      };
      
      const { error } = await supabase
        .from('subtasks')
        .update(updateData)
        .eq('id', subtaskId);
        
      if (error) throw error;
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? {
              ...task,
              subtasks: task.subtasks?.map(subtask =>
                subtask.id === subtaskId
                  ? { ...subtask, status: newStatus, completed_at: newStatus === 'completed' ? now : null }
                  : subtask
              )
            }
          : task
      ));
      
      toast.success(`Subtask marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast.error('Failed to update subtask');
    }
  };

  const handleDeleteSubtask = async (taskId: string, subtaskId: string) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);
        
      if (error) throw error;
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId
          ? { ...task, subtasks: task.subtasks?.filter(subtask => subtask.id !== subtaskId) }
          : task
      ));
      
      toast.success("Subtask deleted successfully");
    } catch (error) {
      console.error('Error deleting subtask:', error);
      toast.error('Failed to delete subtask');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-medium">Tasks</h1>
        <div className="flex gap-2">
          {isCompletedFilter && tasks.filter(t => t.status === 'completed').length > 0 && (
            <AppButton 
              variant="outline"
              onClick={clearCompletedTasks}
              className="text-destructive border-destructive hover:bg-destructive/10"
            >
              Clear All Completed
            </AppButton>
          )}
          <AppButton 
            icon={<Plus size={18} />}
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
          >
            Add Task
          </AppButton>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <AppButton 
            variant={activeFilter === "all" ? "primary" : "outline"} 
            onClick={() => setActiveFilter("all")}
          >
            All
          </AppButton>
          <AppButton 
            variant={activeFilter === "overdue" ? "primary" : "outline"}
            onClick={() => setActiveFilter("overdue")}
            className="whitespace-nowrap"
          >
            <Clock size={16} className="mr-1" />
            Overdue
          </AppButton>
          <AppButton 
            variant={activeFilter === "today" ? "primary" : "outline"}
            onClick={() => setActiveFilter("today")}
          >
            Today
          </AppButton>
          <AppButton 
            variant={activeFilter === "upcoming" ? "primary" : "outline"}
            onClick={() => setActiveFilter("upcoming")}
          >
            Upcoming
          </AppButton>
          <AppButton 
            variant={activeFilter === "completed" ? "primary" : "outline"}
            onClick={() => setActiveFilter("completed")}
            className="whitespace-nowrap"
          >
            <CheckCheck size={16} className="mr-1" />
            Completed
            {tasks.filter(t => t.status === 'completed').length > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                isCompletedFilter 
                  ? "bg-white text-primary" 
                  : "bg-primary text-white"
              }`}>
                {tasks.filter(t => t.status === 'completed').length}
              </span>
            )}
          </AppButton>
        </div>
      </div>
      
      {activeFilter === 'completed' && tasks.filter(t => t.status === 'completed').length > 0 && (
        <div className="flex justify-end">
          <div className="relative" ref={sortDropdownRef}>
            <button 
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              Sort by: <span className="font-medium">{completedSort === 'newest' ? 'Recently Completed' : 'Oldest First'}</span>
              <ChevronDown size={14} />
            </button>
            
            {showSortDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white shadow-lg rounded-md border border-input z-10">
                <div className="py-1">
                  <button
                    className={`w-full text-left px-4 py-2 text-sm ${completedSort === 'newest' ? 'bg-muted font-medium' : 'hover:bg-muted'}`}
                    onClick={() => {
                      setCompletedSort('newest');
                      setShowSortDropdown(false);
                    }}
                  >
                    Recently Completed
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 text-sm ${completedSort === 'oldest' ? 'bg-muted font-medium' : 'hover:bg-muted'}`}
                    onClick={() => {
                      setCompletedSort('oldest');
                      setShowSortDropdown(false);
                    }}
                  >
                    Oldest First
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {isCompletedFilter && tasks.filter(t => t.status === 'completed').length > 0 && (
        <div className="mb-4">
          <CardContainer className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground">Completed Tasks</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {tasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
              
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground">Completion Rate</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {tasks.length > 0 
                    ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) 
                    : 0}%
                </p>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground">Last Completed</h3>
                <p className="text-lg font-bold text-purple-600 mt-1">
                  {tasks.filter(t => t.status === 'completed' && t.completed_at).length > 0
                    ? new Date(
                        Math.max(
                          ...tasks
                            .filter(t => t.status === 'completed' && t.completed_at)
                            .map(t => new Date(t.completed_at!).getTime())
                        )
                      ).toLocaleDateString('en-GB')
                    : 'None'}
                </p>
              </div>
            </div>
          </CardContainer>
        </div>
      )}
      
      <CardContainer className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? "No tasks match your search" : "No tasks available"}
          </div>
        ) : isCompletedFilter ? (
          // Accordion for completed tasks grouped by date
          <Accordion type="multiple" className="w-full">
            {Object.entries(groupedCompletedTasks).map(([dateKey, dateTasks]) => (
              <AccordionItem key={dateKey} value={dateKey} className="border-b border-border">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{formatDateForDisplay(dateKey)}</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 ml-2">
                      {dateTasks.length} {dateTasks.length === 1 ? 'task' : 'tasks'}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="divide-y">
                    {dateTasks.map(task => (
                      <div key={task.id} className="py-4 animate-slide-up">
                        <div className="flex items-start gap-3">
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
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setExpandedTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
                                className="flex items-center gap-2 hover:text-primary transition-colors"
                              >
                                {expandedTasks[task.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                  {task.title}
                                </h3>
                              </button>
                              <div className="flex gap-2">
                                <Badge 
                                  variant="secondary" 
                                  className={priorityLabels[task.priority as keyof typeof priorityLabels].class}
                                >
                                  {priorityLabels[task.priority as keyof typeof priorityLabels].label}
                                </Badge>
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    {task.subtasks.filter(s => s.status === 'completed').length}/{task.subtasks.length}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </p>
                            )}
                            
                            {task.due_date && (
                              <p className="text-xs mt-2 text-muted-foreground">
                                Due: {new Date(task.due_date).toLocaleDateString('en-GB')}
                              </p>
                            )}
                            
                            {task.status === 'completed' && task.completed_at && (
                              <p className="text-xs mt-2 text-green-600 font-medium">
                                Completed at: {new Date(task.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            )}

                            {/* Subtasks section */}
                            {expandedTasks[task.id] && (
                              <div className="mt-4 space-y-2 pl-6 border-l-2 border-gray-100">
                                {task.subtasks?.map(subtask => (
                                  <div key={subtask.id} className="flex items-center gap-2 group">
                                    <button
                                      onClick={() => toggleSubtaskCompletion(task.id, subtask.id, subtask.status)}
                                      className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                                    >
                                      {subtask.status === 'completed' 
                                        ? <CheckCircle2 size={16} className="text-primary" /> 
                                        : <Circle size={16} />
                                      }
                                    </button>
                                    <span className={`flex-1 text-sm ${subtask.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                      {subtask.title}
                                    </span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => {
                                          setEditingSubtask(subtask);
                                          setIsSubtaskModalOpen(true);
                                        }}
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                        aria-label={`Edit ${subtask.title} subtask`}
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSubtask(task.id, subtask.id)}
                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                        aria-label={`Delete ${subtask.title} subtask`}
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                
                                <button
                                  onClick={() => {
                                    setActiveTaskForSubtask(task.id);
                                    setIsSubtaskModalOpen(true);
                                  }}
                                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                                >
                                  <Plus size={14} />
                                  <span>Add Subtask</span>
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingTask(task);
                                setIsTaskModalOpen(true);
                              }}
                              className="text-muted-foreground hover:text-primary transition-colors"
                              aria-label={`Edit ${task.title} task`}
                            >
                              <Pencil size={16} />
                            </button>
                            {task.status === 'completed' && (
                              <button
                                onClick={() => toggleTaskCompletion(task.id, task.status)}
                                className="text-muted-foreground hover:text-green-600 transition-colors"
                                aria-label={`Restore ${task.title} task`}
                                title="Restore task"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                  <path d="M3 3v5h5"/>
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              aria-label={`Delete ${task.title} task`}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="divide-y">
            {filteredTasks.map(task => (
              <div key={task.id} className="py-4 animate-slide-up">
                <div className="flex items-start gap-3">
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
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setExpandedTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        {expandedTasks[task.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h3>
                      </button>
                      <div className="flex gap-2">
                        <Badge 
                          variant="secondary" 
                          className={priorityLabels[task.priority as keyof typeof priorityLabels].class}
                        >
                          {priorityLabels[task.priority as keyof typeof priorityLabels].label}
                        </Badge>
                        {task.subtasks && task.subtasks.length > 0 && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {task.subtasks.filter(s => s.status === 'completed').length}/{task.subtasks.length}
                          </Badge>
                        )}
                        {isOverdue(task) && task.status !== 'completed' && (
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}
                    
                    {task.due_date && (
                      <p className={`text-xs mt-2 ${
                        isOverdue(task) && task.status !== 'completed' 
                          ? 'text-red-600 font-medium' 
                          : 'text-muted-foreground'
                      }`}>
                        Due: {new Date(task.due_date).toLocaleDateString('en-GB')}
                      </p>
                    )}
                    
                    {task.status === 'completed' && task.completed_at && (
                      <p className="text-xs mt-2 text-green-600 font-medium">
                        Completed: {new Date(task.completed_at).toLocaleDateString('en-GB')} at {new Date(task.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    )}

                    {/* Subtasks section */}
                    {expandedTasks[task.id] && (
                      <div className="mt-4 space-y-2 pl-6 border-l-2 border-gray-100">
                        {task.subtasks?.map(subtask => (
                          <div key={subtask.id} className="flex items-center gap-2 group">
                            <button
                              onClick={() => toggleSubtaskCompletion(task.id, subtask.id, subtask.status)}
                              className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                            >
                              {subtask.status === 'completed' 
                                ? <CheckCircle2 size={16} className="text-primary" /> 
                                : <Circle size={16} />
                              }
                            </button>
                            <span className={`flex-1 text-sm ${subtask.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                              {subtask.title}
                            </span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingSubtask(subtask);
                                  setIsSubtaskModalOpen(true);
                                }}
                                className="text-muted-foreground hover:text-primary transition-colors"
                                aria-label={`Edit ${subtask.title} subtask`}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteSubtask(task.id, subtask.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                                aria-label={`Delete ${subtask.title} subtask`}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => {
                            setActiveTaskForSubtask(task.id);
                            setIsSubtaskModalOpen(true);
                          }}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          <Plus size={14} />
                          <span>Add Subtask</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setIsTaskModalOpen(true);
                      }}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label={`Edit ${task.title} task`}
                    >
                      <Pencil size={16} />
                    </button>
                    {task.status === 'completed' && (
                      <button
                        onClick={() => toggleTaskCompletion(task.id, task.status)}
                        className="text-muted-foreground hover:text-green-600 transition-colors"
                        aria-label={`Restore ${task.title} task`}
                        title="Restore task"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                          <path d="M3 3v5h5"/>
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Delete ${task.title} task`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContainer>
      
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? "Edit Task" : "Add New Task"}
      >
        <TaskForm
          mode={editingTask ? 'edit' : 'add'}
          initialData={editingTask || undefined}
          onSubmit={editingTask ? handleEditTask : handleAddTask}
          onCancel={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={isSubtaskModalOpen}
        onClose={() => {
          setIsSubtaskModalOpen(false);
          setEditingSubtask(null);
          setActiveTaskForSubtask(null);
        }}
        title={editingSubtask ? "Edit Subtask" : "Add New Subtask"}
      >
        <SubtaskForm
          mode={editingSubtask ? 'edit' : 'add'}
          initialData={editingSubtask || undefined}
          onSubmit={(subtaskData) => {
            if (editingSubtask) {
              return handleEditSubtask(subtaskData);
            } else if (activeTaskForSubtask) {
              return handleAddSubtask(activeTaskForSubtask, subtaskData);
            }
            return Promise.resolve(false);
          }}
          onCancel={() => {
            setIsSubtaskModalOpen(false);
            setEditingSubtask(null);
            setActiveTaskForSubtask(null);
          }}
        />
      </Modal>
    </div>
  );
}
