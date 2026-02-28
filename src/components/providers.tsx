"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

/** Fires a lightweight health request on app load to wake server (e.g. Render cold start). */
function ApiWarmup({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    api.health().catch(() => {});
  }, []);
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ApiWarmup>{children}</ApiWarmup>
    </QueryClientProvider>
  );
}
