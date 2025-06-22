import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  CalendarDays, 
  Clock, 
  ChevronRight, 
  ThumbsUp, 
  ThumbsDown, 
  SortAsc, 
  Filter, 
  Search
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AppLayout from "@/components/AppLayout";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Recording } from "../../../shared/schema";

type SortOption = "date-desc" | "date-asc" | "rating-desc" | "rating-asc";

export default function AllTranscripts() {
  const [, navigate] = useLocation();
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all recordings
  const { data: recordings, isLoading } = useQuery<Recording[]>({
    queryKey: ['/api/recordings'],
    refetchOnWindowFocus: false
  });
  
  // Sort and filter recordings
  const filteredAndSortedRecordings = recordings 
    ? getFilteredAndSortedRecordings(recordings, sortBy, searchQuery)
    : [];
  
  return (
    <AppLayout
      showBackButton
      backTo="/dashboard"
      backLabel="Back to Dashboard"
      pageTitle="All Transcripts"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <p className="card-description">
            {recordings?.length || 0} recording{recordings?.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      <div className="grid gap-4 mb-6 md:grid-cols-[1fr_200px]">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 card-description" />
          <Input
            placeholder="Search by title or content..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select 
          value={sortBy} 
          onValueChange={(value) => setSortBy(value as SortOption)}
        >
          <SelectTrigger>
            <div className="flex items-center">
              <SortAsc className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Newest first</SelectItem>
            <SelectItem value="date-asc">Oldest first</SelectItem>
            <SelectItem value="rating-desc">Highest rated first</SelectItem>
            <SelectItem value="rating-asc">Lowest rated first</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Tabs defaultValue="all" className="w-full bg-transparent">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="positive">Positive</TabsTrigger>
          <TabsTrigger value="needs-improvement">Needs Improvement</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="glass-card mt-6">
          <div className="flex-column">
            {isLoading ? (
              <TranscriptsSkeleton />
            ) : filteredAndSortedRecordings.length > 0 ? (
              filteredAndSortedRecordings.map(recording => (
                <TranscriptCard 
                  key={recording.id} 
                  recording={recording} 
                />
              ))
            ) : (
              <EmptyState query={searchQuery} />
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="positive" className="glass-card mt-6">
          <div className="flex-column">
            {isLoading ? (
              <TranscriptsSkeleton />
            ) : filteredAndSortedRecordings.filter(r => 
                r.analysisResult?.overview?.rating === "Good" || 
                (r.analysisResult?.overview?.score && r.analysisResult?.overview?.score > 65)
              ).length > 0 ? (
              filteredAndSortedRecordings
                .filter(r => 
                  r.analysisResult?.overview?.rating === "Good" || 
                  (r.analysisResult?.overview?.score && r.analysisResult?.overview?.score > 65)
                )
                .map(recording => (
                  <TranscriptCard 
                    key={recording.id} 
                    recording={recording} 
                  />
                ))
            ) : (
              <EmptyState filter="positive" query={searchQuery} />
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="needs-improvement" className="glass-card mt-6">
          <div className="flex-column">
            {isLoading ? (
              <TranscriptsSkeleton />
            ) : filteredAndSortedRecordings.filter(r => 
                r.analysisResult?.overview?.rating === "Poor" || 
                r.analysisResult?.overview?.rating === "Needs improvement" ||
                (r.analysisResult?.overview?.score !== undefined && r.analysisResult?.overview?.score < 50)
              ).length > 0 ? (
              filteredAndSortedRecordings
                .filter(r => 
                  r.analysisResult?.overview?.rating === "Poor" || 
                  r.analysisResult?.overview?.rating === "Needs improvement" ||
                  (r.analysisResult?.overview?.score !== undefined && r.analysisResult?.overview?.score < 50)
                )
                .map(recording => (
                  <TranscriptCard 
                    key={recording.id} 
                    recording={recording} 
                  />
                ))
            ) : (
              <EmptyState filter="needs improvement" query={searchQuery} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

// Helper function to sort and filter recordings
function getFilteredAndSortedRecordings(
  recordings: Recording[], 
  sortBy: SortOption,
  searchQuery: string
): Recording[] {
  // First filter based on search query
  let filtered = recordings;
  
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = recordings.filter(recording => 
      recording.title.toLowerCase().includes(query) ||
      (recording.transcription && recording.transcription.toLowerCase().includes(query))
    );
  }
  
  // Then sort based on sortBy parameter
  return [...filtered].sort((a, b) => {
    switch(sortBy) {
      case "date-desc":
        return new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime();
      case "date-asc":
        return new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime();
      case "rating-desc":
        const scoreA = a.analysisResult?.overview?.score || 0;
        const scoreB = b.analysisResult?.overview?.score || 0;
        return scoreB - scoreA;
      case "rating-asc":
        const scoreC = a.analysisResult?.overview?.score || 0;
        const scoreD = b.analysisResult?.overview?.score || 0;
        return scoreC - scoreD;
      default:
        return 0;
    }
  });
}

// Card component for each transcript
function TranscriptCard({ recording }: { recording: Recording }) {
  try {
    console.log("TranscriptCard start for recording:", recording.id);
    
    // Format recording date
    const formattedDate = formatDistanceToNow(new Date(recording.recordedAt), { addSuffix: true });
    
    // Format duration
    const minutes = Math.floor(recording.duration / 60);
    const seconds = recording.duration % 60;
    const formattedDuration = `${minutes}m${seconds > 0 ? ` ${seconds}s` : ''}`;
    
    // Determine rating badge color and text
    const rating = recording.analysisResult?.overview?.rating || "N/A";
    const score = recording.analysisResult?.overview?.score || 0;
    
    // Calculate star rating (1-5 scale)
    // Score from server is 0-100, convert to 1-5 stars
    const normalizedScore = score / 20; // Convert 0-100 to 0-5
    const starRating = Math.max(1, Math.min(5, Math.round(normalizedScore)));
    
    const ratingColor = 
      rating === "Good" || score > 65 ? "bg-green-500/20 text-green-300 border-green-500/30" :
      rating === "Average" || (score >= 50 && score <= 65) ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
      "bg-red-500/20 text-red-300 border-red-500/30";
    
    // Count positive and negative instances
    const positiveCount = recording.analysisResult?.positiveInstances?.length || 0;
    const negativeCount = recording.analysisResult?.negativeInstances?.length || 0;
    
    console.log("About to render JSX for recording:", recording.id);
    
    return (
      <Card className="glass-card-opaque">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
            <div>
              <CardTitle>{recording.title}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <CalendarDays className="h-4 w-4 mr-1" /> 
                {formattedDate}
                <span className="mx-2">•</span>
                <Clock className="h-4 w-4 mr-1" /> 
                {formattedDuration}
              </CardDescription>
            </div>
            
            <Badge 
              variant="outline" 
              className={`mt-2 md:mt-0 ${ratingColor}`}
            >
              {rating} {score > 0 && (
                <span className="ml-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < starRating ? "text-yellow-400" : "text-gray-600"}>★</span>
                  ))}
                </span>
              )}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <ThumbsUp className="h-4 w-4 text-green-400 mr-1" />
              <span className="text-sm text-foreground">
                {positiveCount} positive moment{positiveCount !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center">
              <ThumbsDown className="h-4 w-4 text-red-400 mr-1" />
              <span className="text-sm text-foreground">
                {negativeCount} negative moment{negativeCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          {recording.transcription && (
            <div className="mt-4">
              <p className="text-sm card-description line-clamp-2">
                {recording.transcription.substring(0, 150)}
                {recording.transcription.length > 150 ? '...' : ''}
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="bg-transparent flex justify-between">
          <Link href={`/transcript/${recording.id}`}>
            <Button 
              variant="link"
              className="text-sm font-medium card-title hover:text-purple-300 flex items-center p-0"
            >
              View transcript
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  } catch (error) {
    console.error("TranscriptCard error:", error);
    return <div>Error rendering card</div>;
  }
}

// Skeleton loader
function TranscriptsSkeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <Card key={i} className="glass-card overflow-hidden">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Skeleton className="h-4 w-48 mb-2 bg-white/10" />
                <Skeleton className="h-3 w-32 bg-white/10" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full bg-white/10" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6 mb-4">
              <Skeleton className="h-4 w-24 bg-white/10" />
              <Skeleton className="h-4 w-24 bg-white/10" />
            </div>
            <Skeleton className="h-12 w-full bg-white/10" />
          </CardContent>
          <div className="p-4 bg-white/5">
            <Skeleton className="h-4 w-28 bg-white/10" />
          </div>
        </Card>
      ))}
    </>
  );
}

// Empty state component
function EmptyState({ filter, query }: { filter?: string, query?: string }) {
  return (
    <div className="py-12 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
        <Filter className="h-6 w-6 card-description" />
      </div>
      <h3 className="text-lg font-medium text-foreground">No recordings found</h3>
      <p className="card-description mt-1">
        {query ? (
          <>No results match your search for "{query}"</>
        ) : filter ? (
          <>No {filter} recordings found</>
        ) : (
          <>You haven't recorded any conversations yet</>
        )}
      </p>
      
      <Link href="/dashboard">
        <Button variant="outline" className="mt-4 mx-auto">Back to Dashboard</Button>
      </Link>
    </div>
  );
}