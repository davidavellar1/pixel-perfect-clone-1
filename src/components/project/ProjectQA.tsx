import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type Question = Pick<
  Tables<"question">,
  "id" | "body" | "created_at" | "author_id" | "answer_body" | "answered_at" | "is_public"
>;

const MAX_QUESTION = 1000;
const MAX_ANSWER = 3000;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

interface ProjectQAProps {
  projectId?: string;
  userId: string | null;
  isOwner: boolean;
}

/**
 * Investor questions on a listing.
 * Investors with accepted access ask; the developer answers and chooses whether the
 * answer is shared with every investor who has access (askers stay anonymous) or
 * only with the investor who asked. Both sides are notified.
 */
const ProjectQA = ({ projectId, userId, isOwner }: ProjectQAProps) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    const { data, error } = await supabase
      .from("question")
      .select("id, body, created_at, author_id, answer_body, answered_at, is_public")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Q&A query failed", error);
      setQuestions([]);
      return;
    }
    setQuestions(data ?? []);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!projectId) {
    return (
      <Section>
        <p className="text-sm text-muted-foreground">
          Q&A opens once this listing is live on the platform.
        </p>
      </Section>
    );
  }

  const submit = async () => {
    const body = draft.trim();
    if (body.length < 5) {
      toast({
        title: "Question too short",
        description: "Please write at least a short sentence.",
        variant: "destructive",
      });
      return;
    }
    if (!userId) return;
    setSending(true);
    const { error } = await supabase
      .from("question")
      .insert({ project_id: projectId, author_id: userId, body });
    setSending(false);
    if (error) {
      toast({
        title: "Question not sent",
        description:
          error.code === "42501"
            ? "Questions can be asked once the developer has accepted your access request."
            : "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return;
    }
    setDraft("");
    toast({
      title: "Question sent",
      description: "The developer has been notified. You'll get a notification when they answer.",
    });
    void load();
  };

  const own = (q: Question) => q.author_id === userId;
  const published = (questions ?? []).filter((q) => q.answer_body && q.is_public && !own(q));
  const mine = (questions ?? []).filter(own);
  const unanswered = (questions ?? []).filter((q) => !q.answer_body);
  const answered = (questions ?? []).filter((q) => q.answer_body);

  return (
    <Section>
      {questions === null ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : isOwner ? (
        <>
          <h3 className="mb-3 text-base font-semibold text-foreground">
            Awaiting your answer{unanswered.length ? ` (${unanswered.length})` : ""}
          </h3>
          {unanswered.length === 0 ? (
            <Empty text="No open questions. Investors with accepted access can ask here, and you'll be notified." />
          ) : (
            <div className="space-y-4">
              {unanswered.map((q) => (
                <AnswerCard key={q.id} question={q} onAnswered={load} />
              ))}
            </div>
          )}
          {answered.length > 0 && (
            <>
              <h3 className="mb-3 mt-8 text-base font-semibold text-foreground">Answered</h3>
              <div className="space-y-4">
                {answered.map((q) => (
                  <QuestionCard key={q.id} question={q} asker="Investor" showVisibility />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {mine.length > 0 && (
            <>
              <h3 className="mb-3 text-base font-semibold text-foreground">Your questions</h3>
              <div className="mb-8 space-y-4">
                {mine.map((q) => (
                  <QuestionCard key={q.id} question={q} asker="You" showStatus />
                ))}
              </div>
            </>
          )}
          <h3 className="mb-3 text-base font-semibold text-foreground">
            Answers shared by the developer
          </h3>
          {published.length === 0 ? (
            <Empty text="No answers have been shared with investors yet." />
          ) : (
            <div className="space-y-4">
              {published.map((q) => (
                <QuestionCard key={q.id} question={q} asker="An investor" />
              ))}
            </div>
          )}

          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <Label
              htmlFor="qa-question"
              className="mb-3 block text-base font-semibold text-foreground"
            >
              Ask the project developer
            </Label>
            <Textarea
              id="qa-question"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={MAX_QUESTION}
              aria-describedby="qa-question-help"
              placeholder="Type your question here…"
              className="min-h-[110px] resize-y bg-background"
            />
            <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
              <p id="qa-question-help" className="max-w-[52ch] text-xs text-muted-foreground">
                Goes to the developer only. If they share the answer with other investors who have
                access, your name and organisation are not shown.
              </p>
              <span className="text-xs text-muted-foreground">
                {draft.length}/{MAX_QUESTION}
              </span>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDraft("")} disabled={!draft || sending}>
                Clear
              </Button>
              <Button onClick={submit} disabled={sending || !draft.trim()}>
                {sending ? "Sending…" : "Send question"}
              </Button>
            </div>
          </div>
        </>
      )}

      <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <Shield className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Q&A is open to investors whose access request the developer has accepted.</p>
      </div>
    </Section>
  );
};

const Section = ({ children }: { children: React.ReactNode }) => (
  <div>
    <h2 className="mb-3 text-2xl font-serif font-bold text-foreground">Investor questions</h2>
    <div className="mb-6 border-t border-border" />
    {children}
  </div>
);

const Empty = ({ text }: { text: string }) => (
  <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card px-5 py-6 text-sm text-muted-foreground">
    <MessageSquare className="h-5 w-5 shrink-0" />
    {text}
  </div>
);

const QuestionCard = ({
  question: q,
  asker,
  showStatus = false,
  showVisibility = false,
}: {
  question: Question;
  asker: string;
  showStatus?: boolean;
  showVisibility?: boolean;
}) => (
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <span className="font-semibold text-foreground">{asker}</span>
      <span className="text-muted-foreground">· {formatDate(q.created_at)}</span>
      {showStatus && (
        <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {!q.answer_body
            ? "Awaiting answer"
            : q.is_public
              ? "Answered · shared"
              : "Answered · only you"}
        </span>
      )}
      {showVisibility && q.answer_body && (
        <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {q.is_public ? "Shared with investors" : "Only the asker"}
        </span>
      )}
    </div>
    <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
      {q.body}
    </p>
    {q.answer_body && (
      <div className="ml-4 mt-4 border-l-2 border-primary/30 pl-5">
        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-semibold text-foreground">Developer</span>
          {q.answered_at && (
            <span className="text-muted-foreground">· {formatDate(q.answered_at)}</span>
          )}
        </div>
        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {q.answer_body}
        </p>
      </div>
    )}
  </div>
);

const AnswerCard = ({
  question: q,
  onAnswered,
}: {
  question: Question;
  onAnswered: () => void;
}) => {
  const { toast } = useToast();
  const [answer, setAnswer] = useState("");
  const [share, setShare] = useState(true);
  const [busy, setBusy] = useState(false);
  const fieldId = `qa-answer-${q.id}`;

  const send = async () => {
    if (answer.trim().length < 2) return;
    setBusy(true);
    const { error } = await supabase.rpc("answer_question", {
      _question_id: q.id,
      _answer: answer.trim(),
      _publish: share,
    });
    setBusy(false);
    if (error) {
      toast({
        title: "Answer not saved",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Answer sent", description: "The investor has been notified." });
    onAnswered();
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="font-semibold text-foreground">Investor</span>
        <span className="text-muted-foreground">· {formatDate(q.created_at)}</span>
      </div>
      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
        {q.body}
      </p>
      <Label htmlFor={fieldId} className="sr-only">
        Your answer
      </Label>
      <Textarea
        id={fieldId}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        maxLength={MAX_ANSWER}
        placeholder="Write your answer…"
        className="mt-4 min-h-[90px] resize-y bg-background"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${fieldId}-share`}
            checked={share}
            onCheckedChange={(v) => setShare(v === true)}
          />
          <Label htmlFor={`${fieldId}-share`} className="text-sm font-normal text-muted-foreground">
            Share with all investors who have access (asker stays anonymous)
          </Label>
        </div>
        <Button onClick={send} disabled={busy || answer.trim().length < 2}>
          {busy ? "Sending…" : "Send answer"}
        </Button>
      </div>
    </div>
  );
};

export default ProjectQA;
