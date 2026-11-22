import { createFileRoute } from '@tanstack/react-router';
import NewsHealth from '@/pages/platform/admin/NewsHealth';
export const Route=createFileRoute('/app/admin/news-health')({head:()=>({meta:[{title:'News source health - DHC Market'},{name:'description',content:'Internal source polling and ingestion health.'},{property:'og:title',content:'News source health - DHC Market'},{property:'og:description',content:'Internal source polling and ingestion health.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),component:NewsHealth});
