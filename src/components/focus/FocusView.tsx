import { useState, useEffect } from "react";
import { Clock, BarChart3, CheckCircle2, Edit3, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppButton } from "../common/AppButton";
import { cn } from "@/lib/utils";
import { CardContainer } from "../common/CardContainer";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/types/supabase-generated";
import { Timer } from "../common/Timer";
import { useTimerStore } from "@/store/useTimerStore";

type FocusTask = Database['public']['Tables']['focus_tasks']['Row'];
type FocusTaskInsert = Database['public']['Tables']['focus_tasks']['Insert'];
type FocusSession = Database['public']['Tables']['focus_sessions']['Row'];

interface TimerSessionWithTasks extends FocusSession {
  tasks: FocusTask[];
}

export function FocusView() {
  const [showHistory, setShowHistory] = useState(false);
  const [currentTasks, setCurrentTasks] = useState<FocusTask[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [currentNotes, setCurrentNotes] = useState("");
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [timerSessions, setTimerSessions] = useState<TimerSessionWithTasks[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  
  const { toast } = useToast();
  const { isActive, isPaused, setCurrentTasks: setStoreCurrentTasks, setCurrentNotes: setStoreCurrentNotes } = useTimerStore();

  // Load tasks and sessions from Supabase on component mount
  useEffect(() => {
    loadTasks();
    loadSessions();
  }, []);

  // Keep store in sync with local state
  useEffect(() => {
    setStoreCurrentTasks(currentTasks);
  }, [currentTasks, setStoreCurrentTasks]);

  useEffect(() => {
    setStoreCurrentNotes(currentNotes);
  }, [currentNotes, setStoreCurrentNotes]);

  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to view your focus sessions.",
          variant: "destructive",
        });
        return;
      }

      const { data: sessions, error: sessionsError } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)  // Filter by user_id
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // For each session, get its associated tasks
      const sessionsWithTasks = await Promise.all(
        (sessions || []).map(async (session) => {
          const { data: sessionTasks, error: tasksError } = await supabase
            .from('focus_session_tasks')
            .select('task_id')
            .eq('session_id', session.id);

          if (tasksError) throw tasksError;

          const taskIds = sessionTasks.map(st => st.task_id);
          
          const { data: tasks, error: tasksDataError } = await supabase
            .from('focus_tasks')
            .select('*')
            .in('id', taskIds);

          if (tasksDataError) throw tasksDataError;

          return {
            ...session,
            tasks: tasks || []
          };
        })
      );

      // Filter out sessions that were less than 50% complete
      const filteredSessions = sessionsWithTasks.filter(session => {
        // Always include completed sessions
        if (session.completed) return true;
        
        // Calculate completion percentage
        const completionPercentage = session.actual_duration / session.duration;
        
        // Include sessions that are at least 50% complete
        return completionPercentage >= 0.5;
      });

      setTimerSessions(filteredSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Error loading sessions",
        description: "There was a problem loading your focus sessions. Please try again.",
      });
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadTasks = async () => {
    try {
      setIsLoadingTasks(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to view your focus tasks.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('focus_tasks')
        .select('*')
        .eq('user_id', user.id)  // Filter by user_id
        .order('created_at', { ascending: true });

      if (error) throw error;

      setCurrentTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error loading tasks",
        description: "There was a problem loading your tasks. Please try again.",
      });
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const addTask = async () => {
    if (newTaskText.trim()) {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to add tasks.",
            variant: "destructive",
          });
          return;
        }

        const newTask: FocusTaskInsert = {
          text: newTaskText.trim(),
          completed: false,
          user_id: user.id  // Add user_id to the task
        };

        console.log('Attempting to add task:', newTask);
        const { data, error } = await supabase
          .from('focus_tasks')
          .insert([newTask])
          .select()
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        console.log('Task added successfully:', data);
        setCurrentTasks(prev => [...prev, data as FocusTask]);
        setNewTaskText("");
        
        toast({
          title: "Task added",
          description: "Your focus task has been added successfully.",
        });
      } catch (error: any) {
        console.error('Error adding task:', error);
        toast({
          title: "Error adding task",
          description: error.message || "There was a problem adding your task. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const task = currentTasks.find(t => t.id === taskId);
      if (!task) return;

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to update tasks.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('focus_tasks')
        .update({ 
          completed: !task.completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', user.id);  // Ensure user owns the task

      if (error) throw error;

      setCurrentTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error updating task",
        description: "There was a problem updating your task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeTask = async (taskId: string) => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to remove tasks.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('focus_tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);  // Ensure user owns the task

      if (error) throw error;

      setCurrentTasks(prev => prev.filter(task => task.id !== taskId));
      
      toast({
        title: "Task removed",
        description: "Your focus task has been removed successfully.",
      });
    } catch (error) {
      console.error('Error removing task:', error);
      toast({
        title: "Error removing task",
        description: "There was a problem removing your task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const deleteSession = async (sessionId: string) => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to delete sessions.",
          variant: "destructive",
        });
        return;
      }

      // First delete the associated tasks in the focus_session_tasks junction table
      const { error: tasksError } = await supabase
        .from('focus_session_tasks')
        .delete()
        .eq('session_id', sessionId);

      if (tasksError) throw tasksError;

      // Then delete the session itself
      const { error: sessionError } = await supabase
        .from('focus_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id); // Ensure user owns the session

      if (sessionError) throw sessionError;

      // Update the local state to remove the deleted session
      setTimerSessions(prev => prev.filter(session => session.id !== sessionId));
      
      toast({
        title: "Session deleted",
        description: "Your focus session has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error deleting session",
        description: "There was a problem deleting your session. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-medium">Focus Session</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardContainer className="h-full">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-lg">Focus Timer</h3>
              <AppButton
                onClick={() => setShowHistory(!showHistory)}
                variant="ghost"
                size="sm"
                icon={showHistory ? <Clock size={16} /> : <BarChart3 size={16} />}
              >
                {showHistory ? "Timer" : "History"}
              </AppButton>
            </div>
            
            {!showHistory ? (
              <Timer />
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                <h4 className="text-sm font-medium text-muted-foreground">Recent Sessions</h4>
                {isLoadingSessions ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : timerSessions.length > 0 ? (
                  timerSessions.map((session) => (
                    <div 
                      key={session.id}
                      className="p-3 rounded-md border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-sm font-medium">
                              {session.actual_duration}/{session.duration}m
                            </div>
                            <div className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              session.completed 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                                : session.actual_duration >= session.duration
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            )}>
                              {session.completed 
                                ? "Completed" 
                                : session.actual_duration >= session.duration
                                  ? "Finished"
                                  : "Interrupted"}
                            </div>
                            <button
                              onClick={() => deleteSession(session.id)}
                              className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Delete session"
                              title="Delete session"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="h-1.5 bg-secondary rounded-full mb-2">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all",
                                session.completed || session.actual_duration >= session.duration
                                  ? "bg-green-500"
                                  : "bg-amber-500"
                              )}
                              style={{ 
                                width: `${Math.min(100, (session.actual_duration / session.duration) * 100)}%`
                              }}
                            />
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {formatDate(session.created_at)}
                          </div>
                          
                          {session.tasks.length > 0 && (
                            <div className="text-sm mt-2 space-y-1">
                              <div className="font-medium text-xs text-muted-foreground">Tasks:</div>
                              <div className="space-y-1">
                                {session.tasks.map((task) => (
                                  <div key={task.id} className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      task.completed ? "bg-green-500" : "bg-secondary"
                                    )} />
                                    <span className={cn(
                                      "text-sm",
                                      task.completed && "line-through text-muted-foreground"
                                    )}>
                                      {task.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {session.notes && (
                            <div className="text-sm mt-2">
                              <div className="font-medium text-xs text-muted-foreground">Notes:</div>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {session.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No sessions recorded yet
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContainer>
        
        <div className="space-y-6">
          <CardContainer>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-lg">Current Tasks</h3>
                {!isEditingTask && (
                  <AppButton
                    onClick={() => setIsEditingTask(true)}
                    variant="ghost"
                    size="sm"
                    icon={<Edit3 size={16} />}
                    disabled={isActive && !isPaused}
                  >
                    Edit
                  </AppButton>
                )}
              </div>
              
              {isLoadingTasks ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : isEditingTask ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="tasks" className="text-sm font-medium">
                      What are you focusing on?
                    </label>
                    <div className="space-y-3">
                      {currentTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2 group">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTaskCompletion(task.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className={cn(
                            "flex-1",
                            task.completed && "line-through text-muted-foreground"
                          )}>
                            {task.text}
                          </span>
                          <button
                            onClick={() => removeTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          value={newTaskText}
                          onChange={(e) => setNewTaskText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && addTask()}
                          placeholder="Add a new task..."
                          className="flex-1"
                        />
                        <AppButton
                          onClick={addTask}
                          variant="outline"
                          size="sm"
                          icon={<Plus size={16} />}
                        >
                          Add
                        </AppButton>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium">
                      Notes (optional)
                    </label>
                    <Textarea
                      id="notes"
                      value={currentNotes}
                      onChange={(e) => setCurrentNotes(e.target.value)}
                      placeholder="Add any notes or details..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <AppButton
                      onClick={() => setIsEditingTask(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </AppButton>
                    <AppButton
                      onClick={() => setIsEditingTask(false)}
                      variant="primary"
                      size="sm"
                      icon={<CheckCircle2 size={16} />}
                    >
                      Done
                    </AppButton>
                  </div>
                </div>
              ) : (
                <div className="min-h-[200px]">
                  {currentTasks.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        {currentTasks.map(task => (
                          <div key={task.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleTaskCompletion(task.id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              disabled={isActive && !isPaused}
                            />
                            <span className={cn(
                              task.completed && "line-through text-muted-foreground"
                            )}>
                              {task.text}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {currentNotes && (
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                          <p className="text-sm whitespace-pre-wrap">{currentNotes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
                      <p>No tasks set for this focus session</p>
                      <AppButton
                        onClick={() => setIsEditingTask(true)}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        Add tasks
                      </AppButton>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContainer>
          
          <CardContainer>
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Focus Tips</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 text-primary">•</div>
                  <div>Set a clear intention for each focus session</div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 text-primary">•</div>
                  <div>Remove distractions from your environment</div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 text-primary">•</div>
                  <div>Take short breaks between focus sessions</div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 text-primary">•</div>
                  <div>Stay hydrated and maintain good posture</div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 text-primary">•</div>
                  <div>Reflect on your progress after each session</div>
                </li>
              </ul>
            </div>
          </CardContainer>
        </div>
      </div>
    </div>
  );
} 