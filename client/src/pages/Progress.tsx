import { useEffect, useState } from "react";
import { useLocation } from "wouter";
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
import { H2 } from "@/components/ui/typography";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Recording } from "@shared/schema";
import AppLayout from "@/components/AppLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  period: string; // The time period (week/month/quarter/year)
  date: Date; // Start date of the period
  score: number; // Average score for the period (0 if no recordings)
  count: number; // Number of recordings in the period
  isEmpty: boolean; // Whether the period has no recordings
}

export default function Progress() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [allRecordings, setAllRecordings] = useState<RecordingWithScore[]>([]);
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([
    { label: "Last 7 days", recordings: [], averageScore: 0, improvement: 0 },
    { label: "Last 30 days", recordings: [], averageScore: 0, improvement: 0 },
    { label: "This year", recordings: [], averageScore: 0, improvement: 0 },
    { label: "All time", recordings: [], averageScore: 0, improvement: 0 },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeBasedView, setTimeBasedView] = useState<
    "week" | "month" | "quarter" | "year" | "alltime"
  >("month");
  const [recordingsCount, setRecordingsCount] = useState<10 | 20 | 50>(10);

  // Navigation function
  const navigate = (path: string) => {
    setLocation(path);
  };

  // Fetch recordings data
  useEffect(() => {
    if (!isAuthenticated && !authLoading) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await apiRequest("GET", "/api/recordings");

        if (res.ok) {
          const recordings = await res.json();

          // Process recordings to extract relevant data and calculate scores
          const processedRecordings = recordings.map((recording: Recording) => {
            // Extract score from analysis
            let score = 0;
            let leaderMatch = "";

            if (recording.analysisResult) {
              try {
                const analysis =
                  typeof recording.analysisResult === "string"
                    ? JSON.parse(recording.analysisResult)
                    : recording.analysisResult;

                // Get score from analysis if available
                if (analysis.overview?.score !== undefined) {
                  score = analysis.overview.score;
                } else {
                  console.warn(
                    `No score found for recording ${recording.id}, using 0`,
                  );
                }

                // Get leader match if available
                if (
                  analysis.leadershipInsights &&
                  analysis.leadershipInsights.length > 0
                ) {
                  leaderMatch = analysis.leadershipInsights[0].leaderName;
                }
              } catch (e) {
                console.error("Error parsing analysis result:", e);
              }
            }

            return {
              id: recording.id,
              title: recording.title || `Recording ${recording.id}`,
              date: recording.recordedAt
                ? new Date(recording.recordedAt).toISOString()
                : new Date().toISOString(),
              score,
              leaderMatch,
            };
          });

          // Sort by date (newest first)
          processedRecordings.sort(
            (a: RecordingWithScore, b: RecordingWithScore) =>
              new Date(b.date).getTime() - new Date(a.date).getTime(),
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
          const last7Days = processedRecordings.filter(
            (r: RecordingWithScore) => new Date(r.date) >= sevenDaysAgo,
          );
          const last30Days = processedRecordings.filter(
            (r: RecordingWithScore) => new Date(r.date) >= thirtyDaysAgo,
          );
          const thisYear = processedRecordings.filter(
            (r: RecordingWithScore) => new Date(r.date) >= startOfYear,
          );
          const allTime = processedRecordings;

          // Calculate average scores and improvements for each time range
          const calculateAvgAndImprovement = (
            recordings: RecordingWithScore[],
          ): { averageScore: number; improvement: number } => {
            if (recordings.length === 0)
              return { averageScore: 0, improvement: 0 };

            const averageScore =
              recordings.reduce((sum, r) => sum + r.score, 0) /
              recordings.length;

            // If we have at least 2 recordings, calculate improvement from first to last
            if (recordings.length >= 2) {
              // Sort by date (oldest to newest)
              const sorted = [...recordings].sort(
                (a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime(),
              );

              // Calculate average of first 30% and last 30% of recordings
              const firstThirdCount = Math.max(
                1,
                Math.floor(sorted.length * 0.3),
              );
              const lastThirdCount = Math.max(
                1,
                Math.floor(sorted.length * 0.3),
              );

              const firstThird = sorted.slice(0, firstThirdCount);
              const lastThird = sorted.slice(sorted.length - lastThirdCount);

              const firstAvg =
                firstThird.reduce((sum, r) => sum + r.score, 0) /
                firstThird.length;
              const lastAvg =
                lastThird.reduce((sum, r) => sum + r.score, 0) /
                lastThird.length;

              const improvement =
                firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0;

              return { averageScore, improvement };
            }

            return { averageScore, improvement: 0 };
          };

          setTimeRanges([
            {
              label: "Last 7 days",
              recordings: last7Days,
              ...calculateAvgAndImprovement(last7Days),
            },
            {
              label: "Last 30 days",
              recordings: last30Days,
              ...calculateAvgAndImprovement(last30Days),
            },
            {
              label: "This year",
              recordings: thisYear,
              ...calculateAvgAndImprovement(thisYear),
            },
            {
              label: "All time",
              recordings: allTime,
              ...calculateAvgAndImprovement(allTime),
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching recording data:", error);
        toast({
          title: "Error",
          description: "Failed to load your progress data. Please try again.",
          variant: "destructive",
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
    let periodBoundaries: { start: Date; end: Date; label: string }[] = [];

    // Filter by time range and determine appropriate periods
    if (timeBasedView === "week") {
      // Last 7 days - one bar per day
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      filteredRecordings = allRecordings.filter(
        (r) => new Date(r.date) >= sevenDaysAgo,
      );

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

        const formatter = new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        periodBoundaries.push({
          start: startDate,
          end: endDate,
          label: formatter.format(date),
        });
      }
    } else if (timeBasedView === "month") {
      // Last 30 days - group into 10 three-day chunks
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      filteredRecordings = allRecordings.filter(
        (r) => new Date(r.date) >= thirtyDaysAgo,
      );

      // Create 10 three-day chunks
      for (let i = 9; i >= 0; i--) {
        const endDate = new Date();
        endDate.setDate(now.getDate() - i * 3);

        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 2);
        startDate.setHours(0, 0, 0, 0);

        endDate.setHours(23, 59, 59, 999);

        const startFormatter = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        });
        const endFormatter = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        });

        const label = `${startFormatter.format(startDate)} - ${endFormatter.format(endDate)}`;
        periodBoundaries.push({ start: startDate, end: endDate, label });
      }
    } else if (timeBasedView === "quarter") {
      // Last 90 days - group into 13 weekly chunks
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(now.getDate() - 90);
      filteredRecordings = allRecordings.filter(
        (r) => new Date(r.date) >= ninetyDaysAgo,
      );

      // Create 13 weekly entries
      for (let i = 12; i >= 0; i--) {
        const endDate = new Date();
        endDate.setDate(now.getDate() - i * 7);

        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);

        endDate.setHours(23, 59, 59, 999);

        const startFormatter = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        });
        const endFormatter = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        });

        const label = `${startFormatter.format(startDate)} - ${endFormatter.format(endDate)}`;
        periodBoundaries.push({ start: startDate, end: endDate, label });
      }
    } else if (timeBasedView === "year") {
      // Last 365 days - group by calendar month
      const yearAgo = new Date(now);
      yearAgo.setDate(now.getDate() - 365);
      filteredRecordings = allRecordings.filter(
        (r) => new Date(r.date) >= yearAgo,
      );

      // Create 12 monthly entries - current month and previous 11 months
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
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
        const dates = filteredRecordings.map((r) => new Date(r.date));
        const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));

        let year = minDate.getFullYear();
        let month = minDate.getMonth();

        while (new Date(year, month, 1) <= now) {
          const startDate = new Date(year, month, 1);
          const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

          const formatter = new Intl.DateTimeFormat("en-US", {
            month: "short",
            year: "numeric",
          });
          periodBoundaries.push({
            start: startDate,
            end: endDate,
            label: formatter.format(startDate),
          });

          month++;
          if (month > 11) {
            month = 0;
            year++;
          }
        }
      }
    }

    if (filteredRecordings.length === 0 || periodBoundaries.length === 0)
      return [];

    // Aggregate recordings into the defined periods
    const result = periodBoundaries.map((period) => {
      const recordingsInPeriod = filteredRecordings.filter((recording) => {
        const recordingDate = new Date(recording.date);
        return recordingDate >= period.start && recordingDate <= period.end;
      });

      const scores = recordingsInPeriod.map((rec) => rec.score);
      // For display purposes, we'll use 0 for empty periods instead of null
      // but track that this is an empty period with a separate property
      const avgScore =
        scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : 0;

      return {
        period: period.label,
        date: period.start,
        score: avgScore,
        count: recordingsInPeriod.length,
        isEmpty: recordingsInPeriod.length === 0,
      };
    });

    return result;
  };

  // Get week number for a date (ISO week number)
  const getWeekNumber = (date: Date): number => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return weekNumber;
  };

  // Format week as "Week N, YYYY"
  const formatWeek = (date: Date): string => {
    const weekNumber = getWeekNumber(date);
    return `Week ${weekNumber}, ${date.getFullYear()}`;
  };

  // Get recording-based chart data
  const getRecordingsChartData = () => {
    if (allRecordings.length === 0) return [];

    // Sort by date (oldest to newest)
    const sortedRecordings = [...allRecordings].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Get the last N recordings
    const lastNRecordings = sortedRecordings.slice(-recordingsCount);

    return lastNRecordings.map((recording, index) => ({
      index: index + 1,
      name:
        recording.title.length > 15
          ? recording.title.substring(0, 15) + "..."
          : recording.title,
      score: recording.score,
      date: formatDate(recording.date),
      fullTitle: recording.title,
      leaderMatch: recording.leaderMatch || "Unknown",
    }));
  };

  if (isLoading || authLoading) {
    return (
      <AppLayout 
        showBackButton 
        backTo="/dashboard" 
        backLabel="Back to Dashboard"
        pageTitle="Your Progress"
      >
        <div className="flex items-center justify-center h-96">
          <Skeleton className="w-full h-80" />
        </div>
      </AppLayout>
    );
  }

  const timeBasedChartData = getTimeBasedChartData();
  const recordingsChartData = getRecordingsChartData();

  return (
    <AppLayout 
      showBackButton 
      backTo="/dashboard" 
      backLabel="Back to Dashboard"
      pageTitle="Your Progress"
    >
      <p className="card-description mb-8">
        Track your communication improvement over time
      </p>

      <div className="grid grid-cols-1 gap-8">
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
                    value as "week" | "month" | "quarter" | "year" | "alltime",
                  )
                }
              >
                <SelectTrigger className="w-48">
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
            </div>
          </CardHeader>
          <CardContent>
            {timeBasedChartData.length > 0 ? (
              <div className="w-full h-[400px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timeBasedChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 50,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis
                      dataKey="period"
                      label={{
                        value: "Time Period",
                        position: "insideBottom",
                        offset: -10,
                        style: {
                          textAnchor: "middle",
                          fontSize: 12,
                          fill: "#ffffff",
                          fontWeight: 500,
                          dy: 10,
                        },
                      }}
                      tick={{ fontSize: 10, fill: "#ffffff" }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      domain={[0, 100]}
                      label={{
                        value: "Score",
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          textAnchor: "middle",
                          fontSize: 12,
                          fill: "#ffffff",
                          fontWeight: 500,
                          dx: -10,
                        },
                      }}
                      tick={{ fontSize: 10, fill: "#ffffff" }}
                      ticks={[0, 20, 40, 60, 80, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                        color: "#000000",
                        fontSize: "12px",
                        fontWeight: "500"
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === "score") return [`Score: ${value.toFixed(1)}`, "Score"];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Period: ${label}`}
                    />
                    <Bar dataKey="score" name="Score">
                      {timeBasedChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.isEmpty
                              ? "#D1D5DB" // Gray for empty periods
                              : getScoreColor(entry.score)
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 card-description">
                No recordings available for this time period.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Recordings Progress */}
        <Card>
          <CardHeader>
            <div className="w-full mb-4">
              <CardTitle className="text-xl">Recent Recordings</CardTitle>
              <CardDescription>
                Your progress across your most recent recordings
              </CardDescription>
            </div>
            <div className="flex justify-end">
              <Select
                value={recordingsCount.toString()}
                onValueChange={(value) =>
                  setRecordingsCount(parseInt(value) as 10 | 20 | 50)
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Number of recordings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Last 10 recordings</SelectItem>
                  <SelectItem value="20">Last 20 recordings</SelectItem>
                  <SelectItem value="50">Last 50 recordings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {recordingsChartData.length > 0 ? (
              <div className="w-full h-[400px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={recordingsChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 50,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis
                      dataKey="index"
                      label={{
                        value: "Recording Number",
                        position: "insideBottom",
                        offset: -10,
                        style: {
                          textAnchor: "middle",
                          fontSize: 12,
                          fill: "#ffffff",
                          fontWeight: 500,
                          dy: 10,
                        },
                      }}
                      tick={{ fontSize: 10, fill: "#ffffff" }}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      label={{
                        value: "Score",
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          textAnchor: "middle",
                          fontSize: 12,
                          fill: "#ffffff",
                          fontWeight: 500,
                          dx: -10,
                        },
                      }}
                      tick={{ fontSize: 10, fill: "#ffffff" }}
                      ticks={[0, 20, 40, 60, 80, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                        color: "#000000",
                        fontSize: "12px",
                        fontWeight: "500"
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === "score") return [`Score: ${value.toFixed(1)}`, "Score"];
                        return [value, name];
                      }}
                      labelFormatter={(index, data) => {
                        const record = data[0]?.payload;
                        return record
                          ? `${record.fullTitle} (${record.date})`
                          : `Recording ${index}`;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Score"
                      stroke="#3B82F6"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 card-description">
                No recordings available yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="w-full">
          <H2 className="mb-6">Time Period Breakdown</H2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {timeRanges.map((range) => (
              <Card key={range.label}>
                <CardHeader>
                  <CardTitle className="text-lg">{range.label}</CardTitle>
                  <CardDescription>
                    {range.recordings.length} recording
                    {range.recordings.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="card-description">Average score:</span>
                      <span className="font-medium">
                        {range.averageScore.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="card-description">Improvement:</span>
                      <span
                        className={
                          range.improvement > 0
                            ? "text-green-600 font-medium"
                            : range.improvement < 0
                            ? "text-red-600 font-medium"
                            : "font-medium"
                        }
                      >
                        {range.improvement === 0
                          ? "N/A"
                          : `${range.improvement > 0 ? "+" : ""}${range.improvement.toFixed(
                              1,
                            )}%`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}