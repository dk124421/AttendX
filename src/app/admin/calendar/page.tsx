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

const EVENT_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; gradient: string }> = {
  HOLIDAY: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500", gradient: "from-rose-500 to-pink-500" },
  EVENT: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500", gradient: "from-blue-500 to-indigo-500" },
  EXAM: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", gradient: "from-amber-500 to-orange-500" },
};

const EVENT_ICONS: Record<string, any> = {
  HOLIDAY: Sun,
  EVENT: PartyPopper,
  EXAM: GraduationCap,
};

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
    return dow === 0 || dow === 6;
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

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Academic Calendar</h1>
          <p className="text-sm text-slate-500">
            Manage holidays, events, and exams.
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

      {/* Main Layout: Left = Events List, Right = Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        {/* LEFT: Events / Reasons List */}
        <div className="space-y-4 order-2 lg:order-1">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 px-1">
            {(["HOLIDAY", "EVENT", "EXAM"] as const).map(type => {
              const color = EVENT_COLORS[type];
              const Icon = EVENT_ICONS[type];
              return (
                <div key={type} className="flex items-center gap-1.5">
                  <div className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />
                  <span className="text-xs font-medium text-slate-500">{type.charAt(0) + type.slice(1).toLowerCase()}</span>
                </div>
              );
            })}
          </div>

          {/* Events List Card */}
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <CalendarDays size={16} className="text-blue-500" />
                Events & Holidays — {MONTHS[currentMonth]} {currentYear}
              </h3>
            </div>

            <div className="divide-y divide-slate-50">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="px-5 py-4 animate-pulse">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 bg-slate-100 rounded" />
                        <div className="h-3 w-24 bg-slate-100 rounded" />
                      </div>
                    </div>
                  </div>
                ))
              ) : sortedEvents.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <CalendarDays size={32} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm text-slate-400 font-medium">No events this month</p>
                  <p className="text-xs text-slate-300 mt-1">Click "Add Event" to create one</p>
                </div>
              ) : (
                sortedEvents.map((ev, i) => {
                  const color = EVENT_COLORS[ev.type] || EVENT_COLORS.EVENT;
                  const Icon = EVENT_ICONS[ev.type] || CalendarDays;
                  const evDate = new Date(ev.date + "T00:00:00");
                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="px-5 py-3.5 flex items-center gap-4 group hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Date Badge */}
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color.gradient} text-white flex flex-col items-center justify-center shrink-0 shadow-sm`}>
                        <span className="text-lg font-extrabold leading-none">{evDate.getDate()}</span>
                        <span className="text-[8px] font-bold uppercase tracking-wider opacity-80">
                          {evDate.toLocaleDateString("en", { weekday: "short" })}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{ev.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${color.text}`}>
                            <Icon size={10} />
                            {ev.type}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {evDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => { setEventToDelete(ev); setShowDeleteModal(true); }}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Compact Calendar */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-4 self-start">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
            {/* Month Navigation */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <button
                onClick={prevMonth}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/70 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-center">
                <h2 className="text-sm font-bold text-slate-800">
                  {MONTHS[currentMonth]} {currentYear}
                </h2>
              </div>
              <button
                onClick={nextMonth}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/70 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Today Button */}
            <div className="px-4 py-2 border-b border-slate-50 flex justify-end">
              <button
                onClick={goToToday}
                className="px-3 py-1 rounded-lg text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                Today
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 px-3 pt-2">
              {DAYS.map((day, i) => (
                <div
                  key={day}
                  className={`py-1.5 text-center text-[10px] font-bold uppercase tracking-wider ${
                    i === 0 || i === 6 ? "text-rose-400" : "text-slate-400"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid — Compact */}
            <div className="grid grid-cols-7 gap-0.5 px-3 pb-3 pt-1">
              {/* Empty cells */}
              {Array(firstDay).fill(0).map((_, i) => (
                <div key={`e-${i}`} className="h-10" />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dayEvents = getEventsForDay(day);
                const weekend = isWeekend(day);
                const todayHighlight = isToday(day);
                const hasHoliday = dayEvents.some(e => e.type === "HOLIDAY");
                const hasEvent = dayEvents.some(e => e.type === "EVENT");
                const hasExam = dayEvents.some(e => e.type === "EXAM");

                return (
                  <div
                    key={day}
                    onClick={() => {
                      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      setAddForm({ title: "", date: dateStr, type: "HOLIDAY" });
                      setShowAddModal(true);
                    }}
                    className={`h-10 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all relative group hover:shadow-sm ${
                      todayHighlight
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : weekend
                        ? "bg-rose-50/60 text-rose-400 hover:bg-rose-100/60"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className={`text-xs font-bold ${todayHighlight ? "text-white" : ""}`}>
                      {day}
                    </span>
                    {/* Event dots */}
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {hasHoliday && <div className={`h-1 w-1 rounded-full ${todayHighlight ? "bg-white/80" : "bg-rose-500"}`} />}
                        {hasEvent && <div className={`h-1 w-1 rounded-full ${todayHighlight ? "bg-white/80" : "bg-blue-500"}`} />}
                        {hasExam && <div className={`h-1 w-1 rounded-full ${todayHighlight ? "bg-white/80" : "bg-amber-500"}`} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-extrabold text-rose-600">{events.filter(e => e.type === "HOLIDAY").length}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Holidays</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-blue-600">{events.filter(e => e.type === "EVENT").length}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Events</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-amber-600">{events.filter(e => e.type === "EXAM").length}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Exams</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Title / Reason</label>
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
