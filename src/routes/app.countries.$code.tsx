import { createFileRoute } from '@tanstack/react-router';
import MarketNews from '@/pages/platform/MarketNews';
import { countryName, isKnownCountry } from '@/lib/news/regions';
export const Route = createFileRoute('/app/countries/$code')({
 head: ({params}) => ({meta:[{title:`${countryName(params.code)} market - DHC Market`},{name:'description',content:`District heating and cooling news in ${countryName(params.code)}.`},{property:'og:title',content:`${countryName(params.code)} market - DHC Market`},{property:'og:description',content:`District heating and cooling news in ${countryName(params.code)}.`},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component: CountryPage,
});
function CountryPage(){const {code}=Route.useParams();return isKnownCountry(code)?<MarketNews initialCountry={code.toUpperCase()} />:<p>Country not found.</p>;}
