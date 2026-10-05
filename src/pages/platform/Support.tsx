import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertCircle, ArrowRight, Inbox, LifeBuoy } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  BODY_MAX,
  STATUS_CLASS,
  STATUS_LABEL,
  SUBJECT_MAX,
  SUPPORT_TOPICS,
  formatMessageDate,
  referrerPath,
  type MemberMessageKind,
  type MemberMessageStatus,
} from "@/lib/memberMessages";

interface OwnRequest {
  id: string;
  topic: string;
  subject: string | null;
  status: MemberMessageStatus;
  created_at: string;
}

interface InboxRow {
  id: string;
  kind: MemberMessageKind;
  topic: string;
  subject: string | null;
  body: string;
  rating: number | null;
  status: MemberMessageStatus;
  created_at: string;
  sender_email: string | null;
}

const StatusBadge = ({ status }: { status: MemberMessageStatus }) => (
  <span
    className={cn(
      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
      STATUS_CLASS[status],
    )}
  >
    {STATUS_LABEL[status]}
  </span>
);

const ErrorText = ({ id, children }: { id: string; children: string }) => (
  <p id={id} className="text-xs font-medium text-destructive">
    {children}
  </p>
);

const SupportForm = ({ onSent }: { onSent: () => void }) => {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<{ topic?: string; subject?: string; body?: string }>({});
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!topic) next.topic = "Choose a topic.";
    if (!subject.trim()) next.subject = "Add a short subject.";
    if (!body.trim()) next.body = "Write your message.";
    setErrors(next);
    if (Object.keys(next).length || !user) return;
    setSending(true);
    const { error } = await supabase.from("member_message").insert({
      user_id: user.id,
      kind: "support",
      topic,
      subject: subject.trim(),
      body: body.trim(),
      page_url: referrerPath(),
    });
    setSending(false);
    if (error) {
      toast.error("Your message wasn't sent. Please try again.");
      return;
    }
    toast.success(`Message sent — we'll reply to ${user.email ?? "your account email"}`);
    setTopic("");
    setSubject("");
    setBody("");
    setErrors({});
    onSent();
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-5 rounded-lg border border-border bg-card p-6"
    >
      <h2 className="font-display text-lg font-semibold text-foreground">Send us a message</h2>
      <div className="grid gap-2">
        <Label htmlFor="support-topic">Topic</Label>
        <Select
          value={topic}
          onValueChange={(v) => {
            setTopic(v);
            setErrors((e) => ({ ...e, topic: undefined }));
          }}
        >
          <SelectTrigger
            id="support-topic"
            className="h-11 bg-background"
            aria-invalid={!!errors.topic}
            aria-describedby={errors.topic ? "support-topic-error" : undefined}
          >
            <SelectValue placeholder="Choose a topic" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORT_TOPICS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.topic && <ErrorText id="support-topic-error">{errors.topic}</ErrorText>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="support-subject">Subject</Label>
        <Input
          id="support-subject"
          value={subject}
          maxLength={SUBJECT_MAX}
          className="h-11 bg-background"
          onChange={(e) => {
            setSubject(e.target.value);
            setErrors((er) => ({ ...er, subject: undefined }));
          }}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? "support-subject-error" : undefined}
        />
        {errors.subject && <ErrorText id="support-subject-error">{errors.subject}</ErrorText>}
      </div>
      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="support-body">Message</Label>
          <span id="support-body-count" className="text-xs text-muted-foreground">
            {body.length.toLocaleString()} / {BODY_MAX.toLocaleString()}
          </span>
        </div>
        <Textarea
          id="support-body"
          value={body}
          maxLength={BODY_MAX}
          rows={7}
          className="bg-background"
          onChange={(e) => {
            setBody(e.target.value);
            setErrors((er) => ({ ...er, body: undefined }));
          }}
          aria-invalid={!!errors.body}
          aria-describedby={cn("support-body-count", errors.body && "support-body-error")}
        />
        {errors.body && <ErrorText id="support-body-error">{errors.body}</ErrorText>}
      </div>
      <Button
        type="submit"
        disabled={sending}
        className="bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {sending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
};

const OwnRequests = ({ refreshKey }: { refreshKey: number }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<OwnRequest[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setError(false);
    const { data, error: err } = await supabase
      .from("member_message")
      .select("id, topic, subject, status, created_at")
      .eq("user_id", user.id)
      .eq("kind", "support")
      .order("created_at", { ascending: false })
      .limit(50);
    if (err) {
      setError(true);
      setRows([]);
      return;
    }
    setRows((data ?? []) as OwnRequest[]);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold text-foreground">Your requests</h2>
      {rows === null ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-5 py-4 text-sm"
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-destructive" />
            We couldn't load your requests.
          </span>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card px-5 py-6 text-center text-sm text-muted-foreground">
          No requests yet.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {rows.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{r.subject || r.topic}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {r.topic} · {formatMessageDate(r.created_at)}
                </p>
              </div>
              <StatusBadge status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const AdminInbox = () => {
  const [rows, setRows] = useState<InboxRow[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    const { data, error: err } = await (
      supabase.rpc as unknown as (
        fn: string,
      ) => Promise<{ data: InboxRow[] | null; error: { message: string } | null }>
    )("member_message_inbox");
    if (err) {
      setError(true);
      setRows([]);
      return;
    }
    setRows(data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (id: string, status: MemberMessageStatus) => {
    const previous = rows;
    setRows((rs) => rs?.map((r) => (r.id === id ? { ...r, status } : r)) ?? rs);
    const { error: err } = await supabase.from("member_message").update({ status }).eq("id", id);
    if (err) {
      setRows(previous);
      toast.error("Status wasn't updated. Please try again.");
    }
  };

  if (rows === null)
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-5 py-4 text-sm"
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-destructive" />
          We couldn't load the inbox.
        </span>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }
  if (!rows.length)
    return (
      <p className="rounded-lg border border-dashed border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
        No messages from members yet.
      </p>
    );

  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-primary">
                  {r.kind === "support" ? "Support" : "Feedback"}
                </span>
                <span className="text-xs text-muted-foreground">{r.topic}</span>
                {r.rating != null && (
                  <span
                    className="text-xs text-muted-foreground"
                    aria-label={`Rated ${r.rating} out of 5`}
                  >
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </span>
                )}
              </div>
              {r.subject && <p className="mt-2 font-medium text-foreground">{r.subject}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {r.sender_email ?? "Unknown sender"} · {formatMessageDate(r.created_at)}
              </p>
            </div>
            <Select
              value={r.status}
              onValueChange={(v) => void setStatus(r.id, v as MemberMessageStatus)}
            >
              <SelectTrigger className="h-9 w-[140px] bg-background" aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABEL) as MemberMessageStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/85">
            {r.body}
          </p>
        </li>
      ))}
    </ul>
  );
};

const BeforeYouWrite = () => (
  <aside className="rounded-lg border border-border bg-muted/40 p-5">
    <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
      <LifeBuoy className="h-4 w-4 text-accent" />
      Before you write
    </h2>
    <ul className="mt-3 space-y-2 text-sm">
      <li>
        <Link
          to="/how-it-works"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          How it works <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </li>
      <li>
        <Link
          to="/app/public-funding"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          Public funding <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </li>
    </ul>
  </aside>
);

const Support = () => {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const [refreshKey, setRefreshKey] = useState(0);

  const memberView = (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-8">
        <SupportForm onSent={() => setRefreshKey((k) => k + 1)} />
        <OwnRequests refreshKey={refreshKey} />
      </div>
      <BeforeYouWrite />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase text-accent">Support</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">Support</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Questions about a listing, access requests or your account? Send us a message and we'll
          reply by email within one working day.
        </p>
      </header>
      {isAdmin ? (
        <Tabs defaultValue="contact">
          <TabsList>
            <TabsTrigger value="contact">Contact support</TabsTrigger>
            <TabsTrigger value="inbox">
              <Inbox className="mr-1.5 h-4 w-4" />
              Inbox
            </TabsTrigger>
          </TabsList>
          <TabsContent value="contact" className="mt-6">
            {memberView}
          </TabsContent>
          <TabsContent value="inbox" className="mt-6">
            <AdminInbox />
          </TabsContent>
        </Tabs>
      ) : (
        memberView
      )}
    </div>
  );
};

export default Support;
