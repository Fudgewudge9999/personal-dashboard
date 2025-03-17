import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { 
  updateSession, 
  TutoringSession,
  TutoringSessionUpdate,
  TutoringStudent
} from "@/services/tutoringService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface EditSessionDialogProps {
  session: TutoringSession;
  studentMap: Record<string, TutoringStudent>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (session: TutoringSession) => void;
}

export function EditSessionDialog({ 
  session,
  studentMap,
  open, 
  onOpenChange,
  onSave
}: EditSessionDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<TutoringSessionUpdate>({
    student_id: session.student_id,
    session_date: session.session_date,
    start_time: session.start_time,
    duration_minutes: session.duration_minutes,
    session_rate: session.session_rate,
    total_amount: session.total_amount,
    payment_status: session.payment_status,
    payment_date: session.payment_date,
    payment_method: session.payment_method,
    notes: session.notes,
  });

  // Update form when session changes
  useEffect(() => {
    setFormData({
      student_id: session.student_id,
      session_date: session.session_date,
      start_time: session.start_time,
      duration_minutes: session.duration_minutes,
      session_rate: session.session_rate,
      total_amount: session.total_amount,
      payment_status: session.payment_status,
      payment_date: session.payment_date,
      payment_method: session.payment_method,
      notes: session.notes,
    });
  }, [session]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "duration_minutes" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.session_date) {
      toast({
        title: "Error",
        description: "Session date is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.start_time) {
      toast({
        title: "Error",
        description: "Start time is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // If payment status changed to paid, and no payment date is set, set it to today
      if (formData.payment_status === "paid" && session.payment_status !== "paid" && !formData.payment_date) {
        formData.payment_date = new Date().toISOString().split('T')[0];
      }
      
      const updatedSession = await updateSession(session.id, formData);
      
      toast({
        title: "Success",
        description: "Tutoring session has been updated.",
      });
      
      // Close dialog and notify parent
      onOpenChange(false);
      onSave(updatedSession);
      
    } catch (error) {
      console.error("Error updating session:", error);
      toast({
        title: "Error",
        description: "Failed to update session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>
              Update the tutoring session details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <Label htmlFor="student_id">
                Student
              </Label>
              <Input 
                value={studentMap[session.student_id]?.name || "Unknown Student"} 
                disabled 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid items-center gap-2">
                <Label htmlFor="session_date">
                  Date *
                </Label>
                <Input
                  id="session_date"
                  name="session_date"
                  type="date"
                  value={formData.session_date || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid items-center gap-2">
                <Label htmlFor="start_time">
                  Start Time *
                </Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={formData.start_time?.toString().slice(0, 5) || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="grid items-center gap-2">
              <Label htmlFor="duration_minutes">
                Duration *
              </Label>
              <Select
                value={
                  formData.duration_minutes === 45 || 
                  formData.duration_minutes === 60 || 
                  formData.duration_minutes === 90 
                    ? formData.duration_minutes.toString() 
                    : "custom"
                }
                onValueChange={(value) => {
                  if (value === "custom") {
                    // When custom is selected, set a default custom value if currently a standard value
                    if (formData.duration_minutes === 45 || 
                        formData.duration_minutes === 60 || 
                        formData.duration_minutes === 90) {
                      setFormData(prev => ({
                        ...prev,
                        duration_minutes: 30 // Default custom value
                      }));
                    }
                    return;
                  }
                  handleSelectChange("duration_minutes", value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {formData.duration_minutes !== 45 && 
               formData.duration_minutes !== 60 && 
               formData.duration_minutes !== 90 && (
                <Input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.duration_minutes}
                  onChange={handleInputChange}
                  placeholder="Enter minutes"
                />
              )}
            </div>
            
            <div className="grid items-center gap-2">
              <Label htmlFor="session_rate">
                Session Price *
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  £
                </span>
                <Input
                  id="session_rate"
                  name="session_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.session_rate || ""}
                  onChange={handleInputChange}
                  className="pl-6"
                  required
                />
              </div>
              {studentMap[session.student_id] && (
                <p className="text-sm text-muted-foreground">
                  Reference: Student's hourly rate is £{studentMap[session.student_id]?.hourly_rate || 0}/hr
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid items-center gap-2">
                <Label htmlFor="payment_status">
                  Payment Status
                </Label>
                <Select
                  value={formData.payment_status || "unpaid"}
                  onValueChange={(value) => handleSelectChange("payment_status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid items-center gap-2">
                <Label htmlFor="payment_method">
                  Payment Method
                </Label>
                <Select
                  value={formData.payment_method || ""}
                  onValueChange={(value) => handleSelectChange("payment_method", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {(formData.payment_status === "paid" || formData.payment_status === "partial") && (
              <div className="grid items-center gap-2">
                <Label htmlFor="payment_date">
                  Payment Date
                </Label>
                <Input
                  id="payment_date"
                  name="payment_date"
                  type="date"
                  value={formData.payment_date || ""}
                  onChange={handleInputChange}
                />
              </div>
            )}
            
            <div className="grid items-center gap-2">
              <Label htmlFor="notes">
                Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes || ""}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 