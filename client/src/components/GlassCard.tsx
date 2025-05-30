import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  icon?: string
  title?: string
  description?: string
}

export function GlassCard({ children, className = '', onClick, icon, title, description }: GlassCardProps) {
  const handleClick = () => {
    if (onClick) {
      // Add click animation
      const card = event?.currentTarget as HTMLElement
      if (card) {
        card.style.transform = 'scale(0.95)'
        setTimeout(() => {
          card.style.transform = 'translateY(-4px)'
        }, 100)
      }
      onClick()
    }
  }

  if (icon && title && description) {
    return (
      <div 
        className={`glass-card rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-purple-600/30 hover:shadow-[0_15px_40px_rgba(138,43,226,0.2)] relative overflow-hidden group ${className}`}
        onClick={handleClick}
      >
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-400 flex items-center justify-center mr-4 text-xl">
            {icon}
          </div>
          <div className="text-lg font-semibold text-white">{title}</div>
        </div>
        <div className="text-white/70 text-sm leading-relaxed">{description}</div>
      </div>
    )
  }

  return (
    <div 
      className={`glass-card rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-purple-600/30 hover:shadow-[0_15px_40px_rgba(138,43,226,0.2)] relative overflow-hidden ${className}`}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}