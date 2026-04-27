"use client";

import { useEffect, useState } from "react";
import { Layers, Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, XCircle, X } from "lucide-react";

interface AttendanceRecord {
  date: string;
  status: string;
  subject: string | null;
}

interface ClassInfo {
  id: string;
  name: string;
  department: string;
  year: string;
  attendance: AttendanceRecord[];
  totalClasses: number;
  presentClasses: number;
}

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/student/classes");
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const getDayAttendance = (day: number) => {
    if (!selectedClass) return [];
    const startOfDay = new Date(year, month, day, 0, 0, 0).getTime();
    const endOfDay = new Date(year, month, day, 23, 59, 59).getTime();

    return selectedClass.attendance.filter((a) => {
      const time = new Date(a.date).getTime();
      return time >= startOfDay && time <= endOfDay;
    });
  };

  const classColors = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-purple-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-600",
    "from-rose-500 to-red-600",
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-xl bg-white/40 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-white/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">My Classes</h2>
        <p className="text-slate-500 text-sm">Click on a class to view your attendance calendar</p>
      </div>

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Layers size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 text-sm">No classes assigned yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls, i) => {
            const percentage = cls.totalClasses > 0
              ? Math.round((cls.presentClasses / cls.totalClasses) * 100)
              : 0;
            const isSelected = selectedClass?.id === cls.id;

            return (
              <button
                key={cls.id}
                onClick={() => {
                  setSelectedClass(isSelected ? null : cls);
                  setCurrentDate(new Date());
                }}
                className={`glass-card rounded-2xl p-5 text-left hover:shadow-lg transition-all duration-300 group cursor-pointer border-2 ${
                  isSelected
                    ? "border-blue-400 shadow-lg shadow-blue-100 scale-[1.02]"
                    : "border-transparent hover:border-blue-200"
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${classColors[i % classColors.length]} flex items-center justify-center text-white shadow-lg shrink-0 group-hover:scale-110 transition-transform`}>
                    <Layers size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{cls.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">{cls.department || "Department"}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Year: {cls.year}</p>
                  </div>
                </div>

                {/* Attendance Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-semibold">Attendance</span>
                    <span className={`font-bold ${
                      percentage >= 75 ? "text-emerald-600" : percentage >= 50 ? "text-amber-600" : "text-rose-600"
                    }`}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        percentage >= 75 ? "bg-emerald-500" : percentage >= 50 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>{cls.presentClasses} Present</span>
                    <span>{cls.totalClasses} Total</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Attendance Calendar — shown when a class is selected */}
      {selectedClass && (
        <div className="glass-card rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon className="text-blue-500" size={20} />
              {selectedClass.name} — Attendance Calendar
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-slate-700 min-w-[100px] text-center">
                  {monthName} {year}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-500 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all"
                title="Close Calendar"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-2">
                {day}
              </div>
            ))}
            
            {/* Empty slots for first day */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="p-1" />
            ))}

            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const records = getDayAttendance(day);
              
              let isPresent = false;
              let isAbsent = false;
              records.forEach(r => {
                if (r.status === "PRESENT") isPresent = true;
                if (r.status === "ABSENT") isAbsent = true;
              });

              let bgClass = "bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-blue-50/50";
              let textClass = "text-slate-600";
              let statusIcon = null;
              
              if (isPresent && isAbsent) {
                bgClass = "bg-amber-50 border-amber-200";
                textClass = "text-amber-700 font-bold";
                statusIcon = <div className="flex gap-0.5 mt-1"><CheckCircle size={10} className="text-emerald-500" /><XCircle size={10} className="text-rose-500" /></div>;
              } else if (isPresent) {
                bgClass = "bg-emerald-50 border-emerald-200";
                textClass = "text-emerald-700 font-bold";
                statusIcon = <CheckCircle size={14} className="text-emerald-500 mt-1" />;
              } else if (isAbsent) {
                bgClass = "bg-rose-50 border-rose-200";
                textClass = "text-rose-700 font-bold";
                statusIcon = <XCircle size={14} className="text-rose-500 mt-1" />;
              }

              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              if (isToday && !isPresent && !isAbsent) {
                bgClass = "bg-blue-50 border-blue-200 ring-2 ring-blue-500/20";
                textClass = "text-blue-700 font-bold";
              }

              return (
                <div key={day} className={`relative flex flex-col items-center p-1.5 sm:p-2 rounded-xl border transition-all min-h-[60px] sm:min-h-[70px] ${bgClass}`}>
                  <span className={`text-xs ${textClass}`}>{day}</span>
                  {statusIcon}
                  {records.length > 0 && (
                    <div className="mt-auto flex flex-col gap-0.5 w-full">
                      {records.slice(0, 2).map((r, idx) => (
                        <div 
                          key={idx} 
                          className={`text-[7px] sm:text-[8px] px-1 py-0.5 rounded-md truncate font-semibold text-center
                            ${r.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}
                          `}
                        >
                          {r.status === "PRESENT" ? "P" : "A"}
                        </div>
                      ))}
                      {records.length > 2 && (
                        <div className="text-[7px] text-slate-400 font-bold text-center">+{records.length - 2}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 items-center justify-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-white py-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5">
              <CheckCircle size={12} className="text-emerald-500" />
              Present
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle size={12} className="text-rose-500" />
              Absent
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-200"></div>
              Mixed
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-200"></div>
              Today
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
