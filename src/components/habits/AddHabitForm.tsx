
import { useState } from "react";
import { AppButton } from "../common/AppButton";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface AddHabitFormProps {
  onSubmit: (habit: {
    name: string;
    description?: string;
    targetDays: number;
    startDate: string;
  }) => void;
  onCancel: () => void;
}

export function AddHabitForm({ onSubmit, onCancel }: AddHabitFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetDays, setTargetDays] = useState(21);
  const [startDate, setStartDate] = useState<Date>(new Date());
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({
      name,
      description: description.trim() || undefined,
      targetDays,
      startDate: startDate.toISOString().split("T")[0],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="habit-name" className="text-sm font-medium">
          Habit Name
        </label>
        <input
          id="habit-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Daily Reading"
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="habit-description" className="text-sm font-medium">
          Description (Optional)
        </label>
        <textarea
          id="habit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Read for at least 30 minutes every day"
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="target-days" className="text-sm font-medium">
          Target Days
        </label>
        <input
          id="target-days"
          type="number"
          min={1}
          max={365}
          value={targetDays}
          onChange={(e) => setTargetDays(Number(e.target.value))}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
        <p className="text-xs text-muted-foreground">
          Number of days to complete this habit to make it stick
        </p>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Start Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "w-full flex items-center justify-start border rounded-md p-2 text-left",
                "focus:outline-none focus:ring-2 focus:ring-ring"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => date && setStartDate(date)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <AppButton type="button" variant="outline" onClick={onCancel}>
          Cancel
        </AppButton>
        <AppButton type="submit" disabled={!name.trim()}>
          Create Habit
        </AppButton>
      </div>
    </form>
  );
}
