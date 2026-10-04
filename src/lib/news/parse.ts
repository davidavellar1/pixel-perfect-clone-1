import { XMLParser } from "fast-xml-parser";

export interface ParsedItem {
  title: string;
  url: string;
  publishedAt: Date | null;
  excerpt: string | null;
  imageUrl: string | null;
  publisher: string | null;
  language: string | null;
  sourceCountry: string | null;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export const stripHtml = (input: string): string =>
  input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n: string) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();

const text = (v: unknown): string => {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return text(v[0]);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return text(o["#text"] ?? o["@_href"] ?? "");
  }
  return "";
};

const asArray = <T,>(v: T | T[] | undefined): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

const toDate = (s: string): Date | null => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

const pickImage = (item: Record<string, unknown>): string | null => {
  for (const enc of asArray(item.enclosure as Record<string, unknown> | Record<string, unknown>[])) {
    const type = text(enc?.["@_type"]);
    const url = text(enc?.["@_url"]);
    if (url && (!type || type.startsWith("image"))) return url;
  }
  for (const key of ["media:content", "media:thumbnail"]) {
    for (const m of asArray(item[key] as Record<string, unknown> | Record<string, unknown>[])) {
      const url = text(m?.["@_url"]);
      if (url) return url;
    }
  }
  return null;
};

export const parseFeed = (xml: string): ParsedItem[] => {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", processEntities: true });
  const doc = parser.parse(xml) as Record<string, unknown>;
  const out: ParsedItem[] = [];

  const rss = doc.rss as Record<string, unknown> | undefined;
  const rdf = doc["rdf:RDF"] as Record<string, unknown> | undefined;
  const channel = (rss?.channel ?? rdf?.channel) as Record<string, unknown> | undefined;
  const rssItems = asArray((channel?.item ?? rdf?.item) as Record<string, unknown> | Record<string, unknown>[]);
  for (const item of rssItems) {
    const desc = text(item.description ?? item["dc:description"]);
    out.push({
      title: stripHtml(text(item.title)),
      url: text(item.link).trim() || text(item.guid).trim(),
      publishedAt: toDate(text(item.pubDate ?? item["dc:date"])),
      excerpt: desc ? stripHtml(desc) || null : null,
      imageUrl: pickImage(item),
      publisher: null,
      language: null,
      sourceCountry: null,
    });
  }

  const feed = doc.feed as Record<string, unknown> | undefined;
  for (const entry of asArray(feed?.entry as Record<string, unknown> | Record<string, unknown>[])) {
    const links = asArray(entry.link as Record<string, unknown> | Record<string, unknown>[]);
    const alt = links.find((l) => !l["@_rel"] || l["@_rel"] === "alternate") ?? links[0];
    const summary = text(entry.summary);
    out.push({
      title: stripHtml(text(entry.title)),
      url: text(alt?.["@_href"]).trim(),
      publishedAt: toDate(text(entry.published ?? entry.updated)),
      excerpt: summary ? stripHtml(summary) || null : null,
      imageUrl: pickImage(entry),
      publisher: null,
      language: null,
      sourceCountry: null,
    });
  }
  return out;
};

interface GdeltArticle {
  url?: string;
  title?: string;
  seendate?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
  socialimage?: string;
}

export const parseGdeltDate = (s: string): Date | null => {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(s);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
};

export const parseGdelt = (json: unknown): ParsedItem[] => {
  const articles = ((json as { articles?: GdeltArticle[] })?.articles ?? []);
  return articles.map((a) => ({
    title: stripHtml(a.title ?? ""),
    url: (a.url ?? "").trim(),
    publishedAt: parseGdeltDate(a.seendate ?? ""),
    excerpt: null,
    imageUrl: a.socialimage || null,
    publisher: a.domain || null,
    language: a.language || null,
    sourceCountry: a.sourcecountry || null,
  }));
};

export const canonicalUrl = (raw: string): string | null => {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    for (const key of [...u.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_") || key === "fbclid" || key === "gclid") u.searchParams.delete(key);
    }
    return u.toString();
  } catch {
    return null;
  }
};

export const normaliseTitle = (t: string): string => t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

export const truncateAtWord = (s: string, max: number): string => {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const idx = cut.lastIndexOf(" ");
  return `${(idx > 40 ? cut.slice(0, idx) : cut).trimEnd()}…`;
};
