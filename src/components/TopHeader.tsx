"use client";

import { Search, Bell, ChevronDown, LogOut, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function TopHeader() {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { data: session } = useSession();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  let title = "Dashboard";
  if (pathname.includes("/admin/users")) title = "Users";
  else if (pathname.includes("/admin/classes") || pathname.includes("/teacher/classes"))
    title = "Classes";
  else if (pathname.includes("/admin/subjects")) title = "Subjects";
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
        {/* Notifications */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/60 transition-all">
          <Bell size={17} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

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
