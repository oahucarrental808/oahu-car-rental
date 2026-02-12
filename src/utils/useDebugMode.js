import { useQuery } from "@tanstack/react-query";

/**
 * Frontend debug mode is controlled by Firebase Functions' DEBUG_MODE parameter.
 * We read it at runtime from the backend via GET /api/health.
 */
export function useDebugMode() {
  const { data: debug = false, isLoading: loading } = useQuery({
    queryKey: ['debugMode'],
    queryFn: async () => {
      try {
        const res = await fetch("/api/health", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        // Health endpoint returns { ok: true, data: { debugMode: boolean, ... } }
        const text = await res.text();
        const json = text ? JSON.parse(text) : {};
        return Boolean(json?.data?.debugMode);
      } catch {
        // Fail closed: if we can't determine debug mode, do not enable debug UI/logs.
        return false;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - debug mode doesn't change often
    retry: 1, // Only retry once
  });

  return { debug, loading };
}
