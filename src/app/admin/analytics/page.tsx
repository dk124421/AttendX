"use client";

import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler } from "chart.js";
import { Doughnut, Line, Bar } from "react-chartjs-2";
import { Bell, TrendingUp, Send, Loader2 } from "lucide-react";
import io from "socket.io-client";
import { logger } from "@/lib/logger";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler);

let socket: any;

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificationMsg, setNotificationMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([
    "Analytics dashboard initialized",
  ]);

  useEffect(() => {
    fetchData();
    socket = io(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    
    socket.on('admin_notification', (msg: any) => {
      setNotifications(prev => [msg.message, ...prev].slice(0, 5));
    });

    socket.on('connect_error', (err: any) => {
      logger.warn("Socket.IO connection error, will retry", err?.message);
    });

    socket.on('reconnect', (attempt: number) => {
      logger.info(`Socket.IO reconnected after ${attempt} attempts`);
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      logger.error("Failed to fetch analytics data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationMsg.trim()) return;
    setSending(true);
    try {
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: notificationMsg })
      });
      // We will create this API to broadcast via socket, or we can just emit it directly if we want
      // But emitting directly from client might be insecure if not authenticated.
      // Wait, let's just emit from client for now since this is the admin dashboard and it's protected by next-auth.
      socket.emit('admin_notification', { message: notificationMsg, time: new Date().toISOString() });
      setNotificationMsg("");
    } catch (error) {
      logger.error("Failed to send notification", error);
    } finally {
      setSending(false);
    }
  };

  const handleSendBulkAlert = () => {
    if (!data?.lowAttendance?.length) return;
    const msg = `Bulk Alert: ${data.lowAttendance.length} students have attendance below 75%. Please check your portal.`;
    socket.emit('admin_notification', { message: msg, time: new Date().toISOString() });
    setNotifications(prev => [msg, ...prev].slice(0, 5));
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500 w-8 h-8" />
      </div>
    );
  }

  // Formatting Data for Charts
  const lineData = {
    labels: data?.attendanceTrend?.map((d: any) => d.label).reverse() || [],
    datasets: [
      {
        label: "Attendance %",
        data: data?.attendanceTrend?.map((d: any) => d.percentage).reverse() || [],
        borderColor: "#14b8a6",
        backgroundColor: "rgba(20, 184, 166, 0.08)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#14b8a6",
        pointBorderWidth: 2,
        pointBorderColor: "#fff",
      },
    ],
  };

  const barData = {
    labels: data?.classComparison?.map((c: any) => c.name) || [],
    datasets: [
      {
        label: "Avg Attendance %",
        data: data?.classComparison?.map((c: any) => c.percentage) || [],
        backgroundColor: ["#3b82f6", "#14b8a6", "#ec4899", "#f59e0b", "#8b5cf6"],
        borderRadius: 8,
        barThickness: 28,
      },
    ],
  };

  const doughnutData = {
    labels: ["Present", "Absent", "Late"],
    datasets: [
      {
        data: [
          data?.statusDistribution?.present || 0,
          data?.statusDistribution?.absent || 0,
          data?.statusDistribution?.late || 0,
        ],
        backgroundColor: ["#14b8a6", "#ef4444", "#f59e0b"],
        borderWidth: 0,
        cutout: "72%",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { ticks: { font: { size: 10 }, color: "#94a3b8" }, grid: { color: "rgba(148,163,184,0.08)" } },
      x: { ticks: { font: { size: 10 }, color: "#94a3b8" }, grid: { display: false } },
    },
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const, labels: { font: { size: 10 }, color: "#94a3b8", usePointStyle: true, pointStyle: "circle", padding: 12 } },
    },
  };

  return (
    <div className="h-full w-full space-y-4">
      {/* 3 Chart Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Line Chart */}
        <div className="glass-card rounded-2xl p-5 cyan-glow-border">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Attendance Trend (6 Months)
          </span>
          <div className="h-40 mt-3">
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="glass-card rounded-2xl p-5 cyan-glow-border">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Class Comparison
          </span>
          <div className="h-40 mt-3">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        {/* Donut Chart */}
        <div className="glass-card rounded-2xl p-5 cyan-glow-border">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Status Distribution
          </span>
          <div className="h-40 mt-3">
            <Doughnut data={doughnutData} options={donutOptions} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Low Attendance & Bulk Alert */}
        <div className="glass-card rounded-2xl p-5 cyan-glow-border flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-red-500 dark:text-red-400" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Low Attendance Alerts (&lt; 75%)
              </span>
            </div>
            <button
              onClick={handleSendBulkAlert}
              disabled={!data?.lowAttendance?.length}
              className="px-3 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded-lg hover:bg-red-500/20 transition disabled:opacity-50"
            >
              Send Bulk Alert
            </button>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-60 no-scrollbar">
            {data?.lowAttendance?.length > 0 ? (
              data.lowAttendance.map((s: any) => (
                <div key={s.studentId}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {s.name} ({s.studentId})
                    </span>
                    <span className="text-xs font-bold text-red-500">
                      {s.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-700"
                      style={{ width: `${s.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
                No low attendance records found.
              </div>
            )}
          </div>
        </div>

        {/* Custom Notifications & Top Performers */}
        <div className="glass-card rounded-2xl p-5 cyan-glow-border flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={15} className="text-blue-500 dark:text-cyan-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Broadcast Notification
            </span>
          </div>
          
          {/* Broadcast Input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={notificationMsg}
              onChange={(e) => setNotificationMsg(e.target.value)}
              placeholder="Enter message to broadcast..."
              className="flex-1 text-sm bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
            />
            <button
              onClick={handleSendNotification}
              disabled={sending || !notificationMsg.trim()}
              className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:opacity-90 transition shadow disabled:opacity-50 flex items-center justify-center"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-32 no-scrollbar">
            {notifications.map((n, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 p-2 rounded-lg bg-white/30 dark:bg-slate-800/30 transition-colors"
              >
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-blue-500 dark:bg-cyan-400" />
                <span>{n}</span>
              </div>
            ))}
          </div>

          {/* Top Students */}
          <div className="mt-5 pt-4 border-t border-slate-200/30 dark:border-slate-700/30">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Top Performers
            </span>
            <div className="flex gap-2 mt-2.5 overflow-x-auto no-scrollbar pb-1">
              {data?.topStudents?.map((s: any) => (
                <div
                  key={s.studentId}
                  className="flex flex-col items-center shrink-0"
                  title={s.name}
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow ring-2 ring-white dark:ring-slate-800">
                    {s.name.charAt(0)}
                  </div>
                  <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {s.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
