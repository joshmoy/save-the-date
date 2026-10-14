import test from 'node:test';
import assert from 'node:assert/strict';
import {withLegacyWriteFence} from '../apps/web/src/lib/legacy-write-fence.js';

test('legacy fence responses report uncertain maintenance without claiming admission or invalidity',async()=>{
 const handler=withLegacyWriteFence(async()=>{throw Object.assign(new Error('LEGACY_WRITES_FROZEN'),{code:'55000'});}),response=await handler();
 assert.equal(response.status,503);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(response.headers.get('Retry-After'),'60');
 const body=await response.json();assert.equal(body.code,'LEGACY_WRITES_FROZEN');assert.match(body.error,/Reconcile uncertain admissions/);assert.equal('result' in body,false);
 const other=withLegacyWriteFence(async()=>{throw Object.assign(new Error('OTHER_FAILURE'),{code:'55000'});});await assert.rejects(other(),/OTHER_FAILURE/);
 const success=withLegacyWriteFence(async()=>new Response('original response',{status:201}));assert.equal((await success()).status,201);
});
