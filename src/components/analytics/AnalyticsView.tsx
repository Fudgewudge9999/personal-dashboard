import { CardContainer } from "../common/CardContainer";
import { ProgressBar } from "../common/ProgressBar";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export function AnalyticsView() {
  // Sample data for productivity chart
  const productivityData = [
    { name: 'Mon', tasks: 8, hours: 5 },
    { name: 'Tue', tasks: 5, hours: 6 },
    { name: 'Wed', tasks: 10, hours: 7 },
    { name: 'Thu', tasks: 4, hours: 4.5 },
    { name: 'Fri', tasks: 7, hours: 6.5 },
    { name: 'Sat', tasks: 3, hours: 3 },
    { name: 'Sun', tasks: 2, hours: 2.5 },
  ];
  
  // Sample data for habit completion
  const habitData = [
    { name: 'Reading', completion: 80 },
    { name: 'Meditation', completion: 95 },
    { name: 'Exercise', completion: 60 },
    { name: 'Journaling', completion: 75 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-medium">Analytics & Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <CardContainer>
          <h2 className="font-medium text-lg mb-4">Weekly Productivity</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={productivityData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.2} 
                />
                <Area 
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.2} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContainer>
      </div>
      
      <CardContainer>
        <h2 className="font-medium text-lg mb-6">Habit Completion Rates</h2>
        <div className="space-y-6">
          {habitData.map((habit, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{habit.name}</span>
                <span>{habit.completion}%</span>
              </div>
              <ProgressBar 
                value={habit.completion} 
                max={100} 
                variant={habit.completion > 80 ? "success" : "default"} 
              />
            </div>
          ))}
        </div>
      </CardContainer>
    </div>
  );
}
