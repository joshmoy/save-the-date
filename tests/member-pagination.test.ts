import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PostgresStore} from '@save-the-date/persistence';
import {credential,credentialHash} from '@save-the-date/adapters';
import {weddingSchema} from '@save-the-date/contracts';

test('W02 member and invitation pages recheck owner access and keep credentials out of history',async()=>{
 const store=new PostgresStore(process.env.TEST_DB_CONNECTION!),prefix=randomUUID(),hash=(value:string)=>credentialHash(value,'member-pagination-test-key'.repeat(3));
 async function user(label:string){const token=credential(),email=prefix+label+'@example.test';await store.register(email,'fixture',hash(token));await store.verify(hash(token));const actor=await store.login(email,async()=>true,hash(credential()));assert.ok(actor);return actor;}
 try{
  const owner=await user('owner'),foreign=await user('foreign'),partner=await user('partner');const wedding=await store.createWedding(owner,weddingSchema.parse({displayNames:'Member pagination fixture',slug:'members-'+prefix,timezone:'UTC'}));
  const token=credential();await store.invite(owner,wedding.id,{email:partner.email,role:'co_owner',albumIds:[],eventIds:[]},hash(token),'synthetic');await store.acceptInvite(partner,hash(token));
  await store.pool.query(`with users as (insert into std_users(id,email,password_hash,created_at) select gen_random_uuid(),$2::text||n||'@example.test','fixture','2026-10-13T00:00:00.123456Z' from generate_series(1,103) n returning id) insert into std_memberships(wedding_id,user_id,role,created_at) select $1,id,'planner','2026-10-13T00:00:00.123456Z' from users`,[wedding.id,prefix]);
  await store.pool.query(`insert into std_member_invites(id,wedding_id,email,role,token_hash,invited_by,expires_at,revoked_at,created_at) select gen_random_uuid(),$1,$3::text||n||'@example.test','planner',gen_random_uuid()::text,$2,'2020-01-01','2020-01-01','2026-10-13T00:00:00.123456Z' from generate_series(1,104) n`,[wedding.id,owner.userId,prefix]);
  const first=await store.members(partner,wedding.id);assert.equal(first.members.length,100);assert.equal(first.invites.length,100);assert.ok(first.nextMemberCursor);assert.ok(first.nextInviteCursor);
  const second=await store.members(partner,wedding.id,{memberCursor:first.nextMemberCursor!,inviteCursor:first.nextInviteCursor!});assert.equal(second.members.length,5);assert.equal(second.invites.length,5);assert.equal(second.nextMemberCursor,null);assert.equal(second.nextInviteCursor,null);
  assert.equal(new Set([...first.members,...second.members].map(m=>m.user_id)).size,105);assert.equal(new Set([...first.invites,...second.invites].map(i=>i.id)).size,105);
  assert.ok([...first.invites,...second.invites].every(i=>!('token_hash' in i)&&!('cursor_time' in i)));
  await assert.rejects(store.members(foreign,wedding.id,{memberCursor:first.nextMemberCursor!}),{code:'NOT_FOUND'});
  await assert.rejects(store.members(owner,wedding.id,{inviteCursor:first.nextMemberCursor!}),{code:'INVALID_CURSOR'});
  await store.removeMember(owner,wedding.id,partner.userId);await assert.rejects(store.members(partner,wedding.id,{memberCursor:first.nextMemberCursor!}),{code:'NOT_FOUND'});
 }finally{await store.close();}
});
