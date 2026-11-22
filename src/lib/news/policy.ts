// Match the ingestion threshold; manual hiding remains an independent editorial control.
export const MIN_NEWS_RELEVANCE = 30;
export function publishableNews(item: { relevance: number; hidden: boolean }) {
  return !item.hidden && item.relevance >= MIN_NEWS_RELEVANCE;
}
export function newsPriority(a: { related_project_ids: string[]; category: string; relevance: number; published_at: string }, b: typeof a, followed: ReadonlySet<string>) {
  const linked = (item: typeof a) => Number(item.related_project_ids.some(id => followed.has(id)));
  const policy = (item: typeof a) => Number(item.category === 'policy');
  return linked(b) - linked(a) || policy(b) - policy(a) || b.relevance - a.relevance || b.published_at.localeCompare(a.published_at);
}
export function canLeadNews(publishedAt: string, now = Date.now()) {
  const time = Date.parse(publishedAt);
  return Number.isFinite(time) && time <= now && now - time <= 7 * 86400000;
}
