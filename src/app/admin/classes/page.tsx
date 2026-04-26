"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Users, UserCircle2, GraduationCap, X,
  Search, Check, ChevronDown, Edit2, AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState<any>(null);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    department: "",
    year: "2024",
    classTeacherId: "",
  });

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCls, resSubj, resProfiles, resStudents] = await Promise.all([
        fetch("/api/admin/classes"),
        fetch("/api/admin/subjects"),
        fetch("/api/admin/teachers"),
        fetch("/api/admin/students"),
      ]);
      const dataCls = await resCls.json();
      const dataSubj = await resSubj.json();
      const dataStudents = await resStudents.json();

      setClasses(dataCls);
      setSubjects(dataSubj);
      setAllStudents(dataStudents);

      if (resProfiles.ok) {
        const profiles = await resProfiles.json();
        setTeachers(profiles);
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

  // Students available for assignment (show all students, mark already-assigned ones)
  const availableStudents = useMemo(() => {
    return allStudents.filter((s) => {
      // In edit mode: show unassigned students + students already in THIS class
      if (modalMode === "edit" && formData.id) {
        return !s.class_id || s.class_id === formData.id;
      }
      // In create mode: show ALL students (assigned ones get a warning badge)
      return true;
    });
  }, [allStudents, modalMode, formData.id]);

  // Filtered students based on search
  const filteredStudents = useMemo(() => {
    if (!studentSearch) return availableStudents;
    const q = studentSearch.toLowerCase();
    return availableStudents.filter(
      (s) =>
        s.user?.name?.toLowerCase().includes(q) ||
        s.student_id?.toLowerCase().includes(q)
    );
  }, [availableStudents, studentSearch]);

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredStudents.map((s) => s.id);
    setSelectedStudentIds((prev) => {
      const combined = new Set([...prev, ...visibleIds]);
      return Array.from(combined);
    });
  };

  const deselectAll = () => {
    setSelectedStudentIds([]);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setFormData({ id: "", name: "", department: "", year: "2024", classTeacherId: "" });
    setSelectedStudentIds([]);
    setStudentSearch("");
    setShowModal(true);
  };

  const openEditModal = (cls: any) => {
    setModalMode("edit");
    setFormData({
      id: cls.id,
      name: cls.name,
      department: cls.department || "",
      year: cls.year,
      classTeacherId: cls.class_teacher_id || "",
    });
    // Pre-select students already in this class
    const existingStudentIds = (cls.students || []).map((s: any) => s.id);
    setSelectedStudentIds(existingStudentIds);
    setStudentSearch("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = modalMode === "edit";
      const method = isEdit ? "PUT" : "POST";

      const body = {
        ...(isEdit ? { id: formData.id } : {}),
        name: formData.name,
        department: formData.department,
        year: formData.year,
        classTeacherId: formData.classTeacherId,
        studentIds: selectedStudentIds,
      };

      const res = await fetch("/api/admin/classes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(`Class ${isEdit ? "updated" : "created"} successfully!`);
        setShowModal(false);
        setFormData({ id: "", name: "", department: "", year: "2024", classTeacherId: "" });
        setSelectedStudentIds([]);
        fetchData();
      } else {
        const errText = await res.text();
        toast.error(errText || `Failed to ${isEdit ? "update" : "create"} class`);
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const handleDeleteClass = async () => {
    if (!classToDelete) return;
    try {
      const res = await fetch(`/api/admin/classes?id=${classToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Class deleted successfully!");
        setShowDeleteModal(false);
        setClassToDelete(null);
        fetchData();
      } else {
        const errText = await res.text();
        toast.error(errText || "Failed to delete class");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  // Get selected student names for display
  const selectedStudentNames = useMemo(() => {
    return selectedStudentIds.map((id) => {
      const s = allStudents.find((st) => st.id === id);
      return s ? { id, name: s.user?.name || "Unknown", studentId: s.student_id } : null;
    }).filter(Boolean) as { id: string; name: string; studentId: string }[];
  }, [selectedStudentIds, allStudents]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Class Management</h1>
          <p className="text-slate-500">Create classes and assign students to them.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200"
        >
          <Plus size={18} />
          Create New Class
        </button>
      </header>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-48 rounded-[32px] bg-white animate-pulse shadow-sm border border-slate-100" />
          ))
        ) : classes.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-3xl bg-indigo-50 text-indigo-400 flex items-center justify-center mb-4">
              <GraduationCap size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No classes yet</h3>
            <p className="text-sm text-slate-400 mb-4">Create your first class to start assigning students.</p>
            <button
              onClick={openCreateModal}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Create Class
            </button>
          </div>
        ) : (
          classes.map((cls, i) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-[32px] bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:shadow-indigo-500/5"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <GraduationCap size={24} />
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest">
                  {cls.year}
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-1">{cls.name}</h3>
              <p className="text-sm font-medium text-slate-400 mb-4">{cls.department}</p>

              {/* Student Count Badge */}
              <div className="flex items-center gap-2 mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                  <Users size={14} />
                  {cls.studentCount || 0} Students
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                  {cls.teacher?.user?.name ? (
                    <span className="text-xs font-bold text-indigo-600">{cls.teacher.user.name.charAt(0)}</span>
                  ) : (
                    <UserCircle2 size={18} className="text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Class Teacher</p>
                  <p className="text-sm font-semibold text-slate-700">
                    {cls.teacher?.user?.name || "Unassigned"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(cls)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Edit Class"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => {
                    setClassToDelete(cls);
                    setShowDeleteModal(true);
                  }}
                  className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Delete Class"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {modalMode === "create" ? "Create New Class" : "Edit Class"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {modalMode === "create"
                      ? "Define a new class and add students to it."
                      : "Update class details and manage student assignments."}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Class Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Class Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B.Tech CS A"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Subject / Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((s: any) => (
                        <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Academic Year</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2024-25"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Assign Class Teacher</label>
                    <select
                      value={formData.classTeacherId}
                      onChange={(e) => setFormData({ ...formData, classTeacherId: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.user?.name} ({t.teacher_id})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ═══ STUDENT MULTI-SELECT SECTION ═══ */}
                <div className="border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Add Students to Class
                      </label>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {modalMode === "create" ? "Select unassigned students" : "Manage student assignments"}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
                      <Users size={12} />
                      {selectedStudentIds.length} selected
                    </span>
                  </div>

                  {/* Selected Students Chips */}
                  {selectedStudentNames.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedStudentNames.map((s) => (
                        <motion.span
                          key={s.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100"
                        >
                          <span className="h-5 w-5 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {s.name.charAt(0)}
                          </span>
                          {s.name}
                          <span className="text-indigo-400 font-mono text-[10px]">{s.studentId}</span>
                          <button
                            type="button"
                            onClick={() => toggleStudentSelection(s.id)}
                            className="ml-0.5 p-0.5 rounded-full hover:bg-indigo-200/60 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </motion.span>
                      ))}
                      {selectedStudentNames.length > 0 && (
                        <button
                          type="button"
                          onClick={deselectAll}
                          className="text-xs text-rose-500 font-semibold hover:text-rose-600 px-2 py-1"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  )}

                  {/* Student Search & Dropdown */}
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search students by name or enrollment number..."
                        value={studentSearch}
                        onChange={(e) => {
                          setStudentSearch(e.target.value);
                          setShowStudentDropdown(true);
                        }}
                        onFocus={() => setShowStudentDropdown(true)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <ChevronDown size={16} className={`transition-transform ${showStudentDropdown ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* Dropdown List */}
                    <AnimatePresence>
                      {showStudentDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute z-10 mt-2 w-full rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden"
                        >
                          {/* Select All / Deselect All Bar */}
                          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                              {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} available
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={selectAllVisible}
                                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700"
                              >
                                Select All
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={deselectAll}
                                className="text-[11px] font-bold text-slate-400 hover:text-slate-600"
                              >
                                Deselect All
                              </button>
                            </div>
                          </div>

                          <div className="max-h-52 overflow-y-auto">
                            {filteredStudents.length === 0 ? (
                              <div className="px-4 py-6 text-center text-sm text-slate-400">
                                {availableStudents.length === 0
                                  ? "No unassigned students. Create students first from the Students page."
                                  : "No students match your search."}
                              </div>
                            ) : (
                              filteredStudents.map((s) => {
                                const isSelected = selectedStudentIds.includes(s.id);
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => toggleStudentSelection(s.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${isSelected ? 'bg-indigo-50/50' : ''}`}
                                  >
                                    <div
                                      className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected
                                          ? 'bg-indigo-600 border-indigo-600 text-white'
                                          : 'border-slate-300 bg-white'
                                        }`}
                                    >
                                      {isSelected && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                                      {s.user?.name?.charAt(0) || "?"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-slate-700 truncate">{s.user?.name || "N/A"}</p>
                                      <p className="text-xs text-slate-400 font-mono">{s.student_id}</p>
                                    </div>
                                    {isSelected && (
                                      <span className="text-xs font-bold text-indigo-600 shrink-0">Added</span>
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>

                          {/* Close Button */}
                          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setShowStudentDropdown(false)}
                              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-700"
                            >
                              Done
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-xl bg-slate-100 p-3 font-semibold text-slate-600 transition-all hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-indigo-600 p-3 font-bold text-white transition-all shadow-lg shadow-indigo-100 active:scale-95 hover:bg-indigo-700"
                  >
                    {modalMode === "create" ? "Create Class" : "Save Changes"}
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
                <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Class?</h3>
                <p className="text-sm text-slate-500 mb-2">
                  Are you sure you want to delete <span className="font-bold text-slate-700">{classToDelete?.name}</span>?
                </p>
                <p className="text-xs text-amber-600 font-medium mb-6 bg-amber-50 px-3 py-2 rounded-lg">
                  ⚠️ {classToDelete?.studentCount || 0} student(s) in this class will be unassigned.
                </p>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => { setShowDeleteModal(false); setClassToDelete(null); }}
                    className="flex-1 rounded-xl bg-slate-100 p-3 font-semibold text-slate-600 transition-all hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteClass}
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
