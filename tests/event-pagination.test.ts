import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PostgresStore} from '@save-the-date/persistence';
import {credential,credentialHash} from '@save-the-date/adapters';
import {weddingSchema} from '@save-the-date/contracts';

test('W02 event pages preserve dated/null order and current security assignments',async()=>{
 const store=new PostgresStore(process.env.TEST_DB_CONNECTION!),prefix=randomUUID(),hash=(value:string)=>credentialHash(value,'event-pagination-test-key'.repeat(3));
 async function user(label:string){const token=credential(),email=prefix+label+'@example.test';await store.register(email,'fixture',hash(token));await store.verify(hash(token));const actor=await store.login(email,async()=>true,hash(credential()));assert.ok(actor);return actor;}
 try{
  const owner=await user('owner'),foreign=await user('foreign'),security=await user('security');const wedding=await store.createWedding(owner,weddingSchema.parse({displayNames:'Event pagination fixture',slug:'events-'+prefix,timezone:'UTC'}));
  await store.pool.query(`insert into std_events(id,wedding_id,title,type,timezone,starts_at,to_be_confirmed,created_at) select gen_random_uuid(),$1,'Synthetic event '||n,'custom','UTC',case when n<=51 then '2027-08-14T14:00:00.123456Z'::timestamptz else null end,'Date forthcoming','2026-10-13T00:00:00.123456Z' from generate_series(1,105) n`,[wedding.id]);
  const first=await store.listEventPage(owner,wedding.id);assert.equal(first.events.length,50);assert.ok(first.nextCursor);
  const second=await store.listEventPage(owner,wedding.id,first.nextCursor!),third=await store.listEventPage(owner,wedding.id,second.nextCursor!);assert.equal(second.events.length,50);assert.equal(third.events.length,5);assert.equal(third.nextCursor,null);
  const all=[...first.events,...second.events,...third.events];assert.equal(new Set(all.map(e=>e.id)).size,105);assert.ok(all.slice(0,51).every(e=>e.starts_at));assert.ok(all.slice(51).every(e=>e.starts_at===null));
  await assert.rejects(store.listEventPage(foreign,wedding.id,first.nextCursor!),{code:'NOT_FOUND'});
  const token=credential();await store.invite(owner,wedding.id,{email:security.email,role:'security',albumIds:[],eventIds:all.map(e=>e.id)},hash(token),'synthetic');await store.acceptInvite(security,hash(token));
  assert.equal((await store.listEventPage(security,wedding.id,first.nextCursor!)).events.length,50);
  await store.pool.query('delete from std_member_events where wedding_id=$1 and user_id=$2 and event_id=$3',[wedding.id,security.userId,second.events[0].id]);assert.equal((await store.listEventPage(security,wedding.id,first.nextCursor!)).events.length,50);assert.ok(!(await store.listEventPage(security,wedding.id,first.nextCursor!)).events.some(e=>e.id===second.events[0].id));
  const malformed=JSON.parse(Buffer.from(first.nextCursor!,'base64url').toString());malformed.label='invalid timestamp';await assert.rejects(store.listEventPage(owner,wedding.id,Buffer.from(JSON.stringify(malformed)).toString('base64url')),{code:'INVALID_CURSOR'});
  await store.removeMember(owner,wedding.id,security.userId);await assert.rejects(store.listEventPage(security,wedding.id,first.nextCursor!),{code:'NOT_FOUND'});
 }finally{await store.close();}
});
