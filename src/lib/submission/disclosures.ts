import type { SubmissionDocument } from './stageSchema';
export function fundingAssumptionLines(d:SubmissionDocument|null):string[] {
 if(!d||d.answers['fundingPlan']!=='pursuing'||!['development','construction','operational'].includes(d.stage))return [];
 return (d.rows['funding']??[]).filter(r=>r['irrAssumesAward']==='yes'&&['intending','applied','decision_pending'].includes(r['funding_status']??'')).map(r=>{
  const amount=Number(r['amount']);const money=r['amount']&&Number.isFinite(amount)?new Intl.NumberFormat('en-GB',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(amount):'';
  const decision=r['expected_decision_date']?new Date(`${r['expected_decision_date']}T00:00:00Z`):null;
  const date=decision&&!Number.isNaN(decision.valueOf())?`, decision ${decision.toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'})}`:'';
  return `Base case assumes ${[money,r['programme'],r['instrument_type']].filter(Boolean).join(' ')}, not yet awarded${date}. Developer-stated.`;
 });
}
