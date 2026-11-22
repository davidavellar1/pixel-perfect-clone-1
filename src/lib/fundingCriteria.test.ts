import {it} from 'node:test';import assert from 'node:assert/strict';import {applicantCriterion} from './fundingCriteria';
it('private developers do not match municipality-only programmes',()=>assert.equal(applicantCriterion(['municipality'],'private_developer').state,'fails'));
it('SME status is unchecked rather than guessed',()=>assert.equal(applicantCriterion(['sme'],'private_developer').state,'open'));
it('municipality matches recorded municipality actor',()=>assert.equal(applicantCriterion(['municipality'],'municipality').state,'meets'));
it('utility ownership is not assumed municipal',()=>assert.equal(applicantCriterion(['municipal_utility'],'utility').state,'open'));
