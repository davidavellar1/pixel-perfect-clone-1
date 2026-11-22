import { emptyDocument, FIELDS, fieldsForDocument, lockedBasis, STAGES, type SubmissionDocument } from "./stageSchema";
import type { Tables, Json } from "@/integrations/supabase/types";
export function normalizeDocument(d: SubmissionDocument): SubmissionDocument {
 const basis=lockedBasis(d.stage);
 const answers: Record<string,string>={...d.answers,...(basis?{capacityBasis:basis,capexBasis:basis}:{}),...(d.answers["projectType"]==="modernisation"?{site:"Existing network site"}:{})};
 if(d.stage==="concept"){ answers["existingBasis"]="measured"; }
 return {...d,answers};
}
export function serializeDocument(raw:SubmissionDocument) {
 const d=normalizeDocument(raw),a=d.answers;
 const numeric=(key:string)=>a[key]?.trim()?Number(a[key]):null;
 const mix=(d.stage==="concept"?d.rows["existingMix"]:d.rows["designMix"])??[];
 return {
  project:{title:a["title"]??"",summary:a["summary"]??"",country_code:a["country"]??"",project_type:a["projectType"]??null,technology:a["technology"]??null,lifecycle_stage:d.stage,capacity_mw:numeric("capacity"),headline_investment:numeric("capex")},
  energy_mix:mix.filter(r=>r["source"]).map(r=>({source:r["source"],share_pct:Number(r["share"])})),
  milestones:(d.rows["timeline"]??[]).filter(r=>r["date"]).map((r,i)=>({label:r["label"],target_date:r["date"],sort_order:i})),
  capital_stack:(d.rows["capital"]??[]).filter(r=>r["label"]&&r["amount"]).map(r=>({label:r["label"],amount:Number(r["amount"]),provider:r["provider"]??null})),
 };
}
export function parseDocument(value:Json|null):SubmissionDocument|null {
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 const stage=value["stage"];
 if(typeof stage!=="string"|| !STAGES.includes(stage as typeof STAGES[number]))return null;
 const answers=value["answers"],rows=value["rows"];
 if(!answers||typeof answers!=="object"||Array.isArray(answers)||!rows||typeof rows!=="object"||Array.isArray(rows))return null;
 return {version:typeof value["version"]==="string"?value["version"]:emptyDocument().version,stage:stage as typeof STAGES[number],answers:Object.fromEntries(Object.entries(answers).filter((e):e is [string,string]=>typeof e[1]==="string")),rows:Object.fromEntries(Object.entries(rows).map(([key,value])=>[key,Array.isArray(value)?value.filter((r):r is {[key:string]:Json}=>Boolean(r)&&typeof r==="object"&&!Array.isArray(r)).map(r=>Object.fromEntries(Object.entries(r).filter((e):e is [string,string]=>typeof e[1]==="string"))):[]])),askedFields:Array.isArray(value["askedFields"])?value["askedFields"].filter((s):s is string=>typeof s==="string"):[],step:typeof value["step"]==="string"?value["step"]:"basics"};
}
export function legacyDocument(p:Tables<"project">):SubmissionDocument {
 const d=emptyDocument();
 d.stage=STAGES.includes(p.lifecycle_stage as typeof STAGES[number])?p.lifecycle_stage as typeof STAGES[number]:"development";
 d.answers={title:p.title,country:p.country_code,projectType:p.project_type,technology:p.technology,capacity:p.capacity_mw===null?"":String(p.capacity_mw),capex:p.headline_investment===null?"":String(p.headline_investment),summary:p.summary??"",asOf:p.financial_as_of??p.technical_as_of??""};
 d.askedFields=p.asked_fields??[];
 return d;
}
export function askedDocumentKeys(d:SubmissionDocument,section:string) {return fieldsForDocument(d).filter(f=>f.section===section).map(f=>`stage.${f.key}`);}
export function fieldsInSection(d:SubmissionDocument,section:string) {return fieldsForDocument(d).filter(f=>f.section===section);}
export const FIELD_KEYS=new Set(FIELDS.map(f=>f.key));
