import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PostgresStore} from '@save-the-date/persistence';
import {credential,credentialHash} from '@save-the-date/adapters';
import {weddingSchema} from '@save-the-date/contracts';

test('W01 workspace pages include tied timestamps once, bind account and recheck membership',async()=>{
 const store=new PostgresStore(process.env.TEST_DB_CONNECTION!),prefix=randomUUID(),hash=(value:string)=>credentialHash(value,'workspace-pagination-test-key'.repeat(3));
 async function user(label:string){const token=credential(),email=prefix+label+'@example.test';await store.register(email,'fixture',hash(token));await store.verify(hash(token));const actor=await store.login(email,async()=>true,hash(credential()));assert.ok(actor);return actor;}
 try{
  const owner=await user('owner'),foreign=await user('foreign');
  const base=await store.createWedding(owner,weddingSchema.parse({displayNames:'Workspace pagination fixture',slug:'workspace-'+prefix,timezone:'UTC'}));
  await store.pool.query(`insert into std_weddings(id,slug,primary_owner_id,display_names,timezone,locale,palette,created_at) select gen_random_uuid(),'workspace-'||gen_random_uuid(),primary_owner_id,display_names,timezone,locale,palette,'2026-10-13T00:00:00.123456Z' from std_weddings cross join generate_series(1,104) where id=$1`,[base.id]);
  await store.pool.query(`insert into std_memberships(wedding_id,user_id,role) select id,$1,'owner' from std_weddings where primary_owner_id=$1 and id<>$2`,[owner.userId,base.id]);
  const first=await store.listWeddings(owner);assert.equal(first.weddings.length,50);assert.ok(first.nextCursor);
  const second=await store.listWeddings(owner,first.nextCursor!),third=await store.listWeddings(owner,second.nextCursor!);
  assert.equal(second.weddings.length,50);assert.equal(third.weddings.length,5);assert.equal(third.nextCursor,null);
  assert.equal(new Set([...first.weddings,...second.weddings,...third.weddings].map(w=>w.id)).size,105);
  assert.ok(first.weddings.every(w=>!('cursor_time' in w)));
  assert.equal((await store.listWeddings(foreign)).weddings.length,0);
  await assert.rejects(store.listWeddings(foreign,first.nextCursor!),{code:'INVALID_CURSOR'});
  await assert.rejects(store.listWeddings(owner,'invalid'),{code:'INVALID_CURSOR'});
  await store.pool.query('delete from std_memberships where wedding_id=$1 and user_id=$2',[third.weddings[0].id,owner.userId]);
  assert.equal((await store.listWeddings(owner,second.nextCursor!)).weddings.length,4);
 }finally{await store.close();}
});
