import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export function BackButton({ 
  to = "/dashboard", 
  label = "Back to Dashboard", 
  className = "" 
}: BackButtonProps) {
  const [, navigate] = useLocation();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`flex items-center gap-1 mb-4 hover:bg-gray-100 ${className}`}
      onClick={() => navigate(to)}
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}