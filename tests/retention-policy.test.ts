import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {PostgresStore,PostgresGuests,PostgresRetention,PostgresRecovery} from '@save-the-date/persistence';
import {FilesystemStorage,ObjectResourceErasureLedger} from '@save-the-date/adapters';
import {weddingSchema,eventSchema,guestSchema,rsvpSchema} from '@save-the-date/contracts';

test('R01/M05 optional answers expire at ninety days after event end, with start fallback and no invented date',async()=>{
 const connection=process.env.TEST_DB_CONNECTION;assert.ok(connection);const root=await mkdtemp(tmpdir()+'/std-answer-policy-'),storage=new FilesystemStorage(root),ledger=new ObjectResourceErasureLedger(storage),store=new PostgresStore(connection,undefined,undefined,ledger),prefix=randomUUID(),now=new Date(),day=86400000;
 try{
  const email=prefix+'@example.test';await store.register(email,'synthetic','verify-'+prefix);await store.verify('verify-'+prefix);const owner=await store.login(email,async()=>true,'session-'+prefix);assert.ok(owner);
  const wedding=await store.createWedding(owner,weddingSchema.parse({displayNames:'Synthetic retention policy',slug:'policy-'+prefix,timezone:'UTC'})),guests=new PostgresGuests(store,v=>v,'https://example.test'),retention=new PostgresRetention(store,storage,'policy','https://example.test');
  const cases=[{title:'Expired start fallback',start:-91,end:null,erased:true},{title:'End not yet ninety days old',start:-91,end:-89,erased:false},{title:'Exact end boundary',start:-92,end:-90,erased:true},{title:'Unknown schedule',start:null,end:null,erased:false}];
  const fixtures=[];
  for(const item of cases){const event=await store.saveEvent(owner,wedding.id,eventSchema.parse({title:item.title,type:'custom',timezone:'UTC',startsAt:item.start===null?null:new Date(now.getTime()+item.start*day).toISOString(),endsAt:item.end===null?null:new Date(now.getTime()+item.end*day).toISOString()})),attendee=await guests.save(owner,wedding.id,guestSchema.parse({name:'Synthetic guest '+item.title,household:item.title,eventIds:[event.id]}),0);await store.pool.query("insert into std_rsvps(wedding_id,event_id,attendee_id,state,dietary,accessibility) values($1,$2,$3,'unanswered','private answer','private access')",[wedding.id,event.id,attendee.id]);await store.pool.query('insert into std_event_questions values($1,$2,true,true,true,true)',[wedding.id,event.id]);fixtures.push({...item,id:event.id,partyId:attendee.party_id});}
  const before=new PostgresStore(connection);try{await assert.rejects(new PostgresRetention(before,storage,'policy','https://example.test').expireAnswers(now,wedding.id),{code:'ERASURE_LEDGER_REQUIRED'});}finally{await before.close();}
  const parallel=await Promise.all([retention.expireAnswers(now,wedding.id),retention.expireAnswers(now,wedding.id)]);assert.equal(parallel.reduce((total,result)=>total+result.events,0),2);assert.equal((await retention.expireAnswers(now,wedding.id)).events,0);
  for(const fixture of fixtures){const row=(await store.pool.query('select r.dietary,q.dietary as enabled from std_rsvps r join std_event_questions q on q.wedding_id=r.wedding_id and q.event_id=r.event_id where r.wedding_id=$1 and r.event_id=$2',[wedding.id,fixture.id])).rows[0];assert.equal(row.dietary,fixture.erased?'':'private answer');assert.equal(row.enabled,!fixture.erased);}
  const markers=await Array.fromAsync(ledger.records());assert.equal(markers.length,2);assert.ok(markers.every(marker=>marker.kind==='rsvp_answers'));
  const grant=await guests.issueGrant(owner,wedding.id,fixtures[0].partyId,30),sessionHash='policy-session-'+prefix;await guests.exchange(wedding.slug,grant.code,sessionHash);const session=await guests.authenticate(sessionHash),party=await guests.party(session);
  assert.equal(party.events.find(event=>event.id===fixtures[0].id)?.dietary,false);
  const response=await guests.submit(sessionHash,fixtures[0].id,rsvpSchema.parse({responses:party.attendees.map(attendee=>({attendeeId:attendee.id,attendeeVersion:attendee.version,expectedVersion:party.responses.find(row=>row.attendee_id===attendee.id&&row.event_id===fixtures[0].id)?.version??0,choice:'attending',name:attendee.name,dietary:'must not collect expired answer',accessibility:'must not collect',meal:'must not collect',note:'must not collect'}))}),randomUUID());
  assert.equal(response.responses[0].state,'confirmed');assert.equal((await store.pool.query('select dietary from std_rsvps where wedding_id=$1 and event_id=$2',[wedding.id,fixtures[0].id])).rows[0].dietary,'');
  await assert.rejects(guests.questions(owner,wedding.id,fixtures[0].id,{meal:false,dietary:true,accessibility:false,note:false,deleteAnswers:false}),{code:'RSVP_ANSWERS_EXPIRED'});
  await store.pool.query("update std_rsvps set dietary='old backup answer',updated_at=$3 where wedding_id=$1 and event_id=$2",[wedding.id,fixtures[0].id,new Date(now.getTime()-day)]);await new PostgresRecovery(store,storage).reapplyResources();assert.equal((await store.pool.query('select dietary from std_rsvps where wedding_id=$1 and event_id=$2',[wedding.id,fixtures[0].id])).rows[0].dietary,'');
 }finally{await store.close();await rm(root,{recursive:true,force:true});}
});

test('O02 audit records retain twelve months while scoped sweep preserves other weddings',async()=>{
 const connection=process.env.TEST_DB_CONNECTION;assert.ok(connection);const root=await mkdtemp(tmpdir()+'/std-audit-policy-'),store=new PostgresStore(connection),storage=new FilesystemStorage(root),prefix=randomUUID(),now=new Date();
 try{
  const email=prefix+'@example.test';await store.register(email,'synthetic','verify-'+prefix);await store.verify('verify-'+prefix);const owner=await store.login(email,async()=>true,'session-'+prefix);assert.ok(owner);
  const a=await store.createWedding(owner,weddingSchema.parse({displayNames:'Audit policy',slug:'audit-'+prefix,timezone:'UTC'})),b=await store.createWedding(owner,weddingSchema.parse({displayNames:'Other audit tenant',slug:'other-audit-'+prefix,timezone:'UTC'}));
  const kept=randomUUID(),expired=randomUUID(),foreign=randomUUID();for(const [id,wid,days] of [[kept,a.id,200],[expired,a.id,400],[foreign,b.id,400]] as const)await store.pool.query("insert into std_audit_events(id,wedding_id,action,created_at) values($1,$2,'synthetic.policy',$3)",[id,wid,new Date(now.getTime()-days*86400000)]);
  await new PostgresRetention(store,storage,'policy','https://example.test').sweep(now,a.id);
  assert.deepEqual((await store.pool.query('select id from std_audit_events where id=any($1::uuid[]) order by id',[[kept,expired,foreign]])).rows.map(r=>r.id).sort(),[kept,foreign].sort());
 }finally{await store.close();await rm(root,{recursive:true,force:true});}
});
