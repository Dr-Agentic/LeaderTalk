import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  LineChart, Line, AreaChart, Area, Cell
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Recording } from "@shared/schema";
import { BackButton } from "@/components/BackButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types for our recording analysis
interface RecordingWithScore {
  id: number;
  title: string;
  date: string; // ISO date string
  score: number; // 0-100 score
  leaderMatch?: string; // Name of most similar leader
}

interface TimeRange {
  label: string;
  recordings: RecordingWithScore[];
  averageScore: number;
  improvement: number; // Percentage improvement
}

interface PeriodData {
  period: string;  // The time period (week/month/quarter/year)
  date: Date;      // Start date of the period
  score: number;   // Average score for the period (0 if no recordings)
  count: number;   // Number of recordings in the period
  isEmpty: boolean; // Whether the period has no recordings
}

export default function Progress() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [allRecordings, setAllRecordings] = useState<RecordingWithScore[]>([]);
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([
    { label: "Last 7 days", recordings: [], averageScore: 0, improvement: 0 },
    { label: "Last 30 days", recordings: [], averageScore: 0, improvement: 0 },
    { label: "This year", recordings: [], averageScore: 0, improvement: 0 },
    { label: "All time", recordings: [], averageScore: 0, improvement: 0 }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeBasedView, setTimeBasedView] = useState<"week" | "month" | "quarter" | "year" | "alltime">("month");
  const [recordingsCount, setRecordingsCount] = useState<10 | 20 | 50>(10);

  // Fetch recordings data
  useEffect(() => {
    if (!isAuthenticated && !authLoading) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await apiRequest('GET', '/api/recordings');
        
        if (res.ok) {
          const recordings = await res.json();
          
          // Process recordings to extract relevant data and calculate scores
          const processedRecordings = recordings.map((recording: Recording) => {
            // Extract score from analysis
            let score = 0;
            let leaderMatch = "";
            
            if (recording.analysisResult) {
              try {
                const analysis = typeof recording.analysisResult === 'string' 
                  ? JSON.parse(recording.analysisResult) 
                  : recording.analysisResult;
                
                // Get score from analysis if available
                if (analysis.overview?.score !== undefined) {
                  score = analysis.overview.score;
                } else {
                  console.warn(`No score found for recording ${recording.id}, using 0`);
                }
                
                // Get leader match if available
                if (analysis.leadershipInsights && analysis.leadershipInsights.length > 0) {
                  leaderMatch = analysis.leadershipInsights[0].leaderName;
                }
              } catch (e) {
                console.error("Error parsing analysis result:", e);
              }
            }
            
            return {
              id: recording.id,
              title: recording.title || `Recording ${recording.id}`,
              date: recording.recordedAt ? new Date(recording.recordedAt).toISOString() : new Date().toISOString(),
              score,
              leaderMatch
            };
          });
          
          // Sort by date (newest first)
          processedRecordings.sort((a: RecordingWithScore, b: RecordingWithScore) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          
          // Store all recordings
          setAllRecordings(processedRecordings);
          
          // Calculate time ranges
          const now = new Date();
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);
          
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          
          // Filter recordings for each time range
          const last7Days = processedRecordings.filter((r: RecordingWithScore) => new Date(r.date) >= sevenDaysAgo);
          const last30Days = processedRecordings.filter((r: RecordingWithScore) => new Date(r.date) >= thirtyDaysAgo);
          const thisYear = processedRecordings.filter((r: RecordingWithScore) => new Date(r.date) >= startOfYear);
          const allTime = processedRecordings;
          
          // Calculate average scores and improvements for each time range
          const calculateAvgAndImprovement = (recordings: RecordingWithScore[]): { averageScore: number, improvement: number } => {
            if (recordings.length === 0) return { averageScore: 0, improvement: 0 };
            
            const averageScore = recordings.reduce((sum, r) => sum + r.score, 0) / recordings.length;
            
            // If we have at least 2 recordings, calculate improvement from first to last
            if (recordings.length >= 2) {
              // Sort by date (oldest to newest)
              const sorted = [...recordings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              
              // Calculate average of first 30% and last 30% of recordings
              const firstThirdCount = Math.max(1, Math.floor(sorted.length * 0.3));
              const lastThirdCount = Math.max(1, Math.floor(sorted.length * 0.3));
              
              const firstThird = sorted.slice(0, firstThirdCount);
              const lastThird = sorted.slice(sorted.length - lastThirdCount);
              
              const firstAvg = firstThird.reduce((sum, r) => sum + r.score, 0) / firstThird.length;
              const lastAvg = lastThird.reduce((sum, r) => sum + r.score, 0) / lastThird.length;
              
              const improvement = firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0;
              
              return { averageScore, improvement };
            }
            
            return { averageScore, improvement: 0 };
          };
          
          setTimeRanges([
            { 
              label: "Last 7 days", 
              recordings: last7Days,
              ...calculateAvgAndImprovement(last7Days)
            },
            { 
              label: "Last 30 days", 
              recordings: last30Days,
              ...calculateAvgAndImprovement(last30Days)
            },
            { 
              label: "This year", 
              recordings: thisYear,
              ...calculateAvgAndImprovement(thisYear)
            },
            { 
              label: "All time", 
              recordings: allTime,
              ...calculateAvgAndImprovement(allTime)
            }
          ]);
        }
      } catch (error) {
        console.error("Error fetching recording data:", error);
        toast({
          title: "Error",
          description: "Failed to load your progress data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [isAuthenticated, authLoading, toast]);
  
  // Generate chart color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "#22c55e"; // Good (green)
    if (score >= 60) return "#84cc16"; // Above average (lime)
    if (score >= 40) return "#eab308"; // Average (yellow)
    if (score >= 20) return "#f97316"; // Below average (orange)
    return "#ef4444"; // Poor (red)
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  
  // Create time-based chart data
  const getTimeBasedChartData = (): PeriodData[] => {
    if (allRecordings.length === 0) return [];
    
    // Filter recordings based on selected time view
    const now = new Date();
    let filteredRecordings: RecordingWithScore[] = [];
    let periodBoundaries: { start: Date, end: Date, label: string }[] = [];
    
    // Filter by time range and determine appropriate periods
    if (timeBasedView === "week") {
      // Last 7 days - one bar per day
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      filteredRecordings = allRecordings.filter(r => new Date(r.date) >= sevenDaysAgo);
      
      // Create 7 daily entries (today and past 6 days)
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        
        // Set to beginning of day
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        
        // Set to end of day
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        periodBoundaries.push({
          start: startDate,
          end: endDate,
          label: formatter.format(date)
        });
      }
    } else if (timeBasedView === "month") {
      // Last 30 days - group into 10 three-day chunks
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      filteredRecordings = allRecordings.filter(r => new Date(r.date) >= thirtyDaysAgo);
      
      // Create 10 three-day chunks
      for (let i = 9; i >= 0; i--) {
        const endDate = new Date();
        endDate.setDate(now.getDate() - (i * 3));
        
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 2);
        startDate.setHours(0, 0, 0, 0);
        
        endDate.setHours(23, 59, 59, 999);
        
        const startFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
        const endFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
        
        const label = `${startFormatter.format(startDate)} - ${endFormatter.format(endDate)}`;
        periodBoundaries.push({ start: startDate, end: endDate, label });
      }
    } else if (timeBasedView === "quarter") {
      // Last 90 days - group into 13 weekly chunks
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(now.getDate() - 90);
      filteredRecordings = allRecordings.filter(r => new Date(r.date) >= ninetyDaysAgo);
      
      // Create 13 weekly entries
      for (let i = 12; i >= 0; i--) {
        const endDate = new Date();
        endDate.setDate(now.getDate() - (i * 7));
        
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        
        endDate.setHours(23, 59, 59, 999);
        
        const startFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
        const endFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
        
        const label = `${startFormatter.format(startDate)} - ${endFormatter.format(endDate)}`;
        periodBoundaries.push({ start: startDate, end: endDate, label });
      }
    } else if (timeBasedView === "year") {
      // Last 365 days - group by calendar month
      const yearAgo = new Date(now);
      yearAgo.setDate(now.getDate() - 365);
      filteredRecordings = allRecordings.filter(r => new Date(r.date) >= yearAgo);
      
      // Create 12 monthly entries - current month and previous 11 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      let currentMonth = now.getMonth(); // 0-11
      let currentYear = now.getFullYear();
      
      // Start from 11 months ago and add 12 months in chronological order
      for (let i = 11; i >= 0; i--) {
        // Calculate the month index going backwards i months
        // If we go back past January, adjust the year
        let monthIndex = currentMonth - i;
        let year = currentYear;
        
        if (monthIndex < 0) {
          // Adjust for previous year
          monthIndex = 12 + monthIndex; // Convert negative to equivalent month in previous year
          year -= 1;
        }
        
        const startDate = new Date(year, monthIndex, 1);
        
        // Last day of month
        const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
        
        const label = `${monthNames[monthIndex]} ${year}`;
        periodBoundaries.push({ start: startDate, end: endDate, label });
      }
    } else {
      // All time - group by month
      filteredRecordings = [...allRecordings];
      
      // Group by months
      if (filteredRecordings.length > 0) {
        const dates = filteredRecordings.map(r => new Date(r.date));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        
        let year = minDate.getFullYear();
        let month = minDate.getMonth();
        
        while (
          new Date(year, month, 1) <= now
        ) {
          const startDate = new Date(year, month, 1);
          const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
          
          const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
          periodBoundaries.push({
            start: startDate,
            end: endDate,
            label: formatter.format(startDate)
          });
          
          month++;
          if (month > 11) {
            month = 0;
            year++;
          }
        }
      }
    }
    
    if (filteredRecordings.length === 0 || periodBoundaries.length === 0) return [];
    
    // Aggregate recordings into the defined periods
    const result = periodBoundaries.map(period => {
      const recordingsInPeriod = filteredRecordings.filter(recording => {
        const recordingDate = new Date(recording.date);
        return recordingDate >= period.start && recordingDate <= period.end;
      });
      
      const scores = recordingsInPeriod.map(rec => rec.score);
      // For display purposes, we'll use 0 for empty periods instead of null
      // but track that this is an empty period with a separate property
      const avgScore = scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;
      
      return {
        period: period.label,
        date: period.start,
        score: avgScore,
        count: recordingsInPeriod.length,
        isEmpty: recordingsInPeriod.length === 0
      };
    });
    
    return result;
  };
  
  // Get week number for a date (ISO week number)
  const getWeekNumber = (date: Date): number => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };
  
  // Format period label based on the view type
  const formatPeriodLabel = (periodKey: string, granularity: "day" | "week" | "month"): string => {
    if (granularity === "day") {
      const [year, month, day] = periodKey.split("-");
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else if (granularity === "week") {
      const [year, weekNum] = periodKey.split("-W");
      return `Week ${weekNum}`;
    } else { // month
      const [year, month] = periodKey.split("-");
      return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
  };
  
  // Get recording-based chart data
  const getRecordingsChartData = () => {
    if (allRecordings.length === 0) return [];
    
    // Sort by date (oldest to newest)
    const sortedRecordings = [...allRecordings].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Get the last N recordings
    const lastNRecordings = sortedRecordings.slice(-recordingsCount);
    
    return lastNRecordings.map((recording, index) => ({
      index: index + 1,
      name: recording.title.length > 15 ? recording.title.substring(0, 15) + '...' : recording.title,
      score: recording.score,
      date: formatDate(recording.date),
      fullTitle: recording.title,
      leaderMatch: recording.leaderMatch || "Unknown"
    }));
  };
  
  if (isLoading || authLoading) {
    return <ProgressSkeleton />;
  }
  
  const timeBasedChartData = getTimeBasedChartData();
  const recordingsChartData = getRecordingsChartData();
  
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col">
        <BackButton to="/dashboard" label="Back to Dashboard" />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Progress</h1>
          <p className="text-gray-500 mt-2">
            Track your communication improvement over time
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        {/* Time-Based Progress Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Progress Over Time</CardTitle>
              <CardDescription>
                Your leadership score evolution by time period
              </CardDescription>
            </div>
            <Select 
              value={timeBasedView} 
              onValueChange={(value) => setTimeBasedView(value as "week" | "month" | "quarter" | "year" | "alltime")}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last 90 Days</SelectItem>
                <SelectItem value="year">Last 365 Days</SelectItem>
                <SelectItem value="alltime">All Time</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {timeBasedChartData.length > 0 ? (
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timeBasedChartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="period" 
                      angle={-45} 
                      textAnchor="end" 
                      tick={{ fontSize: 12 }}
                      height={60}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      label={{ value: 'Average Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => {
                        const entry = timeBasedChartData.find(item => item.period === props.payload.period);
                        
                        if (entry?.isEmpty) {
                          return ['No recordings', 'Average Score'];
                        }
                        
                        const recordingCount = entry?.count || 0;
                        return [
                          `${Number(value).toFixed(1)}`, 
                          'Average Score',
                          `Based on ${recordingCount} ${recordingCount === 1 ? 'recording' : 'recordings'}`
                        ];
                      }}
                      labelFormatter={(label) => label ? `Period: ${label}` : 'Unknown Period'}
                    />
                    <Legend />
                    <Bar 
                      dataKey="score" 
                      name="Leadership Score" 
                      fill="#6366F1"
                      radius={[4, 4, 0, 0]}
                      minPointSize={5} 
                    >
                      {timeBasedChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.isEmpty ? "#E5E7EB" : "#6366F1"}
                          opacity={entry.isEmpty ? 0.5 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <p>No recordings found. Record conversations to see your progress.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recording-Based Progress Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recording-by-Recording Progress</CardTitle>
              <CardDescription>
                Your leadership score changes across individual recordings
              </CardDescription>
            </div>
            <Select 
              value={recordingsCount.toString()} 
              onValueChange={(value) => setRecordingsCount(parseInt(value) as 10 | 20 | 50)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Select count" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Last 10</SelectItem>
                <SelectItem value="20">Last 20</SelectItem>
                <SelectItem value="50">Last 50</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {recordingsChartData.length > 0 ? (
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={recordingsChartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="index" 
                      label={{ 
                        value: 'Recording Number', 
                        position: 'insideBottom', 
                        offset: -10,
                        style: { textAnchor: 'middle' } 
                      }}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toFixed(1)}`, 'Score']}
                      labelFormatter={(index) => {
                        const recording = recordingsChartData[parseInt(index) - 1];
                        // Check if recording exists before accessing properties
                        if (recording) {
                          return `Recording ${index}: ${recording.fullTitle || recording.name}\nDate: ${recording.date}`;
                        }
                        return `Recording ${index}`;
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      name="Leadership Score" 
                      stroke="#0EA5E9" 
                      strokeWidth={2}
                      dot={{ fill: '#0EA5E9', r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <p>No recordings found. Record conversations to see your progress.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Summary Statistics */}
        <Tabs defaultValue="7days" className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="7days">Last 7 Days</TabsTrigger>
            <TabsTrigger value="30days">Last 30 Days</TabsTrigger>
            <TabsTrigger value="year">This Year</TabsTrigger>
            <TabsTrigger value="alltime">All Time</TabsTrigger>
          </TabsList>
          
          {timeRanges.map((range, index) => (
            <TabsContent 
              key={range.label} 
              value={["7days", "30days", "year", "alltime"][index]}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Average Score</CardTitle>
                    <CardDescription>
                      Your average leadership score for this period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-center">
                      {range.averageScore.toFixed(1)}%
                    </div>
                    <div className="text-sm text-center text-gray-500 mt-2">
                      Based on {range.recordings.length} recordings
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Improvement</CardTitle>
                    <CardDescription>
                      Your progress compared to when you started
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold text-center ${range.improvement >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {range.improvement >= 0 ? '+' : ''}{range.improvement.toFixed(1)}%
                    </div>
                    <div className="text-sm text-center text-gray-500 mt-2">
                      {range.improvement >= 0 
                        ? "You're improving! Keep up the good work." 
                        : "Slight decrease. Focus on improvement areas."}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recordings</CardTitle>
                    <CardDescription>
                      Summary of your recordings in this period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-center">
                      {range.recordings.length}
                    </div>
                    <div className="text-sm text-center text-gray-500 mt-2">
                      {range.recordings.length > 0 
                        ? `Latest on ${formatDate(range.recordings[0].date)}` 
                        : "No recordings in this period"}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

function ProgressSkeleton() {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col">
        <Skeleton className="h-8 w-32 mb-4" /> {/* BackButton skeleton */}
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <Skeleton className="w-full h-80" />
          </CardContent>
        </Card>
        
        <div className="w-full">
          <Skeleton className="h-10 w-full mb-6" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}