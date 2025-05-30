import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/supabaseAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { queryClient } from "@/lib/queryClient";
import { 
  Home, 
  Mic, 
  LineChart, 
  UserRound, 
  Settings,
  X,
  FileText,
  GraduationCap,
  CreditCard
} from "lucide-react";

export default function Sidebar({ sidebarOpen, setSidebarOpen, user }) {
  const [location] = useLocation();
  
  // Listen for the custom closeSidebar event
  useEffect(() => {
    const handleCloseSidebar = (event) => {
      setSidebarOpen(event.detail.value);
    };
    
    window.addEventListener('closeSidebar', handleCloseSidebar);
    
    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('closeSidebar', handleCloseSidebar);
    };
  }, [setSidebarOpen]);
  
  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75" 
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          ></div>
          
          <div className="fixed inset-y-0 left-0 flex max-w-xs w-full bg-white">
            <div className="flex flex-col h-full w-64">
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                <h1 className="text-xl font-bold text-primary">LeaderTalk</h1>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <SidebarContent location={location} />
              
              {user && (
                <SidebarFooter user={user} />
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          <div className="flex items-center justify-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary">LeaderTalk</h1>
          </div>
          
          <SidebarContent location={location} />
          
          {user && (
            <SidebarFooter user={user} />
          )}
        </div>
      </div>
    </>
  );
}

function SidebarContent({ location }) {
  // Get setSidebarOpen from parent component
  const setSidebarOpen = (value) => {
    // On mobile, we need to close the sidebar when a link is clicked
    // This function is only used when we're on a mobile view
    // We use a custom event to communicate with the parent component
    const event = new CustomEvent('closeSidebar', { detail: { value } });
    window.dispatchEvent(event);
  };
  
  const navItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Record & Analyze", href: "/recording", icon: Mic },
    { name: "All Transcripts", href: "/transcripts", icon: FileText },
    { name: "My Progress", href: "/progress", icon: LineChart },
    { name: "Training Module", href: "/training", icon: GraduationCap },
    { name: "Leadership Inspirations", href: "/leadership-inspirations", icon: UserRound },
    { name: "Manage Subscription", href: "/subscription", icon: CreditCard },
    { name: "Settings", href: "/settings", icon: Settings },
  ];
  
  return (
    <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
      <nav className="px-2 space-y-1">
        {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium ${
                location === item.href
                  ? "text-primary bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50"
              } rounded-md group`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className={`mr-3 h-5 w-5 ${
                location === item.href
                  ? "text-primary"
                  : "text-gray-400 group-hover:text-primary"
              }`} />
              {item.name}
            </Link>
        ))}
      </nav>
    </div>
  );
}

function SidebarFooter({ user }) {
  const handleSignOut = async () => {
    // Create a loading state indicator for the user
    const logoutButton = document.querySelector('button[data-action="logout"]');
    if (logoutButton) {
      logoutButton.innerHTML = '<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
      logoutButton.setAttribute('disabled', 'true');
    }
    
    try {
      // 1. First clear all client-side cache/storage to ensure clean state
      localStorage.clear();
      sessionStorage.clear();
      
      // 2. Clear all client-side query cache
      queryClient.clear();
      
      // 3. Try Firebase signout
      try {
        await signOut();
        console.log("Firebase signout successful");
      } catch (e) {
        console.log("Firebase signout skipped:", e);
      }
      
      // 4. Do server-side logout to clear session with cache-busting parameter
      try {
        const cacheBuster = Date.now();
        const response = await fetch(`/api/auth/logout?_=${cacheBuster}`, { 
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        console.log("Logout response status:", response.status);
        
        // 5. Wait at least 500ms before redirecting to ensure the session is cleared
        setTimeout(() => {
          // 6. Force hard refresh by using location.replace (not just href assignment)
          window.location.replace('/');
        }, 500);
      } catch (e) {
        console.error("Logout fetch error:", e);
        // Still redirect with a delay
        setTimeout(() => {
          window.location.replace('/');
        }, 500);
      }
    } catch (error) {
      console.error("Error in signout function:", error);
      // Always redirect on error after delay
      setTimeout(() => {
        window.location.replace('/');
      }, 500);
    }
  };
  
  return (
    <div className="p-4 border-t border-gray-200">
      <div className="flex items-center mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user?.photoUrl} alt={user?.username} />
          <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-700">{user?.username}</p>
          <p className="text-xs font-medium text-gray-500">{user?.email}</p>
        </div>
      </div>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleSignOut}
        className="w-full text-gray-700 hover:text-gray-900 flex items-center justify-center"
        data-action="logout"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Sign out
      </Button>
    </div>
  );
}
