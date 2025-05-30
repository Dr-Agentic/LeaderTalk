import { useLocation } from 'wouter'
import { Home, Search, MessageCircle, TrendingUp, User } from 'lucide-react'

interface BottomNavigationProps {
  currentPage: string
}

const navItems = [
  { id: 'home', icon: Home, label: 'Home', path: '/dashboard' },
  { id: 'explore', icon: Search, label: 'Explore', path: '/training' },
  { id: 'sessions', icon: MessageCircle, label: 'Sessions', path: '/transcripts' },
  { id: 'progress', icon: TrendingUp, label: 'Progress', path: '/progress' },
  { id: 'profile', icon: User, label: 'Profile', path: '/settings' },
]

export function BottomNavigation({ currentPage }: BottomNavigationProps) {
  const [, navigate] = useLocation()

  const handleNavClick = (path: string, id: string) => {
    navigate(path)
    
    // Add ripple effect
    const event = new CustomEvent('nav-click', { detail: { id } })
    window.dispatchEvent(event)
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10 px-6 py-4">
      <div className="flex justify-around items-center">
        {navItems.map(({ id, icon: Icon, label, path }) => {
          const isActive = currentPage === id
          
          return (
            <button
              key={id}
              onClick={() => handleNavClick(path, id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 hover:-translate-y-0.5 ${
                isActive ? 'bg-purple-600/20' : ''
              }`}
            >
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                isActive ? 'bg-purple-600 text-white' : 'bg-purple-600/50 text-purple-300'
              }`}>
                <Icon size={14} />
              </div>
              <span className={`text-[11px] font-medium ${
                isActive ? 'text-white' : 'text-white/70'
              }`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}