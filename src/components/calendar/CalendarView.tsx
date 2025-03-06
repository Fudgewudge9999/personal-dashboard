import { CardContainer } from "../common/CardContainer";
import { AppButton } from "../common/AppButton";
import { Plus, ChevronLeft, ChevronRight, CalendarDays, Calendar as CalendarIcon, List } from "lucide-react";
import { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { AddEventForm } from "./AddEventForm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isWithinInterval, parseISO, startOfDay, addHours, isSameWeek } from "date-fns";

// Interface for our local calendar events
interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
  category: "tutoring" | "work" | "personal";
}

// Interface for Supabase events data
interface SupabaseEvent {
  id: string;
  created_at: string;
  title: string;
  start_time: string;
  end_time: string;
  description: string | null;
  location: string | null;
  category?: "tutoring" | "work" | "personal";
}

type ViewMode = "month" | "week" | "day";

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  
  // Fetch events from Supabase when component mounts
  useEffect(() => {
    fetchEvents();
  }, []);
  
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Transform the data to match our CalendarEvent interface
        const transformedEvents: CalendarEvent[] = (data as SupabaseEvent[]).map(event => {
          // Default to "work" if category is not available
          const eventCategory = event.category || "work";
          
          return {
            id: event.id,
            title: event.title,
            // Extract date from start_time (which is stored as ISO string in Supabase)
            date: new Date(event.start_time).toISOString().split('T')[0],
            // Extract time portion from start_time and end_time
            startTime: new Date(event.start_time).toTimeString().slice(0, 5),
            endTime: new Date(event.end_time).toTimeString().slice(0, 5),
            description: event.description || undefined,
            category: eventCategory
          };
        });
        
        setEvents(transformedEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };
  
  const goToPrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };
  
  const goToNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  const handleAddEvent = async (eventData: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    description?: string;
    category: "tutoring" | "work" | "personal";
  }) => {
    try {
      // Create ISO datetime strings for start and end times
      const startDateTime = `${eventData.date}T${eventData.startTime}:00`;
      const endDateTime = `${eventData.date}T${eventData.endTime}:00`;
      
      // Insert the event into Supabase
      const { data, error } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          start_time: startDateTime,
          end_time: endDateTime,
          description: eventData.description || null,
          // Include the category field
          category: eventData.category,
          // Note: location is null as it's not in our form
          location: null
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Create the new event with the returned ID from Supabase
        const newEvent: CalendarEvent = {
          id: data[0].id,
          title: eventData.title,
          date: eventData.date,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          description: eventData.description,
          category: eventData.category
        };
        
        setEvents([...events, newEvent]);
        setIsAddEventModalOpen(false);
        toast.success("Event added successfully");
      }
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
    }
  };
  
  const getEventsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return events.filter(event => event.date === dateString);
  };
  
  const getEventsForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return events.filter(event => event.date === dateString);
  };

  const getCategoryColor = (category: "tutoring" | "work" | "personal") => {
    switch (category) {
      case "tutoring":
        return "bg-purple-100 text-purple-800";
      case "work":
        return "bg-blue-100 text-blue-800";
      case "personal":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-28 border-t border-l p-2"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = new Date().getDate() === day && 
                      new Date().getMonth() === month && 
                      new Date().getFullYear() === year;
      
      const dayEvents = getEventsForDay(day);
      
      days.push(
        <div 
          key={day} 
          className={`h-28 border-t border-l p-2 relative ${isToday ? 'bg-primary/5' : ''}`}
        >
          <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>{day}</span>
          
          <div className="mt-1 overflow-y-auto max-h-[80px] space-y-1">
            {dayEvents.length > 2 ? (
              <>
                {dayEvents.slice(0, 2).map(event => (
                  <div 
                    key={event.id} 
                    className={`text-xs p-1 rounded truncate ${getCategoryColor(event.category)}`}
                    title={`${event.title} (${event.startTime} - ${event.endTime})`}
                  >
                    {event.startTime.substring(0, 5)} - {event.title}
                  </div>
                ))}
                <div className="text-xs text-gray-500 px-1">
                  + {dayEvents.length - 2} more
                </div>
              </>
            ) : (
              dayEvents.map(event => (
                <div 
                  key={event.id} 
                  className={`text-xs p-1 rounded truncate ${getCategoryColor(event.category)}`}
                  title={`${event.title} (${event.startTime} - ${event.endTime})`}
                >
                  {event.startTime.substring(0, 5)} - {event.title}
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const renderWeekView = () => {
    const currentWeekStart = startOfWeek(currentDate);
    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(currentWeekStart, i);
      const dayEvents = getEventsForDate(day);
      const isToday = isSameDay(day, new Date());

      days.push(
        <div key={i} className="flex flex-col border-l h-full">
          <div className={`p-2 text-center font-medium border-b ${isToday ? 'bg-primary/10' : ''}`}>
            <div>{format(day, 'EEE')}</div>
            <div className={`text-lg ${isToday ? 'text-primary' : ''}`}>{format(day, 'd')}</div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {dayEvents.map(event => (
              <div 
                key={event.id} 
                className={`text-xs p-2 rounded-md ${getCategoryColor(event.category)}`}
              >
                <div className="font-medium">{event.title}</div>
                <div>{event.startTime} - {event.endTime}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 border-r border-b h-[600px]">
        {days}
      </div>
    );
  };

  const renderDayView = () => {
    const hours = [];
    const dayEvents = getEventsForDate(currentDate);
    const isToday = isSameDay(currentDate, new Date());
    
    for (let hour = 0; hour < 24; hour++) {
      const hourTime = addHours(startOfDay(currentDate), hour);
      const hourFormatted = format(hourTime, 'h a');
      const hourEvents = dayEvents.filter(event => {
        const eventStartHour = parseInt(event.startTime.split(':')[0]);
        return eventStartHour === hour;
      });

      hours.push(
        <div key={hour} className="flex border-b min-h-[60px]">
          <div className="w-20 p-2 text-right text-sm border-r flex-shrink-0">
            {hourFormatted}
          </div>
          <div className="flex-grow p-2 relative">
            {hourEvents.map(event => (
              <div 
                key={event.id} 
                className={`p-2 rounded-md ${getCategoryColor(event.category)} mb-1`}
              >
                <div className="font-medium">{event.title}</div>
                <div className="text-xs">{event.startTime} - {event.endTime}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="border-r border-b">
        <div className="p-3 text-xl font-medium border-b">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
          {isToday && <span className="ml-2 text-primary text-sm">Today</span>}
        </div>
        <div className="overflow-y-auto max-h-[600px]">
          {hours}
        </div>
      </div>
    );
  };
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getViewTitle = () => {
    if (viewMode === "month") {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM d, yyyy');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-medium">Calendar</h1>
        <AppButton 
          icon={<Plus size={18} />}
          onClick={() => setIsAddEventModalOpen(true)}
        >
          Add Event
        </AppButton>
      </div>
      
      <CardContainer className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading events...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <button 
                  onClick={goToPrevious}
                  className="p-1 rounded-full hover:bg-secondary transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-xl font-medium">
                  {getViewTitle()}
                </h2>
                <button 
                  onClick={goToNext}
                  className="p-1 rounded-full hover:bg-secondary transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="flex items-center gap-2 border rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode("month")}
                  className={`p-2 flex items-center ${viewMode === "month" ? "bg-primary text-white" : "hover:bg-secondary"}`}
                  title="Month view"
                >
                  <CalendarDays size={18} />
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`p-2 flex items-center ${viewMode === "week" ? "bg-primary text-white" : "hover:bg-secondary"}`}
                  title="Week view"
                >
                  <CalendarIcon size={18} />
                </button>
                <button
                  onClick={() => setViewMode("day")}
                  className={`p-2 flex items-center ${viewMode === "day" ? "bg-primary text-white" : "hover:bg-secondary"}`}
                  title="Day view"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
            
            {viewMode === "month" && (
              <div className="grid grid-cols-7 border-r border-b">
                {/* Weekday headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center font-medium text-sm border-t border-l">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {renderCalendarDays()}
              </div>
            )}

            {viewMode === "week" && renderWeekView()}
            
            {viewMode === "day" && renderDayView()}
          </>
        )}
      </CardContainer>
      
      <Modal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        title="Add New Event"
      >
        <AddEventForm
          onSubmit={handleAddEvent}
          onCancel={() => setIsAddEventModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
