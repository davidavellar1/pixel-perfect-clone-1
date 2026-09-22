import { useCallback, useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const formatWhen = (value: string) =>
  new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

const Notifications = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<NotificationRow[] | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notification")
      .select("id, kind, title, body, link, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data as NotificationRow[]) || []);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const markRead = async (id: string) => {
    await supabase.from("notification").update({ read_at: new Date().toISOString() }).eq("id", id);
    setRows((current) => (current || []).map((row) => (row.id === id ? { ...row, read_at: new Date().toISOString() } : row)));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notification").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
    void load();
  };

  const unread = (rows || []).filter((row) => !row.read_at).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1 className="font-display text-3xl font-bold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access requests, decisions, reminders and fee tail alerts for your projects.
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <Check className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {rows === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <Bell className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Nothing yet</p>
          <p className="text-sm text-muted-foreground">
            You'll be notified here when an investor requests access, when a decision is made, and before a fee tail expires.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card
              key={row.id}
              className={`flex flex-wrap items-start justify-between gap-4 p-4 ${row.read_at ? "" : "border-accent/40 bg-accent/5"}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{row.title}</p>
                {row.body && <p className="mt-1 text-sm text-muted-foreground">{row.body}</p>}
                <p className="mt-2 text-xs text-muted-foreground">{formatWhen(row.created_at)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {row.link && (
                  <Button asChild size="sm" variant="outline" onClick={() => void markRead(row.id)}>
                    <Link to={row.link}>Open</Link>
                  </Button>
                )}
                {!row.read_at && (
                  <Button size="sm" variant="ghost" onClick={() => void markRead(row.id)}>
                    Mark read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
