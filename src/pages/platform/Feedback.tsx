import { useState, type FormEvent } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { BODY_MAX, FEEDBACK_CATEGORIES, referrerPath } from "@/lib/memberMessages";

const RATING_LABEL = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

const Feedback = () => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<{ category?: string; body?: string }>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!category) next.category = "Choose a category.";
    if (!body.trim()) next.body = "Write your feedback.";
    setErrors(next);
    if (Object.keys(next).length || !user) return;
    setSending(true);
    const { error } = await supabase.from("member_message").insert({
      user_id: user.id,
      kind: "feedback",
      topic: category,
      body: body.trim(),
      rating,
      page_url: referrerPath(),
    });
    setSending(false);
    if (error) {
      toast.error("Your feedback wasn't sent. Please try again.");
      return;
    }
    setSent(true);
  };

  const reset = () => {
    setRating(null);
    setCategory("");
    setBody("");
    setErrors({});
    setSent(false);
  };

  return (
    <div className="mx-auto w-full max-w-[760px] space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase text-accent">Support</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">Feedback</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tell us what works and what doesn't. Every message is read by the team.
        </p>
      </header>

      {sent ? (
        <div
          role="status"
          className="flex flex-col items-center rounded-lg border border-border bg-card px-6 py-14 text-center"
        >
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </span>
          <p className="font-display text-lg font-semibold text-foreground">
            Thanks — your feedback helps shape the platform.
          </p>
          <Button variant="outline" className="mt-5" onClick={reset}>
            Send more feedback
          </Button>
        </div>
      ) : (
        <form
          onSubmit={submit}
          noValidate
          className="space-y-6 rounded-lg border border-border bg-card p-6"
        >
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium text-foreground">
              How would you rate DHC Market?{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </legend>
            <div className="flex flex-wrap items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = rating !== null && n <= rating;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={rating === n}
                    aria-label={`${n} out of 5 — ${RATING_LABEL[n]}`}
                    onClick={() => setRating(rating === n ? null : n)}
                    className="rounded-md p-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Star
                      className={cn(
                        "h-7 w-7",
                        active ? "fill-accent text-accent" : "text-muted-foreground",
                      )}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-sm text-muted-foreground" aria-live="polite">
                {rating ? RATING_LABEL[rating] : ""}
              </span>
            </div>
          </fieldset>

          <div className="grid gap-2">
            <Label htmlFor="feedback-category">Category</Label>
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v);
                setErrors((e) => ({ ...e, category: undefined }));
              }}
            >
              <SelectTrigger
                id="feedback-category"
                className="h-11 bg-background"
                aria-invalid={!!errors.category}
                aria-describedby={errors.category ? "feedback-category-error" : undefined}
              >
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p id="feedback-category-error" className="text-xs font-medium text-destructive">
                {errors.category}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="feedback-body">Message</Label>
              <span id="feedback-body-count" className="text-xs text-muted-foreground">
                {body.length.toLocaleString()} / {BODY_MAX.toLocaleString()}
              </span>
            </div>
            <Textarea
              id="feedback-body"
              value={body}
              maxLength={BODY_MAX}
              rows={7}
              className="bg-background"
              onChange={(e) => {
                setBody(e.target.value);
                setErrors((er) => ({ ...er, body: undefined }));
              }}
              aria-invalid={!!errors.body}
              aria-describedby={cn("feedback-body-count", errors.body && "feedback-body-error")}
            />
            {errors.body && (
              <p id="feedback-body-error" className="text-xs font-medium text-destructive">
                {errors.body}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={sending}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {sending ? "Sending…" : "Send feedback"}
          </Button>
        </form>
      )}
    </div>
  );
};

export default Feedback;
