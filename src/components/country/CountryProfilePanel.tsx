import { Link } from "@/lib/router-compat";
import { countryFacts } from "@/lib/countryProfile";
import { useCountryProfile } from "@/hooks/useCountryProfile";
import { countryName } from "@/lib/news/regions";

/** Country library panel: each value with its source and vintage, or the typed absence copy. */
export default function CountryProfilePanel({ code, linkToCountry = false }: { code: string; linkToCountry?: boolean }) {
  const { row, loading, failed } = useCountryProfile(code);
  const facts = countryFacts(row);
  const cc = code.trim().toUpperCase();
  return <section aria-labelledby={`country-${cc}`} className="rounded-lg border border-border bg-card p-5">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 id={`country-${cc}`} className="font-display text-lg font-semibold">{countryName(cc)}: country context</h2>
      {linkToCountry && <Link to={`/app/countries/${cc}`} className="text-sm font-semibold text-primary hover:underline">Country page</Link>}
    </div>
    <p className="mt-1 text-xs text-muted-foreground">Researched by DHC Market from public sources, not by the developer. Each value shows its source and data year.</p>
    {loading ? <p role="status" className="mt-4 text-sm text-muted-foreground">Loading country context...</p> : failed ? <p role="alert" className="mt-4 text-sm text-destructive">Country context could not be loaded.</p> :
      <dl className="mt-4 divide-y divide-border text-sm">{facts.map((fact) => <div key={fact.key} className="grid gap-1 py-2.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <dt className="text-muted-foreground">{fact.label}</dt>
        <dd>{fact.value === null ? <span className="text-muted-foreground">{fact.absence}</span> : <>
          <span className="font-semibold">{fact.value}</span>
          {fact.source && <span className="mt-0.5 block text-xs text-muted-foreground"><a href={fact.source.url} target="_blank" rel="noopener noreferrer nofollow" className="text-primary underline">{fact.source.title}</a>, data year {fact.source.year}, {fact.source.confidence} confidence</span>}
        </>}</dd>
      </div>)}</dl>}
  </section>;
}
