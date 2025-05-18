import { useState } from "react";
import { Link } from "wouter";
import CommunicationChart from "@/components/CommunicationChart";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H2 } from "@/components/ui/typography";
import { Lightbulb, CheckCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AnalysisDisplay({ recording, leaders }) {
  const [activeTab, setActiveTab] = useState("positive");
  
  if (!recording || !recording.analysisResult) {
    return null;
  }
  
  const { title, recordedAt, duration, analysisResult } = recording;
  const { 
    timeline, 
    positiveInstances, 
    negativeInstances, 
    passiveInstances,
    leadershipInsights,
    overview
  } = analysisResult;
  
  // Format recording date
  const formattedDate = formatDistanceToNow(new Date(recordedAt), { addSuffix: true });
  
  // Format duration
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const formattedDuration = `${minutes} minute${minutes !== 1 ? 's' : ''}${seconds > 0 ? ` ${seconds} second${seconds !== 1 ? 's' : ''}` : ''}`;
  
  // Get leader information for insights
  const getLeaderById = (leaderId) => {
    if (!leaders) return null;
    return leaders.find(leader => leader.id === leaderId);
  };
  
  return (
    <div className="mt-8">
      <H2>Last Analysis</H2>
      
      <Card className="mt-4">
        <CardHeader className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <CardTitle className="text-lg leading-6 font-medium text-gray-900">{title}</CardTitle>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Recorded {formattedDate} ({formattedDuration})
            </p>
          </div>
          <Badge variant="outline" className={`
            px-2 mt-2 sm:mt-0 inline-flex text-xs leading-5 font-semibold rounded-full
            ${overview.rating === "Good" ? "bg-green-100 text-green-800" : 
              overview.rating === "Average" ? "bg-yellow-100 text-yellow-800" : 
              "bg-red-100 text-red-800"}
          `}>
            {overview.rating} overall
          </Badge>
        </CardHeader>
        
        <CardContent className="px-4 py-5 sm:p-6">
          {/* Communication Analysis Chart */}
          <CommunicationChart data={timeline} loading={false} />
          
          {/* Key Insights */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="positive" className="text-sm">Positive Moments</TabsTrigger>
              <TabsTrigger value="improve" className="text-sm">Areas for Improvement</TabsTrigger>
              <TabsTrigger value="leadership" className="text-sm">Leadership Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="positive" className="mt-4">
              <Card className="bg-green-50 border border-green-100">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-green-800 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Positive Moments
                  </h4>
                  {positiveInstances && positiveInstances.length > 0 ? (
                    <ul className="mt-2 text-sm text-green-700 space-y-1">
                      {positiveInstances.map((instance, index) => (
                        <li key={index} className="flex items-start">
                          <span className="flex-shrink-0 text-xs mr-1.5">
                            {formatTimestamp(instance.timestamp)} -
                          </span>
                          <span>{instance.analysis}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-green-700">No positive moments identified.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="improve" className="mt-4">
              <Card className="bg-red-50 border border-red-100">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-red-800 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Areas for Improvement
                  </h4>
                  {negativeInstances && negativeInstances.length > 0 ? (
                    <ul className="mt-2 text-sm text-red-700 space-y-1">
                      {negativeInstances.map((instance, index) => (
                        <li key={index} className="flex items-start">
                          <span className="flex-shrink-0 text-xs mr-1.5">
                            {formatTimestamp(instance.timestamp)} -
                          </span>
                          <span>{instance.analysis}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-red-700">No areas for improvement identified.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="leadership" className="mt-4">
              <Card className="bg-blue-50 border border-blue-100">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-blue-800 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Leadership Insights
                  </h4>
                  
                  {leadershipInsights && leadershipInsights.length > 0 ? (
                    <div className="mt-2 text-sm text-blue-700">
                      {leadershipInsights.map((insight, index) => {
                        const leader = getLeaderById(insight.leaderId);
                        return (
                          <div key={index} className="mb-2">
                            <p className="font-medium">{leader?.name || insight.leaderName} would have:</p>
                            <p className="mt-1 text-xs">{insight.advice}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-blue-700">No leadership insights available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="px-4 py-4 sm:px-6 bg-gray-50 flex justify-between">
          <Link href={`/transcript/${recording.id}`} className="text-sm font-medium text-primary hover:text-blue-900">
            View transcript
          </Link>
          <div className="flex space-x-4">
            <Link href={`/transcript/${recording.id}`} className="text-sm font-medium text-gray-500 hover:text-gray-700">
              Detailed analysis
            </Link>
            <span className="text-sm font-medium text-gray-400">
              Practice exercises (Coming soon)
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// Helper function to format timestamp as MM:SS
function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
