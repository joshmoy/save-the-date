import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {mkdtemp,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import pg from 'pg';
import {spawnSync} from 'node:child_process';
import {loadConfig} from '@save-the-date/config';
import {PostgresStore,PostgresGuests,PostgresPasses,PostgresLegacyTransfer,readLegacySnapshot,reconcileLegacySnapshot} from '@save-the-date/persistence';
import {FilesystemStorage,ObjectAdmissionLedger,AesGcmBackupEncryption,credential,credentialHash} from '@save-the-date/adapters';
import {weddingSchema,eventSchema,guestSchema} from '@save-the-date/contracts';

test('frozen legacy historical transfer survives recovery-storage failure, preserves used/revoked facts and activates no credentials',async()=>{
 const connection=process.env.TEST_DB_CONNECTION;assert.ok(connection);const endpoint=new URL(connection);assert.ok(['localhost','127.0.0.1'].includes(endpoint.hostname)&&endpoint.pathname.endsWith('_test'));
 const admin=new pg.Client({connectionString:connection}),database='std_legacy_transfer_'+randomUUID().replaceAll('-','')+'_test',root=await mkdtemp(tmpdir()+'/std-legacy-transfer-'),storage=new FilesystemStorage(root),ledger=new ObjectAdmissionLedger(storage),store=new PostgresStore(connection,undefined,ledger);let created=false,source:pg.Client|undefined;
 await admin.connect();
 try{
  await admin.query('create database "'+database+'"');created=true;endpoint.pathname='/'+database;source=new pg.Client({connectionString:endpoint.href});await source.connect();
  await source.query('create table schema_migrations(filename text primary key,applied_at timestamptz default now())');
  for(const file of (await readdir(new URL('../db/migrations/',import.meta.url))).filter(file=>file.endsWith('.sql')).sort()){await source.query(await readFile(new URL('../db/migrations/'+file,import.meta.url),'utf8'));await source.query('insert into schema_migrations(filename) values($1)',[file]);}
  const prefix=randomUUID(),email='transfer-'+prefix+'@example.test';await store.register(email,'synthetic fixture','verify-'+prefix);await store.verify('verify-'+prefix);const owner=await store.login(email,async()=>true,'session-'+prefix);assert.ok(owner);
  const sourceUser=(await source.query("insert into app_users(email,password_hash,role) values($1,'private legacy hash','super_admin') returning id",[email])).rows[0].id;
  for(const token of ['TRANSFER-USED','TRANSFER-REVOKED','TRANSFER-UNUSED'])await source.query('select * from create_hall_pass_if_available($1,$2,$3,$4)',[token,'Synthetic historical guest',email,null]);
  assert.equal((await source.query('select * from redeem_hall_pass($1,$2)',['TRANSFER-USED',email])).rows[0].status,'valid');
  await source.query("update hall_passes set invalidated_at=now(),invalidated_by=$1 where token in ('TRANSFER-USED','TRANSFER-REVOKED')",[email]);
  const wedding=await store.createWedding(owner,weddingSchema.parse({displayNames:'Historical transfer verification',slug:'transfer-'+prefix,timezone:'UTC'})),event=await store.saveEvent(owner,wedding.id,eventSchema.parse({title:'Explicit historical event',type:'custom',timezone:'UTC'})),guests=new PostgresGuests(store,value=>'test:'+value,'https://example.test');
  const attendees=[];for(let index=0;index<3;index++)attendees.push(await guests.save(owner,wedding.id,guestSchema.parse({name:'Synthetic mapped historical guest '+index,household:'Historical household '+index,eventIds:[event.id]}),0));
  let snapshot=await readLegacySnapshot(endpoint.href);const mappingFor=(value:typeof snapshot)=>({version:1,sourceChecksum:reconcileLegacySnapshot(value).sourceChecksum,weddingId:wedding.id,users:[{sourceUserId:sourceUser,targetUserId:owner.userId}],passes:value.passes.map((pass,index)=>({sourcePassId:pass.id,attendeeId:attendees[index].id,eventId:event.id,admittedByUserId:pass.used_at?owner.userId:null,identityEvidence:'Explicit synthetic identity and historical event mapping reviewed locally'}))});
  const transfer=new PostgresLegacyTransfer(store);await assert.rejects(transfer.transfer(owner,endpoint.href,snapshot,mappingFor(snapshot)),/LEGACY_SOURCE_NOT_FROZEN/);
  await source.query("update legacy_write_fence set frozen=true,frozen_at=clock_timestamp(),reason='Synthetic controlled historical transfer rehearsal' where id=true");snapshot=await readLegacySnapshot(endpoint.href);const mapping=mappingFor(snapshot),originalWrite=ledger.write.bind(ledger);let fail=true;
  ledger.write=async record=>{if(fail)throw Error('synthetic recovery storage unavailable');return originalWrite(record);};
  await assert.rejects(transfer.transfer(owner,endpoint.href,snapshot,mapping),/recovery storage unavailable/);
  assert.equal((await store.pool.query('select count(*) from std_passes where wedding_id=$1',[wedding.id])).rows[0].count,'0');
  assert.equal((await store.pool.query('select state from std_legacy_transfers where wedding_id=$1',[wedding.id])).rows[0].state,'held');
  const passes=new PostgresPasses(store,value=>value,undefined,storage,'historical-test','https://example.test');await assert.rejects(passes.redeem(owner,wedding.id,event.id,'TRANSFER-USED',randomUUID()),{code:'LEGACY_TRANSFER_HELD'});
  // Pre-switch rollback: the target remains held while the old writer can resume.
  // Roll back the synthetic source redemption so no admission is acknowledged by this rehearsal.
  await source.query('update legacy_write_fence set frozen=false,frozen_at=null,reason=null where id=true');
  await source.query('begin');assert.equal((await source.query('select * from redeem_hall_pass($1,$2)',['TRANSFER-UNUSED',email])).rows[0].status,'valid');await source.query('rollback');
  await assert.rejects(passes.redeem(owner,wedding.id,event.id,'TRANSFER-UNUSED',randomUUID()),{code:'LEGACY_TRANSFER_HELD'});
  await assert.rejects(transfer.release(owner,endpoint.href,snapshot,mapping,{}));
  await source.query("update legacy_write_fence set frozen=true,frozen_at=$1,reason='Synthetic source refrozen after pre-switch rollback rehearsal' where id=true",[snapshot.fence!.frozenAt]);
  fail=false;const result=await transfer.transfer(owner,endpoint.href,snapshot,mapping);assert.equal(result.held,true);assert.equal(result.admissions,1);assert.equal(result.passes,3);assert.equal(result.legacyCredentialsActivated,0);
  const rows=(await store.pool.query('select * from std_passes where wedding_id=$1',[wedding.id])).rows;assert.equal(rows.filter(row=>row.status==='used').length,1);assert.equal(rows.filter(row=>row.status==='revoked').length,2);assert.ok(rows.every(row=>row.credential_hash===null&&row.manual_hash===null&&row.encrypted_payload===null));
  const used=rows.find(row=>row.status==='used');assert.equal((await ledger.get(wedding.id,used.id))?.state,'committed');assert.equal((await store.pool.query('select count(*) from std_admissions where wedding_id=$1',[wedding.id])).rows[0].count,'1');assert.equal((await store.pool.query('select count(*) from std_reservations where wedding_id=$1',[wedding.id])).rows[0].count,'0');
  assert.ok((await store.pool.query('select action from std_pass_history where wedding_id=$1 and pass_id=$2',[wedding.id,used.id])).rows.some(row=>row.action==='legacy.invalidated'));
  await transfer.transfer(owner,endpoint.href,snapshot,mapping);assert.equal((await store.pool.query('select count(*) from std_admissions where wedding_id=$1',[wedding.id])).rows[0].count,'1');
  await assert.rejects(passes.reissue(owner,wedding.id,used.id,1,'Review attempted during held transfer',randomUUID()),{code:'LEGACY_TRANSFER_HELD'});
  await assert.rejects(source.query('select * from redeem_hall_pass($1,$2)',['TRANSFER-UNUSED',email]),{code:'55000'});
  await store.pool.query("update std_passes set status='expired' where id=$1",[used.id]);await assert.rejects(transfer.transfer(owner,endpoint.href,snapshot,mapping),{code:'LEGACY_TARGET_CHANGED'});
  await store.pool.query("update std_passes set status='used' where id=$1",[used.id]);
  const evidence={version:1,backupReference:'Synthetic encrypted snapshot and tested restore reference',backupChecksum:'a'.repeat(64),reviewEvidence:'Synthetic owner review confirms every mapped identity, event and historical admission fact',identitiesAndEventsReviewed:true,backupRestoreRehearsed:true,legacyWritersRemainFrozen:true,unusedCredentialsRequireConfirmedRsvpAndExplicitReissue:true};
  await assert.rejects(transfer.release({...owner,reauthenticatedAt:new Date(0)},endpoint.href,snapshot,mapping,evidence),{code:'REAUTH_REQUIRED'});
  await assert.rejects(transfer.release({...owner,userId:randomUUID()},endpoint.href,snapshot,mapping,evidence),{code:'NOT_FOUND'});
  await assert.rejects(transfer.release(owner,endpoint.href,snapshot,mapping,{...evidence,legacyWritersRemainFrozen:false}));
  await store.pool.query('update std_admissions set attendee_id=$2 where pass_id=$1',[used.id,randomUUID()]);
  await assert.rejects(transfer.release(owner,endpoint.href,snapshot,mapping,evidence),{code:'LEGACY_TARGET_CHANGED'});
  await store.pool.query('update std_admissions set attendee_id=$2 where pass_id=$1',[used.id,used.attendee_id]);
  const originalGet=ledger.get.bind(ledger);ledger.get=async()=>null;
  await assert.rejects(transfer.release(owner,endpoint.href,snapshot,mapping,evidence),{code:'LEGACY_LEDGER_NOT_RECONCILED'});ledger.get=originalGet;
  const config=loadConfig(),secret=credential(),keys=JSON.stringify({active:'fixture',keys:{fixture:randomBytes(32).toString('base64')}});
  await store.login(email,async()=>true,credentialHash(secret,config.TOKEN_HASH_KEYS));
  async function* chunks(){yield Buffer.from(JSON.stringify(snapshot));}await new AesGcmBackupEncryption(keys).encryptTo(chunks(),storage,'source-stdbak');
  for(const [name,value] of [['mapping.json',JSON.stringify(mapping)],['evidence.json',JSON.stringify(evidence)],['session',secret]])await writeFile(root+'/'+name,value,{mode:0o600});
  const transferCli=spawnSync(process.execPath,['--import','tsx','scripts/legacy-handover.ts','transfer',root+'/source-stdbak',root+'/mapping.json',root+'/transfer.json'],{env:{...process.env,LEGACY_SOURCE_CONNECTION:endpoint.href,LEGACY_TARGET_CONNECTION:connection,LEGACY_PLAN_SESSION_FILE:root+'/session',BACKUP_ENCRYPTION_KEYS:keys,STORAGE_ADAPTER:'filesystem',DELETION_LEDGER_ROOT:root},encoding:'utf8'});
  assert.equal(transferCli.status,0,transferCli.stderr);assert.equal(JSON.parse(await readFile(root+'/transfer.json','utf8')).held,true);
  const cli=spawnSync(process.execPath,['--import','tsx','scripts/legacy-handover.ts','release',root+'/source-stdbak',root+'/mapping.json',root+'/released.json',root+'/evidence.json'],{env:{...process.env,LEGACY_SOURCE_CONNECTION:endpoint.href,LEGACY_TARGET_CONNECTION:connection,LEGACY_PLAN_SESSION_FILE:root+'/session',BACKUP_ENCRYPTION_KEYS:keys,STORAGE_ADAPTER:'filesystem',DELETION_LEDGER_ROOT:root},encoding:'utf8'});
  assert.equal(cli.status,0,cli.stderr);assert.equal(JSON.parse(await readFile(root+'/released.json','utf8')).state,'released');

  assert.equal((await transfer.release(owner,endpoint.href,snapshot,mapping,evidence)).credentialsActivated,0);
  await assert.rejects(transfer.release(owner,endpoint.href,snapshot,mapping,{...evidence,reviewEvidence:'Different owner evidence must not overwrite an established audited handover decision'}),{code:'LEGACY_HANDOVER_CONFLICT'});
  await assert.rejects(transfer.transfer(owner,endpoint.href,snapshot,mapping),{code:'LEGACY_ALREADY_RELEASED'});
  await assert.rejects(passes.reissue(owner,wedding.id,used.id,1,'Historical used pass remains terminal after release',randomUUID()),{code:'ADMISSION_RECOVERY_HOLD'});
  const unused=rows.find(row=>row.status==='revoked');await assert.rejects(passes.reissue(owner,wedding.id,unused.id,1,'Unused history still requires a confirmed RSVP',randomUUID()),{code:'NOT_CONFIRMED'});
  assert.equal((await store.pool.query("select count(*) from std_passes where wedding_id=$1 and status='active'",[wedding.id])).rows[0].count,'0');
  assert.equal((await store.pool.query("select count(*) from std_audit_events where wedding_id=$1 and action='legacy.handover_released'",[wedding.id])).rows[0].count,'1');

 }finally{await store.close();if(source)await source.end();if(created)await admin.query('drop database "'+database+'" with (force)');await admin.end();await rm(root,{recursive:true,force:true});}
});
