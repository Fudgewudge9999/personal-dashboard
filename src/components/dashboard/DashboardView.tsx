import { WelcomeWidget } from "./WelcomeWidget";
import { ScheduleWidget } from "./ScheduleWidget";
import { TasksWidget } from "./TasksWidget";
import { useState } from "react";
import { Timer } from "../common/Timer";
import { Link } from "react-router-dom";
import { AppButton } from "../common/AppButton";
import { ExternalLink } from "lucide-react";
import { CardContainer } from "../common/CardContainer";

export function DashboardView() {
  const [tasksRefreshTrigger, setTasksRefreshTrigger] = useState(0);
  
  // Function to trigger a refresh of the tasks widget
  const refreshTasks = () => {
    setTasksRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-medium">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardContainer>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-lg">Focus Timer</h3>
              <Link to="/focus">
                <AppButton
                  variant="ghost"
                  size="sm"
                  icon={<ExternalLink size={16} />}
                >
                  Open
                </AppButton>
              </Link>
            </div>
            <Timer showDurationOptions={false} size="sm" />
          </div>
        </CardContainer>
        
        <WelcomeWidget className="md:col-span-2" onTaskAdded={refreshTasks} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TasksWidget className="md:col-span-3" refreshTrigger={tasksRefreshTrigger} />
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <ScheduleWidget />
      </div>
    </div>
  );
}
