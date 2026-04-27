"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, X, Trash2,
  CalendarDays, Sun, PartyPopper, GraduationCap, AlertTriangle
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

export default function AdminCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [addForm, setAddForm] = useState({ title: "", date: "", type: "HOLIDAY" as string });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/calendar?month=${currentMonth + 1}&year=${currentYear}`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentMonth, currentYear]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
  };

  // Calendar grid calculation
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
    const date = new Date(currentYear, currentMonth, day);
    const dow = date.getDay();
    return dow === 0 || dow === 6; // Sunday or Saturday
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        toast.success("Event added!");
        setShowAddModal(false);
        setAddForm({ title: "", date: "", type: "HOLIDAY" });
        fetchEvents();
      } else {
        toast.error("Failed to add event");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      const res = await fetch(`/api/admin/calendar?id=${eventToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Event deleted!");
        setShowDeleteModal(false);
        setEventToDelete(null);
        fetchEvents();
      } else {
        toast.error("Failed to delete event");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const calendarCells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px]" />);
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    const weekend = isWeekend(day);
    const todayHighlight = isToday(day);

    calendarCells.push(
      <div
        key={day}
        className={`min-h-[80px] sm:min-h-[100px] rounded-xl border p-1.5 sm:p-2 transition-all cursor-pointer hover:shadow-md relative group ${
          todayHighlight
            ? "border-blue-400 bg-blue-50/50 ring-2 ring-blue-200"
            : weekend
            ? "border-rose-100 bg-rose-50/30"
            : "border-slate-100 bg-white/60 hover:bg-white"
        }`}
        onClick={() => {
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          setAddForm({ title: "", date: dateStr, type: "HOLIDAY" });
          setShowAddModal(true);
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs sm:text-sm font-bold ${
            todayHighlight ? "text-blue-600" : weekend ? "text-rose-400" : "text-slate-700"
          }`}>
            {day}
          </span>
          {weekend && dayEvents.length === 0 && (
            <span className="text-[8px] font-bold text-rose-300 uppercase hidden sm:block">Holiday</span>
          )}
        </div>
        {/* Events */}
        <div className="space-y-0.5">
          {dayEvents.slice(0, 2).map(ev => {
            const color = EVENT_COLORS[ev.type] || EVENT_COLORS.EVENT;
            return (
              <div
                key={ev.id}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-semibold ${color.bg} ${color.text} ${color.border} border group/event`}
                onClick={(e) => { e.stopPropagation(); }}
              >
                <div className={`h-1.5 w-1.5 rounded-full ${color.dot} shrink-0`} />
                <span className="truncate flex-1">{ev.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEventToDelete(ev);
                    setShowDeleteModal(true);
                  }}
                  className="opacity-0 group-hover/event:opacity-100 text-rose-400 hover:text-rose-600 shrink-0 transition-opacity"
                >
                  <Trash2 size={10} />
                </button>
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
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Academic Calendar</h1>
          <p className="text-sm text-slate-500">
            Manage holidays, events, and exams. Saturdays & Sundays are holidays by default.
          </p>
        </div>
        <button
          onClick={() => {
            setAddForm({ title: "", date: "", type: "HOLIDAY" });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-200"
        >
          <Plus size={18} />
          Add Event
        </button>
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
          <span className="text-xs font-medium text-slate-600">Weekend (default holiday)</span>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              className="h-9 w-9 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 min-w-[180px] text-center">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={nextMonth}
              className="h-9 w-9 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            Today
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS.map((day, i) => (
            <div
              key={day}
              className={`py-2.5 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest ${
                i === 0 || i === 6 ? "text-rose-400" : "text-slate-400"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 p-2 sm:p-3">
          {calendarCells}
        </div>
      </div>

      {/* Upcoming Events List */}
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
                <div
                  key={ev.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl ${color.bg} ${color.border} border group`}
                >
                  <div className="flex items-center gap-3">
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
                  <button
                    onClick={() => { setEventToDelete(ev); setShowDeleteModal(true); }}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-rose-400 hover:bg-rose-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md overflow-hidden rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Add Calendar Event</h3>
                  <p className="text-sm text-slate-500">Add a holiday, event, or exam date.</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Republic Day, Mid-Semester Exam"
                    value={addForm.title}
                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Date</label>
                  <input
                    type="date"
                    required
                    value={addForm.date}
                    onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["HOLIDAY", "EVENT", "EXAM"] as const).map(type => {
                      const color = EVENT_COLORS[type];
                      const Icon = EVENT_ICONS[type];
                      const isSelected = addForm.type === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setAddForm({ ...addForm, type })}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? `${color.bg} ${color.border} ${color.text} shadow-sm`
                              : "border-slate-100 text-slate-400 hover:border-slate-200"
                          }`}
                        >
                          <Icon size={20} />
                          <span className="text-[10px] font-bold uppercase">{type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 rounded-xl bg-slate-100 p-3 font-semibold text-slate-600 hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-blue-600 p-3 font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-100 active:scale-95 transition-all"
                  >
                    Add Event
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && eventToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Event?</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Remove <span className="font-bold text-slate-700">{eventToDelete.title}</span> from the calendar?
                </p>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => { setShowDeleteModal(false); setEventToDelete(null); }}
                    className="flex-1 rounded-xl bg-slate-100 p-3 font-semibold text-slate-600 hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteEvent}
                    className="flex-1 rounded-xl bg-rose-600 p-3 font-bold text-white hover:bg-rose-700 shadow-lg shadow-rose-100 active:scale-95 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
