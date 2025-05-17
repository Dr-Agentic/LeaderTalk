import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MenuIcon, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

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
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden inline-flex items-center justify-center text-gray-500 rounded-md hover:text-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
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
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              onClick={handleBack}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{backLabel}</span>
            </Button>
          )}
          
          {/* App title/logo */}
          <h1 className="text-lg font-bold text-primary">{title}</h1>
        </div>
        
        {/* User profile icon */}
        <div>
          <Avatar className="h-8 w-8 cursor-pointer transition-opacity hover:opacity-80" onClick={() => navigate("/settings")}>
            <AvatarImage src={user?.photoUrl} alt={user?.username} />
            <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}