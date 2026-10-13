import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {PostgresStore,PostgresInvitations} from '@save-the-date/persistence';
import {FilesystemStorage,credential,credentialHash} from '@save-the-date/adapters';
import {weddingSchema,eventSchema} from '@save-the-date/contracts';
import {designSchema} from '@save-the-date/templates';

test('I01 saved design pages use stable creation order and recheck edit permission',async()=>{
 const store=new PostgresStore(process.env.TEST_DB_CONNECTION!),root=await mkdtemp(tmpdir()+'/std-design-pages-'),prefix=randomUUID(),hash=(value:string)=>credentialHash(value,'design-pagination-test-key'.repeat(3));
 async function user(label:string){const token=credential(),email=prefix+label+'@example.test';await store.register(email,'fixture',hash(token));await store.verify(hash(token));const actor=await store.login(email,async()=>true,hash(credential()));assert.ok(actor);return actor;}
 try{
  const owner=await user('owner'),foreign=await user('foreign'),planner=await user('planner'),wedding=await store.createWedding(owner,weddingSchema.parse({displayNames:'Design pagination fixture',slug:'designs-'+prefix,timezone:'UTC'})),event=await store.saveEvent(owner,wedding.id,eventSchema.parse({title:'Synthetic ceremony',type:'custom',timezone:'UTC',toBeConfirmed:'Date forthcoming'})),invitations=new PostgresInvitations(store,new FilesystemStorage(root),'design-pages','https://example.test');
  const saved=await invitations.save(owner,wedding.id,'Synthetic saved design',designSchema.parse({templateId:'modern-minimal',eventIds:[event.id]}),0);
  await store.pool.query(`insert into std_invitation_designs(id,wedding_id,title,config,created_by,created_at,updated_at) select gen_random_uuid(),wedding_id,title,config,created_by,'2026-10-13T00:00:00.123456Z','2026-10-13T00:00:00.123456Z' from std_invitation_designs cross join generate_series(1,204) where id=$1`,[saved.id]);
  const token=credential();await store.invite(owner,wedding.id,{email:planner.email,role:'planner',eventIds:[],albumIds:[]},hash(token),'synthetic');await store.acceptInvite(planner,hash(token));
  const first=await invitations.listDesigns(planner,wedding.id),second=await invitations.listDesigns(planner,wedding.id,first.nextCursor!),third=await invitations.listDesigns(planner,wedding.id,second.nextCursor!);assert.equal(first.designs.length,100);assert.equal(second.designs.length,100);assert.equal(third.designs.length,5);assert.equal(third.nextCursor,null);assert.equal(new Set([...first.designs,...second.designs,...third.designs].map(d=>d.id)).size,205);
  const library=await invitations.list(owner,wedding.id);assert.equal(library.designs.length,100);assert.equal(library.nextDesignCursor,first.nextCursor);
  await store.pool.query('update std_invitation_designs set updated_at=now() where id=$1',[third.designs[0].id]);assert.deepEqual((await invitations.listDesigns(owner,wedding.id,second.nextCursor!)).designs.map(d=>d.id),third.designs.map(d=>d.id));
  await assert.rejects(invitations.listDesigns(foreign,wedding.id,first.nextCursor!),{code:'NOT_FOUND'});await assert.rejects(invitations.listDesigns(owner,wedding.id,'invalid'),{code:'INVALID_CURSOR'});
  await store.removeMember(owner,wedding.id,planner.userId);await assert.rejects(invitations.listDesigns(planner,wedding.id,first.nextCursor!),{code:'NOT_FOUND'});
 }finally{await store.close();await rm(root,{recursive:true,force:true});}
});
