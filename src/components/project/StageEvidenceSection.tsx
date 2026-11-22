import type { SubmissionDocument } from '@/lib/submission/stageSchema';
import { fieldsForDocument, OBJECTIVES } from '@/lib/submission/stageSchema';
import { fundingAssumptionLines } from '@/lib/submission/disclosures';
const sections:Record<string,string[]>={'Summary':['risks'],'Technical':['technical','construction','actuals'],'Financial':['financial'],'Sustainability':['sustainability'],'Structure':['access']};
export function StageEvidenceSection({document,tab}:{document:SubmissionDocument|null;tab:string}) {
 if(!document)return null;
 const fields=fieldsForDocument(document).filter(f=>sections[tab]?.includes(f.section)&&document.answers[f.key]?.trim());
 const date=document.answers['asOf'];
 const rows=tab==='Technical'?document.rows['actuals']??[]:[];
 return <div className="space-y-6">{fields.length>0&&<section><h2 className="mb-3 font-display text-2xl font-semibold">{tab==='Summary'?'Named risks and exposed assumption':tab==='Sustainability'?'Developer-stated environmental position':'Developer-stated project information'}</h2><p className="mb-4 text-xs text-muted-foreground">Developer-stated{date?`, as of ${date}`:''}.</p><dl className="divide-y divide-border">{fields.map(f=><div key={f.key} className="grid gap-2 py-3 sm:grid-cols-2"><dt className="text-sm text-muted-foreground">{f.label}</dt><dd className="break-words text-sm font-medium">{document.answers[f.key]}</dd></div>)}</dl></section>}
 {rows.length>0&&<section><h2 className="mb-3 font-display text-2xl font-semibold">Operating actuals - developer-stated</h2><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-sm"><thead><tr>{['Year','Output GWh','Losses percent','Revenue EUR','Opex EUR'].map(h=><th key={h} className="border-b border-border p-3 text-left">{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{['year','output','losses','revenue','opex'].map(k=><td key={k} className="border-b border-border p-3">{r[k]}</td>)}</tr>)}</tbody></table></div></section>}
 {tab==='Financial'&&fundingAssumptionLines(document).map(line=><p key={line} className="text-sm text-muted-foreground">{line}</p>)}
 {tab==='Financial'&&document.answers['fundingPlan']==='none'&&<p className="text-sm text-muted-foreground">Public funding: Not applicable to this project</p>}
 </div>;
}
