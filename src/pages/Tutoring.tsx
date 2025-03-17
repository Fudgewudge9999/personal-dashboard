import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  TutoringStudentList,
  TutoringSessionList,
  TutoringAnalytics,
  TutoringCalendar,
  AddStudentDialog,
  AddSessionDialog
} from "@/components/tutoring";

export default function Tutoring() {
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("students");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleStudentAdded = () => {
    setIsAddStudentOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSessionAdded = () => {
    setIsAddSessionOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tutoring Payment Tracker</h1>
          <div className="flex gap-2">
            {activeTab === "students" ? (
              <Button 
                onClick={() => setIsAddStudentOpen(true)}
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4" />
                Add Student
              </Button>
            ) : activeTab === "sessions" || activeTab === "calendar" ? (
              <Button 
                onClick={() => setIsAddSessionOpen(true)}
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4" />
                Add Session
              </Button>
            ) : null}
          </div>
        </div>

        <Tabs 
          defaultValue="students" 
          onValueChange={(value) => setActiveTab(value)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="students" className="mt-4">
            <TutoringStudentList key={`students-${refreshTrigger}`} />
          </TabsContent>
          <TabsContent value="sessions" className="mt-4">
            <TutoringSessionList key={`sessions-${refreshTrigger}`} />
          </TabsContent>
          <TabsContent value="calendar" className="mt-4">
            <TutoringCalendar key={`calendar-${refreshTrigger}`} />
          </TabsContent>
          <TabsContent value="analytics" className="mt-4">
            <TutoringAnalytics key={`analytics-${refreshTrigger}`} />
          </TabsContent>
        </Tabs>

        <AddStudentDialog
          open={isAddStudentOpen}
          onOpenChange={setIsAddStudentOpen}
          onSuccess={handleStudentAdded}
        />

        <AddSessionDialog
          open={isAddSessionOpen}
          onOpenChange={setIsAddSessionOpen}
          onSuccess={handleSessionAdded}
        />
      </div>
    </MainLayout>
  );
} 