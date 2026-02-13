import Link from 'next/link';
import { 
  Gavel, 
  Globe, 
  ArrowLeft, 
  Award, 
  Users, 
  CheckCircle, 
  Calendar,
  Trophy,
  Target,
  Shield,
  Clipboard,
  Flag,
  Eye,
  MessageSquare,
  BookOpen,
  TrendingUp,
  Star,
  Clock,
  Activity,
  BarChart3,
  MapPin
} from 'lucide-react';
import { PrismaClient } from '@/generated/prisma';

interface Props {
  params: {
    id: string;
  };
}

export default async function RefereeProfilePage({ params }: Props) {
  const prisma = new PrismaClient();
  const referee = await prisma.referee.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photo: true,
      nationality: true,
      bio: true,
      matchesRefereed: true,
      ballCrewMatches: true,
      experience: true,
      certifications: true,
    },
  });

  if (!referee) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-fuchsia-100 flex items-center justify-center p-8">
        <div className="w-full text-center bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border-2 border-pink-200">
          <Gavel className="w-20 h-20 text-pink-400 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-900 mb-4">Referee not found</h2>
          <p className="text-slate-600 mb-6">The referee profile you're looking for doesn't exist.</p>
          <Link 
            href="/referees" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white font-bold px-6 py-3 rounded-full hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to referees
          </Link>
        </div>
      </main>
    );
  }

  // Mock data for demonstration - in production, fetch from database
  const responsibilities = [
    { icon: Gavel, title: 'Match Control', description: 'Enforce game rules and maintain fair play throughout the match' },
    { icon: Flag, title: 'Decision Making', description: 'Make quick, accurate calls on fouls, violations, and penalties' },
    { icon: Eye, title: 'Player Safety', description: 'Ensure player safety and stop play when necessary for injuries' },
    { icon: MessageSquare, title: 'Communication', description: 'Clearly communicate decisions to players, coaches, and officials' },
    { icon: Clipboard, title: 'Record Keeping', description: 'Document match events, scores, and violations accurately' },
    { icon: BookOpen, title: 'Rule Knowledge', description: 'Maintain up-to-date knowledge of all official rules and regulations' },
  ];

  const recentMatches = [
    { date: '2024-02-10', teams: 'Team Alpha vs Team Beta', score: '3-2', duration: '90 min', fouls: 8 },
    { date: '2024-02-08', teams: 'Warriors vs Champions', score: '2-1', duration: '85 min', fouls: 5 },
    { date: '2024-02-05', teams: 'Eagles vs Tigers', score: '4-3', duration: '95 min', fouls: 12 },
    { date: '2024-02-01', teams: 'Phoenix vs Dragons', score: '1-1', duration: '90 min', fouls: 6 },
  ];

  const performanceMetrics = [
    { label: 'Accuracy Rate', value: '98.5%', icon: Target, color: 'pink' },
    { label: 'Avg. Match Duration', value: '88 min', icon: Clock, color: 'fuchsia' },
    { label: 'Fair Play Rating', value: '9.7/10', icon: Shield, color: 'rose' },
    { label: 'Experience Level', value: 'Expert', icon: TrendingUp, color: 'pink' },
  ];

  const achievements = [
    'International Referee Certification',
    'Best Referee Award 2023',
    'Perfect Match Record (20 consecutive)',
    'Youth Development Mentor',
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-pink-50 to-fuchsia-100 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-300 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-300 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
      </div>

        <div className="w-full mx-auto">
          {/* Edit button is in the header for logged-in referees; remove back button from page */}
          <Link
            href={`/referees/${referee.id}/edit`}
            className="ml-4 inline-flex items-center gap-2 text-white bg-pink-600 hover:bg-pink-700 font-bold px-4 py-2 rounded-full shadow-md"
          >
            Edit Profile
          </Link>

          {/* Hero Section */}
          <div id="overview" className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border-2 border-pink-200 mb-8">
            <div className="relative h-80 bg-gradient-to-br from-pink-500 via-fuchsia-500 to-pink-600 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400/30 to-fuchsia-600/30 mix-blend-overlay"></div>
              <img 
                src={referee.photo ?? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80'} 
                alt={`${referee.firstName} ${referee.lastName}`} 
                className="w-full h-full object-cover opacity-90" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              
              {/* Profile Info Overlay */}
              <div className="absolute left-8 bottom-8 text-white max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-pink-600 fill-pink-600" />
                      <span className="text-sm font-black text-pink-600">CERTIFIED REFEREE</span>
                    </div>
                  </div>
                </div>
                <h1 className="text-5xl md:text-6xl font-black mb-4 drop-shadow-lg">
                  {referee.firstName} {referee.lastName}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-bold backdrop-blur border border-white/30"> 
                    <Globe className="w-5 h-5" /> {referee.nationality || 'Unknown'}
                  </div>
                  <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-bold backdrop-blur border border-white/30">
                    <Gavel className="w-5 h-5" /> Professional Referee
                  </div>
                  <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-bold backdrop-blur border border-white/30">
                    <Trophy className="w-5 h-5" /> {referee.matchesRefereed || 0} Matches
                  </div>
                </div>
              </div>

              {/* Experience Badge */}
              <div className="absolute top-8 right-8 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-2 border-pink-200">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Experience</p>
                <p className="text-3xl font-black bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent">
                  {referee.experience || '5+ years'}
                </p>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-pink-50 to-fuchsia-50 border-t-2 border-pink-200">
              {performanceMetrics.map((metric, idx) => (
                <div key={idx} className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className={`bg-gradient-to-br from-${metric.color}-500 to-${metric.color}-600 p-3 rounded-2xl shadow-lg`}>
                      <metric.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{metric.value}</p>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-pink-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-pink-500 to-fuchsia-600 p-3 rounded-2xl shadow-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">About</h2>
                </div>
                <p className="text-slate-700 text-lg leading-relaxed">
                  {referee.bio || 'A dedicated and experienced referee committed to maintaining the highest standards of fairness, integrity, and professionalism in every match. Known for exceptional decision-making, clear communication, and unwavering commitment to player safety and fair play.'}
                </p>
              </div>

              {/* Core Responsibilities */}
              <div id="ballcrew" className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-pink-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-pink-500 to-fuchsia-600 p-3 rounded-2xl shadow-lg">
                    <Clipboard className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">Core Responsibilities</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {responsibilities.map((resp, idx) => (
                    <div 
                      key={idx} 
                      className="bg-gradient-to-br from-pink-50 to-fuchsia-50 rounded-2xl p-5 border-2 border-pink-200 hover:border-pink-400 transition-all hover:shadow-lg group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-gradient-to-br from-pink-500 to-fuchsia-600 p-2.5 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                          <resp.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-black text-slate-900 mb-1">{resp.title}</h3>
                          <p className="text-sm text-slate-600">{resp.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Matches */}
              <div id="matches" className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-pink-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-pink-500 to-fuchsia-600 p-3 rounded-2xl shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900">Recent Matches</h2>
                </div>
                <div className="space-y-4">
                  {recentMatches.map((match, idx) => (
                    <div 
                      key={idx} 
                      className="bg-gradient-to-br from-pink-50 to-fuchsia-50 rounded-2xl p-5 border-2 border-pink-200 hover:border-pink-400 transition-all hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-pink-600" />
                            <span className="text-sm font-bold text-slate-600">{match.date}</span>
                          </div>
                          <h3 className="font-black text-slate-900 text-lg">{match.teams}</h3>
                          <p className="text-2xl font-black text-pink-600 mt-1">{match.score}</p>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-center">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Duration</p>
                            <p className="text-lg font-black text-slate-900">{match.duration}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Fouls</p>
                            <p className="text-lg font-black text-slate-900">{match.fouls}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div id="certifications">
              
              {referee.certifications && referee.certifications.length > 0 && (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-pink-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-pink-500 to-fuchsia-600 p-3 rounded-2xl shadow-lg">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900">Certifications</h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {referee.certifications.map((cert, idx) => (
                      <div 
                        key={idx} 
                        className="bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white px-6 py-3 rounded-full text-sm font-black shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2 border-pink-400"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                        {cert}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-8">
              {/* Statistics Card */}
              <div id="stats" className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-pink-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-pink-500 to-fuchsia-600 p-3 rounded-2xl shadow-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Statistics</h2>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 shadow-lg text-white border-2 border-pink-400">
                    <div className="flex items-center gap-2 mb-2">
                      <Gavel className="w-5 h-5" />
                      <p className="text-xs font-bold uppercase tracking-wide opacity-90">Matches Refereed</p>
                    </div>
                    <p className="text-5xl font-black">{referee.matchesRefereed || 0}</p>
                  </div>

                  <div className="bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 rounded-2xl p-6 shadow-lg text-white border-2 border-fuchsia-400">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5" />
                      <p className="text-xs font-bold uppercase tracking-wide opacity-90">Ball Crew Matches</p>
                    </div>
                    <p className="text-5xl font-black">{referee.ballCrewMatches || 0}</p>
                  </div>

                  <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 shadow-lg text-white border-2 border-rose-400">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5" />
                      <p className="text-xs font-bold uppercase tracking-wide opacity-90">Total Events</p>
                    </div>
                    <p className="text-5xl font-black">{(referee.matchesRefereed || 0) + (referee.ballCrewMatches || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border-2 border-pink-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-pink-500 to-fuchsia-600 p-3 rounded-2xl shadow-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Achievements</h2>
                </div>
                <div className="space-y-3">
                  {achievements.map((achievement, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-3 bg-gradient-to-br from-pink-50 to-fuchsia-50 rounded-xl p-4 border border-pink-200"
                    >
                      <CheckCircle className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-bold text-slate-700">{achievement}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact/Action Card */}
              <div className="bg-gradient-to-br from-pink-500 via-fuchsia-500 to-pink-600 rounded-3xl p-8 shadow-xl border-2 border-pink-400 text-white">
                <Shield className="w-12 h-12 mb-4" />
                <h3 className="text-2xl font-black mb-3">Professional Referee</h3>
                <p className="text-sm font-semibold mb-6 opacity-90">
                  Available for match officiating and consulting services
                </p>
                <button className="w-full bg-white text-pink-600 font-black py-4 rounded-2xl hover:shadow-2xl transition-all hover:scale-105">
                  Contact Referee
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}