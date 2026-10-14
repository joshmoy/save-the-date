import test from 'node:test';
import assert from 'node:assert/strict';
import {runMaintenance} from '../apps/worker/dist/maintenance.js';

test('worker maintenance failures stay redacted and do not starve later sweeps or queued work',async()=>{
 const completed:string[]=[],events:unknown[]=[];
 await runMaintenance([{name:'media',async run(){throw Object.assign(Error('private contact and connection fixture'),{code:'private connection URI'});}},{name:'passes',async run(){completed.push('passes');}},{name:'retention',async run(){throw Object.assign(Error('private ledger path'),{code:'ERASURE_LEDGER_REQUIRED'});}}],event=>events.push(event));
 completed.push('queued work can run');
 assert.deepEqual(completed,['passes','queued work can run']);
 assert.deepEqual(events,[{event:'worker.maintenance_failed',task:'media',code:'MAINTENANCE_ERROR'},{event:'worker.maintenance_failed',task:'retention',code:'ERASURE_LEDGER_REQUIRED'}]);
 assert.ok(!JSON.stringify(events).includes('private'));
});
