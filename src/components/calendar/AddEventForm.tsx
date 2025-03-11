import { useState, useEffect, useRef } from "react";
import { AppButton } from "../common/AppButton";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddEventFormProps {
  onSubmit: (event: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    description?: string;
    category: "tutoring" | "work" | "personal";
  }) => void;
  onCancel: () => void;
  initialData?: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    description?: string;
    category: "tutoring" | "work" | "personal";
  };
}

export function AddEventForm({ onSubmit, onCancel, initialData }: AddEventFormProps) {
  // Generate time options in 30-minute intervals
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      timeOptions.push(`${formattedHour}:${formattedMinute}`);
    }
  }

  // Get current time and find closest time option
  const getCurrentTimeOption = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Convert current time to minutes since midnight
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Find the closest time option
    let closestOption = timeOptions[0];
    let minDifference = Infinity;
    
    for (const timeOption of timeOptions) {
      const [hours, minutes] = timeOption.split(':').map(Number);
      const optionTimeInMinutes = hours * 60 + minutes;
      const difference = Math.abs(optionTimeInMinutes - currentTimeInMinutes);
      
      if (difference < minDifference) {
        minDifference = difference;
        closestOption = timeOption;
      }
    }
    
    return closestOption;
  };

  // Calculate end time based on start time (1 hour later)
  const calculateEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startTimeInMinutes = hours * 60 + minutes;
    const endTimeInMinutes = startTimeInMinutes + 60; // Add 1 hour (60 minutes)
    
    const endHours = Math.floor(endTimeInMinutes / 60) % 24;
    const endMinutes = endTimeInMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const [title, setTitle] = useState(initialData?.title || "");
  const [date, setDate] = useState<Date>(initialData ? new Date(initialData.date) : new Date());
  const [startTime, setStartTime] = useState(initialData?.startTime || getCurrentTimeOption());
  const [endTime, setEndTime] = useState(initialData?.endTime || calculateEndTime(getCurrentTimeOption()));
  const [description, setDescription] = useState(initialData?.description || "");
  const [category, setCategory] = useState<"tutoring" | "work" | "personal">(initialData?.category || "tutoring");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  // Update end time when start time changes
  useEffect(() => {
    setEndTime(calculateEndTime(startTime));
  }, [startTime]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !startTime || !endTime) return;
    
    // Validate that end time is after start time
    if (startTime >= endTime) {
      alert("End time must be after start time");
      return;
    }
    
    onSubmit({
      title,
      date: date.toISOString().split("T")[0],
      startTime,
      endTime,
      description: description.trim() || undefined,
      category,
    });
  };

  // Format time for display
  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="event-title" className="text-sm font-medium">
          Event Title
        </label>
        <input
          id="event-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Math Tutoring Session"
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Date</label>
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
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selected) => {
                if (selected) {
                  setDate(selected);
                  setIsDatePickerOpen(false);
                }
              }}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="start-time" className="text-sm font-medium">
            Start Time
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger id="start-time" className="w-full pl-10">
                <SelectValue>{formatTimeDisplay(startTime)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {formatTimeDisplay(time)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="end-time" className="text-sm font-medium">
            End Time
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Select value={endTime} onValueChange={setEndTime}>
              <SelectTrigger id="end-time" className="w-full pl-10">
                <SelectValue>{formatTimeDisplay(endTime)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {formatTimeDisplay(time)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="event-category" className="text-sm font-medium">
          Category
        </label>
        <select
          id="event-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as "tutoring" | "work" | "personal")}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="tutoring">Tutoring</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
        </select>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="event-description" className="text-sm font-medium">
          Description (Optional)
        </label>
        <textarea
          id="event-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details about this event"
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          spellCheck="false"
          rows={3}
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <AppButton type="button" variant="outline" onClick={onCancel}>
          Cancel
        </AppButton>
        <AppButton type="submit" disabled={!title.trim() || !date || !startTime || !endTime}>
          {initialData ? 'Update Event' : 'Add Event'}
        </AppButton>
      </div>
    </form>
  );
}
