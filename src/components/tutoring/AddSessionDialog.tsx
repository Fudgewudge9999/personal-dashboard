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
  createSession, 
  TutoringSessionInsert,
  getAllStudents,
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

interface AddSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddSessionDialog({ 
  open, 
  onOpenChange,
  onSuccess
}: AddSessionDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState<TutoringStudent[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Omit<TutoringSessionInsert, "user_id">>({
    student_id: "",
    session_date: format(new Date(), "yyyy-MM-dd"),
    start_time: "",
    duration_minutes: 60,
    session_rate: 0,
    total_amount: 0,
    payment_status: "unpaid",
    notes: "",
  });

  // Fetch students when dialog opens
  useEffect(() => {
    if (open) {
      const fetchStudents = async () => {
        try {
          setLoading(true);
          const data = await getAllStudents();
          setStudents(data);
          
          // Reset form
          setFormData({
            student_id: "",
            session_date: format(new Date(), "yyyy-MM-dd"),
            start_time: "",
            duration_minutes: 60,
            session_rate: 0,
            total_amount: 0,
            payment_status: "unpaid",
            notes: "",
          });
        } catch (error) {
          console.error("Error fetching students:", error);
          toast({
            title: "Error",
            description: "Failed to load students. Please try again.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchStudents();
    }
  }, [open, toast]);

  // Auto-fill hourly rate when student changes (as reference only)
  useEffect(() => {
    if (formData.student_id) {
      const student = students.find(s => s.id === formData.student_id);
      if (student) {
        // Only update the session rate if it hasn't been manually set yet
        if (!formData.session_rate) {
          setFormData(prev => ({
            ...prev,
            session_rate: student.hourly_rate
          }));
        }
      }
    }
  }, [formData.student_id, students]);

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
    if (!formData.student_id) {
      toast({
        title: "Error",
        description: "Please select a student.",
        variant: "destructive",
      });
      return;
    }

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
      
      await createSession(formData);
      
      toast({
        title: "Success",
        description: "Tutoring session has been added.",
      });
      
      // Close dialog and notify parent
      onOpenChange(false);
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error adding session:", error);
      toast({
        title: "Error",
        description: "Failed to add session. Please try again.",
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
            <DialogTitle>Add Tutoring Session</DialogTitle>
            <DialogDescription>
              Record a new tutoring session and payment details
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <Label htmlFor="student_id">
                Student *
              </Label>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading students...</div>
              ) : (
                <Select
                  value={formData.student_id}
                  onValueChange={(value) => handleSelectChange("student_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.length === 0 ? (
                      <SelectItem value="" disabled>
                        No students found
                      </SelectItem>
                    ) : (
                      students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
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
                  value={formData.start_time || ""}
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
              {formData.student_id && (
                <p className="text-sm text-muted-foreground">
                  Reference: Student's hourly rate is £{students.find(s => s.id === formData.student_id)?.hourly_rate || 0}/hr
                </p>
              )}
            </div>
            
            <div className="grid items-center gap-2">
              <Label htmlFor="payment_status">
                Payment Status
              </Label>
              <Select
                value={formData.payment_status}
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
              {isSubmitting ? "Adding..." : "Add Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 