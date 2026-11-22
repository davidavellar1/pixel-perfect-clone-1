import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import type { Database } from '@/integrations/supabase/types';
type Health = Database['public']['Functions']['news_source_health']['Returns'][number];
export default function NewsHealth() {
 const {roles}=useAuth(); const [rows,setRows]=useState<Health[]>([]); const [error,setError]=useState(false); const [loading,setLoading]=useState(true);
 const load=async()=>{setLoading(true);const result=await supabase.rpc('news_source_health');setError(Boolean(result.error));setRows(result.data ?? []);setLoading(false);};
 useEffect(()=>{if(roles.includes('admin'))void load();},[roles.join(',')]);
 if(!roles.includes('admin'))return <p role="alert">This page is available to administrators only.</p>;
 return <div className="workspace-container space-y-5"><header className="flex items-center justify-between gap-4"><h1 className="font-display text-3xl font-semibold">News source health</h1><Button variant="outline" onClick={()=>void load()} disabled={loading}>Refresh</Button></header>{error?<p role="alert">Source health could not be loaded.</p>:loading?<p role="status">Loading sources...</p>:<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border">{['Source','Country','Active','Last success','Failures','Items ingested','Last error'].map(label=><th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.slug} className="border-b border-border"><td className="p-3 font-semibold">{row.name}</td><td className="p-3">{row.country_code ?? 'EU-wide'}</td><td className="p-3">{row.active?'Yes':'No'}</td><td className="p-3">{row.last_success_at?new Date(row.last_success_at).toLocaleString('en-GB'):'No successful poll recorded'}</td><td className="p-3">{row.consecutive_failures}</td><td className="p-3">{row.items_ingested}</td><td className="max-w-sm break-words p-3">{row.last_error}</td></tr>)}</tbody></table></div>}</div>;
}
