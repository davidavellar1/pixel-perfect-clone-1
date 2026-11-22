import { createFileRoute } from '@tanstack/react-router';
import CountryNews from '@/components/news/CountryNews';
import CountryProfilePanel from '@/components/country/CountryProfilePanel';
import { countryName, isKnownCountry } from '@/lib/news/regions';
export const Route = createFileRoute('/app/countries/$code')({
 head: ({params}) => ({meta:[{title:`${countryName(params.code)} market - DHC Market`},{name:'description',content:`District heating and cooling context and news in ${countryName(params.code)}.`},{property:'og:title',content:`${countryName(params.code)} market - DHC Market`},{property:'og:description',content:`District heating and cooling context and news in ${countryName(params.code)}.`},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component: CountryPage,
});
function CountryPage(){
 const {code}=Route.useParams();
 if(!isKnownCountry(code))return <p>Country not found.</p>;
 const cc=code.toUpperCase();
 return <div className="max-w-workspace space-y-8"><header><h1 className="font-display text-3xl font-semibold">{countryName(cc)}</h1><p className="mt-1 text-[15px] text-muted-foreground">Country context from the DHC Market library and district heating and cooling news.</p></header><CountryProfilePanel code={cc}/><CountryNews code={cc}/></div>;
}
