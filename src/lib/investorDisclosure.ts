import { FIELDS, type SubmissionDocument } from '@/lib/submission/stageSchema';
// Mirrors the database whitelist. Free text never crosses the pre-acceptance boundary.
const numericKeys=new Set(['capacity','capex','existingLoad','networkLength','existingHeat','existingSupply','existingReturn','existingLoss','households','designSupply','designReturn','designHeat','designLoad','contractedLoad','signedLoad','negotiationLoad','buildings','grantSplit','debtSplit','equitySplit','equitySought','minTicket','baseIrr','cashYield','debtAmount','debtTenor','constructionProgress','historyYears','realisedDscr','tariff','stake']);
const dateKeys=new Set(['studyDate','studyExpected','dnshDate','progressDate','commissioning','operationalClose','asOf']);
export function investorPreview(document:SubmissionDocument,banded=false):SubmissionDocument {
 const answers:Record<string,string>={};
 for(const f of FIELDS){const value=document.answers[f.key];if(!value)continue;
  if(f.type==='select'&&f.options?.some(([option])=>value===option)&&f.key!=='notifyUsers')answers[f.key]=value;
  else if(numericKeys.has(f.key)&&!banded&&/^\d+(\.\d+)?$/.test(value))answers[f.key]=value;
  else if(dateKeys.has(f.key)&&/^\d{4}-\d{2}-\d{2}$/.test(value))answers[f.key]=value;
 }
 for(const k of ['capacityBasis','capexBasis','returnBasis'])if(['measured','modelled','estimated'].includes(document.answers[k]??''))answers[k]=document.answers[k]??'';
 for(const k of ['indicativeClose','targetClose'])if(/^\d{4}( Q[1-4]| H[12])?$/.test(document.answers[k]??''))answers[k]=document.answers[k]??'';
 if(document.answers['instruments']?.split(',').every(v=>['equity','equity_and_shareholder_loan','preferred_equity','mezzanine','convertible'].includes(v)))answers['instruments']=document.answers['instruments'];
 const rows:SubmissionDocument['rows']={};
 if(!banded){for(const k of ['actuals','designMix','existingMix','capital','timeline'])rows[k]=(document.rows[k]??[]).flatMap((r,i)=>{
  if(k==='actuals')return [Object.fromEntries(['year','output','losses','revenue','opex'].flatMap(key=>/^\d+(\.\d+)?$/.test(r[key]??'')?[[key,r[key]??'']]:[]))];
  if(k==='timeline')return /^\d{4}-\d{2}-\d{2}$/.test(r['date']??'')?[{label:`Development milestone ${i+1}`,date:r['date']??''}]:[];
  if(k==='capital')return /^\d+(\.\d+)?$/.test(r['amount']??'')?[{label:`Capital line ${i+1}`,amount:r['amount']??''}]:[];
  return ['Waste heat','Geothermal','Large heat pump','Heat pump','Solar thermal','Biomass','Biomass / CHP','Gas','Natural gas','Thermal storage','Hybrid','Electricity','CHP'].includes(r['source']??'')&&/^\d+(\.\d+)?$/.test(r['share']??'')?[{source:r['source']??'',share:r['share']??''}]:[];
 });}
 return {version:"investor-projection-1",stage:document.stage,answers,rows,askedFields:document.askedFields.filter(k=>Object.hasOwn(answers,k.replace(/^stage\./,""))),step:"basics"};
}
export function hasExactFigures(qualified:boolean,accepted:boolean,bandUntilAcceptance:boolean){return qualified&&(!bandUntilAcceptance||accepted);}
