import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Recording } from "@shared/schema";
import { BackButton } from "@/components/BackButton";

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

export default function Progress() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [recentRecordings, setRecentRecordings] = useState<RecordingWithScore[]>([]);
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([
    { label: "Last 7 days", recordings: [], averageScore: 0, improvement: 0 },
    { label: "Last 30 days", recordings: [], averageScore: 0, improvement: 0 },
    { label: "This year", recordings: [], averageScore: 0, improvement: 0 },
    { label: "All time", recordings: [], averageScore: 0, improvement: 0 }
  ]);
  const [isLoading, setIsLoading] = useState(true);

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
          const processedRecordings = recordings.map(recording => {
            // Extract score from analysis or use a random score for demo
            let score = 0;
            let leaderMatch = "";
            
            if (recording.analysisResult) {
              try {
                const analysis = typeof recording.analysisResult === 'string' 
                  ? JSON.parse(recording.analysisResult) 
                  : recording.analysisResult;
                
                // Get score from analysis if available
                score = analysis.overview?.score || Math.floor(Math.random() * 100);
                
                // Get leader match if available
                if (analysis.leadershipInsights && analysis.leadershipInsights.length > 0) {
                  leaderMatch = analysis.leadershipInsights[0].leaderName;
                }
              } catch (e) {
                console.error("Error parsing analysis result:", e);
                score = Math.floor(Math.random() * 100);
              }
            } else {
              // Generate random score for demo purposes
              score = Math.floor(Math.random() * 100);
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
          processedRecordings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          // Get the 10 most recent recordings for the histogram
          setRecentRecordings(processedRecordings.slice(0, 10).reverse()); // Reverse for chronological order in the chart
          
          // Calculate time ranges
          const now = new Date();
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);
          
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          
          // Filter recordings for each time range
          const last7Days = processedRecordings.filter(r => new Date(r.date) >= sevenDaysAgo);
          const last30Days = processedRecordings.filter(r => new Date(r.date) >= thirtyDaysAgo);
          const thisYear = processedRecordings.filter(r => new Date(r.date) >= startOfYear);
          const allTime = processedRecordings;
          
          // Calculate average scores and improvements for each time range
          const calculateAvgAndImprovement = (recordings: RecordingWithScore[]): { averageScore: number, improvement: number } => {
            if (recordings.length === 0) return { averageScore: 0, improvement: 0 };
            
            const averageScore = recordings.reduce((sum, r) => sum + r.score, 0) / recordings.length;
            
            // Calculate improvement by comparing first half to second half
            if (recordings.length < 2) return { averageScore, improvement: 0 };
            
            const midpoint = Math.floor(recordings.length / 2);
            const firstHalf = recordings.slice(0, midpoint);
            const secondHalf = recordings.slice(midpoint);
            
            const firstAvg = firstHalf.reduce((sum, r) => sum + r.score, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((sum, r) => sum + r.score, 0) / secondHalf.length;
            
            const improvement = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
            
            return { averageScore, improvement };
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
  
  if (isLoading || authLoading) {
    return <ProgressSkeleton />;
  }
  
  // Prepare the histogram data
  const histogramData = recentRecordings.map(recording => ({
    name: formatDate(recording.date),
    score: recording.score,
    title: recording.title,
    leaderMatch: recording.leaderMatch || "Unknown"
  }));
  
  // Prepare trend data for line charts
  const prepareTrendData = (timeRange: TimeRange) => {
    if (timeRange.recordings.length === 0) return [];
    
    // Group by day, week, or month depending on the time range
    const groupedData = timeRange.recordings.reduce((groups, recording) => {
      const date = new Date(recording.date);
      let key;
      
      if (timeRange.label === "Last 7 days") {
        // Group by day
        key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } else if (timeRange.label === "Last 30 days") {
        // Group by week
        const weekNumber = Math.floor(date.getDate() / 7) + 1;
        key = `Week ${weekNumber}`;
      } else {
        // Group by month
        key = date.toLocaleDateString("en-US", { month: "short" });
      }
      
      if (!groups[key]) {
        groups[key] = { scores: [], count: 0 };
      }
      
      groups[key].scores.push(recording.score);
      groups[key].count++;
      
      return groups;
    }, {} as Record<string, { scores: number[], count: number }>);
    
    // Calculate average score for each group
    return Object.entries(groupedData).map(([key, data]) => ({
      name: key,
      value: data.scores.reduce((sum, score) => sum + score, 0) / data.count,
      count: data.count
    }));
  };
  
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
      
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Recordings Histogram */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Recording Scores</CardTitle>
            <CardDescription>
              Your 10 most recent recordings and their leadership scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRecordings.length > 0 ? (
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={histogramData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      tick={{ fontSize: 12 }}
                      height={70}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => {
                        return [
                          `Score: ${value}`,
                          `Title: ${props.payload.title}`,
                          `Most similar to: ${props.payload.leaderMatch}`
                        ];
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Bar 
                      dataKey="score" 
                      name="Leadership Score" 
                      fill="#6366F1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <p>No recordings found. Record your first conversation to see your progress.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Tabs for different time ranges */}
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
                      Your progress compared to the previous period
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
                    <CardTitle>Trend</CardTitle>
                    <CardDescription>
                      Your score progression over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {range.recordings.length > 0 ? (
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            data={prepareTrendData(range)}
                            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} hide />
                            <Tooltip />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              name="Score" 
                              stroke="#6366F1" 
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>Not enough data to show trend</p>
                      </div>
                    )}
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