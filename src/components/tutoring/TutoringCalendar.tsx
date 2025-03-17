import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import { TutoringSession, getAllSessions, getStudentById, TutoringStudent } from "@/services/tutoringService";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

export function TutoringCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<TutoringSession[]>([]);
  const [studentMap, setStudentMap] = useState<Record<string, TutoringStudent>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
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

  const goToPreviousMonth = () => {
    setCurrentDate(addMonths(currentDate, -1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const getSessionsForDay = (day: Date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.session_date);
      return isSameDay(sessionDate, day);
    }).sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 border-green-500 text-green-800";
      case "unpaid":
        return "bg-amber-100 border-amber-500 text-amber-800";
      case "partial":
        return "bg-blue-100 border-blue-500 text-blue-800";
      case "cancelled":
        return "bg-gray-100 border-gray-500 text-gray-800";
      default:
        return "bg-gray-100 border-gray-500 text-gray-800";
    }
  };

  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Get the day of the week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
    const startDay = monthStart.getDay();
    
    // Create an array for all days to display (including padding days)
    const totalDays = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startDay; i++) {
      totalDays.push(null);
    }
    
    // Add actual days of the month
    totalDays.push(...daysInMonth);
    
    // Calculate rows needed (7 days per row)
    const rows = Math.ceil(totalDays.length / 7);
    
    // Ensure we have complete rows (7 days per row)
    const totalCells = rows * 7;
    while (totalDays.length < totalCells) {
      totalDays.push(null);
    }
    
    // Create calendar grid
    const calendarRows = [];
    for (let row = 0; row < rows; row++) {
      const rowDays = totalDays.slice(row * 7, (row + 1) * 7);
      calendarRows.push(
        <div key={`row-${row}`} className="grid grid-cols-7 border-b last:border-b-0">
          {rowDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${row}-${index}`} className="min-h-[100px] p-1 border-r last:border-r-0" />;
            }
            
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);
            const dayNumber = day.getDate();
            const daySessions = getSessionsForDay(day);
            
            return (
              <div 
                key={`day-${dayNumber}`} 
                className={`min-h-[100px] p-1 border-r last:border-r-0 ${
                  isToday ? 'bg-primary/5' : ''
                } ${
                  !isCurrentMonth ? 'opacity-50' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${isToday ? 'text-primary font-bold' : ''}`}>
                    {dayNumber}
                  </span>
                  {daySessions.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {daySessions.length}
                    </Badge>
                  )}
                </div>
                <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                  {daySessions.map(session => {
                    const student = studentMap[session.student_id];
                    return (
                      <TooltipProvider key={session.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`text-xs p-1 rounded border ${getPaymentStatusColor(session.payment_status)} truncate cursor-pointer`}
                            >
                              {session.start_time.substring(0, 5)} - {student?.name || 'Unknown'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <p className="font-medium">{student?.name || 'Unknown'}</p>
                              <p>Time: {session.start_time.substring(0, 5)} ({session.duration_minutes} min)</p>
                              <p>Rate: £{session.session_rate}</p>
                              <p>Status: {session.payment_status}</p>
                              {session.notes && <p>Notes: {session.notes}</p>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    return calendarRows;
  };

  const renderListView = () => {
    // Filter sessions for the current month
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    const monthSessions = sessions.filter(session => {
      const sessionDate = new Date(session.session_date);
      return sessionDate >= monthStart && sessionDate <= monthEnd;
    }).sort((a, b) => {
      // Sort by date first
      const dateA = new Date(a.session_date);
      const dateB = new Date(b.session_date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      // Then by start time
      return a.start_time.localeCompare(b.start_time);
    });
    
    if (monthSessions.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No sessions scheduled for {format(currentDate, 'MMMM yyyy')}
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {monthSessions.map(session => {
          const student = studentMap[session.student_id];
          return (
            <div 
              key={session.id} 
              className={`p-3 rounded border ${getPaymentStatusColor(session.payment_status)}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{student?.name || 'Unknown Student'}</h4>
                  <p className="text-sm">
                    {format(new Date(session.session_date), 'MMM d, yyyy')} at {session.start_time.substring(0, 5)}
                    {' '}({session.duration_minutes} min)
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">£{session.session_rate}</p>
                  <Badge variant="outline" className={getPaymentStatusColor(session.payment_status)}>
                    {session.payment_status}
                  </Badge>
                </div>
              </div>
              {session.notes && (
                <p className="text-sm mt-2 text-muted-foreground">{session.notes}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Tutoring Calendar</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewMode(viewMode === "calendar" ? "list" : "calendar")}
            >
              {viewMode === "calendar" ? <List className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-medium">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToCurrentMonth}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-[400px]">
            <p>Loading sessions...</p>
          </div>
        ) : viewMode === "calendar" ? (
          <div className="mt-2">
            <div className="grid grid-cols-7 text-center font-medium text-sm py-2 border-b">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>
            <div className="mt-1">
              {renderCalendarDays()}
            </div>
          </div>
        ) : (
          <div className="mt-2">
            {renderListView()}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 