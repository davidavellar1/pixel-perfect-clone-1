import type { ProjectListing } from '@/hooks/useProjectListings';
import { bundleExactFigures } from '@/lib/figureDisclosure';
export function portfolioFigures(projects: ProjectListing[]) {
 const exact=projects.filter(p=>bundleExactFigures(p)!==null);
 const capacity=exact.filter(p=>Number.isFinite(p.capacityMw)&&p.capacityMw>0);
 const capex=exact.filter(p=>p.capex!==null&&Number.isFinite(p.capex));
 const equity=exact.filter(p=>p.equitySought!==null&&Number.isFinite(p.equitySought));
 const tickets=exact.flatMap(p=>p.minTicket!==null&&Number.isFinite(p.minTicket)?[p.minTicket]:[]);
 return {capacity:capacity.reduce((n,p)=>n+p.capacityMw,0),capacityCount:capacity.length,capex:capex.reduce((n,p)=>n+(p.capex??0),0),capexCount:capex.length,equity:equity.reduce((n,p)=>n+(p.equitySought??0),0),equityCount:equity.length,entryFloor:tickets.length?Math.max(...tickets):null,ticketCount:tickets.length};
}
export function portfolioGroups(projects: ProjectListing[],key:'country'|'technology',metric:'capex'|'capacityMw') {
 const totals=new Map<string,number>();
 projects.filter(p=>bundleExactFigures(p)!==null).forEach(p=>{const v=p[metric];if(v!==null&&Number.isFinite(v)&&v>0)totals.set(p[key],(totals.get(p[key])??0)+v);});
 return [...totals].map(([name,value])=>({name,value}));
}
export function teaserExport(projects: ProjectListing[]) {
 // Always use the safe teaser title and bands, even when the viewer holds access.
 const quote=(v:string)=>`"${v.replaceAll('"','""')}"`;
 return [['Country','Stage','Technology','Capacity band','Capex band','Minimum ticket band'],...projects.map(p=>[p.country,p.stage,p.technology,p.capacityBand??'',p.capexBand??'',p.minTicketBand??''])].map(row=>row.map(quote).join(',')).join('\r\n');
}
