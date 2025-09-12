import { QueryClient } from "@tanstack/react-query";
import { SEED_LOTS, SEED_ORDERS } from "@shared/seed-data.js";

async function throwIfResNotOk(res) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method,
  url,
  data,
) {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

export const getQueryFn = (options) =>
  async ({ queryKey }) => {
    const { on401: unauthorizedBehavior } = options;
    const url = queryKey.join("/");
    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const json = await res.json();
      // If API doesn't return expected shape, fallback for known endpoints
      if (!json || !Array.isArray(json.data)) {
        if (url.includes("/api/lots")) {
          return { data: SEED_LOTS, isFallback: true };
        }
        if (url.includes("/api/orders")) {
          return { data: SEED_ORDERS, isFallback: true };
        }
      }
      return json;
    } catch (err) {
      // Network/other errors -> fallback for known endpoints
      if (url.includes("/api/lots")) {
        return { data: SEED_LOTS, isFallback: true };
      }
      if (url.includes("/api/orders")) {
        return { data: SEED_ORDERS, isFallback: true };
      }
      throw err;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
