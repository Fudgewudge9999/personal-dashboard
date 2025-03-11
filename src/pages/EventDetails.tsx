import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { AppButton } from "@/components/common/AppButton";
import { CardContainer } from "@/components/common/CardContainer";
import { toast } from "sonner";
import { ArrowLeft, Link as LinkIcon } from "lucide-react";

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

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
        setDescription(eventDetails.description);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      toast.error('Failed to load event details');
      navigate('/calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDescription = async () => {
    if (!event) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('events')
        .update({
          description: description || null
        })
        .eq('id', event.id);

      if (error) throw error;

      toast.success('Description updated successfully');
    } catch (error) {
      console.error('Error updating description:', error);
      toast.error('Failed to update description');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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
      <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-8">
          <AppButton
            onClick={() => navigate('/calendar')}
            variant="outline"
            className="!p-2"
          >
            <ArrowLeft size={20} />
          </AppButton>
          <h1 className="text-3xl font-medium">Event Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Info */}
          <CardContainer className="lg:col-span-1 p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-medium">{event.title}</h2>
              <p className="text-gray-600 mt-2">
                {format(new Date(event.date), 'PPPP')}
              </p>
              <p className="text-gray-600">
                {formatTimeDisplay(event.startTime)} - {formatTimeDisplay(event.endTime)}
              </p>
              <div className={`inline-block px-3 py-1 rounded-full text-sm mt-3 ${getCategoryColor(event.category)}`}>
                {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
              </div>
            </div>

            <div className="pt-4">
              <AppButton 
                onClick={() => navigate(`/calendar/event/${id}/edit`)}
                variant="outline"
                className="w-full"
              >
                Edit Event Details
              </AppButton>
            </div>
          </CardContainer>

          {/* Description Editor */}
          <CardContainer className="lg:col-span-2 p-6">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium">Description</h2>
                <AppButton
                  onClick={handleUpdateDescription}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </AppButton>
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add detailed notes, lesson plans, or any other relevant information about this event..."
                className="flex-grow w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none min-h-[500px] font-mono text-base"
                spellCheck="false"
              />

              {/* Future feature hint */}
              <div className="mt-4 p-4 bg-secondary/10 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <LinkIcon size={16} />
                  <span>Resource linking coming soon!</span>
                </div>
              </div>
            </div>
          </CardContainer>
        </div>
      </div>
    </MainLayout>
  );
} 