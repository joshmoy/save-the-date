import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {AesGcmBackupEncryption,FilesystemStorage,credential,credentialHash} from '@save-the-date/adapters';
import {loadConfig} from '@save-the-date/config';
import {PostgresStore,PostgresGuests,PostgresLegacyPlanner,reconcileLegacySnapshot,type LegacySnapshot} from '@save-the-date/persistence';
import {weddingSchema,eventSchema,guestSchema} from '@save-the-date/contracts';

test('legacy mappings preserve used/revoked facts, validate real target lineage and never grant roles or reinterpret capacity',async()=>{
 const connection=process.env.TEST_DB_CONNECTION;assert.ok(connection);const endpoint=new URL(connection);assert.ok(['localhost','127.0.0.1'].includes(endpoint.hostname)&&endpoint.pathname.endsWith('_test'));
 const root=await mkdtemp(tmpdir()+'/std-legacy-plan-test-');
 const store=new PostgresStore(connection),prefix=randomUUID(),email='legacy-map-'+prefix+'@example.test';
 try{
  await store.register(email,'synthetic fixture','verify-'+prefix);await store.verify('verify-'+prefix);const owner=await store.login(email,async()=>true,'session-'+prefix);assert.ok(owner);
  const wedding=await store.createWedding(owner,weddingSchema.parse({displayNames:'Synthetic migration mapping',slug:'map-'+prefix,timezone:'UTC'})),event=await store.saveEvent(owner,wedding.id,eventSchema.parse({title:'Explicit mapped event',type:'custom',timezone:'UTC',capacity:10})),guests=new PostgresGuests(store,value=>'synthetic-hash:'+value,'https://example.test');
  const attendees=[];for(let index=0;index<4;index++)attendees.push(await guests.save(owner,wedding.id,guestSchema.parse({name:'Synthetic mapped guest '+index,household:'Mapped household '+index,eventIds:[event.id]}),0));
  const sourceUserId=randomUUID(),at='2026-08-01T12:00:00Z',snapshot:LegacySnapshot={version:1,capturedAt:at,users:[{id:sourceUserId,email,password_hash:'private legacy password hash',role:'super_admin'}],passes:attendees.map((_,index)=>({id:randomUUID(),token:'private legacy token '+index,guest_name:'Synthetic original guest '+index,used_at:index<2?at:null,used_by:index<2?email:null,invalidated_at:index===1||index===2?at:null})),scans:[],settings:[{ticket_limit:4}],migrations:[]};
  snapshot.scans=[{id:randomUUID(),hall_pass_id:snapshot.passes[0].id,token:'private scan token',scanner_email:email,result:'valid'}];
  const mapping={version:1,sourceChecksum:reconcileLegacySnapshot(snapshot).sourceChecksum,weddingId:wedding.id,users:[{sourceUserId,targetUserId:owner.userId}],passes:snapshot.passes.map((pass,index)=>({sourcePassId:pass.id,attendeeId:attendees[index].id,eventId:event.id,admittedByUserId:index<2?owner.userId:null,identityEvidence:'Explicit synthetic identity mapping checked for the local rehearsal'}))},planner=new PostgresLegacyPlanner(store);
  const before=(await store.pool.query('select count(*) from std_passes where wedding_id=$1',[wedding.id])).rows[0].count;
  const result=await planner.plan(owner,snapshot,mapping);assert.equal(result.mappingComplete,true);assert.equal(result.cutoverReady,false);
  assert.deepEqual(result.actions.map(row=>row.action),['preserve_used_never_reissue','preserve_used_never_reissue','preserve_revoked','quarantine_then_owner_review_before_reissue']);
  assert.equal(result.actions[1].invalidatedAt,at);assert.equal(result.rolesGranted,0);assert.equal(result.credentialsActivated,0);assert.equal(result.capacityConverted,false);assert.equal(result.scanActions[0].actorUserId,owner.userId);assert.equal(result.scanActions[0].result,'valid');
  assert.equal((await store.pool.query('select capacity from std_events where id=$1',[event.id])).rows[0].capacity,10);
  assert.equal((await store.pool.query('select count(*) from std_passes where wedding_id=$1',[wedding.id])).rows[0].count,before);
  for(const secret of ['private legacy token','private legacy password hash',email])assert.ok(!JSON.stringify(result).includes(secret));
  await assert.rejects(planner.plan(owner,snapshot,{...mapping,sourceChecksum:'0'.repeat(64)}),{code:'LEGACY_SOURCE_CHANGED'});
  const duplicate=await planner.plan(owner,snapshot,{...mapping,passes:mapping.passes.map((row,index)=>index===1?{...row,attendeeId:attendees[0].id}:row)});assert.ok(duplicate.exceptions.some(row=>row.code==='DUPLICATE_TARGET_ATTENDEE_EVENT'));assert.equal(duplicate.mappingComplete,false);
  const foreign=await store.createWedding(owner,weddingSchema.parse({displayNames:'Other synthetic wedding',slug:'other-map-'+prefix,timezone:'UTC'})),foreignEvent=await store.saveEvent(owner,foreign.id,eventSchema.parse({title:'Foreign event',type:'custom',timezone:'UTC'}));
  const wrongEvent=await planner.plan(owner,snapshot,{...mapping,passes:mapping.passes.map(row=>({...row,eventId:foreignEvent.id}))});assert.equal(wrongEvent.mappingComplete,false);assert.ok(wrongEvent.exceptions.some(row=>row.code==='TARGET_ELIGIBILITY_MAPPING_REQUIRED'));
  await assert.rejects(planner.plan(owner,{...snapshot,passes:[{...snapshot.passes[0],id:'private invalid credential'}]},mapping),{code:'LEGACY_SNAPSHOT_INVALID'});
  const config=loadConfig(),secret=credential();await store.login(email,async()=>true,credentialHash(secret,config.TOKEN_HASH_KEYS));
  const keys=JSON.stringify({active:'rehearsal',keys:{rehearsal:randomBytes(32).toString('base64')}}),storage=new FilesystemStorage(root);
  async function* chunks(){yield Buffer.from(JSON.stringify(snapshot));}await new AesGcmBackupEncryption(keys).encryptTo(chunks(),storage,'source-stdbak');
  await writeFile(root+'/mapping.json',JSON.stringify(mapping),{mode:0o600});await writeFile(root+'/session',secret,{mode:0o600});
  const cli=spawnSync(process.execPath,['--import','tsx','scripts/legacy-mapping-plan.ts',root+'/source-stdbak',root+'/mapping.json',root+'/plan.json'],{env:{...process.env,LEGACY_TARGET_CONNECTION:connection,LEGACY_PLAN_SESSION_FILE:root+'/session',BACKUP_ENCRYPTION_KEYS:keys},encoding:'utf8'});
  assert.equal(cli.status,0,cli.stderr);const report=JSON.parse(await readFile(root+'/plan.json','utf8'));assert.equal(report.mappingComplete,true);assert.equal(report.cutoverReady,false);
  assert.ok(!JSON.stringify(report).includes('private legacy token'));assert.ok(!cli.stdout.includes(secret));
  const otherEmail='other-'+prefix+'@example.test';await store.register(otherEmail,'synthetic','other-verify-'+prefix);await store.verify('other-verify-'+prefix);const other=await store.login(otherEmail,async()=>true,'other-session-'+prefix);assert.ok(other);await assert.rejects(planner.plan(other,snapshot,mapping),{code:'NOT_FOUND'});
 }finally{await store.close();await rm(root,{recursive:true,force:true});}
});
