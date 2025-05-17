import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, DownloadCloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import { Progress } from "@/components/ui/progress";

interface PerformanceSnapshotProps {
  timeBasedChartRef: React.RefObject<HTMLDivElement>;
  recordingsChartRef: React.RefObject<HTMLDivElement>;
  chartDataReady: boolean;
  userName?: string;
}

export default function PerformanceSnapshotGenerator({
  timeBasedChartRef,
  recordingsChartRef,
  chartDataReady,
  userName
}: PerformanceSnapshotProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const generateSnapshot = async () => {
    if (!chartDataReady || !timeBasedChartRef.current || !recordingsChartRef.current) {
      toast({
        title: "Cannot generate snapshot",
        description: "Chart data is not loaded yet or chart elements aren't available.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      setProgress(10);

      // Create a new canvas element for the combined snapshot
      const snapshotCanvas = document.createElement("canvas");
      const ctx = snapshotCanvas.getContext("2d");
      
      if (!ctx) {
        throw new Error("Unable to get canvas context");
      }

      // Capture time-based chart
      setProgress(20);
      const timeBasedCanvas = await html2canvas(timeBasedChartRef.current, {
        scale: 2, // Higher resolution
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      setProgress(50);
      
      // Capture recordings chart
      const recordingsCanvas = await html2canvas(recordingsChartRef.current, {
        scale: 2, // Higher resolution
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      setProgress(80);
      
      // Set the size of the combined canvas
      const padding = 40;
      const headerHeight = 60;
      const spacing = 20;
      
      // Calculate total width/height needed
      const maxWidth = Math.max(timeBasedCanvas.width, recordingsCanvas.width);
      const totalHeight = headerHeight + timeBasedCanvas.height + spacing + recordingsCanvas.height + (padding * 2);
      
      snapshotCanvas.width = maxWidth + (padding * 2);
      snapshotCanvas.height = totalHeight;
      
      // Fill with white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, snapshotCanvas.width, snapshotCanvas.height);
      
      // Add header with user name and date
      ctx.fillStyle = "#000000";
      ctx.font = "bold 24px Arial";
      const title = `${userName || 'User'}'s Leadership Progress`;
      ctx.fillText(title, padding, padding + 24);
      
      ctx.font = "16px Arial";
      const dateText = `Generated on ${new Date().toLocaleDateString()}`;
      ctx.fillText(dateText, padding, padding + 50);
      
      // Draw time-based chart
      ctx.drawImage(
        timeBasedCanvas, 
        padding, 
        headerHeight + padding
      );
      
      // Draw recordings chart
      ctx.drawImage(
        recordingsCanvas, 
        padding, 
        headerHeight + padding + timeBasedCanvas.height + spacing
      );
      
      // Convert to image and trigger download
      const imageUrl = snapshotCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `leadership-progress-${new Date().toISOString().split('T')[0]}.png`;
      link.href = imageUrl;
      link.click();
      
      setProgress(100);
      
      toast({
        title: "Snapshot generated",
        description: "Your performance snapshot has been downloaded.",
      });
    } catch (error) {
      console.error("Error generating snapshot:", error);
      toast({
        title: "Error generating snapshot",
        description: "There was a problem creating your snapshot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
      }, 1000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Snapshot</CardTitle>
        <CardDescription>
          Generate a shareable image of your leadership progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a snapshot of your current progress charts to save, share, or include in your reports.
          </p>
          
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Generating your snapshot...
              </p>
            </div>
          )}
          
          <Button 
            onClick={generateSnapshot} 
            disabled={isGenerating || !chartDataReady}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <DownloadCloud className="mr-2 h-4 w-4" />
                Generate Snapshot
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}