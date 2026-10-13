import test from 'node:test';
import assert from 'node:assert/strict';
import {eventTime} from '../apps/web/src/event-time.js';

test('W02 schedule ranges use the event timezone and retain cross-day end dates',()=>{
 const sameLocalDay=eventTime({starts_at:'2027-08-14T22:00:00Z',ends_at:'2027-08-15T01:00:00Z',timezone:'America/Los_Angeles'},'medium');
 assert.equal((sameLocalDay.match(/2027/g)??[]).length,1);assert.ok(sameLocalDay.includes(' – '));
 const crossesLocalDay=eventTime({starts_at:'2027-08-14T22:30:00Z',ends_at:'2027-08-15T00:30:00Z',timezone:'Europe/London'},'medium');
 assert.equal((crossesLocalDay.match(/2027/g)??[]).length,2);
 assert.equal(eventTime({starts_at:null,ends_at:null,timezone:'UTC',to_be_confirmed:'Date forthcoming'}),'Date forthcoming');
});
