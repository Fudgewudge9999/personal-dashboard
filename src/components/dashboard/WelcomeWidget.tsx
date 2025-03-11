import { CardContainer } from "../common/CardContainer";
import { AppButton } from "../common/AppButton";
import { cn } from "@/lib/utils";
import { PlusCircle } from "lucide-react";
import { Badge } from "../common/Badge";
import { useState } from "react";
import { Modal } from "../common/Modal";
import { TaskForm } from "../tasks/TaskForm";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface WelcomeWidgetProps {
  className?: string;
  onTaskAdded?: () => void;
}

export function WelcomeWidget({ className, onTaskAdded }: WelcomeWidgetProps) {
  const navigate = useNavigate();
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const formattedDate = today.toLocaleDateString('en-GB', options);
  
  const getRandomQuote = () => {
    const quotes = [
      "The only way to do great work is to love what you do.",
      "Simplicity is the ultimate sophistication.",
      "Think differently.",
      "Focus on the journey, not the destination.",
      "Design is not just what it looks like. Design is how it works.",
      "Less is more.",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
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
      
      // Insert into Supabase and return the created record
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select();
        
      if (error) throw error;
      
      setIsAddTaskModalOpen(false);
      toast.success("Task added successfully");
      
      // Notify parent component that a task was added
      if (onTaskAdded) {
        onTaskAdded();
      }
      
      return true; // Return true to indicate success
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
      return false; // Return false to indicate failure
    }
  };
  
  const handleFocusSessionClick = () => {
    navigate("/focus");
  };

  return (
    <CardContainer className={cn("h-full", className)}>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <Badge 
              variant="secondary" 
              className="mb-2 text-primary/70 bg-primary/5 animate-fade-in" 
            >
              Today
            </Badge>
            <h1 className="text-2xl font-medium animate-slide-up">{formattedDate}</h1>
            <p className="text-muted-foreground mt-1 animate-slide-up" style={{ animationDelay: "50ms" }}>
              {getRandomQuote()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <AppButton 
            size="sm" 
            variant="primary" 
            icon={<PlusCircle size={16} />}
            onClick={() => setIsAddTaskModalOpen(true)}
          >
            New Task
          </AppButton>
          <AppButton 
            size="sm" 
            variant="outline"
            icon={<PlusCircle size={16} />}
            onClick={handleFocusSessionClick}
          >
            Focus Session
          </AppButton>
        </div>
      </div>
      
      <Modal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        title="Add New Task"
      >
        <TaskForm
          mode="add"
          onSubmit={handleAddTask}
          onCancel={() => setIsAddTaskModalOpen(false)}
        />
      </Modal>
    </CardContainer>
  );
}
