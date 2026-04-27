"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle, XCircle, Send } from "lucide-react";
import toast from "react-hot-toast";

interface DebarredStudent {
  name: string;
  studentId: string;
  percentage: number;
  totalClasses: number;
  attended: number;
  absent: number;
}

interface MonthlyReportResult {
  success: boolean;
  debarredCount: number;
  emailsSent: number;
  emailsFailed: number;
  debarredStudents: DebarredStudent[];
  error?: string;
}

export default function DebarredListPage() {
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportResult, setReportResult] = useState<MonthlyReportResult | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleGenerateMonthlyReport = async () => {
    setGeneratingReport(true);
    setReportResult(null);
    try {
      const res = await fetch("/api/alerts/monthly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: reportMonth, year: reportYear }),
      });
      const data = await res.json();
      setReportResult(data);
      setShowReportModal(true);
      if (data.success && data.debarredCount > 0) {
        toast.success(`Report generated! ${data.debarredCount} student(s) debarred`);
      } else if (data.success && data.debarredCount === 0) {
        toast.success("No students below 75% — All clear! 🎉");
      } else {
        toast.error(data.error || "Failed to generate report");
      }
    } catch {
      toast.error("Failed to generate monthly report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6 h-full w-full">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Debarred List</h2>
        <p className="text-slate-500 text-sm">Generate monthly reports and send debarment alerts.</p>
      </div>

      {/* ──── Monthly Debarred Report Section ──── */}
      <div className="glass-card rounded-2xl p-5 border-l-4 border-rose-400">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <Mail size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Monthly Debarred Report & Alerts</h3>
            <p className="text-xs text-slate-500">
              Generate debarred list ({"<"}75%) and send email alerts to students & teachers.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              Month
            </label>
            <select
              value={reportMonth}
              onChange={(e) => setReportMonth(parseInt(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white/60 p-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              {monthNames.map((name, i) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              Year
            </label>
            <select
              value={reportYear}
              onChange={(e) => setReportYear(parseInt(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white/60 p-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerateMonthlyReport}
            disabled={generatingReport}
            className="flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-rose-600 active:scale-95 disabled:opacity-50 shadow-lg"
          >
            {generatingReport ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send size={16} />
                Generate Report & Send Alerts
              </>
            )}
          </button>
        </div>
      </div>

      {/* ──── Monthly Report Result Modal ──── */}
      {showReportModal && reportResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-500 to-red-600 px-6 py-5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">
                  📋 Monthly Debarred Report
                </h3>
                <p className="text-rose-100 text-xs mt-0.5">
                  {monthNames[reportMonth - 1]} {reportYear}
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-3 px-6 py-4 bg-slate-50 border-b border-slate-100 shrink-0">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-rose-600">
                  {reportResult.debarredCount}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Debarred</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-emerald-600">
                  {reportResult.emailsSent}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Emails Sent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-amber-600">
                  {reportResult.emailsFailed}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Failed</p>
              </div>
            </div>

            {/* Student List */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {reportResult.debarredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <CheckCircle size={48} className="text-emerald-400 mb-3" />
                  <p className="text-lg font-bold text-slate-700">All Clear! 🎉</p>
                  <p className="text-sm text-slate-400">No students below 75% attendance.</p>
                </div>
              ) : (
               <div className="space-y-2">
                 {reportResult.debarredStudents.map((s, i) => (
                   <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                     <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-full bg-rose-200 flex items-center justify-center text-rose-700 font-bold text-xs shrink-0">
                         {s.name.charAt(0)}
                       </div>
                       <div>
                         <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                         <p className="text-[10px] text-slate-400 font-mono">#{s.studentId}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-4 text-xs">
                       <span className="text-slate-500">
                         {s.attended}/{s.totalClasses}
                       </span>
                       <span className={`font-extrabold text-lg ${s.percentage < 50 ? "text-rose-600" : "text-amber-500"}`}>
                         {s.percentage}%
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
             )}
            </div>

            {/* Close Button */}
            <div className="px-6 py-4 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setShowReportModal(false)}
                className="w-full rounded-xl bg-[#1e3a5f] py-3 font-bold text-white hover:bg-[#162d4a] transition-all active:scale-95 shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
