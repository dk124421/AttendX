"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Users, Star, Loader2, BarChart3 } from "lucide-react";
import toast from "react-hot-toast";

interface LeaderboardEntry {
  id: string;
  studentId: string;
  name: string;
  avatar: string;
  totalClasses: number;
  attended: number;
  percentage: number;
  rank: number;
  isMe?: boolean;
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [topPerformers, setTopPerformers] = useState<LeaderboardEntry[]>([]);
  const [bottomPerformers, setBottomPerformers] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  
  // Subject filter
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("overall");

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch("/api/student/classes");
        if (res.ok) {
          const data = await res.json();
          setSubjects(data.subjects || []);
        }
      } catch {}
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/student/leaderboard?subjectId=${selectedSubject}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setTopPerformers(data.top || []);
        setBottomPerformers(data.bottom || []);
        setMyRank(data.myRank || null);
      } catch {
        toast.error("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [selectedSubject]);

  const hasData = topPerformers.length > 0 || bottomPerformers.length > 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Leaderboard</h1>
          <p className="text-slate-500 text-sm mt-1">Top 5 and Bottom 5 attendance performers in your class.</p>
        </div>
        
        {/* Subject Filter */}
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="border-slate-200 bg-white text-slate-700 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm min-w-[200px]"
        >
          <option value="overall">Overall Attendance</option>
          <option value="general">General (No Subject)</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </header>

      {/* My Rank Card */}
      {!loading && myRank && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-4 flex items-center gap-4 border-2 border-blue-200"
        >
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-blue-400 flex items-center justify-center text-white font-black text-sm shrink-0">
            {myRank.avatar}
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Your Position</p>
            <p className="text-base font-bold text-slate-800">{myRank.name}</p>
            <p className="text-xs text-slate-400">{myRank.attended}/{myRank.totalClasses} classes · Rank #{myRank.rank}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-blue-600 font-black text-lg">
              <Star size={18} className="text-amber-400 fill-amber-400" />
              {myRank.percentage}%
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm font-medium">Loading leaderboard...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasData && (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
          <BarChart3 size={40} className="text-slate-300" />
          <h3 className="text-lg font-bold text-slate-600">No Attendance Data Yet</h3>
          <p className="text-sm text-slate-400 text-center max-w-xs">
            Once attendance is marked for your class, rankings will appear here.
          </p>
        </div>
      )}

      {/* Leaderboard Grid */}
      {!loading && hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top 5 Section */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <Trophy className="text-amber-500" size={22} />
              Top 5 Performers
            </h3>
            <div className="space-y-3">
              {topPerformers.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`group relative flex items-center justify-between rounded-2xl p-4 shadow-sm border transition-all
                    ${p.isMe
                      ? "bg-blue-50 border-blue-200 ring-2 ring-blue-300"
                      : "bg-white border-slate-100 hover:border-amber-200"
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 font-black text-sm">
                      {p.avatar}
                      {p.rank <= 3 && (
                        <div className="absolute -top-2 -left-2 rounded-full bg-amber-400 p-1 text-white shadow-sm">
                          <Award size={11} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 flex items-center gap-1.5">
                        {p.name}
                        {p.isMe && <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full">You</span>}
                      </p>
                      <p className="text-xs text-slate-400">Rank #{p.rank} · {p.attended}/{p.totalClasses} classes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-emerald-600 font-black">
                      <TrendingUp size={15} />
                      {p.percentage}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom 5 Section */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <Users className="text-rose-500" size={22} />
              Bottom 5 Performers
            </h3>
            <div className="space-y-3">
              {bottomPerformers.length === 0 ? (
                <div className="glass-card rounded-2xl p-5 text-center">
                  <p className="text-sm text-emerald-500 font-semibold">
                    🎉 Not enough data for bottom performers yet!
                  </p>
                </div>
              ) : (
                bottomPerformers.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`group flex items-center justify-between rounded-2xl p-4 shadow-sm border transition-all
                      ${p.isMe
                        ? "bg-blue-50 border-blue-200 ring-2 ring-blue-300"
                        : "bg-white border-slate-100 hover:border-rose-200"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 font-black text-sm group-hover:bg-rose-50 group-hover:text-rose-400 transition-colors">
                        {p.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 flex items-center gap-1.5">
                          {p.name}
                          {p.isMe && <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full">You</span>}
                        </p>
                        <p className="text-xs text-slate-400">Rank #{p.rank} · {p.attended}/{p.totalClasses} classes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-rose-500 font-black">
                        <TrendingDown size={15} />
                        {p.percentage}%
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
