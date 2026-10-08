export type MemberMessageKind = "support" | "feedback";
export type MemberMessageStatus = "open" | "answered" | "closed";

export const SUPPORT_TOPICS = [
  "Account & sign-in",
  "Listing a project",
  "Access requests & data room",
  "Investing & introductions",
  "Technical problem",
  "Other",
] as const;

export const FEEDBACK_CATEGORIES = [
  "Idea",
  "Something isn't working",
  "Design & usability",
  "Data & content",
  "Other",
] as const;

export const SUBJECT_MAX = 120;
export const BODY_MAX = 5000;

export const STATUS_LABEL: Record<MemberMessageStatus, string> = {
  open: "Open",
  answered: "Answered",
  closed: "Closed",
};

export const STATUS_CLASS: Record<MemberMessageStatus, string> = {
  open: "bg-warning/15 text-warning",
  answered: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
};

export const formatMessageDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Referrer path inside the app, or null; never stores external URLs or query strings. */
export const referrerPath = (): string | null => {
  try {
    if (!document.referrer) return null;
    const url = new URL(document.referrer);
    return url.origin === window.location.origin ? url.pathname.slice(0, 500) : null;
  } catch {
    return null;
  }
};
