import PageHeader from "@/components/PageHeader";
import Link from "next/link";
import { getMatchDetails } from "@/actions/matches";
import { Trophy, Users, Calendar, MapPin, Award, TrendingUp, Target, Zap, Clock, User } from "lucide-react";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getMatchDetails(id);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-rose-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Match Not Found</h3>
          <p className="text-slate-600 mb-6">No match found for the provided id.</p>
          <Link href="/matches" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg font-semibold">
            Back to Matches
          </Link>
        </div>
      </div>
    );
  }

  const {
    playerA,
    playerB,
    referee,
    round,
    score,
    createdAt,
    headToHead,
    playerAStats,
    playerBStats,
    expected,
  } = data;

  const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : "");

  const formatTime = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : "");

  // Calculate win percentages
  const playerAWinRate = playerAStats?.matchesPlayed 
    ? Math.round(((playerAStats?.matchesWon ?? 0) / Math.max(1, playerAStats.matchesPlayed)) * 100) 
    : 0;
  const playerBWinRate = playerBStats?.matchesPlayed 
    ? Math.round(((playerBStats?.matchesWon ?? 0) / Math.max(1, playerBStats.matchesPlayed)) * 100) 
    : 0;

  // Calculate form (last 5 matches win rate - simulated for demo)
  const playerAForm = playerAStats?.matchesPlayed ? Math.min(100, playerAWinRate + Math.floor(Math.random() * 20 - 10)) : 0;
  const playerBForm = playerBStats?.matchesPlayed ? Math.min(100, playerBWinRate + Math.floor(Math.random() * 20 - 10)) : 0;

  return (
    <main className="min-h-screen py-8 bg-gradient-to-br from-slate-50 via-white to-slate-100 w-full px-4">
      <div className="w-full">
        <PageHeader
          title="Match Details"
          description={`${playerA.firstName} ${playerA.lastName} vs ${playerB.firstName} ${playerB.lastName}`}
          navItems={[{ label: "Matches", href: "/matches" }]}
        />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Match Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Match Header */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Player A */}
                <div className="flex flex-col items-center text-center flex-1">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-3">
                    {playerA.firstName?.[0]}
                  </div>
                  <div className="text-xl font-bold text-slate-900">{playerA.firstName} {playerA.lastName}</div>
                  <div className="text-sm text-slate-500 font-medium">Player A</div>
                  <div className="mt-3 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                    Win Rate: {playerAWinRate}%
                  </div>
                </div>

                {/* VS Section */}
                <div className="text-center px-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm font-semibold text-slate-600 mb-3">
                    <Trophy className="w-4 h-4" />
                    Round {round}
                  </div>
                  <div className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent my-4">VS</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      {formatDate(createdAt)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      {formatTime(createdAt)}
                    </div>
                  </div>
                </div>

                {/* Player B */}
                <div className="flex flex-col items-center text-center flex-1">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-3">
                    {playerB.firstName?.[0]}
                  </div>
                  <div className="text-xl font-bold text-slate-900">{playerB.firstName} {playerB.lastName}</div>
                  <div className="text-sm text-slate-500 font-medium">Player B</div>
                  <div className="mt-3 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    Win Rate: {playerBWinRate}%
                  </div>
                </div>
              </div>

              {/* Score Display */}
              <div className="mt-8 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Final Score</div>
                  {referee && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="w-4 h-4" />
                      Referee: {referee.firstName} {referee.lastName}
                    </div>
                  )}
                </div>
                <div className="text-5xl font-bold text-slate-900 mt-2 text-center">
                  {score ?? '—'}
                </div>
              </div>
            </div>

            {/* Match Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Match Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Venue
                  </div>
                  <div className="font-semibold text-slate-900">Pwani University Courts</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Group
                  </div>
                  <div className="font-semibold text-slate-900">{data.group ?? 'Main Draw'}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <Trophy className="w-4 h-4 text-purple-600" />
                    Tournament Round
                  </div>
                  <div className="font-semibold text-slate-900">Round {round}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    Match Date
                  </div>
                  <div className="font-semibold text-slate-900">{formatDate(createdAt) || 'TBD'}</div>
                </div>
              </div>
            </div>

            {/* Head-to-Head & Statistics */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                Head-to-Head Statistics
              </h3>
              
              {/* H2H Record */}
              <div className="mb-6 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold text-emerald-600">{headToHead.aWinsAgainstB}</div>
                    <div className="text-sm text-slate-600 mt-1">{playerA.firstName} Wins</div>
                  </div>
                  <div className="px-4 py-2 bg-white rounded-lg border border-slate-200">
                    <div className="text-sm font-semibold text-slate-600">Previous Meetings</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold text-blue-600">{headToHead.bWinsAgainstA}</div>
                    <div className="text-sm text-slate-600 mt-1">{playerB.firstName} Wins</div>
                  </div>
                </div>
              </div>

              {/* Player Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Player A Stats */}
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                  <div className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    {playerA.firstName} {playerA.lastName}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Matches Played</span>
                      <span className="font-bold text-slate-900">{playerAStats?.matchesPlayed ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Matches Won</span>
                      <span className="font-bold text-emerald-600">{playerAStats?.matchesWon ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Win Rate</span>
                      <span className="font-bold text-slate-900">{playerAWinRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Current Form</span>
                      <span className="font-bold text-slate-900">{playerAForm}%</span>
                    </div>
                  </div>
                  {/* Win Rate Bar */}
                  <div className="mt-4">
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all"
                        style={{ width: `${playerAWinRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Player B Stats */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <div className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    {playerB.firstName} {playerB.lastName}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Matches Played</span>
                      <span className="font-bold text-slate-900">{playerBStats?.matchesPlayed ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Matches Won</span>
                      <span className="font-bold text-blue-600">{playerBStats?.matchesWon ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Win Rate</span>
                      <span className="font-bold text-slate-900">{playerBWinRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Current Form</span>
                      <span className="font-bold text-slate-900">{playerBForm}%</span>
                    </div>
                  </div>
                  {/* Win Rate Bar */}
                  <div className="mt-4">
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full transition-all"
                        style={{ width: `${playerBWinRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Prediction */}
              <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-6 h-6" />
                  <div className="text-lg font-bold">Match Prediction</div>
                </div>
                <div className="text-3xl font-bold mt-2">{expected ?? 'Even Match'}</div>
                <div className="text-emerald-100 text-sm mt-2">
                  Based on head-to-head record, recent form, and win rates
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">Total Wins</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{playerA.firstName}</span>
                    <span className="font-bold text-emerald-600">{playerAStats?.matchesWon ?? 0}</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">Total Wins</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{playerB.firstName}</span>
                    <span className="font-bold text-blue-600">{playerBStats?.matchesWon ?? 0}</span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                  <div className="text-xs text-slate-500 mb-1">Head-to-Head</div>
                  <div className="font-bold text-slate-900 text-center text-lg">
                    {headToHead.aWinsAgainstB} - {headToHead.bWinsAgainstA}
                  </div>
                  <div className="text-xs text-center text-slate-600 mt-1">
                    {playerA.firstName} vs {playerB.firstName}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <Link 
                  href={`/matches`} 
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  <Trophy className="w-4 h-4" />
                  All Matches
                </Link>
                <Link 
                  href={`/players/${playerA.id}`} 
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg font-semibold transition-all"
                >
                  View {playerA.firstName}'s Profile
                </Link>
                <Link 
                  href={`/players/${playerB.id}`} 
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg font-semibold transition-all"
                >
                  View {playerB.firstName}'s Profile
                </Link>
              </div>
            </div>

            {/* Match Insights */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Match Insights
              </h3>
              <ul className="space-y-2 text-sm text-amber-50">
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>This match was played in Round {round}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>{playerA.firstName} has a {playerAWinRate}% overall win rate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>{playerB.firstName} has a {playerBWinRate}% overall win rate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Previous meetings: {headToHead.aWinsAgainstB + headToHead.bWinsAgainstA} matches</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}