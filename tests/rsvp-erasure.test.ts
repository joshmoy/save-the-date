import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {PostgresStore,PostgresGuests,PostgresRetention,PostgresRecovery} from '@save-the-date/persistence';
import {FilesystemStorage,ObjectResourceErasureLedger,type Job} from '@save-the-date/adapters';
import {weddingSchema,eventSchema,guestSchema} from '@save-the-date/contracts';

test('R01/O02 answer deletion revokes archive copies, replays after restore and preserves later answers and other tenants',async()=>{
 const connection=process.env.TEST_DB_CONNECTION;assert.ok(connection);const root=await mkdtemp(tmpdir()+'/std-answer-erasure-'),storage=new FilesystemStorage(root+'/objects'),ledger=new ObjectResourceErasureLedger(new FilesystemStorage(root+'/ledger')),store=new PostgresStore(connection,undefined,undefined,ledger),prefix=randomUUID();
 try{
  const email=prefix+'@example.test';await store.register(email,'synthetic','verify-'+prefix);await store.verify('verify-'+prefix);const owner=await store.login(email,async()=>true,'session-'+prefix);assert.ok(owner);
  const wedding=await store.createWedding(owner,weddingSchema.parse({displayNames:'Synthetic answer erasure',slug:'answers-'+prefix,timezone:'UTC'})),event=await store.saveEvent(owner,wedding.id,eventSchema.parse({title:'Private answers',type:'custom',timezone:'UTC'})),guests=new PostgresGuests(store,v=>v,'https://example.test'),retention=new PostgresRetention(store,storage,'answer-test','https://example.test'),recovery=new PostgresRecovery(store,storage);
  const attendee=await guests.save(owner,wedding.id,guestSchema.parse({name:'Synthetic guest',household:'Synthetic household',eventIds:[event.id]}),0);
  await store.pool.query("insert into std_rsvps(wedding_id,attendee_id,event_id,state,dietary,accessibility,note) values($1,$2,$3,'unanswered','private old answer','private accessibility','private note')",[wedding.id,attendee.id,event.id]);
  const foreign=await store.createWedding(owner,weddingSchema.parse({displayNames:'Other tenant',slug:'other-answers-'+prefix,timezone:'UTC'})),foreignEvent=await store.saveEvent(owner,foreign.id,eventSchema.parse({title:'Other tenant event',type:'custom',timezone:'UTC'})),foreignAttendee=await guests.save(owner,foreign.id,guestSchema.parse({name:'Other synthetic guest',household:'Other household',eventIds:[foreignEvent.id]}),0);
  await store.pool.query("insert into std_rsvps(wedding_id,attendee_id,event_id,state,dietary) values($1,$2,$3,'unanswered','other tenant retained')",[foreign.id,foreignAttendee.id,foreignEvent.id]);
  const sensitive=await retention.export(owner,wedding.id,true,randomUUID()),ordinary=await retention.export(owner,wedding.id,false,randomUUID());
  const original=(await store.pool.query('select * from std_archive_exports where id=$1',[sensitive.id])).rows[0];
  const row=(await store.pool.query("update std_jobs set state='leased',lease_owner='answer-fixture',lease_until=now()+interval '1 minute' where dedupe_key=$1 returning *",['archive:'+sensitive.id])).rows[0],job:Job={id:row.id,weddingId:wedding.id,type:row.type,payload:row.payload,attempts:1,leaseOwner:'answer-fixture',requestedBy:owner.userId};
  await retention.process(job);const generated=(await store.pool.query('select object_key from std_archive_exports where id=$1',[sensitive.id])).rows[0].object_key;assert.ok((await storage.read(generated)).includes(Buffer.from('private old answer')));
  const unjournalledStore=new PostgresStore(connection);try{await assert.rejects(new PostgresGuests(unjournalledStore,v=>v,'https://example.test').questions(owner,wedding.id,event.id,{meal:false,dietary:false,accessibility:false,note:false,deleteAnswers:true}),{code:'ERASURE_LEDGER_REQUIRED'});}finally{await unjournalledStore.close();}
  assert.equal((await store.pool.query('select dietary from std_rsvps where wedding_id=$1',[wedding.id])).rows[0].dietary,'private old answer');
  await guests.questions(owner,wedding.id,event.id,{meal:false,dietary:false,accessibility:false,note:false,deleteAnswers:true});
  assert.equal((await store.pool.query('select dietary from std_rsvps where wedding_id=$1',[wedding.id])).rows[0].dietary,'');await assert.rejects(retention.download(owner,wedding.id,sensitive.id),{code:'NOT_FOUND'});
  assert.equal((await store.pool.query('select count(*) from std_archive_exports where id=$1',[ordinary.id])).rows[0].count,'1');
  const cleanup=(await store.pool.query("select * from std_jobs where type='rsvp-answer-delete' and wedding_id=$1",[wedding.id])).rows[0];
  await recovery.eraseAnswerArchives({...job,id:cleanup.id,type:cleanup.type,payload:cleanup.payload},'answer-test');await assert.rejects(storage.read(generated),{code:'ENOENT'});
  assert.equal((await store.pool.query('select dietary from std_rsvps where wedding_id=$1',[foreign.id])).rows[0].dietary,'other tenant retained');
  const marker=await Array.fromAsync(ledger.records());assert.equal(marker.length,1);assert.equal(marker[0].kind,'rsvp_answers');assert.ok(!JSON.stringify(marker).includes('private old answer'));
  await store.pool.query("update std_rsvps set dietary='new consented answer',updated_at=$2 where wedding_id=$1",[wedding.id,new Date(Date.parse(marker[0].recordedAt)+1000)]);await recovery.reapplyResources();assert.equal((await store.pool.query('select dietary from std_rsvps where wedding_id=$1',[wedding.id])).rows[0].dietary,'new consented answer');
  await store.pool.query("update std_rsvps set dietary='restored old answer',updated_at=$2 where wedding_id=$1",[wedding.id,new Date(Date.parse(marker[0].recordedAt)-1000)]);
  await store.pool.query('insert into std_archive_exports(id,wedding_id,requested_by,operation_key,include_sensitive,snapshot,created_at) values($1,$2,$3,$4,true,$5,$6)',[original.id,wedding.id,owner.userId,original.operation_key,original.snapshot,original.created_at]);
  await storage.write(generated,Buffer.from('restored sensitive TAR'),'application/x-tar');await store.pool.query("update std_jobs set state='succeeded' where id=$1",[cleanup.id]);await recovery.reapplyResources();
  assert.equal((await store.pool.query('select dietary from std_rsvps where wedding_id=$1',[wedding.id])).rows[0].dietary,'');assert.equal((await store.pool.query('select state from std_jobs where id=$1',[cleanup.id])).rows[0].state,'pending');
  await recovery.eraseAnswerArchives({...job,payload:cleanup.payload},'answer-test');await assert.rejects(storage.read(generated),{code:'ENOENT'});
 }finally{await store.close();await rm(root,{recursive:true,force:true});}
});
