import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export type WatchlistItem = Tables<"watchlist_item">;

type Result = { ok: true } | { ok: false; error: string };

interface WatchlistContextValue {
  /** Saved rows, newest first. */
  items: WatchlistItem[];
  /** Saved project ids, for quick lookups. */
  ids: Set<string>;
  count: number;
  loading: boolean;
  error: string | null;
  has: (projectId: string) => boolean;
  add: (projectId: string) => Promise<Result>;
  remove: (projectId: string) => Promise<Result>;
  reload: () => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

const UNIQUE_VIOLATION = "23505";

const byNewest = (a: WatchlistItem, b: WatchlistItem) => b.added_at.localeCompare(a.added_at);

/**
 * One shared copy of the signed-in user's watchlist, loaded once per session, so the cards,
 * the project page, the Watchlist page, the dashboard and the sidebar badge stay in sync.
 * Changes are applied optimistically and rolled back if the database rejects them.
 */
export const WatchlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const reload = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("watchlist_item")
      .select("*")
      .eq("user_id", userId)
      .order("added_at", { ascending: false });
    if (err) setError(err.message);
    else setItems(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const add = useCallback(
    async (projectId: string): Promise<Result> => {
      if (!userId) return { ok: false, error: "Sign in to save projects" };
      if (itemsRef.current.some((i) => i.project_id === projectId)) return { ok: true };
      const temp: WatchlistItem = {
        id: `pending-${projectId}`,
        user_id: userId,
        project_id: projectId,
        added_at: new Date().toISOString(),
      };
      setItems((prev) => [temp, ...prev]);
      const { data, error: err } = await supabase
        .from("watchlist_item")
        .insert({ project_id: projectId, user_id: userId })
        .select("*")
        .single();
      if (err && err.code !== UNIQUE_VIOLATION) {
        setItems((prev) => prev.filter((i) => i.id !== temp.id));
        return { ok: false, error: err.message };
      }
      if (data) setItems((prev) => [data, ...prev.filter((i) => i.id !== temp.id)].sort(byNewest));
      else void reload(); // already saved elsewhere: fetch the real row
      return { ok: true };
    },
    [userId, reload],
  );

  const remove = useCallback(
    async (projectId: string): Promise<Result> => {
      if (!userId) return { ok: false, error: "Sign in to manage your watchlist" };
      const previous = itemsRef.current;
      if (!previous.some((i) => i.project_id === projectId)) return { ok: true };
      setItems((prev) => prev.filter((i) => i.project_id !== projectId));
      const { error: err } = await supabase
        .from("watchlist_item")
        .delete()
        .eq("user_id", userId)
        .eq("project_id", projectId);
      if (err) {
        setItems(previous);
        return { ok: false, error: err.message };
      }
      return { ok: true };
    },
    [userId],
  );

  const value = useMemo<WatchlistContextValue>(() => {
    const ids = new Set(items.map((i) => i.project_id));
    return {
      items,
      ids,
      count: items.length,
      loading,
      error,
      has: (id) => ids.has(id),
      add,
      remove,
      reload,
    };
  }, [items, loading, error, add, remove, reload]);

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
};

export const useWatchlist = (): WatchlistContextValue => {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error("useWatchlist must be used inside <WatchlistProvider>");
  return ctx;
};
