import { useQuery } from '@tanstack/react-query'
import { MobileLayout } from '@/components/MobileLayout'
import { GlassCard } from '@/components/GlassCard'
import { useLocation } from 'wouter'
import { Rocket, Target, Lightbulb, Phone, BookOpen } from 'lucide-react'

export default function MobileDashboard() {
  const [, navigate] = useLocation()
  
  const { data: user } = useQuery({
    queryKey: ['/api/users/me'],
  })

  const { data: recordings } = useQuery({
    queryKey: ['/api/recordings'],
  })

  const { data: leaders } = useQuery({
    queryKey: ['/api/leaders'],
  })

  const recordingCount = recordings?.length || 0
  const leaderCount = leaders?.length || 0
  const successRate = recordingCount > 0 ? Math.round((recordingCount / 10) * 100) : 0

  return (
    <MobileLayout currentPage="home">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-600/10 to-pink-500/10 rounded-3xl p-8 mb-8 backdrop-blur-lg border border-purple-600/20 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-conic from-transparent via-purple-600/10 to-transparent animate-spin" style={{animationDuration: '6s'}} />
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-white mb-3 leading-tight">
            Elevate Your Leadership
          </h1>
          <p className="text-white/70 mb-6 leading-relaxed">
            Connect with industry leaders and unlock your potential through meaningful conversations
          </p>
          <button 
            onClick={() => navigate('/training')}
            className="bg-gradient-to-r from-purple-600 to-pink-500 px-8 py-4 rounded-2xl text-white font-semibold shadow-[0_8px_25px_rgba(138,43,226,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(138,43,226,0.4)] transition-all duration-300"
          >
            Start Your Journey
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 bg-gradient-to-br from-purple-600/10 to-pink-500/10 rounded-2xl p-5 text-center border border-purple-600/20 backdrop-blur-lg">
          <div className="text-2xl font-extrabold text-white mb-1">{leaderCount}</div>
          <div className="text-xs text-white/60 uppercase tracking-wider">Leaders</div>
        </div>
        <div className="flex-1 bg-gradient-to-br from-purple-600/10 to-pink-500/10 rounded-2xl p-5 text-center border border-purple-600/20 backdrop-blur-lg">
          <div className="text-2xl font-extrabold text-white mb-1">{recordingCount}</div>
          <div className="text-xs text-white/60 uppercase tracking-wider">Sessions</div>
        </div>
        <div className="flex-1 bg-gradient-to-br from-purple-600/10 to-pink-500/10 rounded-2xl p-5 text-center border border-purple-600/20 backdrop-blur-lg">
          <div className="text-2xl font-extrabold text-white mb-1">{successRate}%</div>
          <div className="text-xs text-white/60 uppercase tracking-wider">Progress</div>
        </div>
      </div>

      {/* Featured Sessions */}
      <h2 className="text-2xl font-bold text-white mb-5">Featured Sessions</h2>
      <div className="space-y-4 mb-8">
        <GlassCard
          icon="🚀"
          title="Innovation Leadership"
          description="Master the art of leading through change and driving innovation in your organization"
          onClick={() => navigate('/training')}
        />
        <GlassCard
          icon="🎯"
          title="Strategic Thinking"
          description="Develop strategic mindset and learn to make decisions that shape the future"
          onClick={() => navigate('/training')}
        />
        <GlassCard
          icon="💡"
          title="Team Dynamics"
          description="Build high-performing teams and create cultures of excellence and collaboration"
          onClick={() => navigate('/training')}
        />
      </div>

      {/* Quick Actions */}
      <h2 className="text-2xl font-bold text-white mb-5">Quick Actions</h2>
      <div className="space-y-4">
        <GlassCard
          icon="📞"
          title="Practice Session"
          description="Start a new practice session with AI feedback and guidance"
          onClick={() => navigate('/training')}
        />
        <GlassCard
          icon="📚"
          title="Learning Path"
          description="Follow curated learning journeys designed by leadership experts"
          onClick={() => navigate('/leadership-inspirations')}
        />
      </div>
    </MobileLayout>
  )
}