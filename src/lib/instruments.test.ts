import {it} from 'node:test';import assert from 'node:assert/strict';import {legacyMatchedInstruments,matchedInstrumentIntersection} from './instruments';
it('legacy Either resolves to the five equity-like instruments, never arbitrary acceptance',()=>{assert.equal(legacyMatchedInstruments('either').length,5);assert.equal(matchedInstrumentIntersection(legacyMatchedInstruments('either'),['debt']),false);});
it('matching is set intersection, with senior debt excluded',()=>{assert.equal(matchedInstrumentIntersection(['mezzanine','equity'],['convertible','mezzanine']),true);assert.equal(matchedInstrumentIntersection(['senior_debt'],['senior_debt']),false);});
it('debt-only legacy preference never invents equity interest',()=>assert.deepEqual(legacyMatchedInstruments('debt'),[]));
