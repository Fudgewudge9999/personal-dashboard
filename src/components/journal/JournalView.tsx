
import { CardContainer } from "../common/CardContainer";
import { AppButton } from "../common/AppButton";
import { Plus, BookHeart } from "lucide-react";
import { Badge } from "../common/Badge";

export function JournalView() {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const formattedDate = today.toLocaleDateString('en-US', options);
  
  const journalPrompts = [
    "What are three things you're grateful for today?",
    "What was your biggest achievement today?",
    "What challenged you today, and how did you handle it?",
    "What did you learn today that could help you tomorrow?",
    "How did you take care of yourself today?"
  ];
  
  const recentEntries = [
    { date: "May 15, 2023", preview: "Today was a productive day. I managed to complete..." },
    { date: "May 14, 2023", preview: "I had an interesting conversation with a student about..." },
    { date: "May 12, 2023", preview: "Feeling a bit overwhelmed today with the workload..." },
  ];
  
  // Select a random prompt
  const randomPrompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-medium">Journal</h1>
        <AppButton icon={<Plus size={18} />}>New Entry</AppButton>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <CardContainer>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="secondary" className="mb-2">Today's Entry</Badge>
                  <h2 className="text-xl font-medium">{formattedDate}</h2>
                </div>
              </div>
              
              <div className="p-4 bg-secondary/50 rounded-md">
                <p className="text-sm italic text-muted-foreground">Prompt: {randomPrompt}</p>
              </div>
              
              <textarea 
                placeholder="Start writing your thoughts here..."
                className="w-full h-64 p-3 rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-ring bg-transparent"
              ></textarea>
            </div>
          </CardContainer>
        </div>
        
        <div>
          <CardContainer>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BookHeart size={20} className="text-primary" />
                <h3 className="font-medium">Recent Entries</h3>
              </div>
              
              <div className="space-y-3">
                {recentEntries.map((entry, index) => (
                  <a 
                    href="#" 
                    key={index}
                    className="block p-3 border rounded-md hover:border-primary/50 transition-colors"
                  >
                    <p className="text-sm font-medium">{entry.date}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.preview}</p>
                  </a>
                ))}
              </div>
            </div>
          </CardContainer>
        </div>
      </div>
    </div>
  );
}
