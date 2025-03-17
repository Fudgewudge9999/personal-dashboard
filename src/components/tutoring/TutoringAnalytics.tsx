import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getCurrentWeekEarnings,
  getCurrentMonthEarnings,
  getYearlyEarningsSummary,
  EarningsSummary
} from "@/services/tutoringService";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function TutoringAnalytics() {
  const [weekEarnings, setWeekEarnings] = useState<EarningsSummary | null>(null);
  const [monthEarnings, setMonthEarnings] = useState<EarningsSummary | null>(null);
  const [yearlyData, setYearlyData] = useState<EarningsSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load weekly and monthly data
        const weekData = await getCurrentWeekEarnings();
        const monthData = await getCurrentMonthEarnings();
        
        // Load yearly data
        const currentYear = new Date().getFullYear();
        const yearData = await getYearlyEarningsSummary(currentYear);
        
        // Update state
        setWeekEarnings(weekData);
        setMonthEarnings(monthData);
        setYearlyData(yearData);
      } catch (error) {
        console.error("Error loading earnings data:", error);
        toast({
          title: "Error",
          description: "Failed to load earnings data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Prepare data for the chart
  const chartData = yearlyData.map((month) => ({
    name: month.period,
    paid: month.paidEarnings,
    unpaid: month.unpaidEarnings,
    total: month.totalEarnings,
    hours: month.totalHours
  }));

  const StatCard = ({ title, value, description }: { title: string; value: string; description?: string }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center p-8">Loading earnings data...</div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="This Week"
              value={formatCurrency(weekEarnings?.totalEarnings || 0)}
              description={`${weekEarnings?.sessionCount || 0} sessions (${weekEarnings?.totalHours.toFixed(1) || 0} hours)`}
            />
            <StatCard
              title="Paid (This Week)"
              value={formatCurrency(weekEarnings?.paidEarnings || 0)}
              description={`${((weekEarnings?.paidEarnings || 0) / (weekEarnings?.totalEarnings || 1) * 100).toFixed(0)}% collected`}
            />
            <StatCard
              title="This Month"
              value={formatCurrency(monthEarnings?.totalEarnings || 0)}
              description={`${monthEarnings?.sessionCount || 0} sessions (${monthEarnings?.totalHours.toFixed(1) || 0} hours)`}
            />
            <StatCard
              title="Paid (This Month)"
              value={formatCurrency(monthEarnings?.paidEarnings || 0)}
              description={`${((monthEarnings?.paidEarnings || 0) / (monthEarnings?.totalEarnings || 1) * 100).toFixed(0)}% collected`}
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Monthly Earnings</CardTitle>
              <CardDescription>
                Overview of your tutoring earnings for {new Date().getFullYear()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mt-4">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis 
                        tickFormatter={(value) => `£${value}`}
                        label={{ value: 'Earnings (£)', angle: -90, position: 'insideLeft' }} 
                      />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value as number)}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Legend />
                      <Bar dataKey="paid" name="Paid" fill="#16a34a" />
                      <Bar dataKey="unpaid" name="Unpaid" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No earnings data available for this year.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Monthly Hours</CardTitle>
              <CardDescription>
                Overview of your tutoring hours for {new Date().getFullYear()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mt-4">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis 
                        label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} 
                      />
                      <Tooltip 
                        formatter={(value) => `${value} hours`}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Legend />
                      <Bar dataKey="hours" name="Hours" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No hours data available for this year.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 