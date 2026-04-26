"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft, ChevronRight,
  CalendarDays, Sun, PartyPopper, GraduationCap
} from "lucide-react";
import toast from "react-hot-toast";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "HOLIDAY" | "EVENT" | "EXAM";
}

const EVENT_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  HOLIDAY: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
  EVENT: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  EXAM: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
};

const EVENT_ICONS: Record<string, any> = {
  HOLIDAY: Sun,
  EVENT: PartyPopper,
  EXAM: GraduationCap,
};

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ReadOnlyCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/calendar?month=${currentMonth + 1}&year=${currentYear}`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [currentMonth, currentYear]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };
  const goToToday = () => {
    setCurrentMonth(new Date().getMonth());
    setCurrentYear(new Date().getFullYear());
  };

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => e.date === dateStr);
  };

  const isWeekend = (day: number) => {
    const dow = new Date(currentYear, currentMonth, day).getDay();
    return dow === 0 || dow === 6;
  };

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px]" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    const weekend = isWeekend(day);
    const todayHighlight = isToday(day);

    calendarCells.push(
      <div
        key={day}
        className={`min-h-[80px] sm:min-h-[100px] rounded-xl border p-1.5 sm:p-2 transition-all ${
          todayHighlight
            ? "border-blue-400 bg-blue-50/50 ring-2 ring-blue-200"
            : weekend
            ? "border-rose-100 bg-rose-50/30"
            : "border-slate-100 bg-white/60"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs sm:text-sm font-bold ${
            todayHighlight ? "text-blue-600" : weekend ? "text-rose-400" : "text-slate-700"
          }`}>{day}</span>
          {weekend && dayEvents.length === 0 && (
            <span className="text-[8px] font-bold text-rose-300 uppercase hidden sm:block">Holiday</span>
          )}
        </div>
        <div className="space-y-0.5">
          {dayEvents.slice(0, 2).map(ev => {
            const color = EVENT_COLORS[ev.type] || EVENT_COLORS.EVENT;
            return (
              <div key={ev.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-semibold ${color.bg} ${color.text} ${color.border} border`}>
                <div className={`h-1.5 w-1.5 rounded-full ${color.dot} shrink-0`} />
                <span className="truncate">{ev.title}</span>
              </div>
            );
          })}
          {dayEvents.length > 2 && (
            <span className="text-[8px] text-slate-400 font-medium">+{dayEvents.length - 2} more</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Academic Calendar</h1>
        <p className="text-sm text-slate-500">View holidays, events, and exam schedules.</p>
      </header>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-5">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-rose-500" />
          <span className="text-xs font-medium text-slate-600">Holiday</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-xs font-medium text-slate-600">Event</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-xs font-medium text-slate-600">Exam</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-rose-50 border border-rose-200" />
          <span className="text-xs font-medium text-slate-600">Weekend</span>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        {/* Navigation */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="h-9 w-9 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 min-w-[180px] text-center">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button onClick={nextMonth} className="h-9 w-9 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
          <button onClick={goToToday} className="px-4 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
            Today
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS.map((day, i) => (
            <div key={day} className={`py-2.5 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest ${
              i === 0 || i === 6 ? "text-rose-400" : "text-slate-400"
            }`}>{day}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1 p-2 sm:p-3">
          {calendarCells}
        </div>
      </div>

      {/* Events List */}
      {events.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <CalendarDays size={16} className="text-blue-500" />
            Events This Month
          </h3>
          <div className="space-y-2">
            {events.map(ev => {
              const color = EVENT_COLORS[ev.type] || EVENT_COLORS.EVENT;
              const Icon = EVENT_ICONS[ev.type] || CalendarDays;
              return (
                <div key={ev.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${color.bg} ${color.border} border`}>
                  <div className={`h-8 w-8 rounded-lg ${color.bg} flex items-center justify-center`}>
                    <Icon size={16} className={color.text} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${color.text}`}>{ev.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {new Date(ev.date + 'T00:00:00').toLocaleDateString("en-IN", {
                        weekday: "long", day: "numeric", month: "short", year: "numeric"
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
