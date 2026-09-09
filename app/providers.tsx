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
      <div className="flex min-h-screen items-center justify-center bg-branco">
        <div className="flex flex-col items-center gap-4">
          <div className="size-9 animate-spin rounded-full border-2 border-border-strong border-t-coral" />
          <p className="font-brand text-lg font-light tracking-tighter text-carvao lowercase">
            growthdirect<span className="text-coral">.</span>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
