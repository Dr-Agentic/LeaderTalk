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
import { BackButton } from "@/components/BackButton";
import { formatDistanceToNow } from "date-fns";

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
    <div className="container mx-auto px-4 py-8">
      <BackButton to="/dashboard" label="Back to Dashboard" />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">All Transcripts</h1>
          <p className="text-muted-foreground">
            {recordings?.length || 0} recording{recordings?.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      <div className="grid gap-4 mb-6 md:grid-cols-[1fr_200px]">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="positive">Positive</TabsTrigger>
          <TabsTrigger value="needs-improvement">Needs Improvement</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
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
        </TabsContent>
        
        <TabsContent value="positive" className="space-y-4">
          {isLoading ? (
            <TranscriptsSkeleton />
          ) : filteredAndSortedRecordings.filter(r => 
              r.analysisResult?.overview?.rating === "Good" || 
              r.analysisResult?.overview?.score > 0.65
            ).length > 0 ? (
            filteredAndSortedRecordings
              .filter(r => 
                r.analysisResult?.overview?.rating === "Good" || 
                r.analysisResult?.overview?.score > 0.65
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
        </TabsContent>
        
        <TabsContent value="needs-improvement" className="space-y-4">
          {isLoading ? (
            <TranscriptsSkeleton />
          ) : filteredAndSortedRecordings.filter(r => 
              r.analysisResult?.overview?.rating === "Poor" || 
              r.analysisResult?.overview?.score < 0.5
            ).length > 0 ? (
            filteredAndSortedRecordings
              .filter(r => 
                r.analysisResult?.overview?.rating === "Poor" || 
                r.analysisResult?.overview?.score < 0.5
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
        </TabsContent>
      </Tabs>
    </div>
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
  // Format recording date
  const formattedDate = formatDistanceToNow(new Date(recording.recordedAt), { addSuffix: true });
  
  // Format duration
  const minutes = Math.floor(recording.duration / 60);
  const seconds = recording.duration % 60;
  const formattedDuration = `${minutes}m${seconds > 0 ? ` ${seconds}s` : ''}`;
  
  // Determine rating badge color and text
  const rating = recording.analysisResult?.overview?.rating || "N/A";
  const score = recording.analysisResult?.overview?.score || 0;
  
  const ratingColor = 
    rating === "Good" || score > 0.65 ? "bg-green-100 text-green-800 border-green-200" :
    rating === "Average" || (score >= 0.5 && score <= 0.65) ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
    "bg-red-100 text-red-800 border-red-200";
  
  // Count positive and negative instances
  const positiveCount = recording.analysisResult?.positiveInstances?.length || 0;
  const negativeCount = recording.analysisResult?.negativeInstances?.length || 0;
  
  return (
    <Card>
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
            {rating} {score > 0 && `(${Math.round(score * 100)}%)`}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <ThumbsUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-sm">
              {positiveCount} positive moment{positiveCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center">
            <ThumbsDown className="h-4 w-4 text-red-600 mr-1" />
            <span className="text-sm">
              {negativeCount} negative moment{negativeCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        {recording.transcription && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {recording.transcription.substring(0, 150)}
              {recording.transcription.length > 150 ? '...' : ''}
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-muted/50 flex justify-between">
        <Link 
          href={`/transcript/${recording.id}`} 
          className="text-sm font-medium text-primary hover:text-primary/80 flex items-center"
        >
          View transcript
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </CardFooter>
    </Card>
  );
}

// Skeleton loader
function TranscriptsSkeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <Card key={i} className="overflow-hidden">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6 mb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-12 w-full" />
          </CardContent>
          <div className="p-4 bg-muted/50">
            <Skeleton className="h-4 w-28" />
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
        <Filter className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">No recordings found</h3>
      <p className="text-muted-foreground mt-1">
        {query ? (
          <>No results match your search for "{query}"</>
        ) : filter ? (
          <>No {filter} recordings found</>
        ) : (
          <>You haven't recorded any conversations yet</>
        )}
      </p>
      
      <BackButton to="/dashboard" label="Back to Dashboard" className="mt-4 mx-auto" />
    </div>
  );
}