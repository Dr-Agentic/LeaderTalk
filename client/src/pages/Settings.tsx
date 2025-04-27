import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LeaderSelection from "@/components/onboarding/LeaderSelection";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";
import WordUsageStats from "@/components/dashboard/WordUsageStats";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState("leaders");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch leaders data
  const { data: leaders, isLoading: isLoadingLeaders } = useQuery({
    queryKey: ['/api/leaders'],
    enabled: activeTab === "leaders",
  });
  
  // Delete user records mutation
  const deleteRecordsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/users/delete-records', {
        method: 'POST'
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Records deleted",
        description: `Successfully deleted user records: ${data.counts.recordings} recordings, ${data.counts.progressRecords} progress records, ${data.counts.situationAttempts} situation attempts, and ${data.counts.wordUsageRecords} word usage records.`,
        variant: "default",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/training'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/word-usage'] });
      
      // Force the user to complete onboarding again
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user records. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  return (
    <div className="container mx-auto py-10 px-4">
      <BackButton to="/dashboard" label="Back to Dashboard" />
      <div className="flex items-center justify-between my-8">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      
      <Tabs defaultValue="leaders" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="leaders">Leadership Inspirations</TabsTrigger>
          <TabsTrigger value="account">Account Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="leaders">
          {isLoadingLeaders ? (
            <SettingsSkeleton />
          ) : (
            <LeaderSelection 
              leaders={leaders || []} 
              currentSelections={userData?.selectedLeaders || []}
              isSettingsPage={true}
            />
          )}
        </TabsContent>
        
        <TabsContent value="account">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Manage your account details and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">NAME</h3>
                      <p className="mt-1 text-sm text-gray-900">{userData?.username || 'Not set'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">EMAIL</h3>
                      <p className="mt-1 text-sm text-gray-900">{userData?.email || 'Not set'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">DATE OF BIRTH</h3>
                      <p className="mt-1 text-sm text-gray-900">{userData?.dateOfBirth || 'Not set'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">PROFESSION</h3>
                      <p className="mt-1 text-sm text-gray-900">{userData?.profession || 'Not set'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">GOALS</h3>
                    <p className="mt-1 text-sm text-gray-900">{userData?.goals || 'Not set'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Word usage stats for billing */}
            <WordUsageStats />
            
            {/* Data management for testing */}
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>For testing and development purposes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">RESET USER DATA</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      This will delete all your recordings, progress data, situation attempts, and 
                      word usage records. Your account will remain but you'll need to complete onboarding
                      again. This is useful for testing the application with a clean slate.
                    </p>
                    
                    {/* Alert dialog for confirmation */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete All User Records
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action will delete all your recordings, progress, and usage data.
                            This action cannot be undone, and all your data will be permanently lost.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteRecordsMutation.mutate()}
                            disabled={deleteRecordsMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 gap-2"
                          >
                            {deleteRecordsMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                Delete All Records
                              </>
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto my-10 bg-white p-8 rounded-lg shadow-md">
      <Skeleton className="h-8 w-32 mb-4" /> {/* BackButton skeleton */}
      <div className="text-center mb-6">
        <Skeleton className="h-8 w-64 mx-auto mb-4" />
        <Skeleton className="h-4 w-96 mx-auto" />
        <Skeleton className="h-4 w-72 mx-auto mt-1" />
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white overflow-hidden rounded-lg border border-gray-200">
            <div className="p-4">
              <Skeleton className="w-full h-36 rounded-md mb-4" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full mt-1" />
              <Skeleton className="h-4 w-3/4 mt-1" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 flex justify-center">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}