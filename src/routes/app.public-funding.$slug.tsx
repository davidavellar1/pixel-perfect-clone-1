import {createFileRoute} from '@tanstack/react-router';
import FundingProgrammeDetail from '@/pages/platform/FundingProgrammeDetail';
export const Route=createFileRoute('/app/public-funding/$slug')({head:({params})=>({meta:[{title:`${params.slug.replaceAll('-',' ')} funding - DHC Market`},{name:'description',content:'Published funding criteria, terms and official sources.'},{property:'og:title',content:`${params.slug.replaceAll('-',' ')} funding - DHC Market`},{property:'og:description',content:'Published funding criteria, terms and official sources.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:Page});
function Page(){const {slug}=Route.useParams();return <FundingProgrammeDetail slug={slug}/>;}
