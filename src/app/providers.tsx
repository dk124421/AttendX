"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        // Handle realtime subscriptions reconnect if tab becomes active
        const channels = supabase.getChannels();
        channels.forEach((channel) => {
          // Attempt to resubscribe if it disconnected
          if (channel.state === 'closed' || channel.state === 'errored') {
            channel.subscribe();
          }
        });

        // Trigger a supabase session refresh/check to ensure it's alive
        await supabase.auth.getSession();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Cleanup
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status]);

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
