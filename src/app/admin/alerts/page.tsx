"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Bell,
  AlertTriangle,
  Search,
  CheckCircle2,
  CalendarDays,
  Mail,
  Users,
  Settings,
  Send,
  Loader2,
  Filter
} from "lucide-react";
import toast from "react-hot-toast";
import { logger } from "@/lib/logger";

type StudentAlert = {
  id: string;
  enrollmentNo: string;
  name: string;
  contactEmail: string;
  parentEmail: string;
  course: string;
  branch: string;
  totalClasses: number;
  attended: number;
  absent: number;
  percentage: number;
};

export default function AdminAlertsPage() {
  const { data: session } = useSession();
  const [students, setStudents] = useState<StudentAlert[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Selection state
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  
  // Settings state
  const [alertDate, setAlertDate] = useState<string>("28");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Sending state
  const [isSending, setIsSending] = useState(false);
  const [recipientType, setRecipientType] = useState<"STUDENT" | "PARENT" | "BOTH">("STUDENT");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = students.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.enrollmentNo.toLowerCase().includes(term) ||
        s.course.toLowerCase().includes(term) ||
        s.branch.toLowerCase().includes(term)
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [studentsRes, settingsRes] = await Promise.all([
        fetch("/api/admin/alerts/students"),
        fetch("/api/admin/alerts/settings")
      ]);

      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data.students || []);
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.date) setAlertDate(data.date);
        if (data.requiresSetup) {
        
          // toast.error("Settings table missing. Please run SQL migration.");

        }
      }
    } catch (error) {
      logger.error("Failed to fetch alerts data", error);
      toast.error("Failed to load alerts data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!alertDate || isNaN(Number(alertDate)) || Number(alertDate) < 1 || Number(alertDate) > 28) {
      toast.error("Please enter a valid day (1-28)");
      return;
    }

    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/admin/alerts/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: alertDate }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to save settings");
      }

      toast.success("Automated alert date saved successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSendAlerts = async () => {
    if (selectedStudents.size === 0) {
      toast.error("Please select at least one student");
      return;
    }

    const studentsToAlert = students.filter(s => selectedStudents.has(s.id));
    
    setIsSending(true);
    try {
      const res = await fetch("/api/admin/alerts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          students: studentsToAlert,
          recipientType
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to send alerts");
      }

      const data = await res.json();
      toast.success(`Sent ${data.sent} emails successfully!`);
      
      // Clear selection after sending
      setSelectedStudents(new Set());
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSending(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const toggleSelectStudent = (id: string) => {
    const newSet = new Set(selectedStudents);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedStudents(newSet);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            Alerts & Warnings
          </h1>
          <p className="text-gray-500 mt-1">
            Manage and send low attendance (&lt; 75%) warnings to students and parents.
          </p>
        </div>
        
        {/* Settings Card */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <CalendarDays className="w-5 h-5 text-purple-600" />
            <span>Monthly Auto-Alert Date:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="28"
              value={alertDate}
              onChange={(e) => setAlertDate(e.target.value)}
              className="w-16 px-3 py-1.5 border border-gray-200 rounded-lg text-center focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
            />
            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="px-4 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-red-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <AlertTriangle className="w-16 h-16 text-red-600" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-500 mb-1">Debarred Candidates</p>
            <p className="text-3xl font-bold text-red-600">{students.length}</p>
            <div className="mt-2 text-sm text-gray-600">
              Students below 75% threshold
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, enrollment, course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none bg-white"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 w-full sm:w-auto justify-between">
              <span className="text-sm text-gray-600 font-medium">Send to:</span>
              <select
                value={recipientType}
                onChange={(e: any) => setRecipientType(e.target.value)}
                className="text-sm border-none bg-transparent focus:ring-0 text-gray-900 font-medium outline-none cursor-pointer"
              >
                <option value="STUDENT">Student Only</option>
                <option value="PARENT">Parent Only</option>
                <option value="BOTH">Student & Parent</option>
              </select>
            </div>

            <button
              onClick={handleSendAlerts}
              disabled={selectedStudents.size === 0 || isSending}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium w-full sm:w-auto shadow-sm"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Alert ({selectedStudents.size})
                </>
              )}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-600 cursor-pointer"
                  />
                </th>
                <th className="p-4 font-medium">Student Info</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Course/Branch</th>
                <th className="p-4 font-medium text-center">Attendance</th>
                <th className="p-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                      <p>No students found below the 75% threshold.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className={`hover:bg-gray-50/50 transition-colors ${selectedStudents.has(student.id) ? 'bg-purple-50/30' : ''}`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleSelectStudent(student.id)}
                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-600 cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{student.enrollmentNo}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <span className="w-4 h-4 flex items-center justify-center bg-gray-100 rounded text-[10px] font-bold text-gray-500">S</span>
                          <span className="truncate max-w-[150px]" title={student.contactEmail}>{student.contactEmail || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <span className="w-4 h-4 flex items-center justify-center bg-gray-100 rounded text-[10px] font-bold text-gray-500">P</span>
                          <span className="truncate max-w-[150px]" title={student.parentEmail}>{student.parentEmail || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-900">{student.course}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{student.branch}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-center justify-center">
                        <span className={`text-lg font-bold ${student.percentage < 50 ? 'text-red-600' : 'text-orange-500'}`}>
                          {student.percentage}%
                        </span>
                        <span className="text-xs text-gray-500">
                          {student.attended} / {student.totalClasses}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        Debarred
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
