"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        // Handle realtime subscriptions reconnect if tab becomes active
        try {
          const channels = supabase.getChannels();
          channels.forEach((channel) => {
            if (channel.state === 'closed' || channel.state === 'errored') {
              channel.subscribe();
            }
          });

          // Check Supabase session
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            logger.warn("Supabase session error on tab focus", error);
          }
          
          // If the NextAuth session is completely gone (e.g., deleted cookies or expired),
          // reload the window to enforce standard redirect-to-login logic.
          if (status === "unauthenticated") {
            window.location.reload();
          } else {
            // Soft refresh router to re-fetch any server components that might be stale
            router.refresh();
          }
        } catch (err) {
          logger.error("Error during visibility change handling", err);
        }
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status, router]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchOnWindowFocus={true} 
      refetchInterval={5 * 60} // Refetch every 5 minutes (300s)
    >
      <SessionGuard>
        {children}
      </SessionGuard>
    </SessionProvider>
  );
}
