import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PostgresStore,PostgresGuests,parseCsv} from '@save-the-date/persistence';
import {credential,credentialHash} from '@save-the-date/adapters';
import {weddingSchema,eventSchema,guestSchema} from '@save-the-date/contracts';

test('Household pagination searches the whole wedding, includes matching plus ones and preserves complete CSV/duplicate checks',async()=>{
 const connection=process.env.TEST_DB_CONNECTION;
 if(!connection||!['localhost','127.0.0.1'].includes(new URL(connection).hostname)||!new URL(connection).pathname.endsWith('_test'))throw Error('Requires isolated local _test database');
 const store=new PostgresStore(connection),prefix=randomUUID(),hash=(v:string)=>credentialHash(v,'guest-pagination-key'.repeat(3));
 async function user(label:string){const token=credential(),email=prefix+label+'@example.test';await store.register(email,'fixture',hash(token));await store.verify(hash(token));const actor=await store.login(email,async()=>true,hash(credential()));assert.ok(actor);return actor;}
 try{
  await store.migrate('packages/persistence/migrations');const owner=await user('owner'),foreign=await user('foreign'),wid=(await store.createWedding(owner,weddingSchema.parse({displayNames:'Guest pagination fixture',slug:'guest-pages-'+prefix,timezone:'UTC'}))).id,event=(await store.saveEvent(owner,wid,eventSchema.parse({title:'Manual approval fixture',type:'custom',timezone:'UTC',approvalPolicy:'manual'}))).id,guests=new PostgresGuests(store,hash,'https://example.test');let lateId='',lateParty='';
  for(let i=0;i<205;i++){const suffix=String(i).padStart(3,'0'),guest=await guests.save(owner,wid,guestSchema.parse({household:'Household '+suffix,name:'Guest '+suffix,eventIds:[event],plusOnes:i===204?1:0}),0);if(i===204){lateId=guest.id;lateParty=guest.party_id;}}
  const first=await guests.list(owner,wid);assert.equal(first.parties.length,100);assert.ok(first.nextCursor);assert.ok(!first.attendees.some(a=>a.id===lateId));const ids:string[]=[];let cursor:string|undefined;
  do{const page=await guests.list(owner,wid,{cursor});ids.push(...page.parties.map(p=>p.id));assert.ok(page.attendees.every(a=>page.parties.some(p=>p.id===a.party_id)));cursor=page.nextCursor??undefined;}while(cursor);
  assert.equal(ids.length,205);assert.equal(new Set(ids).size,205);
  const found=await guests.list(owner,wid,{search:'guest 204'});assert.equal(found.parties.length,1);assert.equal(found.parties[0].id,lateParty);assert.equal(found.attendees.length,2);
  const slot=(await store.pool.query('select id from std_attendees where wedding_id=$1 and plus_one_of=$2',[wid,lateId])).rows[0].id;
  await store.pool.query("update std_attendees set name='Matching allocated companion' where wedding_id=$1 and id=$2",[wid,slot]);
  await store.pool.query("insert into std_rsvps(wedding_id,attendee_id,event_id,state) values($1,$2,$3,'pending')",[wid,slot,event]);
  const pending=await guests.list(owner,wid,{search:'matching allocated',state:'pending',eventId:event});assert.equal(pending.parties.length,1);assert.equal(pending.parties[0].id,lateParty);assert.ok(pending.attendees.some(a=>a.id===lateId));
  assert.equal(parseCsv(await guests.csvExport(owner,wid)).length,206);
  const preview=await guests.importPreview(owner,wid,'household,name,event_ids\nOther,Guest 204,'+event);assert.ok(preview[0].duplicates.includes(lateId));
  await store.pool.query("insert into std_access_requests(id,wedding_id,name,email,note,state,created_at) select gen_random_uuid(),$1,'Synthetic visitor '||n,$2||n||'@example.test','Pagination metadata',case when n<=205 then 'pending' else 'rejected' end,'2020-01-01T00:00:00.123456Z' from generate_series(1,230) n",[wid,prefix]);const requestIds:string[]=[];let requestCursor:string|undefined;do{const page=await guests.listRequests(owner,wid,requestCursor);assert.ok(page.requests.length<=100);assert.ok(page.requests.every(r=>r.state==='pending'));requestIds.push(...page.requests.map(r=>r.id));requestCursor=page.nextCursor??undefined;}while(requestCursor);assert.equal(requestIds.length,205);assert.equal(new Set(requestIds).size,205);const requests=await guests.listRequests(owner,wid);await assert.rejects(guests.listRequests(foreign,wid,requests.nextCursor!),{code:'NOT_FOUND'});await assert.rejects(guests.listRequests(owner,wid,first.nextCursor!),{code:'INVALID_CURSOR'});
  await assert.rejects(guests.list(foreign,wid,{cursor:first.nextCursor!}),{code:'NOT_FOUND'});await assert.rejects(guests.list(owner,wid,{cursor:first.nextCursor!,search:'changed'}),{code:'INVALID_CURSOR'});
 }finally{await store.close();}
});
