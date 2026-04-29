"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, Shield, GraduationCap, UserCircle } from "lucide-react";
import AttendXLogo from "@/components/AttendXLogo";

type Role = "Admin" | "Teacher" | "Student";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("Admin");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: identifier,
        password,
      });

      if (res?.error) {
        toast.error("Invalid credentials.");
      } else {
        toast.success("Login successful!");
        if (role === "Admin") router.push("/admin");
        else if (role === "Teacher") router.push("/teacher");
        else router.push("/student");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (selectedRole: Role) => {
    setRole(selectedRole);
    if (selectedRole === "Admin") {
      setIdentifier("admin@college.edu");
      setPassword("admin123");
    } else {
      setIdentifier("");
      setPassword("");
    }
  };

  const getPlaceholder = () => {
    if (role === "Admin") return "Email Address";
    if (role === "Teacher") return "Teacher ID (e.g. TT001)";
    return "Enrollment Number (e.g. 2023SUBTCS001)";
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-gradient-premium">
      {/* Background blurs */}
      <div className="absolute top-1/4 left-1/3 h-80 w-80 rounded-full bg-blue-400/20 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-400/20 blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-pink-300/15 blur-[80px]" />

      {/* Login Card */}
      <div className="relative w-full max-w-sm glass-card p-8 z-10">
        <div className="flex flex-col items-center mb-6">
          <AttendXLogo size={52} className="mb-3" />
          <h1 className="text-2xl font-bold text-center text-slate-900">
            Log in to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0891b2] to-[#14b8a6]">AttendX</span>
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Identifier (Email / Teacher ID / Enrollment Number) */}
          <div>
            <input
              type="text"
              placeholder={getPlaceholder()}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full rounded-xl py-3 px-4 text-sm font-medium glass-input text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl py-3 px-4 pr-11 text-sm font-medium glass-input text-slate-800 placeholder-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Role Selector */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-500 mb-3">
              Role Selector
            </p>
            <div className="flex gap-3">
              <RoleButton
                currentRole={role}
                thisRole="Admin"
                icon={<Shield size={22} />}
                onClick={() => selectRole("Admin")}
              />
              <RoleButton
                currentRole={role}
                thisRole="Teacher"
                icon={<UserCircle size={22} />}
                onClick={() => selectRole("Teacher")}
              />
              <RoleButton
                currentRole={role}
                thisRole="Student"
                icon={<GraduationCap size={22} />}
                onClick={() => selectRole("Student")}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-3 font-bold text-white transition-all active:scale-95 disabled:opacity-50 shadow-lg
                bg-[#1e3a5f] hover:bg-[#162d4a]"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RoleButton({
  currentRole,
  thisRole,
  icon,
  onClick,
}: {
  currentRole: Role;
  thisRole: Role;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const active = currentRole === thisRole;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col flex-1 items-center justify-center gap-1.5 rounded-xl border-2 p-3.5 transition-all duration-200 ${
        active
          ? "border-blue-500 bg-white text-blue-600 shadow-sm"
          : "border-slate-200/60 bg-transparent text-slate-500 hover:border-slate-300"
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold">{thisRole}</span>
    </button>
  );
}
