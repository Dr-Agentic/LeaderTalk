import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MenuIcon, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Link } from "wouter";

interface AppHeaderProps {
  setSidebarOpen: (isOpen: boolean) => void;
  user: any;
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
  title?: string;
}

export default function AppHeader({ 
  setSidebarOpen, 
  user, 
  showBackButton = false,
  backTo = "/dashboard",
  backLabel = "Back",
  title = "LeaderTalk"
}: AppHeaderProps) {
  const [location, navigate] = useLocation();
  
  const handleBack = () => {
    navigate(backTo);
  };
  
  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10" style={{background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)'}}>
      <div className="flex h-14 items-center px-4 relative">
        {/* Left side with controls */}
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden inline-flex items-center justify-center text-white/70 rounded-md hover:text-white hover:bg-purple-600/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="h-5 w-5" />
          </Button>
          
          {/* Back button - show only when requested */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-secondary hover:text-primary"
              onClick={handleBack}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{backLabel}</span>
            </Button>
          )}
        </div>
        
        {/* Centered logo and title */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/assets/images/LeaderTalk-2025-05-30.png" alt="LeaderTalk Logo" className="h-8 w-auto" />
            <h1 className="text-lg font-bold text-white">LeaderTalk</h1>
          </Link>
        </div>
        
        {/* User profile icon */}
        <div className="ml-auto">
          <Avatar className="h-8 w-8 cursor-pointer transition-opacity hover:opacity-80" onClick={() => navigate("/settings")}>
            <AvatarImage src={user?.photoUrl} alt={user?.username} />
            <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}