import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import AttendXLogo from "@/components/AttendXLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-premium flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-400/15 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 h-[500px] w-[500px] rounded-full bg-purple-400/12 blur-[140px]" />
      </div>

      <div className="glass-card max-w-md rounded-2xl p-10 text-center shadow-xl border border-slate-200/60 relative z-10">
        <AttendXLogo size={40} showText={false} />

        <div className="mt-6 mb-3">
          <span className="text-7xl font-extrabold bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
            404
          </span>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Page Not Found
        </h2>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#162d4a] active:scale-95 transition-all"
          >
            <Home size={16} />
            Go Home
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl bg-white/70 border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-white hover:shadow-md active:scale-95 transition-all"
          >
            <ArrowLeft size={16} />
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
