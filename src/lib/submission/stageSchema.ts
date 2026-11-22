import { z } from "zod";
export const STAGES = ["concept", "feasibility", "development", "construction", "operational"] as const;
export type Stage = typeof STAGES[number];
export const STAGE_LABELS: Record<Stage, string> = { concept: "Concept", feasibility: "Feasibility", development: "Development", construction: "Construction", operational: "Operational" };
export const COUNTRY_OPTIONS = [["AT","Austria"],["BE","Belgium"],["HR","Croatia"],["CZ","Czech Republic"],["DK","Denmark"],["EE","Estonia"],["FI","Finland"],["FR","France"],["DE","Germany"],["GR","Greece"],["HU","Hungary"],["IE","Ireland"],["IT","Italy"],["LV","Latvia"],["LT","Lithuania"],["NL","Netherlands"],["NO","Norway"],["PL","Poland"],["PT","Portugal"],["RO","Romania"],["SK","Slovakia"],["SI","Slovenia"],["ES","Spain"],["SE","Sweden"],["CH","Switzerland"],["GB","United Kingdom"]] as const;
export const TECHNOLOGY_OPTIONS = [["waste_heat_recovery","Waste heat"],["geothermal","Geothermal"],["large_heat_pump","Large heat pump"],["solar_thermal","Solar thermal"],["biomass_chp","Biomass / CHP"],["thermal_storage","Thermal storage"],["hybrid","Hybrid"]] as const;
export const INSTRUMENTS = ["equity", "equity_and_shareholder_loan", "preferred_equity", "mezzanine", "convertible"];
export const RISK_OPTIONS = ["Demand / offtake", "Heat source availability", "Site control", "Permitting", "Construction", "Technology", "Financing", "Energy prices", "Counterparty", "Operations"];
export const OBJECTIVES = ["Climate change mitigation", "Climate change adaptation", "Water and marine resources", "Circular economy", "Pollution prevention and control", "Biodiversity and ecosystems"];
export type SubmissionDocument = { version: string; stage: Stage | ""; answers: Record<string, string>; rows: Record<string, Record<string, string>[]>; askedFields: string[]; step: string };
export const emptyDocument = (): SubmissionDocument => ({ version: "2026-11-stage-wizard-1", stage: "", answers: {}, rows: {}, askedFields: [], step: "basics" });
export type FieldSpec = { key: string; label: string; section: string; stages?: readonly Stage[]; required?: boolean; type?: "text" | "number" | "date" | "textarea" | "select" | "multi"; options?: readonly (readonly [string,string])[]; max?: number; limit?: number; when?: (d: SubmissionDocument) => boolean };
const afterConcept: Stage[] = ["feasibility", "development", "construction", "operational"];
const late: Stage[] = ["development", "construction", "operational"];
const design: Stage[] = ["feasibility", "development", "construction"];
const options = (items: readonly string[]) => items.map(value => [value, value] as const);
const yesNo = [["yes","Yes"],["no","No"]] as const;
export const FIELDS: FieldSpec[] = [
 { key:"title",label:"Project title",section:"basics",required:true },
 { key:"country",label:"Country",section:"basics",required:true,type:"select",options:COUNTRY_OPTIONS },
 { key:"projectType",label:"Project type",section:"basics",required:true,type:"select",options:[["greenfield","Greenfield"],["brownfield","Brownfield extension"],["modernisation","Modernisation"]] },
 { key:"technology",label:"Primary technology",section:"basics",required:true,type:"select",options:TECHNOLOGY_OPTIONS },
 { key:"capacity",label:"Thermal capacity MW",section:"basics",required:true,type:"number" },
 { key:"capex",label:"Total capex EUR",section:"basics",required:true,type:"number" },
 { key:"precision",label:"Capex precision band",section:"basics",required:true,type:"select",options:options(["Plus or minus 25%","Plus or minus 50%","Wider than 50%"] ) },
 { key:"summary",label:"Anonymised summary",section:"basics",required:true,type:"textarea",limit:2000 },
 { key:"risk1",label:"Named risk 1",section:"risks",required:true,type:"select",options:options(RISK_OPTIONS) },
 { key:"risk2",label:"Named risk 2",section:"risks",required:true,type:"select",options:options(RISK_OPTIONS) },
 { key:"risk3",label:"Named risk 3",section:"risks",required:true,type:"select",options:options(RISK_OPTIONS) },
 { key:"stopper",label:"Which risk could stop the project?",section:"risks",required:true,type:"select" },
 { key:"exposure",label:"The single assumption this case is most exposed to",section:"risks",required:true,type:"textarea",limit:200 },
 { key:"asOf",label:"Figures as of",section:"basics",required:true,type:"date" },
 { key:"anchor",label:"Intended anchor offtaker type",section:"technical",stages:["concept"],required:true,type:"select",options:options(["Municipal buildings","Housing","Industrial","Commercial","Mixed"]) },
 { key:"studyStatus",label:"Feasibility study status",section:"technical",stages:["concept"],required:true,type:"select",options:options(["Not started","Being tendered","Under way"]) },
 { key:"studyExpected",label:"Expected feasibility completion",section:"technical",stages:["concept"],type:"date",when:d=>d.answers["studyStatus"]!=="Not started" && Boolean(d.answers["studyStatus"]) },
 { key:"site",label:"Site control status",section:"technical",stages:["concept","feasibility","development"],required:true,type:"select",options:options(["Identified only","Under negotiation","Option or agreement held","Owned"]),when:d=>d.answers["projectType"]!=="modernisation" },
 { key:"existingLoad",label:"Existing served load MW",section:"technical",type:"number",when:d=>d.answers["projectType"]==="modernisation" },
 ...[{key:"networkLength",label:"Existing network length km"},{key:"existingHeat",label:"Annual heat delivered GWh"},{key:"existingSupply",label:"Existing supply temperature C"},{key:"existingReturn",label:"Existing return temperature C"},{key:"existingLoss",label:"Existing network loss percent",max:100},{key:"households",label:"Connected dwellings"}].map(f=>({...f,section:"technical",type:"number" as const,when:(d:SubmissionDocument)=>d.answers["projectType"]==="modernisation"})),
 {key:"studyComplete",label:"Feasibility study complete",section:"technical",stages:["feasibility","development"],required:true,type:"select",options:yesNo},
 {key:"studyAuthor",label:"Feasibility study author type",section:"technical",stages:["feasibility","development"],required:true,type:"select",options:options(["Internal team","Independent engineering firm","University / research body","Other"])},
 {key:"studyDate",label:"Feasibility study date",section:"technical",stages:["feasibility","development"],required:true,type:"date"},
 ...[{key:"designSupply",label:"Design supply temperature C"},{key:"designReturn",label:"Design return temperature C"},{key:"designHeat",label:"Design annual heat output GWh"},{key:"designLoad",label:"Design load MW"}].map(f=>({...f,section:"technical",type:"number" as const,stages:design,required:true})),
 {key:"revenueModel",label:"Revenue model",section:"financial",stages:afterConcept,required:true,type:"textarea",limit:500},
 {key:"regulated",label:"Is the price regulated or capped?",section:"financial",stages:afterConcept,required:true,type:"select",options:yesNo},
 {key:"grantSplit",label:"Indicative grant share percent",section:"financial",stages:["feasibility"],required:true,type:"number",max:100},
 {key:"debtSplit",label:"Indicative debt share percent",section:"financial",stages:["feasibility"],required:true,type:"number",max:100},
 {key:"equitySplit",label:"Indicative equity share percent",section:"financial",stages:["feasibility"],required:true,type:"number",max:100},
 {key:"indicativeClose",label:"Indicative close year or half year",section:"financial",stages:["feasibility"],required:true},
 {key:"fundingPlan",label:"Is public funding part of the plan?",section:"funding",stages:afterConcept,type:"select",options:[["none","Not pursuing public funding"],["pursuing","Pursuing public funding"]]},
 {key:"dnsh",label:"DNSH assessment status",section:"sustainability",stages:afterConcept,type:"select",options:options(["Not assessed","Self-assessed","Third-party reviewed"])},
 {key:"dnshDate",label:"DNSH assessment date",section:"sustainability",stages:afterConcept,type:"date",when:d=>Boolean(d.answers["dnsh"])&&d.answers["dnsh"]!=="Not assessed"},
 ...OBJECTIVES.flatMap((label,index): FieldSpec[]=>[
  {key:`dnshStatus${index}`,label:`${label} - developer-stated position`,section:"sustainability",stages:afterConcept,type:"select",options:options(["Substantial contribution","Addressed","Not addressed"]),when:d=>Boolean(d.answers["dnsh"])&&d.answers["dnsh"]!=="Not assessed"},
  {key:`dnshText${index}`,label:`${label} - developer-stated statement`,section:"sustainability",stages:afterConcept,type:"textarea",limit:300,when:d=>Boolean(d.answers["dnsh"])&&d.answers["dnsh"]!=="Not assessed"},
 ]),
 {key:"equitySought",label:"Equity sought EUR",section:"transaction",stages:late,required:true,type:"number"},
 {key:"minTicket",label:"Minimum ticket EUR",section:"transaction",stages:late,required:true,type:"number"},
 {key:"instruments",label:"Instruments sought",section:"transaction",stages:late,required:true,type:"multi",options:options(INSTRUMENTS)},
 {key:"targetClose",label:"Target financial close quarter",section:"transaction",stages:["development","construction"],required:true},
 {key:"debtStatus",label:"Debt status",section:"financial",stages:["development","construction"],required:true,type:"select",options:options(["Not approached","Sounded","Term sheet held","Credit approved"])},
 {key:"baseIrr",label:"Target equity IRR at underwriting, percent (base case)",section:"financial",stages:late,required:true,type:"number"},
 {key:"cashYield",label:"Target cash yield percent (base case)",section:"financial",stages:late,required:true,type:"number"},
 {key:"returnBasis",label:"Returns basis (base case)",section:"financial",stages:late,required:true,type:"select",options:options(["measured","modelled","estimated"])},
 {key:"debtAmount",label:"Debt amount EUR",section:"financial",stages:["construction"],required:true,type:"number"},
 {key:"debtTenor",label:"Debt tenor years",section:"financial",stages:["construction"],required:true,type:"number"},
 {key:"debtPricing",label:"Debt pricing",section:"financial",stages:["construction"],required:true},
 {key:"epcStatus",label:"EPC status",section:"construction",stages:["construction"],required:true,type:"select",options:options(["Tendering","Preferred bidder","Contract signed","Under construction"])},
 {key:"epcType",label:"EPC contract type",section:"construction",stages:["construction"],required:true,type:"select",options:options(["Lump-sum turnkey","EPC","EPCM","Multi-contract"])},
 {key:"constructionProgress",label:"Construction progress percent",section:"construction",stages:["construction"],required:true,type:"number",max:100},
 {key:"progressDate",label:"Construction progress as of",section:"construction",stages:["construction"],required:true,type:"date"},
 {key:"commissioning",label:"Commissioning target",section:"construction",stages:["construction"],required:true,type:"date"},
 {key:"historyYears",label:"Years of operating history available",section:"actuals",stages:["operational"],required:true,type:"select",options:options(["1","2","3"])},
 {key:"vehicleDebt",label:"Existing debt - project vehicle",section:"actuals",stages:["operational"],required:true,type:"select",options:yesNo},
 {key:"realisedDscr",label:"Realised DSCR (base case actuals)",section:"actuals",stages:["operational"],required:true,type:"number",when:d=>d.answers["vehicleDebt"]==="yes"},
 {key:"eed",label:"Efficient DHC status under EED Article 26",section:"sustainability",stages:["operational"],required:true,type:"select",options:options(["Share test - renewable / waste heat / cogeneration","GHG-reduction path","Not claimed"])},
 {key:"tariff",label:"Current heat price or tariff EUR/MWh",section:"financial",stages:["operational"],required:true,type:"number"},
 {key:"transactionType",label:"Transaction type",section:"transaction",stages:["operational"],required:true,type:"select",options:options(["Secondary stake","Refinancing","Expansion capital"])},
 {key:"stake",label:"Stake offered percent",section:"transaction",stages:["operational"],required:true,type:"number",max:100},
 {key:"operationalClose",label:"Target close for this transaction",section:"transaction",stages:["operational"],required:true,type:"date"},
 {key:"sponsorAccounts",label:"Audited accounts - sponsor",section:"access",type:"select",options:options(["Available","Not available"])},
 {key:"vehicleAccounts",label:"Audited accounts - project vehicle",section:"access",type:"select",options:options(["Available","Not available","Vehicle not incorporated"])},
 {key:"sponsorDebt",label:"Existing debt - sponsor",section:"access",type:"select",options:yesNo},
 {key:"vehicleDebtDisclosure",label:"Existing debt - project vehicle",section:"access",stages:["concept","feasibility","development","construction"],type:"select",options:yesNo},
 {key:"notifyUsers",label:"Request notification emails",section:"access"},
 {key:"constructionAppetite",label:"Require construction-risk appetite",section:"access",type:"select",options:yesNo},
];
export function fieldsForDocument(d: SubmissionDocument) { return FIELDS.filter(f=>(!f.stages || (d.stage!=="" && f.stages.includes(d.stage))) && (!f.when || f.when(d))); }
export function lockedBasis(stage: Stage | "") { return stage==="concept" ? "estimated" : stage==="feasibility" ? "modelled" : null; }
export function promotionFields(d: SubmissionDocument, from: Stage) { const previous=fieldsForDocument({...d,stage:from}); const keys=new Set(previous.map(f=>f.key)); return fieldsForDocument(d).filter(f=>!keys.has(f.key)); }
export function nextStage(stage: Stage) { return STAGES[STAGES.indexOf(stage)+1] ?? null; }
export function unawardedFunding(d: SubmissionDocument) { return d.stage!=="" && late.includes(d.stage) && d.answers["fundingPlan"]==="pursuing" ? (d.rows["funding"]??[]).filter(r=>["intending","applied","decision_pending"].includes(r["funding_status"]??"")) : []; }
export function actualYears(d: SubmissionDocument) { return d.stage==="operational" ? Math.max(0,Math.min(3,Number(d.answers["historyYears"])||0)) : 0; }
export const documentSchema=z.object({version:z.string(),stage:z.union([z.enum(STAGES),z.literal("")]),answers:z.record(z.string()),rows:z.record(z.array(z.record(z.string()))),askedFields:z.array(z.string()),step:z.string()}).superRefine((raw,ctx)=>{
 const d:SubmissionDocument=raw;
 if (!d.stage) { ctx.addIssue({code:"custom",path:["stage"],message:"Choose a lifecycle stage."}); return; }
 for(const f of fieldsForDocument(d)) {
  const value=d.answers[f.key]??"";
  if(f.required && !value.trim()) ctx.addIssue({code:"custom",path:["answers",f.key],message:"Required for this lifecycle stage."});
  if(f.limit && value.length>f.limit) ctx.addIssue({code:"custom",path:["answers",f.key],message:`Use at most ${f.limit} characters.`});
  if(value && f.type==="number" && (!Number.isFinite(Number(value)) || Number(value)<0 || (f.max!==undefined && Number(value)>f.max))) ctx.addIssue({code:"custom",path:["answers",f.key],message:f.max===undefined?"Enter a non-negative number.":`Enter a number from 0 to ${f.max}.`});
  if(value && f.options && f.type!=="multi" && !f.options.some(o=>o[0]===value))ctx.addIssue({code:"custom",path:["answers",f.key],message:"Choose an available option."});
  if(value && f.type==="multi" && value.split(",").some(v=>!f.options?.some(o=>o[0]===v)))ctx.addIssue({code:"custom",path:["answers",f.key],message:"Choose an available instrument."});
 }
 const issue=(key:string,message:string)=>ctx.addIssue({code:"custom",path:["answers",key],message});
 for(const key of ["capacity","capex"])if(Number(d.answers[key])<=0)issue(key,"Enter a number greater than zero.");
 const risks=[d.answers["risk1"],d.answers["risk2"],d.answers["risk3"]];
 if(new Set(risks).size!==3)issue("risk3","Choose three different named risks.");
 if(!risks.includes(d.answers["stopper"]))issue("stopper","Choose one of the three named risks.");
 if(d.stage==="feasibility" && ["grantSplit","debtSplit","equitySplit"].reduce((n,k)=>n+Number(d.answers[k]??0),0)!==100)issue("equitySplit","Indicative grant, debt and equity shares must total 100 percent.");
 if(d.stage==="feasibility" && !/^\d{4}( H[12])?$/.test(d.answers["indicativeClose"]??""))issue("indicativeClose","Use a year or half year, for example 2028 or 2028 H1.");
 if(["development","construction"].includes(d.stage)&&!/^\d{4} Q[1-4]$/.test(d.answers["targetClose"]??""))issue("targetClose","Use a quarter, for example 2028 Q2.");
 if(d.stage!=="concept"&&d.stage!=="operational"){
  const mix=d.rows["designMix"]??[];
  if(!mix.length || mix.reduce((n,r)=>n+Number(r["share"]??0),0)!==100)issue("designMix","Design energy source shares must total 100 percent.");
  if(["contractedLoad","signedLoad","negotiationLoad"].some(k=>d.answers[k]===undefined || d.answers[k]===""))issue("ladder","Enter each new-load tier, including zero where appropriate.");
  if(["contractedLoad","signedLoad","negotiationLoad"].some(k=>Number(d.answers[k])<0 || Number(d.answers[k])>100) || ["contractedLoad","signedLoad","negotiationLoad"].reduce((sum,k)=>sum+Number(d.answers[k]??0),0)>100)issue("ladder","New-load shares must be between 0 and 100, with a total no greater than 100 percent.");
 }
 if(d.stage!=="concept" && !["measured","modelled","estimated"].includes(d.answers["capacityBasis"]??lockedBasis(d.stage)??""))issue("capacityBasis","Choose a capacity basis.");
 if(d.stage!=="concept" && !["measured","modelled","estimated"].includes(d.answers["capexBasis"]??lockedBasis(d.stage)??""))issue("capexBasis","Choose a capex basis.");
 if(["development","construction"].includes(d.stage)){
  if((d.rows["timeline"]??[]).length!==5 || (d.rows["timeline"]??[]).some(r=>!r["date"]))issue("timeline","Enter all five development timeline dates.");
  if((d.rows["capital"]??[]).length!==4 || (d.rows["capital"]??[]).some(r=>!r["label"]||!r["amount"]||!r["status"]))issue("capital","Complete the four capital stack lines and their status.");
 }
 for(const r of unawardedFunding(d))if(!["yes","no"].includes(r["irrAssumesAward"]??""))issue("funding","Record whether the base case assumes each unawarded programme.");
 if(d.answers["fundingPlan"]==="pursuing")for(const r of d.rows["funding"]??[])if(!r["programme"] || !r["instrument_type"] || !r["amount"] || !r["funding_status"])issue("funding","Complete programme, instrument, amount and status for each funding row.");
 if(d.stage==="operational" && ((d.rows["actuals"]??[]).length!==actualYears(d)||(d.rows["actuals"]??[]).some(r=>["year","output","losses","revenue","opex"].some(k=>!r[k]))))issue("actuals","Complete actuals for each available operating year.");
});
