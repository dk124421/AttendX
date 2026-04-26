"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, BookOpen, X, AlertTriangle, Edit2, Search } from "lucide-react";
import toast from "react-hot-toast";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    code: "",
    sem: "",
    year: "2024-25",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subjects");
      const data = await res.json();
      setSubjects(data);
    } catch (err) {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const q = searchQuery.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q) ||
        s.sem?.toString().includes(q)
    );
  }, [subjects, searchQuery]);

  const openCreateModal = () => {
    setModalMode("create");
    setFormData({ id: "", name: "", code: "", sem: "", year: "2024-25" });
    setShowModal(true);
  };

  const openEditModal = (sub: any) => {
    setModalMode("edit");
    setFormData({
      id: sub.id,
      name: sub.name || "",
      code: sub.code || "",
      sem: sub.sem || "",
      year: sub.year || "2024-25",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = modalMode === "edit";
      const url = "/api/admin/subjects";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit
        ? JSON.stringify({ id: formData.id, name: formData.name, code: formData.code, sem: formData.sem, year: formData.year })
        : JSON.stringify({ name: formData.name, code: formData.code, sem: formData.sem, year: formData.year });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.ok) {
        toast.success(isEdit ? "Subject updated!" : "Subject created!");
        setShowModal(false);
        setFormData({ id: "", name: "", code: "", sem: "", year: "2024-25" });
        fetchData();
      } else {
        toast.error(isEdit ? "Failed to update" : "Failed to create");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/subjects?id=${subjectToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Subject deleted successfully!");
        setShowDeleteModal(false);
        setSubjectToDelete(null);
        fetchData();
      } else {
        const errText = await res.text();
        toast.error(errText || "Failed to delete subject");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Subject Management</h1>
          <p className="text-slate-500 text-sm">Configure academic subjects, their codes, and target semesters.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200"
        >
          <Plus size={18} />
          Create New Subject
        </button>
      </header>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search subjects by name, code, or semester..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
        />
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {loading ? (
          Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-48 rounded-[32px] bg-white animate-pulse shadow-sm border border-slate-100" />
            ))
        ) : filteredSubjects.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-white shadow-sm border border-slate-100">
            <div className="h-20 w-20 rounded-3xl bg-indigo-50 text-indigo-400 flex items-center justify-center mb-4">
              <BookOpen size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">
              {searchQuery ? "No matching subjects" : "No subjects yet"}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {searchQuery
                ? "Try a different search term."
                : "Create your first subject to get started."}
            </p>
            {!searchQuery && (
              <button
                onClick={openCreateModal}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Create Subject
              </button>
            )}
          </div>
        ) : (
          filteredSubjects.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-[32px] bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between"
            >
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center group-hover:bg-fuchsia-600 group-hover:text-white transition-colors">
                    <BookOpen size={24} />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-widest">
                    Sem {sub.sem || "N/A"}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-1 line-clamp-2">{sub.name}</h3>
                <p className="text-sm font-mono font-medium text-slate-400 mb-6">{sub.code}</p>
              </div>

              <div className="flex items-center pt-4 border-t border-slate-50 justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Year</p>
                  <p className="text-sm font-semibold text-slate-700">{sub.year || "N/A"}</p>
                </div>
                {/* Edit & Delete buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(sub)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                    title="Edit subject"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setSubjectToDelete(sub);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete subject"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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
              className="w-full max-w-lg overflow-hidden rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {modalMode === "edit" ? "Edit Subject" : "Add New Subject"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {modalMode === "edit"
                      ? "Update the subject details below."
                      : "Provide details for the new subject."}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Subject Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Data Structures"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Subject Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS201"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Semester</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 3"
                      value={formData.sem}
                      onChange={(e) => setFormData({ ...formData, sem: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Year</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2024-25"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

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
                    {modalMode === "edit" ? "Save Changes" : "Add Subject"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && subjectToDelete && (
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
                <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Subject?</h3>
                <p className="text-sm text-slate-500 mb-2">
                  Are you sure you want to delete{" "}
                  <span className="font-bold text-slate-700">{subjectToDelete.name}</span>?
                </p>
                <p className="text-xs text-amber-600 font-medium mb-4 bg-amber-50 px-3 py-2 rounded-lg">
                  ⚠️ This will also remove any teacher assignments for this subject.
                </p>
                <div className="flex w-full gap-3 mt-2">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSubjectToDelete(null);
                    }}
                    className="flex-1 rounded-xl bg-slate-100 p-3 font-semibold text-slate-600 transition-all hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteSubject}
                    disabled={deleting}
                    className="flex-1 rounded-xl bg-rose-600 p-3 font-bold text-white transition-all hover:bg-rose-700 shadow-lg shadow-rose-100 active:scale-95 disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete Now"}
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
