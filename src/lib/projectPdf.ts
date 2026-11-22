import { PDFDocument, rgb, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type {Json} from '@/integrations/supabase/types';
import {z} from 'zod';
import {parseDocument} from '@/lib/submission/serializer';
import {FIELDS} from '@/lib/submission/stageSchema';
import {parseProjectIdentity} from '@/lib/projectIdentity';
export const pdfInputsSchema=z.object({teaser:z.record(z.unknown()),information:z.unknown(),identity:z.unknown(),recipient:z.string(),generatedAt:z.string(),asOf:z.string().nullable(),reference:z.string().uuid()});
export type PdfInputs=z.infer<typeof pdfInputsSchema>;
export type PdfKind='teaser'|'summary';
const text=(v:unknown)=>typeof v==='string'||typeof v==='number'?String(v):'';
export function pdfRows(inputs:PdfInputs,kind:PdfKind):[string,string][]{
 const t=inputs.teaser;
 const teaser:[string,string][]=[['Country',text(t['country_code'])],['Technology',text(t['technology']).replaceAll('_',' ')],['Lifecycle stage',text(t['lifecycle_stage']).replaceAll('_',' ')],['Capacity band',text(t['capacity_band'])],['Capex band',text(t['capex_band'])],['Minimum ticket band',text(t['min_ticket_band'])],['Instrument',text(t['instrument']).replaceAll('_',' ')],['Offtake committed, design load',t['offtake_committed_load_pct']==null?'':`${text(t['offtake_committed_load_pct'])}%`]];
 if(kind==='teaser')return teaser.map(([k,v])=>[k,v||'Not collected in the teaser']);
 const info=inputs.information && typeof inputs.information==='object'?inputs.information as Record<string,unknown>:{};
 const d=parseDocument(info['document'] as Json);const identity=parseProjectIdentity(inputs.identity);
 const rows:[string,string][]=[...teaser.slice(0,3)];
 if(identity)rows.unshift(['Project',identity.title],['Location',[identity.city,identity.country].filter(Boolean).join(', ')],['Developer',identity.developer.name??'']);
 for(const [key,label] of [['capacity','Thermal capacity MW'],['capex','Capex EUR'],['equitySought','Equity sought EUR'],['minTicket','Minimum ticket EUR'],['designSupply','Supply temperature C'],['designReturn','Return temperature C'],['networkLength','Network length km'],['baseIrr','Base case equity IRR percent'],['cashYield','Base case cash yield percent'],['realisedDscr','Base case realised DSCR'],['debtAmount','Debt amount EUR'],['tariff','Heat tariff EUR/MWh']] as const){const value=d?.answers[key];const band=key==='capacity'?text(t['capacity_band']):key==='capex'?text(t['capex_band']):key==='minTicket'?text(t['min_ticket_band']):'';rows.push([label,value|| (info['exact']===false?band||'Held until acceptance':d?.askedFields.includes(`stage.${key}`)?'Not provided':'Not collected at this stage')]);}
 const included=new Set(['capacity','capex','equitySought','minTicket','designSupply','designReturn','networkLength','baseIrr','cashYield','realisedDscr','debtAmount','tariff']);
 for(const f of FIELDS.filter(f=>['transaction','access','sustainability'].includes(f.section)&&!included.has(f.key))){const value=d?.answers[f.key];if(value)rows.push([f.label,value]);}
 for(const [group,records] of Object.entries(d?.rows??{}))for(const record of records)rows.push([group,Object.entries(record).map(([k,v])=>`${k}: ${v}`).join(', ')]);
 return rows;
}
export async function generateProjectPdf(inputs:PdfInputs,kind:PdfKind,fontBytes:Uint8Array,liveOrigin:string):Promise<Uint8Array>{
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(fontBytes,{subset:false});
 pdf.setTitle(kind==='teaser'?'DHC Market anonymized teaser':'DHC Market project summary');pdf.setAuthor('DHC Market');pdf.setSubject('Developer-stated project information');pdf.setCreator('DHC Market');
 const generated=inputs.generatedAt.slice(0,10);const url=`${liveOrigin}/app/projects/${encodeURIComponent(text(inputs.teaser['slug']))}`;
 const rows=pdfRows(inputs,kind);const pageSize:[number,number]=kind==='teaser'?[960,540]:[595.28,841.89];
 const muted=rgb(0.36,0.40,0.46),ink=rgb(0.06,0.11,0.18),primary=rgb(0.09,0.40,0.84);
 const wrap=(value:string,size:number,width:number)=>{const result:string[]=[];let line='';for(const char of value){if(char==='\n'||font.widthOfTextAtSize(line+char,size)>width){result.push(line);line=char==='\n'?'':char;}else line+=char;}if(line)result.push(line);return result;};
 const draw=(page:PDFPage,value:string,x:number,y:number,size:number,width:number,color=ink)=>{const lines=wrap(value,size,width);for(const [i,line]of lines.entries())page.drawText(line,{x,y:y-i*(size+3),size,font,color});return lines.length*(size+3);};
 const pages=kind==='teaser'?[rows.slice(0,4),rows.slice(4)]:[rows];
 for(const [index,records]of pages.entries()){
  const page=pdf.addPage(pageSize);const [w,h]=pageSize;page.drawRectangle({x:0,y:h-9,width:w,height:9,color:primary});draw(page,'DHC Market',34,h-48,23,w-68);draw(page,kind==='teaser'?`Anonymized teaser ${index+1} of 2`:'Standardised project summary',34,h-76,14,w-68);
  draw(page,`Generated ${generated} | Figures as of ${inputs.asOf??'Date not recorded'} | Developer-stated`,34,h-99,9,w-68,muted);
  const size=kind==='teaser'?16:Math.max(7,Math.min(10,580/Math.max(records.length*2,1)));let y=h-130;
  for(const [label,value]of records){const lh=draw(page,label,34,y,size,w*.39,muted);const vh=draw(page,value,w*.45,y,size,w*.55-34);y-=Math.max(lh,vh)+7;}
  draw(page,'Figures are developer-stated. DHC Market does not verify or endorse them.',34,80,8,w-68,muted);draw(page,url,34,60,8,w-68,primary);draw(page,`Copy for ${inputs.recipient} | ${generated}`,34,35,9,w-68,muted);
 }
 return pdf.save();
}
