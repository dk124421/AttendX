"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,

  BookOpen,
  ClipboardCheck,
  Trophy,
  GraduationCap,
  BarChart3,
  UserCircle,
  FlaskConical,
  Layers,
  CalendarDays,
  Menu,
  X,
} from "lucide-react";
import AttendXLogo from "@/components/AttendXLogo";

interface SidebarProps {
  role: "ADMIN" | "TEACHER" | "STUDENT";
}

const menuItems = {
  ADMIN: [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { name: "Students", icon: GraduationCap, href: "/admin/students" },
    { name: "Teachers", icon: UserCircle, href: "/admin/teachers" },
    { name: "Classes", icon: Layers, href: "/admin/classes" },
    { name: "Subjects", icon: FlaskConical, href: "/admin/subjects" },
    { name: "Courses", icon: BookOpen, href: "/admin/courses" },
    { name: "Calendar", icon: CalendarDays, href: "/admin/calendar" },
  ],
  TEACHER: [
    { name: "My Classes", icon: Layers, href: "/teacher" },
    { name: "Attendance", icon: ClipboardCheck, href: "/teacher/attendance" },
    { name: "Leaderboard", icon: Trophy, href: "/teacher/leaderboard" },
    { name: "Calendar", icon: CalendarDays, href: "/teacher/calendar" },
  ],
  STUDENT: [
    { name: "Dashboard", icon: LayoutDashboard, href: "/student" },
    { name: "My Classes", icon: Layers, href: "/student/classes" },
    { name: "Leaderboard", icon: Trophy, href: "/student/leaderboard" },
    { name: "Calendar", icon: CalendarDays, href: "/student/calendar" },
  ],
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = menuItems[role];
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/teacher" || href === "/student") {
      const rootMap: Record<string, string[]> = {
        "/admin": ["/admin", "/admin/overview"],
        "/teacher": ["/teacher"],
        "/student": ["/student", "/student/dashboard"],
      };
      return rootMap[href]?.some((p) => pathname === p) ?? false;
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* App Icon */}
      <Link
        href={role === "ADMIN" ? "/admin" : role === "TEACHER" ? "/teacher" : "/student"}
        className="mb-4 hover:scale-105 transition-transform"
      >
        <AttendXLogo size={42} />
      </Link>

      {/* Menu Items */}
      <nav className="flex-1 flex flex-col items-center gap-1 w-full px-2">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex flex-col items-center justify-center w-full py-2.5 rounded-xl transition-all duration-200 ${active
                  ? "bg-white/90 text-blue-600 shadow-sm"
                  : "text-slate-500 hover:bg-white/50 hover:text-slate-800"
                }`}
            >
              <item.icon
                size={20}
                className={`mb-0.5 transition-colors ${active
                    ? "text-blue-600"
                    : "text-slate-400 group-hover:text-slate-700"
                  }`}
              />
              <span
                className={`text-[9px] font-semibold leading-tight ${active ? "text-blue-600" : ""
                  }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-[60] md:hidden flex items-center justify-center h-10 w-10 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg text-slate-600 hover:bg-white transition-all"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Desktop Sidebar */}
      <aside className="glass-sidebar hidden md:flex flex-col items-center w-[72px] min-h-screen py-4 gap-2 z-50 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sidebar Panel */}
          <aside
            className="absolute left-0 top-0 h-full w-[72px] glass-sidebar flex flex-col items-center py-4 gap-2 shadow-2xl animate-in slide-in-from-left duration-200"
          >
            {/* Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="mb-2 flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:bg-white/50 hover:text-slate-700 transition-all"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-[60] md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around py-1.5 px-1 max-w-lg mx-auto">
          {items.slice(0, 5).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 min-w-0 ${active
                    ? "text-blue-600"
                    : "text-slate-400"
                  }`}
              >
                <item.icon
                  size={18}
                  className={`mb-0.5 ${active ? "text-blue-600" : "text-slate-400"}`}
                />
                <span className={`text-[8px] font-semibold leading-tight truncate ${active ? "text-blue-600" : ""}`}>
                  {item.name}
                </span>
                {active && (
                  <div className="h-0.5 w-4 rounded-full bg-blue-600 mt-0.5" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
