import { it } from 'node:test';
import assert from 'node:assert/strict';
import { emptyDocument, fieldsForDocument, promotionFields, lockedBasis, actualYears, documentSchema, unawardedFunding, type Stage } from './stageSchema';
import { normalizeDocument, serializeDocument } from './serializer';
import { fundingAssumptionLines } from './disclosures';
const doc=(stage:Stage)=>({...emptyDocument(),stage,answers:{projectType:'greenfield'}});
const keys=(stage:Stage)=>fieldsForDocument(doc(stage)).map(f=>f.key);
it('concept never asks for euro equity, EPC, actuals or DNSH',()=>{
 const visible=keys('concept');for(const key of ['equitySought','epcStatus','historyYears','dnsh','designHeat'])assert.equal(visible.includes(key),false);
 assert.equal(visible.includes('capex'),true);
});
it('concept capex and capacity are estimated even if another basis is submitted',()=>{
 const d=normalizeDocument({...doc('concept'),answers:{capacityBasis:'measured',capexBasis:'modelled'}});assert.equal(d.answers['capacityBasis'],'estimated');assert.equal(d.answers['capexBasis'],'estimated');
});
it('feasibility capex and capacity basis are modelled',()=>assert.equal(lockedBasis('feasibility'),'modelled'));
it('concept existing network figures appear only for modernisation',()=>{
 assert.equal(keys('concept').includes('existingHeat'),false);
 assert.equal(fieldsForDocument({...doc('concept'),answers:{projectType:'modernisation'}}).some(f=>f.key==='existingHeat'),true);
});
it('modernisation site is pre-answered rather than demanded',()=>{
 const d=normalizeDocument({...doc('concept'),answers:{projectType:'modernisation'}});assert.equal(d.answers['site'],'Existing network site');assert.equal(fieldsForDocument(d).some(f=>f.key==='site'),false);
});
it('feasibility asks for indicative shares but no equity sought euros',()=>{
 const visible=keys('feasibility');assert.equal(visible.includes('grantSplit'),true);assert.equal(visible.includes('equitySought'),false);assert.equal(visible.includes('fundingPlan'),true);
});
it('construction drops feasibility and site-control questions',()=>{
 const visible=keys('construction');for(const key of ['studyStatus','studyComplete','site'])assert.equal(visible.includes(key),false);assert.equal(visible.includes('constructionProgress'),true);
});
it('operational drops EPC, development dates and feasibility questions',()=>{
 const visible=keys('operational');for(const key of ['epcStatus','studyStatus','studyComplete','designHeat','targetClose'])assert.equal(visible.includes(key),false);assert.equal(visible.includes('transactionType'),true);
});
it('operating history sizes actuals to one, two or three years',()=>{
 for(const n of [1,2,3])assert.equal(actualYears({...doc('operational'),answers:{historyYears:String(n)}}),n);assert.equal(actualYears(doc('concept')),0);
});
it('DNSH six statements appear only after the developer reports an assessment',()=>{
 assert.equal(fieldsForDocument({...doc('feasibility'),answers:{dnsh:'Not assessed'}}).filter(f=>f.key.startsWith('dnshText')).length,0);
 assert.equal(fieldsForDocument({...doc('feasibility'),answers:{dnsh:'Self-assessed'}}).filter(f=>f.key.startsWith('dnshText')).length,6);
});
it('DNSH statements have a 300 character limit',()=>{
 const result=documentSchema.safeParse({...doc('feasibility'),answers:{dnsh:'Self-assessed',dnshText0:'x'.repeat(301)}});assert.equal(result.success,false);if(!result.success)assert.equal(result.error.issues.some(i=>i.path[1]==='dnshText0'),true);
});
it('exposed assumption has a 200 character limit',()=>{
 const result=documentSchema.safeParse({...doc('concept'),answers:{exposure:'x'.repeat(201)}});assert.equal(result.success,false);if(!result.success)assert.equal(result.error.issues.some(i=>i.path[1]==='exposure'),true);
});
it('funding zero rows adds no required funding gap',()=>{
 const result=documentSchema.safeParse({...doc('feasibility'),answers:{fundingPlan:'none'}});if(!result.success)assert.equal(result.error.issues.some(i=>i.path[1]==='funding'),false);
});
it('the base-case award question exists only for unawarded rows from development',()=>{
 const rows={funding:[{funding_status:'awarded'},{funding_status:'applied'}]};assert.equal(unawardedFunding({...doc('feasibility'),answers:{fundingPlan:'pursuing'},rows}).length,0);assert.equal(unawardedFunding({...doc('development'),answers:{fundingPlan:'pursuing'},rows}).length,1);
});
it('promotion opens only newly eligible fields and excludes title',()=>{
 const delta=promotionFields(doc('feasibility'),'concept').map(f=>f.key);assert.equal(delta.includes('title'),false);assert.equal(delta.includes('designLoad'),true);assert.equal(delta.includes('studyComplete'),true);
});
it('zero committed new load is retained as a legitimate answer',()=>{
 const result=documentSchema.safeParse({...doc('feasibility'),answers:{contractedLoad:'0',signedLoad:'0',negotiationLoad:'0'},rows:{designMix:[{source:'Waste heat',share:'100'}]}});if(!result.success)assert.equal(result.error.issues.some(i=>i.path[1]==='ladder'),false);
});
it('serializes numeric capacity and capital amounts from developer answers',()=>{
 const result=serializeDocument({...doc('development'),answers:{capacity:'8',capex:'12000000'},rows:{capital:[{label:'Equity',amount:'4000000'}]}});assert.equal(result.project.capacity_mw,8);assert.equal(result.capital_stack[0]?.amount,4000000);
});
it('award disclosures include the recorded amount and decision month without recomputing IRR',()=>{
 const d={...doc('development'),answers:{fundingPlan:'pursuing'},rows:{funding:[{programme:'FEnIKS',instrument_type:'grant',amount:'10800000',funding_status:'decision_pending',irrAssumesAward:'yes',expected_decision_date:'2027-03-10'}]}};
 assert.deepEqual(fundingAssumptionLines(d),['Base case assumes €10,800,000 FEnIKS grant, not yet awarded, decision March 2027. Developer-stated.']);
});
