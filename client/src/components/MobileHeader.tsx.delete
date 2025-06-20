import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MobileHeader({ setSidebarOpen, user }) {
  return (
    <div className="pt-1 pl-1 md:hidden sm:pt-3 sm:pl-3 flex items-center justify-between shadow-sm bg-white">
      <Button
        variant="ghost"
        size="icon"
        className="inline-flex items-center justify-center p-2 text-gray-500 rounded-md hover:text-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <MenuIcon className="h-6 w-6" />
      </Button>
      
      <div className="px-4 flex items-center">
        <h1 className="text-lg font-bold text-primary">LeaderTalk</h1>
      </div>
      
      <div className="pr-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.photoUrl} alt={user?.username} />
          <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
