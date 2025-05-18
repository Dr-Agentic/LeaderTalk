import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import WordUsageStats from "@/components/dashboard/WordUsageStats";
import CurrentCycleUsageChart from "@/components/dashboard/CurrentCycleUsageChart";
import SubscriptionManager from "@/components/subscription/SubscriptionManager";
import AppLayout from "@/components/AppLayout";
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
import { Loader2, UserX } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Delete user account mutation - deletes all user data and the account itself
  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/users/delete-account');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Account deleted",
        description: "Your account and all associated data have been permanently deleted.",
        variant: "default",
      });
      
      // Show a success message and then log the user out after a short delay
      setTimeout(() => {
        // Log the user out and redirect to login
        apiRequest('GET', '/api/auth/logout')
          .then(() => {
            // Clear query cache
            queryClient.invalidateQueries();
            
            // Redirect to login page
            window.location.href = '/login';
          })
          .catch(error => {
            console.error("Error during logout:", error);
            // Force redirect even if logout fails
            window.location.href = '/login';
          });
      }, 1500); // Short delay to allow the user to see the success message
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete your account. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  return (
    <AppLayout showBackButton backTo="/dashboard" backLabel="Back to Dashboard" pageTitle="Account Settings">
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Manage your account details and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">NAME</h3>
                <p className="mt-1 text-sm text-gray-900">{userData?.username || 'Not set'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">EMAIL</h3>
                <p className="mt-1 text-sm text-gray-900 break-all">{userData?.email || 'Not set'}</p>
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
        
        {/* Current billing cycle usage chart */}
        <CurrentCycleUsageChart />
        
        {/* Subscription Management */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Management</CardTitle>
            <CardDescription>View and manage your subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriptionManager />
          </CardContent>
        </Card>
        
        {/* Account deletion */}
        <Card>
          <CardHeader>
            <CardTitle>Delete Account</CardTitle>
            <CardDescription>Permanently remove your account and data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-red-500 mb-2">DELETE YOUR ACCOUNT</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will permanently delete your entire account, including all your personal data,
                  recordings, progress, and settings. This action cannot be undone.
                </p>
                
                {/* Alert dialog for account deletion confirmation */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2 bg-red-600 hover:bg-red-700">
                      <UserX className="h-4 w-4" />
                      Delete Account Permanently
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-600">
                        Delete Your Account Permanently?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        <p>This will immediately and permanently delete:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>Your user profile and personal information</li>
                          <li>All recordings you've created</li>
                          <li>All training progress and situation attempts</li>
                          <li>All word usage records</li>
                          <li>Selected leader preferences</li>
                        </ul>
                        <p className="mt-4">
                          <span className="text-red-500">Note:</span> If you have a paid subscription, any remaining balance in your current billing cycle <span className="font-bold">cannot be reimbursed</span> if you delete your account.
                        </p>
                        <p className="mt-4 font-bold">
                          This action CANNOT be undone. Are you sure you want to proceed?
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteUserMutation.mutate()}
                        disabled={deleteUserMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 gap-2"
                      >
                        {deleteUserMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Deleting Account...
                          </>
                        ) : (
                          <>
                            <UserX className="h-4 w-4" />
                            Yes, Delete My Account
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
    </AppLayout>
  );
}