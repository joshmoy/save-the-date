import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PostgresStore,PostgresPasses} from '@save-the-date/persistence';
import {credential,credentialHash} from '@save-the-date/adapters';
import {weddingSchema,eventSchema} from '@save-the-date/contracts';

test('Pass/confirmed-attendee cursor pages preserve event ties, conceal credentials and recheck tenant scope',async()=>{
 const connection=process.env.TEST_DB_CONNECTION;
 if(!connection||!['localhost','127.0.0.1'].includes(new URL(connection).hostname)||!new URL(connection).pathname.endsWith('_test'))throw Error('Requires isolated local _test database');
 const store=new PostgresStore(connection),prefix=randomUUID(),hash=(v:string)=>credentialHash(v,'pass-pagination-key'.repeat(3));
 async function user(label:string){const token=credential(),email=prefix+label+'@example.test';await store.register(email,'fixture',hash(token));await store.verify(hash(token));const actor=await store.login(email,async()=>true,hash(credential()));assert.ok(actor);return actor;}
 try{
  await store.migrate('packages/persistence/migrations');const owner=await user('owner'),foreign=await user('foreign'),wid=(await store.createWedding(owner,weddingSchema.parse({displayNames:'Historical pagination fixture',slug:'pass-pages-'+prefix,timezone:'UTC'}))).id,events=[];
  for(let i=0;i<2;i++)events.push((await store.saveEvent(owner,wid,eventSchema.parse({title:'Historical event '+i,type:'custom',timezone:'UTC',startsAt:'2020-01-01T12:00:00Z',endsAt:'2020-01-01T15:00:00Z',admissionPolicy:'owner'}))).id);
  const party=randomUUID();
  await store.transaction(async tx=>{
   await tx.query("insert into std_parties(id,wedding_id,name) values($1,$2,'Historical metadata household')",[party,wid]);
   await tx.query("insert into std_attendees(id,wedding_id,party_id,name,created_at) select gen_random_uuid(),$1,$2,'Historical attendee '||n,'2020-01-01T00:00:00.123456Z' from generate_series(1,205) n",[wid,party]);
   await tx.query('insert into std_attendee_events(wedding_id,attendee_id,event_id) select a.wedding_id,a.id,e.id from std_attendees a join std_events e on e.wedding_id=a.wedding_id where a.wedding_id=$1',[wid]);
   await tx.query("insert into std_rsvps(wedding_id,attendee_id,event_id,state) select wedding_id,attendee_id,event_id,'confirmed' from std_attendee_events where wedding_id=$1",[wid]);
   await tx.query('insert into std_reservations(wedding_id,attendee_id,event_id) select wedding_id,attendee_id,event_id from std_attendee_events where wedding_id=$1',[wid]);
   await tx.query('update std_events set confirmed_count=205 where wedding_id=$1',[wid]);
   // Expired credential-free metadata verifies pagination, never real issuance/rendering.
   await tx.query("insert into std_passes(id,wedding_id,attendee_id,event_id,status,issued_at) select gen_random_uuid(),wedding_id,attendee_id,event_id,'expired','2020-01-01T00:00:00.123456Z' from std_attendee_events where wedding_id=$1 and event_id=$2",[wid,events[0]]);
  });
  const passes=new PostgresPasses(store,hash),ids:string[]=[],pairs:string[]=[];let cursor:string|undefined;
  do{const page=await passes.list(owner,wid,cursor);assert.ok(page.passes.length<=200);ids.push(...page.passes.map(p=>p.id));assert.ok(page.passes.every(p=>!('credential_hash' in p)&&!('manual_hash' in p)&&!('encrypted_payload' in p)));cursor=page.nextCursor??undefined;}while(cursor);
  assert.equal(ids.length,205);assert.equal(new Set(ids).size,205);
  const first=await passes.listEligible(owner,wid);assert.ok(first.nextCursor);
  do{const page=await passes.listEligible(owner,wid,cursor);pairs.push(...page.eligible.map(p=>p.id+':'+p.event_id));assert.ok(page.eligible.every(p=>p.has_pass===(p.event_id===events[0])));cursor=page.nextCursor??undefined;}while(cursor);
  assert.equal(pairs.length,410);assert.equal(new Set(pairs).size,410);
  await assert.rejects(passes.list(foreign,wid),{code:'NOT_FOUND'});await assert.rejects(passes.listEligible(foreign,wid,first.nextCursor!),{code:'NOT_FOUND'});await assert.rejects(passes.list(owner,wid,first.nextCursor!),{code:'INVALID_CURSOR'});
 }finally{await store.close();}
});
