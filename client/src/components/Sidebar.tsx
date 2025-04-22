import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { signOut } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  Mic, 
  LineChart, 
  UserRound, 
  Settings,
  X,
  FileText
} from "lucide-react";

export default function Sidebar({ sidebarOpen, setSidebarOpen, user }) {
  const [location] = useLocation();
  
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
  const navItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Record & Analyze", href: "#record-section", icon: Mic, scrollTo: true },
    { name: "All Transcripts", href: "/transcripts", icon: FileText },
    { name: "My Progress", href: "/progress", icon: LineChart },
    { name: "Leadership Models", href: "/leaders", icon: UserRound },
    { name: "Settings", href: "/settings", icon: Settings },
  ];
  
  return (
    <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
      <nav className="px-2 space-y-1">
        {navItems.map((item) => (
          item.scrollTo ? (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium ${
                false
                  ? "text-primary bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50"
              } rounded-md group`}
            >
              <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-primary" />
              {item.name}
            </a>
          ) : (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium ${
                location === item.href
                  ? "text-primary bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50"
              } rounded-md group`}
            >
              <item.icon className={`mr-3 h-5 w-5 ${
                location === item.href
                  ? "text-primary"
                  : "text-gray-400 group-hover:text-primary"
              }`} />
              {item.name}
            </Link>
          )
        ))}
      </nav>
    </div>
  );
}

function SidebarFooter({ user }) {
  const handleSignOut = async () => {
    try {
      // First try Firebase signout
      try {
        await signOut();
      } catch (e) {
        console.log("Firebase signout error (expected):", e);
      }
      
      // Then do server-side logout to clear session
      try {
        const response = await fetch('/api/auth/logout', { 
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        // Log response for debugging
        console.log("Logout response status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Logout success:", data);
        } else {
          console.warn("Logout failed:", response.statusText);
        }
      } catch (e) {
        console.error("Logout fetch error:", e);
      }
      
      // Always redirect to login page, even if the logout had an error
      window.location.href = '/login';
    } catch (error) {
      console.error("Error in signout function:", error);
      // Still attempt to redirect on error
      window.location.href = '/login';
    }
  };
  
  return (
    <div className="flex items-center p-4 border-t border-gray-200">
      <Avatar className="h-10 w-10">
        <AvatarImage src={user?.photoUrl} alt={user?.username} />
        <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-gray-700">{user?.username}</p>
        <p className="text-xs font-medium text-gray-500">{user?.email}</p>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleSignOut}
        className="text-xs text-gray-500 hover:text-gray-700"
      >
        Sign out
      </Button>
    </div>
  );
}
