import { useState, useEffect } from 'react';
import { getLogs, clearLogs, LogEntry } from '@/lib/debugLogger';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, RefreshCw, Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DebugLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { toast } = useToast();
  
  // Load logs on mount
  useEffect(() => {
    loadLogs();
  }, []);
  
  // Refresh logs
  const loadLogs = () => {
    setLogs(getLogs());
  };
  
  // Clear logs
  const handleClearLogs = () => {
    clearLogs();
    setLogs([]);
    toast({
      title: "Logs cleared",
      description: "Debug logs have been cleared"
    });
  };
  
  // Copy logs to clipboard
  const handleCopyLogs = () => {
    const logText = logs.map(log => 
      `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] ${log.message} ${log.details ? JSON.stringify(log.details) : ''}`
    ).join('\n');
    
    navigator.clipboard.writeText(logText).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Debug logs have been copied to clipboard"
      });
    });
  };
  
  // Download logs as file
  const handleDownloadLogs = () => {
    const logText = logs.map(log => 
      `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] ${log.message} ${log.details ? JSON.stringify(log.details) : ''}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leadertalk-debug-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Get badge variant based on log level
  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'error': return "destructive";
      case 'warn': return "outline"; // Change from "warning" to "outline" as it's supported
      case 'debug': return "outline";
      default: return "secondary";
    }
  };
  
  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Debug Logs</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={loadLogs}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button size="sm" variant="outline" onClick={handleCopyLogs}>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownloadLogs}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button size="sm" variant="destructive" onClick={handleClearLogs}>
                <X className="h-4 w-4 mr-1" />
                Clear Logs
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Client-side logs that persist across page refreshes. Useful for debugging authentication issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-250px)] border rounded-md p-4 bg-muted/20">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No logs available
              </div>
            ) : (
              <div className="space-y-3 font-mono text-sm">
                {logs.map((log, index) => (
                  <div key={index} className="border-b pb-2 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={getBadgeVariant(log.level)}>
                        {log.level.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="font-semibold mt-1">{log.message}</div>
                    {log.details && (
                      <pre className="text-xs mt-1 bg-muted p-2 rounded overflow-x-auto">
                        {typeof log.details === 'string' 
                          ? log.details 
                          : JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {logs.length} log entries
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}