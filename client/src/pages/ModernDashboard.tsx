import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { Rocket, Target, Lightbulb, Phone, BookOpen, TrendingUp, Users, Award } from 'lucide-react'
import { GlassCard } from '@/components/GlassCard'

export default function ModernDashboard() {
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

  const recordingCount = Array.isArray(recordings) ? recordings.length : 0
  const leaderCount = Array.isArray(leaders) ? leaders.length : 0
  const successRate = recordingCount > 0 ? Math.round((recordingCount / 10) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Welcome back, {(user as any)?.username || 'Leader'}
          </h1>
          <p className="text-xl text-white/70 leading-relaxed max-w-2xl">
            Continue your leadership journey and unlock your potential through AI-powered coaching
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-500/20 backdrop-blur-lg border border-purple-600/30 rounded-2xl p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-600/30 rounded-2xl mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-300" />
            </div>
            <div className="text-3xl font-extrabold text-white mb-2">{leaderCount}</div>
            <div className="text-sm text-white/60 uppercase tracking-wider">Available Leaders</div>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-pink-500/20 backdrop-blur-lg border border-purple-600/30 rounded-2xl p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-pink-600/30 rounded-2xl mx-auto mb-4">
              <Target className="w-8 h-8 text-pink-300" />
            </div>
            <div className="text-3xl font-extrabold text-white mb-2">{recordingCount}</div>
            <div className="text-sm text-white/60 uppercase tracking-wider">Practice Sessions</div>
          </div>

          <div className="bg-gradient-to-br from-purple-600/20 to-pink-500/20 backdrop-blur-lg border border-purple-600/30 rounded-2xl p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-600/30 rounded-2xl mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-300" />
            </div>
            <div className="text-3xl font-extrabold text-white mb-2">{successRate}%</div>
            <div className="text-sm text-white/60 uppercase tracking-wider">Progress Rate</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <GlassCard
                className="cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                onClick={() => navigate('/training')}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-600/30 rounded-xl">
                    <Rocket className="w-6 h-6 text-purple-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Start Training Session</h3>
                    <p className="text-white/60">Begin a new leadership training module</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard
                className="cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                onClick={() => navigate('/leadership-inspirations')}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-pink-600/30 rounded-xl">
                    <BookOpen className="w-6 h-6 text-pink-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Leadership Inspirations</h3>
                    <p className="text-white/60">Explore different leadership styles and approaches</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard
                className="cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                onClick={() => navigate('/transcripts')}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-600/30 rounded-xl">
                    <Target className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Review Progress</h3>
                    <p className="text-white/60">Check your past sessions and improvements</p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Featured Content */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Featured Training</h2>
            <div className="space-y-4">
              <GlassCard
                className="cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                onClick={() => navigate('/training')}
              >
                <div className="mb-4">
                  <div className="text-2xl mb-2">🚀</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Innovation Leadership</h3>
                  <p className="text-white/70 leading-relaxed">
                    Master the art of leading through change and driving innovation in your organization. 
                    Learn from industry pioneers who transformed their companies.
                  </p>
                </div>
              </GlassCard>

              <GlassCard
                className="cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                onClick={() => navigate('/training')}
              >
                <div className="mb-4">
                  <div className="text-2xl mb-2">🎯</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Strategic Communication</h3>
                  <p className="text-white/70 leading-relaxed">
                    Develop clear and compelling communication strategies that align teams 
                    and drive organizational success.
                  </p>
                </div>
              </GlassCard>

              <GlassCard
                className="cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                onClick={() => navigate('/training')}
              >
                <div className="mb-4">
                  <div className="text-2xl mb-2">💡</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Team Empowerment</h3>
                  <p className="text-white/70 leading-relaxed">
                    Build high-performing teams and create cultures of excellence, 
                    collaboration, and continuous growth.
                  </p>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {recordingCount > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
            <GlassCard>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Latest Practice Session</h3>
                  <p className="text-white/60">You've completed {recordingCount} practice sessions</p>
                </div>
                <button 
                  onClick={() => navigate('/transcripts')}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-3 rounded-xl text-white font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                >
                  View All
                </button>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  )
}