import { SLA_LAPSE_WORKING_DAYS, SLA_ESCALATION_WORKING_DAYS } from "./access";

export function pendingAccessNotices(input: { id: string; project_id: string; investor_user_id: string; ownerId?: string; workingDays: number; paused: boolean; title: string; teaserTitle: string }) {
  const { id, project_id, investor_user_id, ownerId, workingDays, paused, title, teaserTitle } = input;
  if (paused || workingDays < SLA_ESCALATION_WORKING_DAYS) return [];
  const lapsed = workingDays >= SLA_LAPSE_WORKING_DAYS;
  const kind = lapsed ? "access_request_lapsed" : "access_request_escalation";
  const recipients = lapsed ? [investor_user_id, ownerId] : [ownerId];
  return [...new Set(recipients.filter((value): value is string => Boolean(value)))].map((user_id) => ({
    user_id, kind, project_id, access_request_id: id,
    title: lapsed ? "Access request lapsed without a decision" : "Access request needs a decision",
    body: lapsed ? `The request on ${user_id === investor_user_id ? teaserTitle : title} reached ${SLA_LAPSE_WORKING_DAYS} working days without a decision. No access was granted and no introduction was logged.` : `The request on ${title} has been waiting ${workingDays} working days. Please review it before it lapses.`,
    link: user_id === ownerId ? `/app/access-requests?request=${id}` : "/app/my-deals/investing",
    dedupe_key: `${kind}:${id}:${user_id}`,
  }));
}