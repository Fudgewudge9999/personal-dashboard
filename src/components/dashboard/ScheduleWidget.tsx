import { CardContainer } from "../common/CardContainer";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ScheduleWidgetProps {
  className?: string;
}

interface AppointmentProps {
  time: string;
  title: string;
  type: "work" | "personal" | "tutoring";
}

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  description: string | null;
  location: string | null;
  created_at: string;
  category?: "work" | "personal" | "tutoring";
}

function Appointment({ time, title, type }: AppointmentProps) {
  const typeClasses = {
    work: "bg-blue-50 border-blue-200 text-blue-700",
    personal: "bg-purple-50 border-purple-200 text-purple-700",
    tutoring: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };

  return (
    <div className={cn(
      "flex items-start p-3 rounded-md border animate-fade-in",
      typeClasses[type]
    )}>
      <div className="flex-shrink-0 mr-3 pt-1">
        <Clock size={14} />
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs opacity-80">{time}</p>
      </div>
    </div>
  );
}

export function ScheduleWidget({ className }: ScheduleWidgetProps) {
  const [appointments, setAppointments] = useState<AppointmentProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodaysEvents();
  }, []);

  const fetchTodaysEvents = async () => {
    try {
      setIsLoading(true);
      
      // Get today's date in ISO format (YYYY-MM-DD)
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Calculate start and end of today
      const startOfDay = `${todayStr}T00:00:00`;
      const endOfDay = `${todayStr}T23:59:59`;
      
      // Fetch events for today from Supabase
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .order('start_time', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Transform the data to match our AppointmentProps interface
        const todaysAppointments: AppointmentProps[] = data.map((event: Event) => {
          // Format the time range
          const startTime = new Date(event.start_time);
          const endTime = new Date(event.end_time);
          const formattedTimeRange = `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
          
          return {
            time: formattedTimeRange,
            title: event.title,
            // Use the category from the database, defaulting to "work" if not available
            type: event.category || "work"
          };
        });
        
        setAppointments(todaysAppointments);
      }
    } catch (error) {
      console.error('Error fetching today\'s events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CardContainer className={cn("h-full", className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-lg">Today's Schedule</h3>
          <a href="/calendar" className="text-sm text-primary/80 hover:text-primary transition-colors">View All</a>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((appointment, index) => (
              <Appointment 
                key={index} 
                time={appointment.time} 
                title={appointment.title} 
                type={appointment.type} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>No events scheduled for today</p>
          </div>
        )}
      </div>
    </CardContainer>
  );
}
