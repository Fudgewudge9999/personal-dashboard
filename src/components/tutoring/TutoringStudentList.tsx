import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Search, Plus } from "lucide-react";
import { TutoringStudent } from "@/services/tutoringService";
import { getAllStudents, deleteStudent } from "@/services/tutoringService";
import { useToast } from "@/components/ui/use-toast";
import { EditStudentDialog } from "./EditStudentDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { formatCurrency } from "@/lib/utils";

export function TutoringStudentList() {
  const [students, setStudents] = useState<TutoringStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<TutoringStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState<TutoringStudent | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<TutoringStudent | null>(null);
  const { toast } = useToast();

  // Load students on component mount
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const studentData = await getAllStudents();
        setStudents(studentData);
        setFilteredStudents(studentData);
      } catch (error) {
        console.error("Error loading students:", error);
        toast({
          title: "Error",
          description: "Failed to load students. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [toast]);

  // Filter students when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStudents(students);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        (student.email && student.email.toLowerCase().includes(query)) ||
        (student.phone && student.phone.toLowerCase().includes(query))
    );

    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  // Handle student deletion
  const handleDelete = async (student: TutoringStudent) => {
    try {
      await deleteStudent(student.id);
      
      // Update local state
      setStudents((prevStudents) => 
        prevStudents.filter((s) => s.id !== student.id)
      );
      
      toast({
        title: "Success",
        description: `Student ${student.name} has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({
        title: "Error",
        description: "Failed to delete student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setStudentToDelete(null);
    }
  };

  // Handle edit completion
  const handleEditComplete = (updatedStudent: TutoringStudent) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.id === updatedStudent.id ? updatedStudent : student
      )
    );
    setEditingStudent(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tutoring Students</CardTitle>
        <CardDescription>Manage your tutoring students and rates</CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">Loading students...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No students match your search" : "No students found. Add your first student!"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Hourly Rate</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {student.email && <span className="text-sm">{student.email}</span>}
                      {student.phone && <span className="text-sm text-muted-foreground">{student.phone}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(student.hourly_rate)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingStudent(student)}
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setStudentToDelete(student)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Edit Student Dialog */}
      {editingStudent && (
        <EditStudentDialog
          student={editingStudent}
          open={!!editingStudent}
          onOpenChange={(open) => !open && setEditingStudent(null)}
          onSave={handleEditComplete}
        />
      )}

      {/* Confirm Delete Dialog */}
      {studentToDelete && (
        <ConfirmDialog
          open={!!studentToDelete}
          onOpenChange={(open) => !open && setStudentToDelete(null)}
          title="Delete Student"
          description={`Are you sure you want to delete ${studentToDelete.name}? This will also delete all associated tutoring sessions and cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => handleDelete(studentToDelete)}
          variant="destructive"
        />
      )}
    </Card>
  );
} 