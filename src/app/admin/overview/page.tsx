"use client";

import { useEffect, useState } from "react";
import { Users, LayoutGrid, CheckCircle2, ChevronRight, GraduationCap, UserCircle, BookOpen, Send, Megaphone } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface ClassAttendance {
  id: string;
  name: string;
  present: number;
  total: number;
}

interface OverviewData {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendancePercentage: number;
<<<<<<< HEAD
  recentClasses: { id: string; name: string; year: string; department: string }[];
  classAttendance: ClassAttendance[];
=======
  recentClasses: { id: string; name: string; year: string; department: string; studentCount: number; teacherName: string | null }[];
  recentSubjects: { id: string; name: string; code: string; sem?: string; year?: string }[];
>>>>>>> a49a31928021f612845626652408e5e0c8112ad0
}

const classColors = ["bg-emerald-500", "bg-indigo-500", "bg-pink-500", "bg-blue-500", "bg-amber-500"];

export default function AdminOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  // Custom notification state
  const [notifMessage, setNotifMessage] = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await fetch("/api/admin/overview");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notifMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    setSendingNotif(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: notifMessage }),
      });
      if (res.ok) {
        toast.success("Notification sent to all students!");
        setNotifMessage("");
      } else {
        toast.error("Failed to send notification");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSendingNotif(false);
    }
  };

  const totalStudents = data?.totalStudents ?? 0;
  const totalTeachers = data?.totalTeachers ?? 0;
  const totalClasses = data?.totalClasses ?? 0;
  const attendance = data?.attendancePercentage ?? 0;
  const recentClasses = data?.recentClasses ?? [];
  const classAttendance = data?.classAttendance ?? [];

  return (
    <div className="h-full w-full">
      <div className="glass-card rounded-2xl p-6 space-y-6">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Students */}
          <div className="rounded-xl p-5 bg-white/40 border border-slate-100 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Students
              </h3>
              <GraduationCap className="text-slate-400" size={18} />
            </div>
            {loading ? (
              <div className="h-9 w-20 bg-slate-100 rounded mt-2 animate-pulse" />
            ) : (
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {totalStudents.toLocaleString()}
              </p>
            )}
          </div>

          {/* Total Teachers */}
          <div className="rounded-xl p-5 bg-white/40 border border-slate-100 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Teachers
              </h3>
              <UserCircle className="text-slate-400" size={18} />
            </div>
            {loading ? (
              <div className="h-9 w-20 bg-slate-100 rounded mt-2 animate-pulse" />
            ) : (
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {totalTeachers.toLocaleString()}
              </p>
            )}
          </div>

          {/* Today's Attendance */}
          <div className="rounded-xl p-5 bg-white/40 border border-slate-100 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Today's Attendance
              </h3>
              <CheckCircle2 className="text-emerald-500" size={18} />
            </div>
            {loading ? (
              <div className="h-9 w-20 bg-slate-100 rounded mt-2 animate-pulse" />
            ) : (
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {attendance}%
              </p>
            )}
            <div className="mt-3 h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 rounded-full transition-all duration-700"
                style={{ width: `${attendance}%` }}
              />
            </div>
          </div>
        </div>

        {/* Class-wise Attendance Stats */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-slate-800 px-1">
            Class-wise Attendance Today
          </h4>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-slate-100/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : classAttendance.length === 0 ? (
            <p className="text-xs text-slate-400 px-2.5 py-4 text-center">No classes found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {classAttendance.map((cls, i) => {
                const pct = cls.total > 0 ? Math.round((cls.present / cls.total) * 100) : 0;
                return (
                  <div
                    key={cls.id}
                    className="rounded-xl p-4 bg-white/50 border border-slate-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${classColors[i % classColors.length]} text-white font-bold text-xs shadow-sm`}
                        >
                          {cls.name?.charAt(0) || "C"}
                        </div>
                        <span className="font-semibold text-sm text-slate-700">{cls.name}</span>
                      </div>
                      <span className={`text-lg font-extrabold ${pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {cls.present}/{cls.total}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lists Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quick Stats */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-800 px-1">
              Quick Stats
            </h4>
            <div className="space-y-1">
              <Link
                href="/admin/students"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-100/60 text-emerald-600">
                    <GraduationCap size={14} />
                  </div>
                  <span className="font-medium text-sm text-slate-700 group-hover:text-blue-600 transition-colors">
                    {loading ? "..." : totalStudents} Students
                  </span>
                </div>
                <ChevronRight
                  size={14}
                  className="text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/admin/teachers"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-100/60 text-blue-600">
                    <UserCircle size={14} />
                  </div>
                  <span className="font-medium text-sm text-slate-700 group-hover:text-blue-600 transition-colors">
                    {loading ? "..." : totalTeachers} Teachers
                  </span>
                </div>
                <ChevronRight
                  size={14}
                  className="text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="/admin/classes"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-100/60 text-purple-600">
                    <LayoutGrid size={14} />
                  </div>
                  <span className="font-medium text-sm text-slate-700 group-hover:text-blue-600 transition-colors">
                    {loading ? "..." : totalClasses} Classes
                  </span>
                </div>
                <ChevronRight
                  size={14}
                  className="text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>

          {/* Classes List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h4 className="font-bold text-sm text-slate-800">
                Recent Classes
              </h4>
              <Link
                href="/admin/classes"
                className="text-[11px] font-bold text-blue-500 hover:underline"
              >
                Manage
              </Link>
            </div>
            <div className="space-y-1">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100/50 rounded-xl animate-pulse" />
                ))
              ) : recentClasses.length === 0 ? (
                <p className="text-xs text-slate-400 px-2.5 py-4 text-center">No classes yet</p>
              ) : (
                recentClasses.map((item, i) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/50 transition-colors cursor-pointer group bg-white/20 border border-slate-100/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ${classColors[i % classColors.length]} text-white font-bold text-xs shadow-sm`}
                      >
                        {item.name?.charAt(0) || "C"}
                      </div>
                      <div>
                        <span className="font-medium text-sm text-slate-700 group-hover:text-blue-600 transition-colors block">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.studentCount} students{item.teacherName ? ` · ${item.teacherName}` : ""}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-0.5"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

<<<<<<< HEAD
  {/* Send Custom Notification */ }
  <div className="space-y-3">
    <div className="flex items-center gap-2 px-1">
      <Megaphone size={16} className="text-indigo-500" />
      <h4 className="font-bold text-sm text-slate-800">
        Send Notification to Students
      </h4>
    </div>
    <div className="flex gap-3">
      <input
        type="text"
        placeholder="Type a message to broadcast to all students..."
        value={notifMessage}
        onChange={(e) => setNotifMessage(e.target.value)}
        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
      />
      <button
        onClick={handleSendNotification}
        disabled={sendingNotif || !notifMessage.trim()}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-200"
      >
        <Send size={14} />
        {sendingNotif ? "Sending..." : "Send"}
      </button>
=======
          {/* Subjects List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h4 className="font-bold text-sm text-slate-800">
            Subjects
          </h4>
          <Link
            href="/admin/subjects"
            className="text-[11px] font-bold text-blue-500 hover:underline"
          >
            Manage
          </Link>
        </div>
        <div className="space-y-1">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-10 bg-slate-100/50 rounded-xl animate-pulse" />
            ))
          ) : recentSubjects.length === 0 ? (
            <p className="text-xs text-slate-400 px-2.5 py-4 text-center">No subjects yet</p>
          ) : (
            recentSubjects.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/50 transition-colors cursor-pointer group bg-white/20 border border-slate-100/50"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${subjectColors[i % subjectColors.length]} text-white font-bold text-xs shadow-sm`}
                  >
                    {item.name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <span className="font-medium text-sm text-slate-700 group-hover:text-blue-600 transition-colors block">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.code}{item.sem ? ` · Sem ${item.sem}` : ""}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className="text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-0.5"
                />
              </div>
            ))
          )}
        </div>
>>>>>>> a49a31928021f612845626652408e5e0c8112ad0
      </div>
    </div>
  </div>
    </div >
  );
}
