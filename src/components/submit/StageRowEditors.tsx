import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WizardSelect, WizardOption } from "./wizardFields";
import { actualYears, type SubmissionDocument } from "@/lib/submission/stageSchema";
export const TIMELINE_LABELS=["Feasibility complete","Permits issued","Financial close","Construction start","Commissioning"];
export function StageRows({kind,document,onChange}:{kind:"designMix"|"existingMix"|"timeline"|"capital"|"actuals";document:SubmissionDocument;onChange:(rows:Record<string,string>[])=>void}) {
 const rows=document.rows[kind]??[];
 const columns=kind==="actuals"?["year","output","losses","revenue","opex"]:kind==="timeline"?["label","date"]:kind==="capital"?["label","amount","provider","status"]:["source","share"];
 const labels:Record<string,string>={year:"Year",output:"Output GWh",losses:"Losses percent",revenue:"Revenue EUR",opex:"Opex EUR",label:kind==="timeline"?"Milestone":"Tranche",date:"Target date",amount:"Amount EUR",provider:"Counterparty",status:"Status",source:"Energy source",share:"Share percent"};
 const fixed=kind==="actuals"?actualYears(document):kind==="timeline"?5:kind==="capital"?4:null;
 const displayed: Record<string,string>[] =fixed!==null?Array.from({length:fixed},(_,i)=>({...rows[i],...(kind==="timeline"?{label:TIMELINE_LABELS[i]??""}:{})})):rows;
 const update=(i:number,key:string,value:string)=>onChange(displayed.map((r,index)=>index===i?{...r,[key]:value}:r));
 return <div className="space-y-4">{displayed.map((row,i)=><fieldset key={i} className="border-b border-border pb-4"><legend className="mb-3 text-sm font-semibold">{kind==="actuals"?`Operating year ${i+1}`:kind==="timeline"?TIMELINE_LABELS[i]:`Row ${i+1}`}</legend><div className="grid gap-3 sm:grid-cols-2">{columns.map(key=>key==="label"&&kind==="timeline"?null:<Label key={key} className="block space-y-2"><span>{labels[key]}</span>{key==="status"?<WizardSelect value={row[key]??""} onChange={e=>update(i,key,e.target.value)}>{(document.stage==="construction"?["Committed","Drawn"]:["Intended","In discussion","Committed"]).map(value=><WizardOption key={value}>{value}</WizardOption>)}</WizardSelect>:<Input aria-label={`${labels[key]}, row ${i+1}`} type={key==="date"?"date":["year","output","losses","revenue","opex","amount","share"].includes(key)?"number":"text"} min={key==="date"?undefined:0} value={row[key]??""} onChange={e=>update(i,key,e.target.value)} />}</Label>)}</div>{fixed===null&&<Button className="mt-3" variant="outline" size="sm" onClick={()=>onChange(rows.filter((_,index)=>i!==index))}>Remove row</Button>}</fieldset>)}{fixed===null&&<Button variant="outline" onClick={()=>onChange([...rows,{}])}>Add energy source</Button>}</div>;
}
