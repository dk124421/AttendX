"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, X, Eye, EyeOff, Edit2, Trash2, AlertTriangle, Mail } from "lucide-react";
import toast from "react-hot-toast";

interface CourseData {
  id: string;
  name: string;
  branches: { id: string; name: string; course_id: string }[];
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [courses, setCourses] = useState<CourseData[]>([]);

  const [formData, setFormData] = useState({
    id: "",
    userId: "",
    name: "",
    enrollmentNumber: "",
    password: "",
    courseId: "",
    branchId: "",
    year: "",
    contactEmail: "",
    parentEmail: "priyalbaldwa10@gmail.com",
  });

  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Get branches filtered by selected course
  const filteredBranches = useMemo(() => {
    if (!formData.courseId) return [];
    const course = courses.find((c) => c.id === formData.courseId);
    return course?.branches || [];
  }, [formData.courseId, courses]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, coursesRes] = await Promise.all([
        fetch("/api/admin/students"),
        fetch("/api/admin/courses"),
      ]);
      const studentsData = await studentsRes.json();
      setStudents(studentsData);

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData);
      }
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = modalMode === "edit";
      const url = "/api/admin/students";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(`Student ${isEdit ? "updated" : "added"} successfully!`);
        setShowAddModal(false);
        setFormData({ id: "", userId: "", name: "", enrollmentNumber: "", password: "", courseId: "", branchId: "", year: "", contactEmail: "", parentEmail: "priyalbaldwa10@gmail.com" });
        fetchData();
      } else {
        const errData = await res.text();
        toast.error(errData || `Failed to ${isEdit ? "update" : "add"} student`);
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const handleDeleteStudent = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`/api/admin/students?id=${userToDelete.id}&userId=${userToDelete.user_id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Student deleted successfully!");
        setShowDeleteModal(false);
        setUserToDelete(null);
        fetchData();
      } else {
        const errData = await res.text();
        toast.error(errData || "Failed to delete student");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  // Helper to get course/branch name
  const getCourseName = (courseId: string) => courses.find((c) => c.id === courseId)?.name || "—";
  const getBranchName = (courseId: string, branchId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course?.branches?.find((b) => b.id === branchId)?.name || "—";
  };

  const filtered = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.user?.name?.toLowerCase().includes(q) ||
      s.student_id?.toLowerCase().includes(q) ||
      s.class?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Student Management</h1>
          <p className="text-slate-500">Add students and manage their passwords. Assign classes from the Classes page.</p>
        </div>
        <button
          onClick={() => {
            setModalMode("add");
            setFormData({ id: "", userId: "", name: "", enrollmentNumber: "", password: "", courseId: "", branchId: "", year: "", contactEmail: "", parentEmail: "priyalbaldwa10@gmail.com" });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-200"
        >
          <UserPlus size={18} />
          Add Student
        </button>
      </header>

      {/* Student Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, enrollment number, class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrollment No.</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Parent Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-10 w-40 bg-slate-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-32 bg-slate-100 rounded" /></td>
                      <td className="px-6 py-4"><div className="h-8 w-24 bg-slate-100 ml-auto rounded" /></td>
                    </tr>
                  ))
                : filtered.map((student, i) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {student.user?.name?.charAt(0) || "?"}
                        </div>
                        <p className="font-semibold text-slate-800">{student.user?.name || "N/A"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-indigo-600">
                        {student.student_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.course_id ? 'bg-violet-50 text-violet-700' : 'bg-slate-50 text-slate-400'}`}>
                        {student.course_id ? getCourseName(student.course_id) : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {student.year || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-500 truncate max-w-[160px]">
                          {student.parent_email || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setModalMode("edit");
                            setFormData({
                              id: student.id,
                              userId: student.user?.id || "",
                              name: student.user?.name || "",
                              enrollmentNumber: student.student_id || "",
                              password: "",
                              courseId: student.course_id || "",
                              branchId: student.branch_id || "",
                              year: student.year || "",
                              contactEmail: student.contact_email || "",
                              parentEmail: student.parent_email || "priyalbaldwa10@gmail.com",
                            });
                            setNewPassword("");
                            setShowAddModal(true);
                          }}
                          className="inline-flex flex-1 justify-center items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                          title="Edit Student"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setUserToDelete(student);
                            setShowDeleteModal(true);
                          }}
                          className="inline-flex flex-1 justify-center items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Student Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[32px] bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{modalMode === "add" ? "Add New Student" : "Edit Student"}</h3>
                  <p className="text-sm text-slate-500">{modalMode === "add" ? "Create a student account. Assign to a class later from the Classes page." : "Update student details."}</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveStudent} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Enrollment Number */}
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Enrollment Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EN2024001"
                    value={formData.enrollmentNumber}
                    onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Row 1: Course + Branch side-by-side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Course</label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value, branchId: "" })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">Select Course</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Branch</label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                      disabled={!formData.courseId}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">{formData.courseId ? "Select Branch" : "Select course first"}</option>
                      {filteredBranches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Year */}
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                {/* Contact Email */}
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Contact Email <span className="text-slate-400 font-normal normal-case">(for alerts)</span></label>
                  <input
                    type="email"
                    placeholder="e.g. student@gmail.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Parent Email */}
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Parent's Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. parent@gmail.com"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">Default: priyalbaldwa10@gmail.com — Used for attendance notifications to parents.</p>
                </div>

                {/* Password (only for add mode) */}
                {modalMode === "add" && (
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Default Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Set a default password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {modalMode === "add" && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                    <p className="text-xs text-blue-600 font-medium">
                      💡 Tip: After creating the student, go to <span className="font-bold">Classes → Create/Edit Class</span> to assign them to a class.
                    </p>
                  </div>
                )}

                {/* Change Password Section (edit mode only) */}
                {modalMode === "edit" && (
                  <div className="border-t border-slate-100 pt-4 mt-2">
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Change Password <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Leave blank to keep current password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {newPassword && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newPassword) return;
                          try {
                            const res = await fetch("/api/admin/password", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ userId: formData.userId, newPassword }),
                            });
                            if (res.ok) {
                              toast.success("Password changed!");
                              setNewPassword("");
                            } else {
                              toast.error("Failed to change password");
                            }
                          } catch {
                            toast.error("Something went wrong");
                          }
                        }}
                        className="mt-2 w-full rounded-xl bg-amber-500 p-2.5 text-sm font-bold text-white transition-all hover:bg-amber-600 active:scale-95"
                      >
                        Update Password
                      </button>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 rounded-xl bg-slate-100 p-3 font-semibold text-slate-600 transition-all hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-emerald-600 p-3 font-bold text-white transition-all hover:bg-emerald-700 shadow-lg shadow-emerald-100 active:scale-95"
                  >
                    {modalMode === "add" ? "Add Student" : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Student?</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Are you sure you want to completely remove <span className="font-bold text-slate-700">{userToDelete?.user?.name}</span>? This action cannot be undone and will permanently delete their data.
                </p>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }}
                    className="flex-1 rounded-xl bg-slate-100 p-3 font-semibold text-slate-600 transition-all hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteStudent}
                    className="flex-1 rounded-xl bg-rose-600 p-3 font-bold text-white transition-all hover:bg-rose-700 shadow-lg shadow-rose-100 active:scale-95"
                  >
                    Delete Now
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
