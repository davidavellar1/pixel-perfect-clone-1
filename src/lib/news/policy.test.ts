import { it } from 'node:test';
import assert from 'node:assert/strict';
import { publishableNews, canLeadNews, newsPriority } from './policy';
it('keeps the ingestion relevance floor of 30 and manual hiding', () => {
 assert.equal(publishableNews({relevance:29,hidden:false}),false); assert.equal(publishableNews({relevance:30,hidden:false}),true); assert.equal(publishableNews({relevance:100,hidden:true}),false);
});
it('a week with no current item has no lead', () => { assert.equal(canLeadNews('2026-11-14',Date.parse('2026-11-22')),false); assert.equal(canLeadNews('2026-11-21',Date.parse('2026-11-22')),true); });
it('followed projects lead before policy, relevance and recency', () => {
 const a={related_project_ids:['followed'],category:'project',relevance:30,published_at:'2026-11-16'};
 const b={related_project_ids:[],category:'policy',relevance:100,published_at:'2026-11-22'};
 assert.ok(newsPriority(a,b,new Set(['followed']))<0);
});
