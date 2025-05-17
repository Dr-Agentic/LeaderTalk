import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  LineChart, Line, AreaChart, Area 
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
  score: number | null;   // Average score for the period (null if no recordings)
  count: number;   // Number of recordings in the period
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
              date: recording.createdAt || new Date().toISOString(),
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
    let groupingGranularity: "day" | "week" | "month";
    
    // Filter by time range and determine appropriate grouping
    if (timeBasedView === "week") {
      // Last 7 days
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      filteredRecordings = allRecordings.filter(r => new Date(r.date) >= sevenDaysAgo);
      groupingGranularity = "day";
    } else if (timeBasedView === "month") {
      // Last 30 days
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      filteredRecordings = allRecordings.filter(r => new Date(r.date) >= thirtyDaysAgo);
      groupingGranularity = "day";
    } else if (timeBasedView === "quarter") {
      // Last 90 days
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(now.getDate() - 90);
      filteredRecordings = allRecordings.filter(r => new Date(r.date) >= ninetyDaysAgo);
      groupingGranularity = "week";
    } else if (timeBasedView === "year") {
      // Last 365 days
      const yearAgo = new Date(now);
      yearAgo.setDate(now.getDate() - 365);
      filteredRecordings = allRecordings.filter(r => new Date(r.date) >= yearAgo);
      groupingGranularity = "month";
    } else {
      // All time
      filteredRecordings = [...allRecordings];
      groupingGranularity = "month";
    }
    
    if (filteredRecordings.length === 0) return [];
    
    // Sort by date (oldest first)
    const sortedRecordings = [...filteredRecordings].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Group recordings by the appropriate granularity
    const periodMap = new Map<string, { scores: number[], date: Date }>();
    
    // Fill in periods with no data for more continuous charts
    if (filteredRecordings.length > 0) {
      const oldestDate = new Date(sortedRecordings[0].date);
      const fillBlanks = (startDate: Date, endDate: Date, granularity: "day" | "week" | "month") => {
        let current = new Date(startDate);
        while (current <= endDate) {
          let periodKey: string;
          let periodDate = new Date(current);
          
          if (granularity === "day") {
            const year = current.getFullYear();
            const month = current.getMonth();
            const day = current.getDate();
            periodKey = `${year}-${month + 1}-${day}`;
          } else if (granularity === "week") {
            const year = current.getFullYear();
            const weekNum = getWeekNumber(current);
            periodKey = `${year}-W${weekNum}`;
          } else { // month
            const year = current.getFullYear();
            const month = current.getMonth();
            periodKey = `${year}-${month + 1}`;
          }
          
          if (!periodMap.has(periodKey)) {
            periodMap.set(periodKey, { scores: [], date: periodDate });
          }
          
          // Advance to next period
          if (granularity === "day") {
            current.setDate(current.getDate() + 1);
          } else if (granularity === "week") {
            current.setDate(current.getDate() + 7);
          } else { // month
            current.setMonth(current.getMonth() + 1);
          }
        }
      };
      
      fillBlanks(oldestDate, now, groupingGranularity);
    }
    
    // Add actual recordings to the periods
    for (const recording of sortedRecordings) {
      const recordingDate = new Date(recording.date);
      let periodKey: string;
      
      if (groupingGranularity === "day") {
        const year = recordingDate.getFullYear();
        const month = recordingDate.getMonth();
        const day = recordingDate.getDate();
        periodKey = `${year}-${month + 1}-${day}`;
      } else if (groupingGranularity === "week") {
        const year = recordingDate.getFullYear();
        const weekNum = getWeekNumber(recordingDate);
        periodKey = `${year}-W${weekNum}`;
      } else { // month
        const year = recordingDate.getFullYear();
        const month = recordingDate.getMonth();
        periodKey = `${year}-${month + 1}`;
      }
      
      if (periodMap.has(periodKey)) {
        periodMap.get(periodKey)!.scores.push(recording.score);
      }
    }
    
    // Convert the map to an array of period data
    return Array.from(periodMap.entries()).map(([key, data]) => {
      // If no recordings in this period, score will be null (but we'll still show the period)
      const avgScore = data.scores.length > 0
        ? data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
        : null;
      
      return {
        period: formatPeriodLabel(key, groupingGranularity),
        date: data.date,
        score: avgScore,
        count: data.scores.length
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
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
              onValueChange={(value) => setTimeBasedView(value as "week" | "month" | "quarter" | "year")}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="quarter">Quarterly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {timeBasedChartData.length > 0 ? (
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
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
                      formatter={(value) => {
                        if (value === undefined || value === null) return ['N/A', 'Average Score'];
                        return [`${Number(value).toFixed(1)}`, 'Average Score'];
                      }}
                      labelFormatter={(label) => label ? `Period: ${label}` : 'Unknown Period'}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      name="Leadership Score" 
                      stroke="#6366F1"
                      fill="#6366F180"
                      strokeWidth={2}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  </AreaChart>
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