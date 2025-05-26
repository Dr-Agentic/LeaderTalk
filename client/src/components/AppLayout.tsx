import { ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import AppHeader from "./AppHeader";

interface AppLayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
  pageTitle?: string;
}

export default function AppLayout({ 
  children, 
  showBackButton = false, 
  backTo = "/dashboard", 
  backLabel = "Back", 
  pageTitle
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  
  // Get the current user
  const { data: user = {} } = useQuery({ 
    queryKey: ['/api/users/me'], 
  });
  
  // Determine the title based on the current location
  const determineTitle = () => {
    if (pageTitle) return pageTitle;
    
    // Default mapping between routes and titles
    const titleMap: Record<string, string> = {
      "/": "Dashboard",
      "/dashboard": "Dashboard",
      "/transcripts": "All Transcripts",
      "/progress": "My Progress",
      "/training": "Training Module",
      "/leadership-inspirations": "Leadership Inspirations",
      "/settings": "Settings"
    };
    
    // Check if the current location matches any of our defined routes
    if (location in titleMap) {
      return titleMap[location];
    }
    
    // For other routes, try to extract a title from the path
    const segments = location.split('/').filter(Boolean);
    if (segments.length > 0) {
      // Get the last non-id segment
      const lastSegment = segments[segments.length - 1];
      if (!lastSegment.match(/^\d+$/)) {
        return lastSegment.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
      
      // If last segment is an ID, use previous segment
      if (segments.length > 1) {
        const previousSegment = segments[segments.length - 2];
        return previousSegment.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
    }
    
    return "LeaderTalk";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
      
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <AppHeader 
          setSidebarOpen={setSidebarOpen} 
          user={user}
          showBackButton={showBackButton}
          backTo={backTo}
          backLabel={backLabel}
          title={determineTitle()}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container px-4 py-6 mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export { AppLayout };