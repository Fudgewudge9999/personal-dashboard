import { useState, useEffect } from "react";
import { AppButton } from "../common/AppButton";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TaskFormProps {
  onSubmit: (task: {
    title: string;
    description?: string;
    dueDate?: string;
    priority: "high" | "medium" | "low";
  }) => void;
  onCancel: () => void;
  initialData?: {
    title: string;
    description?: string;
    due_date?: string;
    priority: "high" | "medium" | "low";
  };
  mode?: 'add' | 'edit';
}

export function TaskForm({ onSubmit, onCancel, initialData, mode = 'add' }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [dueDate, setDueDate] = useState<Date>(
    initialData?.due_date ? new Date(initialData.due_date) : new Date()
  );
  const [priority, setPriority] = useState<"high" | "medium" | "low">(
    initialData?.priority || "medium"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setDueDate(initialData.due_date ? new Date(initialData.due_date) : new Date());
      setPriority(initialData.priority);
    }
  }, [initialData]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    
    onSubmit({
      title,
      description: description.trim() || undefined,
      dueDate: dueDate.toISOString(),
      priority,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="task-title" className="text-sm font-medium">
          Task Title
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Prepare weekly lesson plan"
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="task-description" className="text-sm font-medium">
          Description (Optional)
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more details about this task"
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Due Date</label>
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "w-full flex items-center justify-start border rounded-md p-2 text-left",
                "focus:outline-none focus:ring-2 focus:ring-ring"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dueDate, "PPP")}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={(selected) => {
                setDueDate(selected || new Date());
                setIsDatePickerOpen(false);
              }}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Priority</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            className={`p-2 rounded-md border ${
              priority === "high" ? "border-primary bg-rose-100 text-rose-800" : "border-input"
            }`}
            onClick={() => setPriority("high")}
          >
            High
          </button>
          <button
            type="button"
            className={`p-2 rounded-md border ${
              priority === "medium" ? "border-primary bg-amber-100 text-amber-800" : "border-input"
            }`}
            onClick={() => setPriority("medium")}
          >
            Medium
          </button>
          <button
            type="button"
            className={`p-2 rounded-md border ${
              priority === "low" ? "border-primary bg-slate-100 text-slate-800" : "border-input"
            }`}
            onClick={() => setPriority("low")}
          >
            Low
          </button>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <AppButton type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </AppButton>
        <AppButton type="submit" disabled={!title.trim() || isSubmitting}>
          {isSubmitting ? `${mode === 'add' ? 'Adding' : 'Saving'}...` : mode === 'add' ? 'Add Task' : 'Save Changes'}
        </AppButton>
      </div>
    </form>
  );
}
