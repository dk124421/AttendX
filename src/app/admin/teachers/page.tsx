"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, UserCircle, X, Key, Eye, EyeOff, Edit2, Trash2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    userId: "",
    name: "",
    idNumber: "",
    password: "",
  });

  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/teachers");
      const data = await res.json();
      setTeachers(data);
    } catch (err) {
      toast.error("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = modalMode === "edit";
      const url = isEdit ? "/api/admin/teachers" : "/api/admin/users";
      const method = isEdit ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(`Teacher ${isEdit ? "updated" : "added"} successfully!`);
        setShowAddModal(false);
        setFormData({ id: "", userId: "", name: "", idNumber: "", password: "" });
        fetchTeachers();
      } else {
        const errData = await res.text();
        toast.error(errData || `Failed to ${isEdit ? "update" : "add"} teacher`);
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const handleDeleteTeacher = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`/api/admin/teachers?id=${userToDelete.id}&userId=${userToDelete.user_id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Teacher deleted successfully!");
        setShowDeleteModal(false);
        setUserToDelete(null);
        fetchTeachers();
      } else {
        const errData = await res.text();
        toast.error(errData || "Failed to delete teacher");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const filtered = teachers.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.user?.name?.toLowerCase().includes(q) ||
      t.teacher_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Teacher Management</h1>
          <p className="text-slate-500">Add teachers and manage their passwords.</p>
        </div>
        <button
          onClick={() => {
            setModalMode("add");
            setFormData({ id: "", userId: "", name: "", idNumber: "", password: "" });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200"
        >
          <UserPlus size={18} />
          Add Teacher
        </button>
      </header>

      {/* Teacher Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or ID number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID Number</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Classes</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subjects</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-10 w-40 bg-slate-100 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-100 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-6 w-32 bg-slate-100 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-6 w-32 bg-slate-100 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-8 w-24 bg-slate-100 ml-auto rounded" /></td>
                      </tr>
                    ))
                : filtered.map((teacher, i) => (
                    <motion.tr
                      key={teacher.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                            {teacher.user?.name?.charAt(0) || "?"}
                          </div>
                          <p className="font-semibold text-slate-800">{teacher.user?.name || "N/A"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-indigo-600">
                          {teacher.teacher_id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {teacher.assignedClasses.map((cls: any) => (
                              <span key={cls.id} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                                {cls.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No classes assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {teacher.assignedSubjects && teacher.assignedSubjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {teacher.assignedSubjects.map((sub: any) => (
                              <span key={sub.id} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-100">
                                {sub.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No subjects</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setModalMode("edit");
                              setFormData({
                                id: teacher.id,
                                userId: teacher.user?.id || "",
                                name: teacher.user?.name || "",
                                idNumber: teacher.teacher_id || "",
                                password: "",
                              });
                              setNewPassword("");
                              setShowAddModal(true);
                            }}
                            className="inline-flex flex-1 justify-center items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                            title="Edit Teacher"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(teacher);
                              setShowDeleteModal(true);
                            }}
                            className="inline-flex flex-1 justify-center items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                            title="Delete Teacher"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No teachers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Teacher Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{modalMode === "add" ? "Add New Teacher" : "Edit Teacher"}</h3>
                  <p className="text-sm text-slate-500">{modalMode === "add" ? "Fill in the details to create a teacher account." : "Update details for this teacher."}</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveTeacher} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Anita Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">ID Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. T1001"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                    className="flex-1 rounded-xl bg-indigo-600 p-3 font-bold text-white transition-all hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95"
                  >
                    {modalMode === "add" ? "Add Teacher" : "Save Changes"}
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
                <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Teacher?</h3>
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
                    onClick={handleDeleteTeacher}
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
