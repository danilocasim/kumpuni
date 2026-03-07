"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Detects cross-tab auth changes (e.g. logging in as a different user
 * in another tab) and refreshes the page so the UI reflects the actual
 * signed-in user.
 */
export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const currentUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();

    // Seed the ref with the current user id
    supabase.auth.getUser().then(({ data: { user } }) => {
      currentUserIdRef.current = user?.id ?? null;
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id ?? null;

      // Skip the very first callback (initial session)
      if (currentUserIdRef.current === undefined) {
        currentUserIdRef.current = newUserId;
        return;
      }

      // If the user changed (different account or signed out), refresh
      if (newUserId !== currentUserIdRef.current) {
        currentUserIdRef.current = newUserId;
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return <>{children}</>;
}
