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
  updateStudent, 
  TutoringStudent, 
  TutoringStudentUpdate 
} from "@/services/tutoringService";

interface EditStudentDialogProps {
  student: TutoringStudent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (student: TutoringStudent) => void;
}

export function EditStudentDialog({ 
  student,
  open, 
  onOpenChange,
  onSave
}: EditStudentDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TutoringStudentUpdate>({
    name: student.name,
    email: student.email,
    phone: student.phone,
    hourly_rate: student.hourly_rate,
    notes: student.notes,
  });

  // Update form when student changes
  useEffect(() => {
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone,
      hourly_rate: student.hourly_rate,
      notes: student.notes,
    });
  }, [student]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name?.trim()) {
      toast({
        title: "Error",
        description: "Student name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.hourly_rate) {
      toast({
        title: "Error",
        description: "Hourly rate is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Convert hourly_rate to number if it's a string
      const studentData = {
        ...formData,
        hourly_rate: typeof formData.hourly_rate === 'string' 
          ? parseFloat(formData.hourly_rate) 
          : formData.hourly_rate,
      };
      
      const updatedStudent = await updateStudent(student.id, studentData);
      
      toast({
        title: "Success",
        description: `Student ${formData.name} has been updated.`,
      });
      
      // Close dialog and notify parent
      onOpenChange(false);
      onSave(updatedStudent);
      
    } catch (error) {
      console.error("Error updating student:", error);
      toast({
        title: "Error",
        description: "Failed to update student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update the details for {student.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ""}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone || ""}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hourly_rate" className="text-right">
                Hourly Rate *
              </Label>
              <div className="relative col-span-3">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  £
                </span>
                <Input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourly_rate || ""}
                  onChange={handleInputChange}
                  className="pl-6"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes || ""}
                onChange={handleInputChange}
                className="col-span-3"
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