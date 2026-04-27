"use client";

import { useEffect, useState } from "react";
import { Send, Calendar as CalendarIcon, AlertTriangle, CheckCircle, X, History, Edit3, ClipboardCheck, BookOpen, Users } from "lucide-react";
import toast from "react-hot-toast";
import socket from "@/lib/socketClient";

export default function TeacherAttendance() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState<Record<string, string>>({});
  const [showAbsentReview, setShowAbsentReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Mode: "mark" for new attendance, "modify" for editing past
  const [mode, setMode] = useState<"mark" | "modify">("mark");
  const [pastDate, setPastDate] = useState("");
  const [pastRecords, setPastRecords] = useState<any[]>([]);
  const [loadingPast, setLoadingPast] = useState(false);
  const [modifying, setModifying] = useState(false);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);

  const [assignments, setAssignments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  );

  const fetchTodaySessions = async () => {
    try {
      const res = await fetch("/api/teacher/today");
      if (res.ok) {
        const data = await res.json();
        setTodaySessions(Array.isArray(data) ? data : []);
      }
    } catch {
      // silently ignore
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/teacher/assignments");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setAssignments(data);
        
        // Extract unique classes
        const uniqueClasses = Array.from(new Map(data.map(item => [item.class.id, item.class])).values()) as any[];
        setClasses(uniqueClasses);
        
        if (uniqueClasses.length > 0) {
          const defaultClass = uniqueClasses[0];
          setSelectedClass(defaultClass.id);
          setSelectedYear(defaultClass.year);
        }
      }
    } catch (err) {
      toast.error("Failed to load assignments");
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchTodaySessions();
  }, []);

  // When selected class changes, update available subjects
  useEffect(() => {
    if (selectedClass && assignments.length > 0) {
      const releventAssignments = assignments.filter(
        a => (a.class_id === selectedClass) && a.subject != null
      );
      const uniqueSubjects = Array.from(new Map(releventAssignments.map(item => [item.subject.id, item.subject])).values()) as any[];
      setSubjects(uniqueSubjects);
      if (uniqueSubjects.length > 0) {
        setSelectedSubject(uniqueSubjects[0].id);
      } else {
        setSelectedSubject("");
      }
      
      const cls = classes.find(c => c.id === selectedClass);
      if (cls) setSelectedYear(cls.year);
    }
  }, [selectedClass, assignments]);

  const fetchStudents = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/students?classId=${selectedClass}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setStudents(data);
        const init: Record<string, string> = {};
        data.forEach((s: any) => (init[s.id] = "PRESENT"));
        setMarking(init);
      } else {
        setStudents([]);
        setMarking({});
      }
    } catch {
      setStudents([]);
      setMarking({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass]);

  useEffect(() => {
    fetchStudents();
  }, []);

  // Get absent students list
  const absentStudents = students.filter(s => marking[s.id] === "ABSENT");

  const handleSubmitClick = () => {
    setShowAbsentReview(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    const attendanceData = Object.entries(marking).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    try {
      const currentSubjectName = subjects.find(s => s.id === selectedSubject)?.name || "Unknown";
      
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClass,
          subjectId: selectedSubject || null,
          date: new Date().toISOString(),
          attendanceData,
        }),
      });

      if (res.ok) {
        toast.success("Attendance submitted successfully!");
        socket.emit("attendance_marked", {
          classId: selectedClass,
          subject: currentSubjectName,
          timeStamp: new Date().toLocaleTimeString(),
        });
        setShowAbsentReview(false);
        // Refresh today's session summary
        fetchTodaySessions();
      } else {
        const errText = await res.text();
        toast.error(errText || "Failed to submit");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Past Attendance Modification ---
  const fetchPastAttendance = async () => {
    if (!pastDate) {
      toast.error("Please select a date");
      return;
    }
    setLoadingPast(true);
    try {
      // Send plain date (YYYY-MM-DD) — API will handle the full-day range
      const res = await fetch(
        `/api/teacher/attendance/modify?classId=${selectedClass}&subjectId=${selectedSubject}&date=${pastDate}`
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        setPastRecords(data);
        if (data.length === 0) {
          toast("No attendance records found for this date.", { icon: "📋" });
        }
      } else {
        toast.error("Failed to load records");
      }
    } catch {
      toast.error("Failed to fetch past records");
    } finally {
      setLoadingPast(false);
    }
  };

  const handleModifyRecord = async (record: any, newStatus: string) => {
    setModifying(true);
    try {
      const res = await fetch("/api/teacher/attendance/modify", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: record.student_id,
          classId: record.class_id,
          subjectId: record.subject_id,
          date: record.date,
          newStatus,
        }),
      });

      if (res.ok) {
        toast.success("Attendance updated!");
        // Update local state
        setPastRecords((prev) =>
          prev.map((r) =>
            r.id === record.id ? { ...r, status: newStatus } : r
          )
        );
      } else {
        const errText = await res.text();
        toast.error(errText || "Failed to modify");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setModifying(false);
    }
  };

  const todayLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="h-full w-full space-y-4">

      {/* ── Today's Submitted Sessions ── */}
      {todaySessions.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <ClipboardCheck size={16} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Today's Submitted Attendance</p>
              <p className="text-[10px] text-slate-400">{todayLabel}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todaySessions.map((session: any, i: number) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-white/60 p-4 flex flex-col gap-2">
                {/* Class */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center shrink-0">
                    <Users size={14} className="text-[#1e3a5f]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{session.className}</p>
                    {session.classYear && <p className="text-[10px] text-slate-400">Year: {session.classYear}</p>}
                  </div>
                </div>
                {/* Subject */}
                {session.subjectName && (
                  <div className="flex items-center gap-2">
                    <BookOpen size={13} className="text-blue-400 shrink-0" />
                    <span className="text-xs font-semibold text-slate-600">
                      {session.subjectName}
                      {session.subjectCode && <span className="text-slate-400 font-normal ml-1">({session.subjectCode})</span>}
                    </span>
                  </div>
                )}
                {/* Stats */}
                <div className="flex gap-2 mt-1">
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                    <CheckCircle size={11} />{session.present} Present
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold">
                    <X size={11} />{session.absent} Absent
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {new Date(session.submittedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Mode Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("mark")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            mode === "mark"
              ? "bg-[#1e3a5f] text-white shadow-lg"
              : "bg-white/80 text-slate-600 border border-slate-200 hover:bg-white"
          }`}
        >
          <Send size={15} />
          Mark Attendance
        </button>
        <button
          onClick={() => setMode("modify")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            mode === "modify"
              ? "bg-amber-500 text-white shadow-lg"
              : "bg-white/80 text-slate-600 border border-slate-200 hover:bg-white"
          }`}
        >
          <History size={15} />
          Modify Past Attendance
        </button>
      </div>

      {/* Shared Filters */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        {/* Filter Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-lg glass-input py-2 px-3 text-sm font-medium text-slate-700"
            >
              {classes.length === 0 && <option value="">No Classes Assigned</option>}
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
              Year
            </label>
            <select
              value={selectedYear}
              disabled
              className="w-full rounded-lg glass-input py-2 px-3 text-sm font-medium text-slate-700 opacity-80"
            >
              <option value={selectedYear}>{selectedYear || "—"}</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full rounded-lg glass-input py-2 px-3 text-sm font-medium text-slate-700"
            >
              <option value="">-- No Subject --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
              Date
            </label>
            <div className="relative">
              {mode === "mark" ? (
                <>
                  <input
                    type="text"
                    value={selectedDate}
                    readOnly
                    className="w-full rounded-lg glass-input py-2 px-3 pr-9 text-sm font-medium text-slate-700"
                  />
                  <CalendarIcon
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </>
              ) : (
                <input
                  type="date"
                  value={pastDate}
                  onChange={(e) => setPastDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-lg glass-input py-2 px-3 text-sm font-medium text-slate-700"
                />
              )}
            </div>
          </div>
        </div>
        {mode === "modify" && (
          <div className="flex justify-end pt-2">
            <button
              onClick={fetchPastAttendance}
              disabled={loadingPast || !pastDate}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50 shadow-lg"
            >
              {loadingPast ? "Loading..." : "Fetch Records"}
            </button>
          </div>
        )}
      </div>

      {/* MARK MODE */}
      {mode === "mark" && (
        <div className="glass-card rounded-2xl p-5 space-y-4">
          {/* Student Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200/50">
                  <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                    Present
                  </th>
                  <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                    Absent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {(loading ? [] : students).map((student, i) => (
                  <tr
                    key={student.id}
                    className={`hover:bg-white/30 transition-colors ${
                      i === 0 ? "bg-white/20" : ""
                    }`}
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                          {student.user.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {student.studentId}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-sm font-medium text-slate-800">
                        {student.user.name}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() =>
                          setMarking((prev) => ({ ...prev, [student.id]: "PRESENT" }))
                        }
                        className={`h-8 w-8 mx-auto rounded-lg border-2 text-xs font-extrabold transition-all duration-200 flex items-center justify-center ${
                          marking[student.id] === "PRESENT"
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30"
                            : "text-emerald-500 border-emerald-200 hover:bg-emerald-50"
                        }`}
                      >
                        P
                      </button>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() =>
                          setMarking((prev) => ({ ...prev, [student.id]: "ABSENT" }))
                        }
                        className={`h-8 w-8 mx-auto rounded-lg border-2 text-xs font-extrabold transition-all duration-200 flex items-center justify-center ${
                          marking[student.id] === "ABSENT"
                            ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/30"
                            : "text-rose-500 border-rose-200 hover:bg-rose-50"
                        }`}
                      >
                        A
                      </button>
                    </td>
                  </tr>
                ))}
                {loading && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 text-sm">
                      Loading roster...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmitClick}
              disabled={loading || students.length === 0}
              className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 shadow-lg
                bg-[#1e3a5f] text-white hover:bg-[#162d4a]"
            >
              <Send size={15} />
              Submit Attendance
            </button>
          </div>
        </div>
      )}

      {/* MODIFY MODE */}
      {mode === "modify" && (
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Edit3 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Modify Past Attendance</h2>
              <p className="text-xs text-slate-500">Edit past attendance records for the selected class and date.</p>
            </div>
          </div>

          {/* Past Records Table */}
          {pastRecords.length > 0 && (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200/50">
                    <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                      Current Status
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                      Change To
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {pastRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-white/30 transition-colors">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                            {record.student?.user?.name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {record.student?.user?.name || "Unknown"}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {record.student?.student_id || ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            record.status === "PRESENT"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleModifyRecord(record, "PRESENT")}
                            disabled={record.status === "PRESENT" || modifying}
                            className={`h-8 w-8 rounded-lg border-2 text-xs font-extrabold transition-all duration-200 flex items-center justify-center disabled:opacity-30 ${
                              record.status === "PRESENT"
                                ? "bg-emerald-500 text-white border-emerald-500"
                                : "text-emerald-500 border-emerald-200 hover:bg-emerald-50"
                            }`}
                          >
                            P
                          </button>
                          <button
                            onClick={() => handleModifyRecord(record, "ABSENT")}
                            disabled={record.status === "ABSENT" || modifying}
                            className={`h-8 w-8 rounded-lg border-2 text-xs font-extrabold transition-all duration-200 flex items-center justify-center disabled:opacity-30 ${
                              record.status === "ABSENT"
                                ? "bg-rose-500 text-white border-rose-500"
                                : "text-rose-500 border-rose-200 hover:bg-rose-50"
                            }`}
                          >
                            A
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pastRecords.length === 0 && pastDate && !loadingPast && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No records found. Select a date and click &quot;Fetch Records&quot;.
            </div>
          )}
        </div>
      )}

      {/* Absent Students Review Modal */}
      {showAbsentReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Review Absent Students</h3>
                  <p className="text-xs text-slate-500">Please verify this list before final submission.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAbsentReview(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Absent Students List */}
            {absentStudents.length === 0 ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 mb-5">
                <CheckCircle size={20} className="text-emerald-500" />
                <p className="text-sm font-semibold text-emerald-700">
                  All students are marked Present! No absent students.
                </p>
              </div>
            ) : (
              <div className="mb-5">
                <p className="text-sm font-semibold text-slate-600 mb-3">
                  <span className="text-rose-500 font-bold">{absentStudents.length}</span> student{absentStudents.length > 1 ? "s" : ""} marked as Absent:
                </p>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {absentStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-rose-200 flex items-center justify-center text-rose-600 font-bold text-xs shrink-0">
                          {student.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{student.user.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">ID: {student.studentId}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setMarking((prev) => ({ ...prev, [student.id]: "PRESENT" }));
                        }}
                        className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        Mark Present
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowAbsentReview(false)}
                className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-600 hover:bg-slate-200 transition-all"
              >
                Go Back & Edit
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="flex-1 rounded-xl bg-[#1e3a5f] py-3 font-bold text-white hover:bg-[#162d4a] transition-all active:scale-95 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
              >
                {submitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Confirm & Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
