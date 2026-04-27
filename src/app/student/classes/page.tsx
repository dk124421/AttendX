"use client";

import { useEffect, useState } from "react";
import { GraduationCap, BookOpen, Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, XCircle, UserCircle } from "lucide-react";

interface ClassInfo {
  id: string;
  name: string;
  department: string;
  year: string;
}

interface SubjectInfo {
  id: string;
  name: string;
  code: string;
  teacher: string;
}

interface AttendanceRecord {
  date: string;
  status: string;
  subject?: { name: string } | null;
}

export default function StudentClassesPage() {
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

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
        setClassInfo(data.class);
        setSubjects(data.subjects || []);
        setAttendance(data.attendance || []);
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
    // We want to match dates
    // Attendance dates are ISO strings, e.g. "2024-05-15T10:00:00.000Z"
    const startOfDay = new Date(year, month, day, 0, 0, 0).getTime();
    const endOfDay = new Date(year, month, day, 23, 59, 59).getTime();

    const records = attendance.filter((a) => {
      const time = new Date(a.date).getTime();
      return time >= startOfDay && time <= endOfDay;
    });

    return records;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-2xl bg-white/40 animate-pulse" />
        <div className="h-64 rounded-2xl bg-white/40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Class Info Card */}
      {classInfo ? (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
              <GraduationCap size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{classInfo.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{classInfo.department || "Department"}</p>
              <div className="flex items-center gap-2 mt-2">
                <CalendarIcon size={14} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Academic Year: {classInfo.year}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-slate-400">No class assigned yet.</p>
        </div>
      )}

      {/* Main Grid: Subjects vs Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Subjects */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1">
            Subjects ({subjects.length})
          </h3>
          {subjects.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center">
              <BookOpen size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-400 text-xs">No subjects assigned.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.map((sub, i) => {
                const colors = [
                  "from-blue-500 to-cyan-500",
                  "from-purple-500 to-pink-500",
                  "from-emerald-500 to-teal-500",
                  "from-amber-500 to-orange-500",
                ];
                return (
                  <div key={sub.id} className="glass-card rounded-2xl p-4 hover:shadow-lg transition-all group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0`}>
                        {sub.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{sub.name}</h4>
                        <p className="text-[10px] font-mono text-slate-400">{sub.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-slate-500 bg-slate-50 p-2 rounded-xl">
                      <UserCircle size={14} />
                      <p className="text-[10px] font-semibold truncate">{sub.teacher}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Calendar */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon className="text-blue-500" size={20} />
                Attendance Calendar
              </h3>
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
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 flex-1">
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
                
                // Determine dominant status if multiple records
                let isPresent = false;
                let isAbsent = false;
                records.forEach(r => {
                  if (r.status === "PRESENT") isPresent = true;
                  if (r.status === "ABSENT") isAbsent = true;
                });

                let bgClass = "bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-blue-50/50";
                let textClass = "text-slate-600";
                
                if (isPresent && isAbsent) {
                  bgClass = "bg-amber-50 border-amber-200"; // Partial attendance
                  textClass = "text-amber-700 font-bold";
                } else if (isPresent) {
                  bgClass = "bg-emerald-50 border-emerald-200";
                  textClass = "text-emerald-700 font-bold";
                } else if (isAbsent) {
                  bgClass = "bg-rose-50 border-rose-200";
                  textClass = "text-rose-700 font-bold";
                }

                // Check if it's today
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                if (isToday && !isPresent && !isAbsent) {
                  bgClass = "bg-blue-50 border-blue-200 ring-2 ring-blue-500/20";
                  textClass = "text-blue-700 font-bold";
                }

                return (
                  <div key={day} className={`relative flex flex-col p-1.5 sm:p-2 rounded-xl border transition-all min-h-[60px] sm:min-h-[80px] ${bgClass}`}>
                    <span className={`text-xs ${textClass}`}>{day}</span>
                    
                    {records.length > 0 && (
                      <div className="mt-auto flex flex-col gap-0.5">
                        {records.slice(0, 2).map((r, idx) => (
                          <div 
                            key={idx} 
                            className={`text-[8px] sm:text-[9px] px-1 py-0.5 rounded-md truncate font-semibold
                              ${r.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}
                            `}
                            title={r.subject?.name || "General"}
                          >
                            {r.subject?.name?.substring(0, 10) || "Gen"}
                          </div>
                        ))}
                        {records.length > 2 && (
                          <div className="text-[8px] text-slate-400 font-bold text-center">+{records.length - 2}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 flex flex-wrap gap-4 items-center justify-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-white py-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-200"></div>
                Present
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-rose-100 border border-rose-200"></div>
                Absent
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-200"></div>
                Mixed
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
