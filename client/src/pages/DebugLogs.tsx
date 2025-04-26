import { useState, useEffect } from 'react';
import { getLogs, clearLogs, LogEntry, logInfo } from '@/lib/debugLogger';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  RefreshCw, 
  Copy, 
  Download, 
  Filter, 
  AlertTriangle, 
  Info, 
  Bug,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';

export default function DebugLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const { toast } = useToast();
  
  // Load logs on mount
  useEffect(() => {
    loadLogs();
    checkSession();
  }, []);
  
  // Apply filters when logs or filter changes
  useEffect(() => {
    applyFilters();
  }, [logs, filter, selectedTab]);
  
  // Apply all filtering rules
  const applyFilters = () => {
    let filtered = [...logs];
    
    // Apply text search filter
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(lowerFilter) || 
        JSON.stringify(log.details || "").toLowerCase().includes(lowerFilter)
      );
    }
    
    // Apply tab filter
    if (selectedTab !== "all") {
      if (selectedTab === "auth") {
        filtered = filtered.filter(log => 
          log.message.toLowerCase().includes("auth") ||
          log.message.toLowerCase().includes("login") ||
          log.message.toLowerCase().includes("session") ||
          log.message.toLowerCase().includes("google") ||
          log.message.toLowerCase().includes("firebase") ||
          log.message.toLowerCase().includes("sign")
        );
      } else if (selectedTab === "errors") {
        filtered = filtered.filter(log => log.level === "error");
      } else if (selectedTab === "warnings") {
        filtered = filtered.filter(log => log.level === "warn");
      } else if (selectedTab === "info") {
        filtered = filtered.filter(log => log.level === "info");
      } else if (selectedTab === "debug") {
        filtered = filtered.filter(log => log.level === "debug");
      }
    }
    
    setFilteredLogs(filtered);
  };
  
  // Check session status
  const checkSession = async () => {
    try {
      setIsCheckingSession(true);
      const response = await apiRequest('GET', '/api/debug/session');
      if (response.ok) {
        const data = await response.json();
        setSessionInfo(data);
        logInfo("Debug page checked session status", data);
      } else {
        logInfo("Failed to get session data", {
          status: response.status,
          statusText: response.statusText
        });
      }
    } catch (error) {
      console.error("Error checking session:", error);
    } finally {
      setIsCheckingSession(false);
    }
  };
  
  // Refresh logs
  const loadLogs = () => {
    const newLogs = getLogs();
    setLogs(newLogs);
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
    const logsToUse = filteredLogs.length > 0 ? filteredLogs : logs;
    const logText = logsToUse.map(log => 
      `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] ${log.message} ${log.details ? JSON.stringify(log.details) : ''}`
    ).join('\n');
    
    navigator.clipboard.writeText(logText).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `${logsToUse.length} debug logs copied to clipboard`
      });
    });
  };
  
  // Download logs as file
  const handleDownloadLogs = () => {
    const logsToUse = filteredLogs.length > 0 ? filteredLogs : logs;
    const logText = logsToUse.map(log => 
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
    
    toast({
      title: "Logs downloaded",
      description: `${logsToUse.length} debug log entries saved to file`
    });
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
  
  // Get icon for log level
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <Bug className="h-3 w-3 mr-1 text-destructive" />;
      case 'warn': return <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />;
      case 'info': return <Info className="h-3 w-3 mr-1 text-blue-500" />;
      case 'debug': return <CheckCircle2 className="h-3 w-3 mr-1 text-muted-foreground" />;
      default: return null;
    }
  };
  
  return (
    <div className="container py-8">
      <div className="grid gap-6">
        {/* Session Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Session Status</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={checkSession} 
                disabled={isCheckingSession}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isCheckingSession ? "animate-spin" : ""}`} />
                {isCheckingSession ? "Checking..." : "Check Session"}
              </Button>
            </CardTitle>
            <CardDescription>
              Current session status from the server to help diagnose authentication issues.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionInfo ? (
              <div className="bg-muted p-4 rounded-md text-sm font-mono overflow-x-auto">
                <pre>{JSON.stringify(sessionInfo, null, 2)}</pre>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {isCheckingSession ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Checking session...
                  </div>
                ) : (
                  "Click 'Check Session' to get current session status"
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Debug Logs Card */}
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
                  Clear
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Client-side logs that persist across page refreshes. Useful for debugging authentication issues.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Log filtering controls */}
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="Search logs..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full"
                />
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="auth">Auth</TabsTrigger>
                    <TabsTrigger value="errors">Errors</TabsTrigger>
                    <TabsTrigger value="warnings">Warnings</TabsTrigger>
                    <TabsTrigger value="info">Info</TabsTrigger>
                    <TabsTrigger value="debug">Debug</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Logs display */}
              <ScrollArea className="h-[calc(100vh-450px)] border rounded-md p-4 bg-muted/20">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No logs available
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No logs match the current filter
                  </div>
                ) : (
                  <div className="space-y-3 font-mono text-sm">
                    {filteredLogs.map((log, index) => (
                      <div key={index} className="border-b pb-2 last:border-b-0">
                        <div className="flex items-center gap-2">
                          <Badge variant={getBadgeVariant(log.level)} className="flex items-center">
                            {getLevelIcon(log.level)}
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
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredLogs.length} of {logs.length} log entries displayed
            </div>
          </CardFooter>
        </Card>
        
        {/* Firebase Configuration Info */}
        <Card>
          <CardHeader>
            <CardTitle>Firebase Configuration</CardTitle>
            <CardDescription>
              Information about the Firebase configuration being used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="font-semibold">Firebase Project ID:</div>
                <div className="bg-muted p-2 rounded">
                  {import.meta.env.VITE_FIREBASE_PROJECT_ID || "Not configured"}
                </div>
              </div>
              <div>
                <div className="font-semibold">API Key Status:</div>
                <div className="bg-muted p-2 rounded">
                  {import.meta.env.VITE_FIREBASE_API_KEY ? "Configured" : "Missing"}
                </div>
              </div>
              <div>
                <div className="font-semibold">Auth Domain:</div>
                <div className="bg-muted p-2 rounded">
                  {import.meta.env.VITE_FIREBASE_PROJECT_ID 
                    ? `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com` 
                    : "Not configured"}
                </div>
              </div>
              <div>
                <div className="font-semibold">Current Origin:</div>
                <div className="bg-muted p-2 rounded">
                  {typeof window !== 'undefined' ? window.location.origin : "Unknown"}
                </div>
              </div>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 text-sm text-amber-800">
                <p>
                  <strong>Important:</strong> For Firebase Google authentication to work, the current origin must be added to the authorized domains in Firebase console under Authentication &gt; Settings &gt; Authorized domains.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}