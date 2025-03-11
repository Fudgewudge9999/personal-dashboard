import { CardContainer } from "../common/CardContainer";
import { AppButton } from "../common/AppButton";
import { Plus, ChevronLeft, ChevronRight, CalendarDays, Calendar as CalendarIcon, List, Pencil, Trash } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Modal } from "../common/Modal";
import { AddEventForm } from "./AddEventForm";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isWithinInterval, parseISO, startOfDay, addHours, isSameWeek } from "date-fns";
import { addUserIdToData } from "@/utils/supabase-utils";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [isViewEventModalOpen, setIsViewEventModalOpen] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const dayViewRef = useRef<HTMLDivElement>(null);
  
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
      
      // Prepare event data with user ID
      const eventWithUserId = await addUserIdToData({
        title: eventData.title,
        start_time: startDateTime,
        end_time: endDateTime,
        description: eventData.description || null,
        category: eventData.category,
        location: null
      });
      
      // Insert the event into Supabase
      const { data, error } = await supabase
        .from('events')
        .insert(eventWithUserId)
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
    
    return events
      .filter(event => event.date === dateString)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };
  
  const getEventsForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return events
      .filter(event => event.date === dateString)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
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
      days.push(<div key={`empty-${i}`} className="border-t border-l p-2 min-h-0"></div>);
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
          className={`border-t border-l p-2 relative flex flex-col min-h-0 ${isToday ? 'bg-primary/5' : ''}`}
        >
          <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>{day}</span>
          
          <div className="mt-1 flex-1 overflow-y-auto space-y-1">
            {dayEvents.length > 2 ? (
              <>
                {dayEvents.slice(0, 2).map(event => (
                  <div 
                    key={event.id} 
                    className={`text-xs p-1 rounded truncate ${getCategoryColor(event.category)} cursor-pointer hover:opacity-80`}
                    title={`${event.title} (${event.startTime} - ${event.endTime})`}
                    onClick={() => handleEventClick(event)}
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
                  className={`text-xs p-1 rounded truncate ${getCategoryColor(event.category)} cursor-pointer hover:opacity-80`}
                  title={`${event.title} (${event.startTime} - ${event.endTime})`}
                  onClick={() => handleEventClick(event)}
                >
                  {event.startTime.substring(0, 5)} - {event.title}
                </div>
              ))
            )}
          </div>
        </div>
      );
    }
    
    // Add empty cells for remaining days to complete the grid
    const totalDays = firstDayOfMonth + daysInMonth;
    const remainingCells = 42 - totalDays; // 6 rows * 7 days = 42
    for (let i = 0; i < remainingCells; i++) {
      days.push(<div key={`empty-end-${i}`} className="border-t border-l p-2 min-h-0"></div>);
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
        <div key={i} className="flex flex-col border-l h-full min-w-0">
          <div className={`p-2 text-center font-medium border-b ${isToday ? 'bg-primary/10' : ''}`}>
            <div>{format(day, 'EEE')}</div>
            <div className={`text-lg ${isToday ? 'text-primary' : ''}`}>{format(day, 'd')}</div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {dayEvents.map(event => (
              <div 
                key={event.id} 
                className={`text-xs p-2 rounded-md ${getCategoryColor(event.category)} mb-1 group relative cursor-pointer hover:opacity-80`}
                onClick={() => handleEventClick(event)}
              >
                <div className="font-medium">{event.title}</div>
                <div className="text-xs">{event.startTime} - {event.endTime}</div>
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEvent(event);
                    }}
                    className="p-1 hover:bg-black/10 rounded"
                    title="Edit event"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(event.id);
                    }}
                    className="p-1 hover:bg-black/10 rounded text-red-600"
                    title="Delete event"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 border-r border-b h-full">
        {days}
      </div>
    );
  };

  useEffect(() => {
    if (viewMode === "day" && dayViewRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const scrollPosition = currentHour * 60; // Each hour block is 60px high
      dayViewRef.current.scrollTop = scrollPosition - 100; // Scroll to show a bit above current hour
    }
  }, [viewMode]);

  const renderDayView = () => {
    const hours = [];
    const dayEvents = getEventsForDate(currentDate);
    const currentHour = new Date().getHours();
    
    // Helper function to convert time string to minutes since midnight
    const timeToMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    // Calculate event positions and dimensions
    const eventElements = dayEvents.map(event => {
      const startMinutes = timeToMinutes(event.startTime);
      const endMinutes = timeToMinutes(event.endTime);
      const duration = endMinutes - startMinutes;
      
      // Calculate position and height
      const top = (startMinutes / 60) * 60; // Each hour is 60px
      const height = (duration / 60) * 60;
      
      return (
        <div 
          key={event.id} 
          className={`absolute left-0 right-0 mx-2 p-2 rounded-md ${getCategoryColor(event.category)} group cursor-pointer hover:opacity-80 overflow-hidden`}
          style={{
            top: `${top}px`,
            height: `${height}px`,
            minHeight: '20px', // Ensure very short events are still visible
          }}
          onClick={() => handleEventClick(event)}
        >
          <div className="font-medium truncate">{event.title}</div>
          <div className="text-xs">{event.startTime} - {event.endTime}</div>
          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditEvent(event);
              }}
              className="p-1 hover:bg-black/10 rounded"
              title="Edit event"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteEvent(event.id);
              }}
              className="p-1 hover:bg-black/10 rounded text-red-600"
              title="Delete event"
            >
              <Trash size={14} />
            </button>
          </div>
        </div>
      );
    });
    
    // Render the time grid
    for (let hour = 0; hour < 24; hour++) {
      const hourTime = addHours(startOfDay(currentDate), hour);
      const hourFormatted = format(hourTime, 'h a');
      const isCurrentHour = isSameDay(currentDate, new Date()) && hour === currentHour;

      hours.push(
        <div key={hour} className={`flex border-b min-h-[60px] ${isCurrentHour ? 'bg-primary/5' : ''}`}>
          <div className="w-20 p-2 text-right text-sm border-r flex-shrink-0">
            {hourFormatted}
          </div>
          <div className="flex-grow relative">
            {/* Render half-hour marker */}
            <div className="absolute left-0 right-0 top-[30px] border-t border-gray-100"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        {hours}
        {/* Overlay events on top of the time grid */}
        <div className="absolute inset-0 ml-20">
          {eventElements}
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

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEditEventModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) {
        throw error;
      }

      setEvents(events.filter(event => event.id !== eventId));
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleUpdateEvent = async (eventData: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    description?: string;
    category: "tutoring" | "work" | "personal";
  }) => {
    if (!selectedEvent) return;

    try {
      // Create ISO datetime strings for start and end times
      const startDateTime = `${eventData.date}T${eventData.startTime}:00`;
      const endDateTime = `${eventData.date}T${eventData.endTime}:00`;

      const { error } = await supabase
        .from('events')
        .update({
          title: eventData.title,
          start_time: startDateTime,
          end_time: endDateTime,
          description: eventData.description || null,
          category: eventData.category
        })
        .eq('id', selectedEvent.id);

      if (error) {
        throw error;
      }

      // Update the local events state
      setEvents(events.map(event => 
        event.id === selectedEvent.id
          ? {
              ...event,
              title: eventData.title,
              date: eventData.date,
              startTime: eventData.startTime,
              endTime: eventData.endTime,
              description: eventData.description,
              category: eventData.category
            }
          : event
      ));

      setIsEditEventModalOpen(false);
      setSelectedEvent(null);
      toast.success('Event updated successfully');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    navigate(`/calendar/event/${event.id}`);
  };

  const handleUpdateDescription = async () => {
    if (!selectedEvent) return;

    try {
      const { error } = await supabase
        .from('events')
        .update({
          description: editedDescription || null
        })
        .eq('id', selectedEvent.id);

      if (error) {
        throw error;
      }

      // Update the local events state
      setEvents(events.map(event => 
        event.id === selectedEvent.id
          ? {
              ...event,
              description: editedDescription
            }
          : event
      ));

      toast.success('Description updated successfully');
    } catch (error) {
      console.error('Error updating description:', error);
      toast.error('Failed to update description');
    }
  };

  const handleEditFromView = () => {
    setIsViewEventModalOpen(false);
    setIsEditEventModalOpen(true);
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
    <div className="h-[calc(100vh-theme(spacing.20))] flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-medium">Calendar</h1>
        <AppButton 
          icon={<Plus size={18} />}
          onClick={() => setIsAddEventModalOpen(true)}
        >
          Add Event
        </AppButton>
      </div>
      
      <CardContainer className="flex-1 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading events...</span>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4">
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
            
            <div className="flex-1 overflow-hidden">
              {viewMode === "month" && (
                <div className="grid grid-cols-7 h-full border-r border-b">
                  {/* Weekday headers */}
                  <div className="col-span-7 grid grid-cols-7">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-2 text-center font-medium text-sm border-t border-l">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar days */}
                  <div className="col-span-7 grid grid-cols-7 grid-rows-6 flex-1">
                    {renderCalendarDays()}
                  </div>
                </div>
              )}

              {viewMode === "week" && (
                <div className="h-full">
                  {renderWeekView()}
                </div>
              )}
              
              {viewMode === "day" && (
                <div className="h-full overflow-hidden flex flex-col">
                  <div className="p-3 text-xl font-medium border-b flex-shrink-0">
                    {format(currentDate, 'EEEE, MMMM d, yyyy')}
                    {isSameDay(currentDate, new Date()) && <span className="ml-2 text-primary text-sm">Today</span>}
                  </div>
                  <div ref={dayViewRef} className="flex-1 overflow-y-auto">
                    {renderDayView()}
                  </div>
                </div>
              )}
            </div>
          </div>
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

      <Modal
        isOpen={isEditEventModalOpen}
        onClose={() => {
          setIsEditEventModalOpen(false);
          setSelectedEvent(null);
        }}
        title="Edit Event"
      >
        {selectedEvent && (
          <AddEventForm
            onSubmit={handleUpdateEvent}
            onCancel={() => {
              setIsEditEventModalOpen(false);
              setSelectedEvent(null);
            }}
            initialData={{
              title: selectedEvent.title,
              date: selectedEvent.date,
              startTime: selectedEvent.startTime,
              endTime: selectedEvent.endTime,
              description: selectedEvent.description,
              category: selectedEvent.category
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={isViewEventModalOpen}
        onClose={() => {
          setIsViewEventModalOpen(false);
          setSelectedEvent(null);
        }}
        title="Event Description"
      >
        {selectedEvent && (
          <div className="space-y-8 max-w-[90vw] w-full mx-auto px-12 min-h-[80vh] py-8 flex flex-col">
            <div className="space-y-4">
              <h3 className="text-3xl font-medium text-center">{selectedEvent.title}</h3>
              <div className="text-center">
                <p className="text-lg text-gray-600">
                  {format(new Date(selectedEvent.date), 'PPPP')}
                </p>
                <p className="text-lg text-gray-600">
                  {formatTimeDisplay(selectedEvent.startTime)} - {formatTimeDisplay(selectedEvent.endTime)}
                </p>
                <div className={`inline-block px-4 py-1.5 rounded-full text-base mt-3 ${getCategoryColor(selectedEvent.category)}`}>
                  {selectedEvent.category.charAt(0).toUpperCase() + selectedEvent.category.slice(1)}
                </div>
              </div>
            </div>
            
            <div className="space-y-4 flex-grow flex flex-col">
              <label htmlFor="event-description" className="text-base font-medium">
                Description (Optional)
              </label>
              <textarea
                id="event-description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Add details about this event"
                className="w-full p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-base flex-grow"
              />
            </div>
            
            <div className="flex justify-center">
              <AppButton 
                onClick={() => {
                  handleUpdateDescription();
                  setIsViewEventModalOpen(false);
                  setSelectedEvent(null);
                }}
                className="bg-gray-900 hover:bg-gray-800 text-white px-12 py-3 text-lg"
              >
                Update
              </AppButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
