'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error('Unhandled exception in route segment', error);
  }, [error]);

  return (
    <div className="flex h-[80vh] w-full items-center justify-center p-4">
      <div className="glass-card max-w-md rounded-2xl p-8 text-center shadow-xl border border-rose-100">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
          <AlertTriangle size={32} className="text-rose-500" />
        </div>
        <h2 className="mb-3 text-xl font-bold text-slate-800">Oops! Something went wrong here.</h2>
        <p className="mb-6 text-sm text-slate-500">
          {error.message || "An unexpected error occurred while loading this section."}
        </p>
        <button
          onClick={() => reset()}
          className="w-full rounded-xl bg-[#1e3a5f] py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#162d4a] active:scale-95"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
