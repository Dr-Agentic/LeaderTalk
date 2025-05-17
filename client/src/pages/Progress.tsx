import { useEffect, useState, useRef } from "react";
import PerformanceSnapshotGenerator from "@/components/dashboard/PerformanceSnapshotGenerator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Recording } from "@shared/schema";
import { BackButton } from "@/components/BackButton";

// Interface for recording data with score
interface RecordingWithScore {
  id: number;
  title: string;
  date: string; // ISO date string
  score: number; // 0-100 score
  leaderMatch?: string; // Name of most similar leader
}

// Interface for a time range of recordings
interface TimeRange {
  label: string;
  recordings: RecordingWithScore[];
  averageScore: number;
  improvement: number; // Percentage improvement
}

// Interface for period data in time-based charts
interface PeriodData {
  period: string; // The time period (week/month/quarter/year)
  date: Date; // Start date of the period
  score: number; // Average score for the period (0 if no recordings)
  count: number; // Number of recordings in the period
  isEmpty: boolean; // Whether the period has no recordings
}

// Custom tooltip for time-based chart
const TimeBasedTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip bg-white p-4 border border-gray-200 rounded-md shadow-md">
        <p className="font-semibold">{label}</p>
        <p className="text-sm">
          Average Score: <span className="font-medium">{data.score.toFixed(1)}</span>
        </p>
        <p className="text-sm">
          Recordings: <span className="font-medium">{data.count}</span>
        </p>
        {data.isEmpty && (
          <p className="text-xs text-gray-500">No recordings in this period</p>
        )}
      </div>
    );
  }
  return null;
};

// Custom tooltip for recordings chart
const RecordingsTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip bg-white p-4 border border-gray-200 rounded-md shadow-md">
        <p className="font-semibold">
          {new Date(data.date).toLocaleDateString()}
        </p>
        <p className="text-sm">
          Title: <span className="font-medium">{data.title}</span>
        </p>
        <p className="text-sm">
          Score: <span className="font-medium">{data.score.toFixed(1)}</span>
        </p>
        {data.leaderMatch && (
          <p className="text-sm">
            Leader Match: <span className="font-medium">{data.leaderMatch}</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function Progress() {
  const { toast } = useToast();
  const { isAuthenticated, user, authLoading } = useAuth();
  const [recordings, setRecordings] = useState<RecordingWithScore[]>([]);
  const [timeRanges, setTimeRanges] = useState<{
    sevenDays: TimeRange;
    thirtyDays: TimeRange;
    thisYear: TimeRange;
    allTime: TimeRange;
  }>({
    sevenDays: {
      label: "Last 7 Days",
      recordings: [],
      averageScore: 0,
      improvement: 0,
    },
    thirtyDays: {
      label: "Last 30 Days",
      recordings: [],
      averageScore: 0,
      improvement: 0,
    },
    thisYear: {
      label: "This Year",
      recordings: [],
      averageScore: 0,
      improvement: 0,
    },
    allTime: {
      label: "All Time",
      recordings: [],
      averageScore: 0,
      improvement: 0,
    },
  });
  const [timeBasedChartData, setTimeBasedChartData] = useState<PeriodData[]>([]);
  const [recordingsChartData, setRecordingsChartData] = useState<RecordingWithScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeBasedView, setTimeBasedView] = useState<
    "week" | "month" | "quarter" | "year" | "alltime"
  >("month");
  const [recordingsCount, setRecordingsCount] = useState<10 | 20 | 50>(10);
  
  // Create refs for chart containers to use with the snapshot generator
  const timeBasedChartRef = useRef<HTMLDivElement>(null);
  const recordingsChartRef = useRef<HTMLDivElement>(null);

  // Fetch recordings data
  useEffect(() => {
    if (!isAuthenticated && !authLoading) return;

    async function fetchRecordings() {
      try {
        setIsLoading(true);
        const response = await apiRequest<Recording[]>({
          url: "/api/recordings",
          method: "GET",
        });

        // Process the recordings data
        if (response) {
          const processedRecordings = response.map((recording: Recording) => {
            // Create a normalized score from 0-100 from the analysis
            const positiveScore = recording.analysisResult?.positiveScore || 0;
            const negativeScore = recording.analysisResult?.negativeScore || 0;
            const neutralScore = recording.analysisResult?.neutralScore || 0;
            
            // Calculate a weighted score where positive is good and negative is bad
            const weightedPositive = positiveScore * 100;
            const weightedNegative = negativeScore * -50;
            const weightedNeutral = neutralScore * 25;
            
            // Combine for a score from 0 to 100
            const rawScore = 50 + weightedPositive + weightedNegative + weightedNeutral;
            const score = Math.max(0, Math.min(100, rawScore));
            
            return {
              id: recording.id,
              title: recording.title || `Recording ${recording.id}`,
              date: recording.createdAt?.toISOString() || new Date().toISOString(),
              score,
              leaderMatch: recording.analysisResult?.leaderMatches?.[0]?.name,
            };
          });

          // Sort recordings by date (newest first)
          const sortedRecordings = [...processedRecordings].sort(
            (a: RecordingWithScore, b: RecordingWithScore) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          setRecordings(sortedRecordings);

          // Calculate time ranges
          const now = new Date();
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);

          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);

          const startOfYear = new Date(now.getFullYear(), 0, 1);

          // Filter recordings for each time range
          const last7DaysRecordings = sortedRecordings.filter(
            (r: RecordingWithScore) => new Date(r.date) >= sevenDaysAgo
          );

          const last30DaysRecordings = sortedRecordings.filter(
            (r: RecordingWithScore) => new Date(r.date) >= thirtyDaysAgo
          );

          const thisYearRecordings = sortedRecordings.filter(
            (r: RecordingWithScore) => new Date(r.date) >= startOfYear
          );

          // Calculate average scores for each time range
          const calcAverage = (recordings: RecordingWithScore[]) => 
            recordings.length 
              ? recordings.reduce((sum, r) => sum + r.score, 0) / recordings.length 
              : 0;

          // Calculate improvement (comparing first and last recording in range)
          const calcImprovement = (recordings: RecordingWithScore[]) => {
            if (recordings.length < 2) return 0;
            const oldest = recordings[recordings.length - 1];
            const newest = recordings[0];
            return ((newest.score - oldest.score) / oldest.score) * 100;
          };

          // Set time ranges with calculated data
          setTimeRanges({
            sevenDays: {
              label: "Last 7 Days",
              recordings: last7DaysRecordings,
              averageScore: calcAverage(last7DaysRecordings),
              improvement: calcImprovement(last7DaysRecordings),
            },
            thirtyDays: {
              label: "Last 30 Days",
              recordings: last30DaysRecordings,
              averageScore: calcAverage(last30DaysRecordings),
              improvement: calcImprovement(last30DaysRecordings),
            },
            thisYear: {
              label: "This Year",
              recordings: thisYearRecordings,
              averageScore: calcAverage(thisYearRecordings),
              improvement: calcImprovement(thisYearRecordings),
            },
            allTime: {
              label: "All Time",
              recordings: sortedRecordings,
              averageScore: calcAverage(sortedRecordings),
              improvement: calcImprovement(sortedRecordings),
            },
          });

          // Set recordings for recent progress chart (limited to selected count)
          setRecordingsChartData(sortedRecordings.slice(0, recordingsCount));
          
          // Generate time-based chart data based on selected view
          generateTimeBasedChartData(sortedRecordings, timeBasedView);
        }
      } catch (error) {
        console.error("Error fetching recordings:", error);
        toast({
          title: "Error fetching recordings",
          description: "Failed to load your progress data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecordings();
  }, [isAuthenticated, authLoading, toast]);

  // Update recordings chart data when count changes
  useEffect(() => {
    if (recordings.length > 0) {
      setRecordingsChartData(recordings.slice(0, recordingsCount));
    }
  }, [recordingsCount, recordings]);

  // Update time-based chart data when view changes
  useEffect(() => {
    if (recordings.length > 0) {
      generateTimeBasedChartData(recordings, timeBasedView);
    }
  }, [timeBasedView, recordings]);

  // Function to generate time-based chart data
  const generateTimeBasedChartData = (
    recordings: RecordingWithScore[],
    viewType: "week" | "month" | "quarter" | "year" | "alltime"
  ) => {
    const now = new Date();
    let periodBoundaries: { start: Date; end: Date; label: string }[] = [];

    // Helper function to get week number
    const getWeekNumber = (date: Date): number => {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    // Generate period boundaries based on view type
    switch (viewType) {
      case "week":
        // Last 7 weeks, each period is a week
        for (let i = 6; i >= 0; i--) {
          const endDate = new Date(now);
          endDate.setDate(now.getDate() - (i * 7));
          const startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 6);
          
          const weekNum = getWeekNumber(startDate);
          
          periodBoundaries.push({
            start: startDate,
            end: endDate,
            label: `Week ${weekNum}`,
          });
        }
        break;
        
      case "month":
        // Last 30 days in 3-day chunks
        for (let i = 9; i >= 0; i--) {
          const endDate = new Date(now);
          endDate.setDate(now.getDate() - (i * 3));
          const startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 2);
          
          const monthName = startDate.toLocaleString('default', { month: 'short' });
          const dayNum = startDate.getDate();
          
          periodBoundaries.push({
            start: startDate,
            end: endDate,
            label: `${monthName} ${dayNum}`,
          });
        }
        break;
        
      case "quarter":
        // Last 13 weeks (quarter)
        for (let i = 12; i >= 0; i--) {
          const endDate = new Date(now);
          endDate.setDate(now.getDate() - (i * 7));
          const startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 6);
          
          const weekNum = getWeekNumber(startDate);
          
          periodBoundaries.push({
            start: startDate,
            end: endDate,
            label: `Week ${weekNum}`,
          });
        }
        break;
        
      case "year":
        // Last 12 months
        for (let i = 11; i >= 0; i--) {
          const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          
          const monthName = startDate.toLocaleString('default', { month: 'short' });
          
          periodBoundaries.push({
            start: startDate,
            end: endDate,
            label: monthName,
          });
        }
        break;
        
      case "alltime":
        // Group by quarter since user started
        if (recordings.length === 0) {
          // Default to last year if no recordings
          for (let i = 3; i >= 0; i--) {
            const endDate = new Date(now.getFullYear(), (now.getMonth() - i * 3) + 3, 0);
            const startDate = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
            
            const quarterNum = Math.floor(startDate.getMonth() / 3) + 1;
            const year = startDate.getFullYear();
            
            periodBoundaries.push({
              start: startDate,
              end: endDate,
              label: `Q${quarterNum} ${year}`,
            });
          }
        } else {
          // Find the oldest recording date
          const oldestRecording = recordings.reduce((oldest, recording) => {
            const recordingDate = new Date(recording.date);
            return recordingDate < oldest ? recordingDate : oldest;
          }, new Date());
          
          // Start from the quarter of the oldest recording
          const startQuarter = Math.floor(oldestRecording.getMonth() / 3);
          const startYear = oldestRecording.getFullYear();
          
          // Calculate how many quarters to now
          const endQuarter = Math.floor(now.getMonth() / 3);
          const endYear = now.getFullYear();
          
          const totalQuarters = (endYear - startYear) * 4 + (endQuarter - startQuarter + 1);
          
          // Generate quarters
          for (let i = 0; i < totalQuarters; i++) {
            const quarterOffset = startQuarter + i;
            const yearOffset = Math.floor(quarterOffset / 4);
            const quarter = (quarterOffset % 4) + 1;
            const year = startYear + yearOffset;
            
            const startDate = new Date(year, (quarter - 1) * 3, 1);
            const endDate = new Date(year, quarter * 3, 0);
            
            periodBoundaries.push({
              start: startDate,
              end: endDate,
              label: `Q${quarter} ${year}`,
            });
          }
        }
        break;
    }

    // Calculate stats for each period
    const chartData = periodBoundaries.map(({start, end, label}) => {
      // Filter recordings in this period
      const periodRecordings = recordings.filter(recording => {
        const recordingDate = new Date(recording.date);
        return recordingDate >= start && recordingDate <= end;
      });
      
      // Calculate average score
      const averageScore = periodRecordings.length
        ? periodRecordings.reduce((sum, r) => sum + r.score, 0) / periodRecordings.length
        : 0;
        
      return {
        period: label,
        date: start,
        score: averageScore,
        count: periodRecordings.length,
        isEmpty: periodRecordings.length === 0,
      };
    });

    setTimeBasedChartData(chartData);
  };

  if (isLoading) {
    return <ProgressSkeleton />;
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex mb-4">
        <BackButton />
      </div>

      <div className="mb-8">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-gray-900">Your Progress</h1>
          <p className="text-gray-500 mt-2">
            Track your communication improvement over time
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* Time-Based Progress Chart */}
          <Card>
            <CardHeader>
              <div className="w-full mb-4">
                <CardTitle className="text-xl">Progress Over Time</CardTitle>
                <CardDescription>
                  Your leadership score evolution by time period
                </CardDescription>
              </div>
              <div className="flex justify-end">
                <Select
                  value={timeBasedView}
                  onValueChange={(value) =>
                    setTimeBasedView(
                      value as "week" | "month" | "quarter" | "year" | "alltime"
                    )
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last 7 Weeks</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                    <SelectItem value="alltime">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={timeBasedChartRef} className="w-full h-[400px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timeBasedChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 70,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis
                      dataKey="period"
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickCount={6}
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Leadership Score",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle" },
                      }}
                    />
                    <Tooltip content={<TimeBasedTooltip />} />
                    <ReferenceLine y={50} stroke="#ddd" label="Average" />
                    <Bar
                      dataKey="score"
                      name="Score"
                      fill={({ isEmpty }) =>
                        isEmpty ? "#e5e7eb" : "var(--primary)"
                      }
                      opacity={({ isEmpty }) => (isEmpty ? 0.5 : 1)}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recordings Progress Chart */}
          <Card>
            <CardHeader>
              <div className="w-full mb-4">
                <CardTitle className="text-xl">Recent Recordings Performance</CardTitle>
                <CardDescription>
                  Track your scores across individual recordings
                </CardDescription>
              </div>
              <div className="flex justify-end">
                <Select
                  value={recordingsCount.toString()}
                  onValueChange={(value) =>
                    setRecordingsCount(parseInt(value) as 10 | 20 | 50)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Number of Recordings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Last 10 Recordings</SelectItem>
                    <SelectItem value="20">Last 20 Recordings</SelectItem>
                    <SelectItem value="50">Last 50 Recordings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={recordingsChartRef} className="w-full h-[400px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={recordingsChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 70,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(dateStr) =>
                        new Date(dateStr).toLocaleDateString()
                      }
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickCount={6}
                      tick={{ fontSize: 12 }}
                      label={{
                        value: "Leadership Score",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle" },
                      }}
                    />
                    <Tooltip content={<RecordingsTooltip />} />
                    <ReferenceLine y={50} stroke="#ddd" label="Average" />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Leadership Score"
                      stroke="var(--primary)"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Performance Snapshot and Summary Cards */}
        <div className="space-y-6">
          {/* Performance Snapshot Generator */}
          <PerformanceSnapshotGenerator
            timeBasedChartRef={timeBasedChartRef}
            recordingsChartRef={recordingsChartRef}
            chartDataReady={!isLoading && recordings.length > 0}
            userName={user?.name}
          />
          
          {/* Summary Cards */}
          <Tabs defaultValue="7days" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="7days">7 Days</TabsTrigger>
              <TabsTrigger value="30days">30 Days</TabsTrigger>
            </TabsList>

            <TabsContent value="7days">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Last 7 Days</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {timeRanges.sevenDays.recordings.length > 0 ? (
                    <>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          Average Score
                        </div>
                        <div className="text-2xl font-bold">
                          {timeRanges.sevenDays.averageScore.toFixed(1)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          Recordings
                        </div>
                        <div className="text-lg font-medium">
                          {timeRanges.sevenDays.recordings.length}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          Improvement
                        </div>
                        <div
                          className={`text-lg font-medium ${
                            timeRanges.sevenDays.improvement > 0
                              ? "text-green-500"
                              : timeRanges.sevenDays.improvement < 0
                              ? "text-red-500"
                              : ""
                          }`}
                        >
                          {timeRanges.sevenDays.improvement > 0 ? "+" : ""}
                          {timeRanges.sevenDays.improvement.toFixed(1)}%
                        </div>
                      </div>
                    </>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Data</AlertTitle>
                      <AlertDescription>
                        No recordings in the last 7 days.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="30days">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Last 30 Days</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {timeRanges.thirtyDays.recordings.length > 0 ? (
                    <>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          Average Score
                        </div>
                        <div className="text-2xl font-bold">
                          {timeRanges.thirtyDays.averageScore.toFixed(1)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          Recordings
                        </div>
                        <div className="text-lg font-medium">
                          {timeRanges.thirtyDays.recordings.length}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          Improvement
                        </div>
                        <div
                          className={`text-lg font-medium ${
                            timeRanges.thirtyDays.improvement > 0
                              ? "text-green-500"
                              : timeRanges.thirtyDays.improvement < 0
                              ? "text-red-500"
                              : ""
                          }`}
                        >
                          {timeRanges.thirtyDays.improvement > 0 ? "+" : ""}
                          {timeRanges.thirtyDays.improvement.toFixed(1)}%
                        </div>
                      </div>
                    </>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Data</AlertTitle>
                      <AlertDescription>
                        No recordings in the last 30 days.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
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