import { ReactNode } from 'react'
import { BottomNavigation } from './BottomNavigation'

interface MobileLayoutProps {
  children: ReactNode
  currentPage?: string
}

export function MobileLayout({ children, currentPage = 'home' }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center p-4">
      {/* Phone Container */}
      <div className="w-[375px] h-[812px] bg-black rounded-[40px] p-2 shadow-[0_25px_80px_rgba(138,43,226,0.4)] relative overflow-hidden">
        {/* Phone Screen */}
        <div className="w-full h-full bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 rounded-[32px] overflow-hidden relative">
          
          {/* Floating Background Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute w-[100px] h-[100px] top-[10%] -right-5 rounded-full bg-gradient-radial from-purple-600/10 to-transparent animate-float" style={{animationDelay: '0s'}} />
            <div className="absolute w-[60px] h-[60px] bottom-[20%] -left-2 rounded-full bg-gradient-radial from-purple-600/10 to-transparent animate-float" style={{animationDelay: '2s'}} />
            <div className="absolute w-[80px] h-[80px] top-[60%] -right-8 rounded-full bg-gradient-radial from-purple-600/10 to-transparent animate-float" style={{animationDelay: '4s'}} />
          </div>

          {/* Status Bar */}
          <div className="flex justify-between items-center px-6 py-3 text-white text-sm font-semibold">
            <span>9:41</span>
            <span>●●●●● 100%</span>
          </div>

          {/* Header */}
          <div className="flex justify-between items-center px-6 py-5">
            <div className="text-2xl font-extrabold bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 bg-clip-text text-transparent animate-pulse">
              LeaderTalk
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 flex items-center justify-center text-white font-semibold cursor-pointer hover:scale-110 transition-transform duration-300 hover:shadow-[0_8px_25px_rgba(138,43,226,0.3)]">
              JD
            </div>
          </div>

          {/* Main Content */}
          <div className="h-[calc(100%-140px)] overflow-y-auto px-6 pb-20">
            {children}
          </div>

          {/* Bottom Navigation */}
          <BottomNavigation currentPage={currentPage} />
        </div>
      </div>
    </div>
  )
}