import {it} from 'node:test';import assert from 'node:assert/strict';import {compareMissingLast} from './opportunitySort';
it('missing equity bands sort last ascending and descending, never as zero',()=>{for(const desc of [false,true])assert.deepEqual([{n:null},{n:3},{n:1}].sort((a,b)=>compareMissingLast(a,b,p=>p.n,desc)).map(p=>p.n),desc?[3,1,null]:[1,3,null]);});
it('unset close dates follow dated projects',()=>assert.equal(compareMissingLast({d:null},{d:'2028 Q1'},p=>p.d),1));
