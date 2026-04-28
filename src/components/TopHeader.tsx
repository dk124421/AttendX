"use client";

import { Search, Bell, ChevronDown, LogOut, User, X, Check } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function TopHeader() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { data: session } = useSession();

  const isStudent = session?.user?.role === "STUDENT";

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications (for students)
  const fetchNotifications = useCallback(async () => {
    if (!isStudent) return;
    try {
      const res = await fetch("/api/student/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      // silent
    }
  }, [isStudent]);

  // Poll every 15 seconds for new notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (notifId: string) => {
    try {
      await fetch("/api/student/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notifId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
    } catch {
      // silent
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/student/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silent
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  let title = "Dashboard";
  if (pathname.includes("/admin/users")) title = "Users";
  else if (pathname.includes("/admin/classes") || pathname.includes("/teacher/classes"))
    title = "Classes";
  else if (pathname.includes("/admin/calendar")) title = "Academic Calendar";
  else if (pathname.includes("/admin/courses")) title = "Courses & Branches";
  else if (pathname.includes("/teacher/attendance")) title = "Mark Attendance";
  else if (pathname.includes("/teacher/reports")) title = "Attendance Reports";
  else if (pathname.includes("/teacher/calendar")) title = "Academic Calendar";
  else if (pathname.includes("/teacher/leaderboard")) title = "Leaderboard";
  else if (pathname.includes("/student/attendance")) title = "My Attendance";
  else if (pathname.includes("/student/leaderboard")) title = "Leaderboard";
  else if (pathname.includes("/student/students")) title = "Students";
  else if (pathname.includes("/student/classes")) title = "My Classes";
  else if (pathname.includes("/student/calendar")) title = "Academic Calendar";
  else if (pathname.includes("/student/reports")) title = "Reports Page";
  else if (pathname.includes("/admin/analytics")) title = "Analytics Dashboard";
  else if (pathname.includes("/admin")) title = "Dashboard";
  else if (pathname.includes("/teacher")) title = "My Classes";
  else if (pathname.includes("/student")) title = "Student Dashboard";

  return (
    <header className="mb-6 flex items-center justify-between ml-12 md:ml-0">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {title}
        </h1>

        {/* Search Bar */}
        <div className="hidden relative md:block">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search"
            className="w-48 rounded-lg glass-input py-1.5 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifPanel(!showNotifPanel);
              if (!showNotifPanel) fetchNotifications();
            }}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/60 transition-all"
          >
            <Bell size={17} />
            {isStudent && unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {showNotifPanel && isStudent && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Check size={10} />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifPanel(false)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.read && markAsRead(n.id)}
                      className={`px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${
                        !n.read ? "bg-indigo-50/40" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && (
                          <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        )}
                        <div className={`flex-1 ${n.read ? "ml-4" : ""}`}>
                          <p className={`text-xs font-semibold ${!n.read ? "text-slate-800" : "text-slate-500"}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {timeAgo(n.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-white shadow-sm">
              <img
                src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=e2e8f0"
                alt="User avatar"
                className="h-full w-full object-cover"
              />
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-slate-100 shrink-0">
                    <img
                      src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=e2e8f0"
                      alt="User"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {session?.user?.role || "Role"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Link */}
              <div className="py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <User size={15} className="text-slate-400" />
                  Profile
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-slate-100 py-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut size={15} />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
