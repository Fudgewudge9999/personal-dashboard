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
import { 
  Edit2, 
  Trash2, 
  Search, 
  CheckCircle2, 
  Clock, 
  CalendarIcon 
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { 
  TutoringSession, 
  getAllSessions,
  getStudentById,
  deleteSession,
  markSessionAsPaid,
  TutoringStudent
} from "@/services/tutoringService";
import { EditSessionDialog } from "./EditSessionDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function TutoringSessionList() {
  const [sessions, setSessions] = useState<TutoringSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<TutoringSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [studentMap, setStudentMap] = useState<Record<string, TutoringStudent>>({});
  const [editingSession, setEditingSession] = useState<TutoringSession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<TutoringSession | null>(null);
  const [sessionToMarkPaid, setSessionToMarkPaid] = useState<TutoringSession | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const { toast } = useToast();

  // Load sessions and build student map on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const sessionData = await getAllSessions();
        setSessions(sessionData);
        
        // Build a map of student IDs to student data
        const studentMapData: Record<string, TutoringStudent> = {};
        
        for (const session of sessionData) {
          if (!studentMapData[session.student_id]) {
            try {
              const student = await getStudentById(session.student_id);
              studentMapData[session.student_id] = student;
            } catch (error) {
              console.error(`Error fetching student ${session.student_id}:`, error);
            }
          }
        }
        
        setStudentMap(studentMapData);
      } catch (error) {
        console.error("Error loading sessions:", error);
        toast({
          title: "Error",
          description: "Failed to load tutoring sessions. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Filter sessions based on search query and status filter
  useEffect(() => {
    let filtered = [...sessions];
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(session => session.payment_status === statusFilter);
    }
    
    // Apply search filter if needed
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(session => {
        const student = studentMap[session.student_id];
        const studentName = student?.name.toLowerCase() || "";
        const sessionDate = format(new Date(session.session_date), "MMM d, yyyy");
        
        return (
          studentName.includes(query) ||
          sessionDate.includes(query) ||
          session.payment_status.toLowerCase().includes(query) ||
          (session.notes && session.notes.toLowerCase().includes(query))
        );
      });
    }
    
    setFilteredSessions(filtered);
  }, [searchQuery, sessions, statusFilter, studentMap]);

  // Handle session deletion
  const handleDelete = async (session: TutoringSession) => {
    try {
      await deleteSession(session.id);
      
      // Update local state
      setSessions(prevSessions => 
        prevSessions.filter(s => s.id !== session.id)
      );
      
      toast({
        title: "Success",
        description: "Tutoring session has been deleted.",
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSessionToDelete(null);
    }
  };

  // Handle marking a session as paid
  const handleMarkAsPaid = async (session: TutoringSession) => {
    try {
      const updatedSession = await markSessionAsPaid(
        session.id, 
        paymentMethod as any,
        new Date().toISOString().split('T')[0]
      );
      
      // Update local state
      setSessions(prevSessions => 
        prevSessions.map(s => 
          s.id === updatedSession.id ? updatedSession : s
        )
      );
      
      toast({
        title: "Success",
        description: "Session has been marked as paid.",
      });
    } catch (error) {
      console.error("Error marking session as paid:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSessionToMarkPaid(null);
      setPaymentMethod("cash");
    }
  };

  // Handle edit completion
  const handleEditComplete = (updatedSession: TutoringSession) => {
    setSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === updatedSession.id ? updatedSession : session
      )
    );
    setEditingSession(null);
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-600">Paid</Badge>;
      case "unpaid":
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Unpaid</Badge>;
      case "partial":
        return <Badge className="bg-blue-600">Partial</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tutoring Sessions</CardTitle>
        <CardDescription>Track your tutoring sessions and payments</CardDescription>
        
        <div className="flex flex-col md:flex-row gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">Loading sessions...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery || statusFilter !== "all" 
              ? "No sessions match your filters" 
              : "No sessions found. Add your first tutoring session!"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => {
                const student = studentMap[session.student_id];
                return (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {student?.name || "Unknown Student"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{format(new Date(session.session_date), "MMM d, yyyy")}</span>
                        <span className="text-sm text-muted-foreground">
                          {session.start_time.slice(0, 5)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {session.duration_minutes} min
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(session.total_amount)}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(session.payment_status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingSession(session)}
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        
                        {session.payment_status !== "paid" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSessionToMarkPaid(session)}
                            className="text-green-600"
                            title="Mark as Paid"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="sr-only">Mark as Paid</span>
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSessionToDelete(session)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Edit Session Dialog */}
      {editingSession && (
        <EditSessionDialog
          session={editingSession}
          studentMap={studentMap}
          open={!!editingSession}
          onOpenChange={(open) => !open && setEditingSession(null)}
          onSave={handleEditComplete}
        />
      )}

      {/* Confirm Delete Dialog */}
      {sessionToDelete && (
        <ConfirmDialog
          open={!!sessionToDelete}
          onOpenChange={(open) => !open && setSessionToDelete(null)}
          title="Delete Session"
          description="Are you sure you want to delete this tutoring session? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => handleDelete(sessionToDelete)}
          variant="destructive"
        />
      )}

      {/* Mark as Paid Dialog */}
      {sessionToMarkPaid && (
        <ConfirmDialog
          open={!!sessionToMarkPaid}
          onOpenChange={(open) => !open && setSessionToMarkPaid(null)}
          title="Mark Session as Paid"
          description={
            <div className="space-y-4">
              <p>Mark this session for {studentMap[sessionToMarkPaid.student_id]?.name || "Unknown"} as paid?</p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Payment Method:</p>
                <Select 
                  value={paymentMethod} 
                  onValueChange={setPaymentMethod}
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
          }
          confirmLabel="Confirm Payment"
          cancelLabel="Cancel"
          onConfirm={() => handleMarkAsPaid(sessionToMarkPaid)}
        />
      )}
    </Card>
  );
} 