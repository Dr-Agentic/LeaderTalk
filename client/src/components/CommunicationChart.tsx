import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommunicationChart({ data, loading }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (loading || !data || !data.length || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw horizontal lines
    const midY = canvas.height / 2;
    const posY = canvas.height / 4;
    const negY = canvas.height * 3 / 4;
    
    // Draw lines
    ctx.strokeStyle = '#e5e7eb'; // gray-200
    ctx.lineWidth = 1;
    
    // Draw positive line
    ctx.beginPath();
    ctx.moveTo(0, posY);
    ctx.lineTo(canvas.width, posY);
    ctx.stroke();
    
    // Draw neutral line
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(canvas.width, midY);
    ctx.stroke();
    
    // Draw negative line
    ctx.beginPath();
    ctx.moveTo(0, negY);
    ctx.lineTo(canvas.width, negY);
    ctx.stroke();
    
    // Add labels
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#16a34a'; // green-600
    ctx.fillText('Positive', 4, posY - 8);
    
    ctx.fillStyle = '#6b7280'; // gray-500
    ctx.fillText('Neutral', 4, midY - 4);
    
    ctx.fillStyle = '#dc2626'; // red-600
    ctx.fillText('Negative', 4, negY - 4);
    
    // Process data for drawing
    const maxTime = data[data.length - 1].timestamp;
    const points = data.map(point => ({
      x: (point.timestamp / maxTime) * canvas.width,
      y: mapValueToY(point.value, canvas.height),
      type: point.type
    }));
    
    // Draw line connecting points
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      // Create smooth curves
      if (i < points.length - 1) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      } else {
        // Last point
        ctx.lineTo(points[i].x, points[i].y);
      }
    }
    
    ctx.strokeStyle = '#3b82f6'; // primary blue
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw points
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      
      switch (point.type) {
        case 'positive':
          ctx.fillStyle = '#10b981'; // green-500
          break;
        case 'negative':
          ctx.fillStyle = '#ef4444'; // red-500
          break;
        case 'passive':
          ctx.fillStyle = '#f59e0b'; // amber-500
          break;
        default:
          ctx.fillStyle = '#6b7280'; // gray-500
      }
      
      ctx.fill();
    });
    
    // Draw time markers at bottom
    const timeLabels = 5;
    ctx.fillStyle = '#9ca3af'; // gray-400
    ctx.font = '10px Inter, sans-serif';
    
    for (let i = 0; i < timeLabels; i++) {
      const x = (canvas.width / (timeLabels - 1)) * i;
      const time = formatTime((maxTime / (timeLabels - 1)) * i);
      ctx.fillText(time, x - 10, canvas.height - 4);
    }
    
  }, [data, loading]);
  
  // Helper function to map value (-1 to 1) to Y coordinate
  const mapValueToY = (value, height) => {
    // Map value from -1..1 to height..0 (reverse Y-axis)
    return height * (1 - (value + 1) / 2);
  };
  
  // Format time in MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-sm text-gray-500 mb-4">Communication Analysis</div>
          <Skeleton className="h-32 w-full" />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-sm text-gray-500 mb-4">Communication Analysis</div>
          <div className="h-32 flex items-center justify-center text-gray-400">
            No analysis data available
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center text-sm text-gray-500 mb-4">Communication Analysis</div>
        <div className="relative h-32">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </CardContent>
    </Card>
  );
}
