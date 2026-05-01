'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error('Global unhandled exception', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-4">
          <div className="glass-card max-w-md rounded-2xl p-8 text-center shadow-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
              <AlertTriangle size={32} className="text-rose-600" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-slate-800">Something went wrong!</h2>
            <p className="mb-6 text-sm text-slate-500">
              We apologize for the inconvenience. An unexpected error has occurred. Our team has been notified.
            </p>
            <button
              onClick={() => reset()}
              className="w-full rounded-xl bg-[#1e3a5f] py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#162d4a] active:scale-95"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
