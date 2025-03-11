import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { AddEventForm } from "@/components/calendar/AddEventForm";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AppButton } from "@/components/common/AppButton";

interface EventDetails {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  category: "tutoring" | "work" | "personal";
}

// Add type guard function
const isValidCategory = (category: string): category is "tutoring" | "work" | "personal" => {
  return ["tutoring", "work", "personal"].includes(category);
};

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        const eventDetails: EventDetails = {
          id: data.id,
          title: data.title,
          date: new Date(data.start_time).toISOString().split('T')[0],
          startTime: new Date(data.start_time).toTimeString().slice(0, 5),
          endTime: new Date(data.end_time).toTimeString().slice(0, 5),
          description: data.description || "",
          category: isValidCategory(data.category) ? data.category : "work"
        };
        setEvent(eventDetails);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      toast.error('Failed to load event details');
      navigate('/calendar');
    } finally {
      setIsLoading(false);
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
        .eq('id', id);

      if (error) throw error;

      toast.success('Event updated successfully');
      navigate(`/calendar/event/${id}`);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3">Loading event details...</span>
        </div>
      </MainLayout>
    );
  }

  if (!event) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p>Event not found</p>
          <AppButton onClick={() => navigate('/calendar')} className="mt-4">
            Back to Calendar
          </AppButton>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
          <AppButton
            onClick={() => navigate(`/calendar/event/${id}`)}
            variant="outline"
            className="!p-2"
          >
            <ArrowLeft size={20} />
          </AppButton>
          <h1 className="text-3xl font-medium">Edit Event</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <AddEventForm
            onSubmit={handleUpdateEvent}
            onCancel={() => navigate(`/calendar/event/${id}`)}
            initialData={{
              title: event.title,
              date: event.date,
              startTime: event.startTime,
              endTime: event.endTime,
              description: event.description,
              category: event.category
            }}
          />
        </div>
      </div>
    </MainLayout>
  );
} 