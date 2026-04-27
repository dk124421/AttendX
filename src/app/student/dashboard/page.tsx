"use client";

import { useEffect, useState } from "react";
import { Flame, Bell, TrendingUp, CalendarCheck, CheckCircle, XCircle, BookOpen, AlertTriangle, ShieldAlert } from "lucide-react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import socket from "@/lib/socketClient";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

interface SubjectProgress {
  subject: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
}

interface TodayAttendance {
  subject: string;
  status: string;
}

interface DashboardData {
  overallPercentage: number;
  currentStreak: number;
  subjectProgress: SubjectProgress[];
  todayAttendance: TodayAttendance[];
  todayPercentage: number;
}

const progressColors = [
  "bg-blue-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-teal-500",
];

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    fetchDashboard();

    socket.on("attendance_updated", (evt: any) => {
      setNotifications((prev) => [
        `Attendance marked for ${evt.subject || "a class"} at ${evt.timeStamp || "now"}`,
        ...prev.slice(0, 4),
      ]);
      // Refresh data when attendance is marked
      fetchDashboard();
    });

    socket.on("admin_notification", (msg: any) => {
      setNotifications((prev) => [
        `[ADMIN]: ${msg.message}`,
        ...prev.slice(0, 4),
      ]);
    });

    return () => {
      socket.off("attendance_updated");
      socket.off("admin_notification");
    };
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/student/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Use fallback data
    } finally {
      setLoading(false);
    }
  };

  const overall = data?.overallPercentage ?? 0;
  const streak = data?.currentStreak ?? 0;
  const todayPct = data?.todayPercentage ?? 0;
  const todayAttendance = data?.todayAttendance ?? [];
  const subjectProgress = data?.subjectProgress ?? [];

  // Doughnut data
  const doughnutData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        data: [overall, 100 - overall],
        backgroundColor: ["#14b8a6", "#e2e8f0"],
        borderWidth: 0,
        cutout: "78%",
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };

  // Line chart data
  const lineData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      {
        label: "Attendance",
        data: [90, 85, 95, 88, 92, 87],
        borderColor: "#14b8a6",
        backgroundColor: "rgba(20, 184, 166, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#14b8a6",
        pointBorderWidth: 2,
        pointBorderColor: "#fff",
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 60, max: 100, ticks: { font: { size: 10 }, color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.08)" } },
      x: { ticks: { font: { size: 10 }, color: "#94a3b8" }, grid: { display: false } },
    },
    plugins: { legend: { display: false } },
  };

  return (
    <div className="h-full w-full space-y-4">
      {/* ──── Attendance Warning Banners ──── */}
      {!loading && overall < 75 && (
        <div className="rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 p-4 shadow-lg animate-pulse-slow">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">🚫 Debarment Warning</h3>
              <p className="text-red-100 text-xs mt-0.5">
                Your attendance is <strong className="text-white">{overall}%</strong> which is below the required 75%. 
                You are at risk of being debarred from examinations. Please attend classes regularly.
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && overall >= 75 && overall < 80 && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">⚠️ Low Attendance Alert</h3>
              <p className="text-amber-100 text-xs mt-0.5">
                Your attendance is <strong className="text-white">{overall}%</strong> — dangerously close to the 75% threshold. 
                Maintain regular attendance to avoid debarment.
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && streak === 0 && data && (
        <div className="rounded-2xl bg-gradient-to-r from-slate-600 to-slate-700 p-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-amber-300" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">
                Your attendance streak is broken. Mark your presence today to start a new streak! 🔥
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Attendance Donut */}
        <div className="glass-card rounded-2xl p-5 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Overall Attendance
          </p>
          <div className="relative h-32 w-32">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-slate-900">
                {overall}%
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Present</span>
            </div>
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="glass-card rounded-2xl p-5 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Today's Attendance
          </p>
          <div className="flex items-center gap-2">
            <CalendarCheck className="text-blue-500" size={28} />
            <span className="text-3xl font-extrabold text-slate-900">
              {todayPct}%
            </span>
          </div>
          <span className="text-xs text-slate-400 font-semibold mt-1">
            {todayAttendance.filter(a => a.status === "PRESENT").length}/{todayAttendance.length} Classes
          </span>
        </div>

        {/* Streak */}
        <div className="glass-card rounded-2xl p-5 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Current Streak
          </p>
          <div className="flex items-center gap-2">
            <Flame className="text-orange-500" size={28} />
            <span className="text-3xl font-extrabold text-slate-900">
              {streak}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-semibold mt-1">
            Days 🔥
          </span>
        </div>

        {/* Notifications */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={15} className="text-blue-500" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Notifications
            </span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar">
            {notifications.map((n, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-slate-600"
              >
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-blue-500" />
                <span>{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Daily Attendance */}
      {todayAttendance.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck size={15} className="text-emerald-500" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Today's Classes
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {todayAttendance.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  item.status === "PRESENT"
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-rose-50 border-rose-200"
                }`}
              >
                {item.status === "PRESENT" ? (
                  <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                ) : (
                  <XCircle size={16} className="text-rose-500 shrink-0" />
                )}
                <span className="text-xs font-semibold text-slate-700 truncate">{item.subject}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Middle Row — Weekly Chart */}
      <div className="glass-card rounded-2xl p-5">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
          Weekly Attendance
        </span>
        <div className="h-40 mt-3">
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      {/* Bottom — Subject Progress with Total/Attended counts */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={15} className="text-blue-500" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Subject Progress
          </span>
        </div>
        {subjectProgress.length === 0 && !loading ? (
          <p className="text-sm text-slate-400 text-center py-6">No subject data available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200/50">
                  <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                  <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Total Classes</th>
                  <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Attended</th>
                  <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {subjectProgress.map((s, idx) => (
                  <tr key={s.subject} className="hover:bg-white/30 transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-2.5 w-2.5 rounded-full ${progressColors[idx % progressColors.length]}`} />
                        <span className="text-sm font-semibold text-slate-700">{s.subject}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-bold text-slate-600">{s.totalClasses}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-bold text-emerald-600">{s.attendedClasses}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-200/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${progressColors[idx % progressColors.length]} rounded-full transition-all duration-700`}
                            style={{ width: `${Math.round(s.percentage)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-500 w-10 text-right">
                          {Math.round(s.percentage)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
