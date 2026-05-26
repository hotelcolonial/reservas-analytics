"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrated = useStore((s) => s.hydrated);
  const loadData = useStore((s) => s.loadData);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutro">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-colonial/20 border-t-colonial" />
          <p className="font-display text-lg text-colonial">
            ReservaTrack Colonial
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
