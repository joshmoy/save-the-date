import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import pg from 'pg';
import {readLegacySnapshot} from '@save-the-date/persistence';

test('legacy fencing waits for in-flight admission, rejects later writers and preserves a frozen snapshot',async()=>{
 const connection=process.env.TEST_DB_CONNECTION;assert.ok(connection);const endpoint=new URL(connection);assert.ok(['localhost','127.0.0.1'].includes(endpoint.hostname)&&endpoint.pathname.endsWith('_test'));
 const database='std_legacy_fence_'+randomUUID().replaceAll('-','')+'_test',admin=new pg.Client({connectionString:connection});await admin.connect();let created=false;
 const clients:pg.Client[]=[];
 try{
  await admin.query('create database "'+database+'"');created=true;endpoint.pathname='/'+database;
  for(let index=0;index<3;index++){const client=new pg.Client({connectionString:endpoint.href});await client.connect();clients.push(client);}
  const [writer,fencer,late]=clients;
  await writer.query('create table schema_migrations(filename text primary key,applied_at timestamptz default now())');
  for(const file of (await readdir(new URL('../db/migrations/',import.meta.url))).filter(file=>file.endsWith('.sql')).sort()){await writer.query(await readFile(new URL('../db/migrations/'+file,import.meta.url),'utf8'));await writer.query('insert into schema_migrations(filename) values($1)',[file]);}
  await writer.query("insert into app_users(email,password_hash,role) values('synthetic@example.test','private fixture hash','bouncer')");
  for(const token of ['FENCE-FIRST','FENCE-LATE'])assert.equal((await writer.query('select * from create_hall_pass_if_available($1,$2,$3,$4)',[token,'Synthetic guest','synthetic@example.test',null])).rowCount,1);
  await writer.query('begin');assert.equal((await writer.query("select * from redeem_hall_pass('FENCE-FIRST','synthetic@example.test')")).rows[0].status,'valid');
  const pid=(await fencer.query('select pg_backend_pid() as id')).rows[0].id;
  const freeze=fencer.query("update legacy_write_fence set frozen=true,frozen_at=clock_timestamp(),reason='Explicit synthetic local migration handover' where id=true");
  let blocked=false;for(let attempt=0;attempt<100;attempt++){blocked=(await late.query('select cardinality(pg_blocking_pids($1))>0 as blocked',[pid])).rows[0].blocked;if(blocked)break;await new Promise(resolve=>setTimeout(resolve,10));}assert.equal(blocked,true,'Fence must wait for the old admission transaction');
  const denied=late.query("select * from redeem_hall_pass('FENCE-LATE','synthetic@example.test')").then(()=>null,error=>error);
  await writer.query('commit');await freeze;const error=await denied;assert.equal(error?.code,'55000');assert.equal(error?.message,'LEGACY_WRITES_FROZEN');
  const snapshot=await readLegacySnapshot(endpoint.href);assert.equal(snapshot.fence?.frozen,true);assert.ok(snapshot.fence?.frozenAt);
  assert.equal(snapshot.passes.filter(pass=>pass.used_at).length,1);
  for(const sql of ["insert into hall_passes(token) values('NO-NEW-PASS')","update hall_passes set invalidated_at=now()","delete from hall_passes","truncate scan_attempts","update ticket_settings set ticket_limit=1","update app_users set password_hash='changed'"])await assert.rejects(writer.query(sql),{code:'55000',message:'LEGACY_WRITES_FROZEN'});
  const again=await readLegacySnapshot(endpoint.href);assert.deepEqual(again.passes,snapshot.passes);assert.deepEqual(again.users,snapshot.users);
 }finally{for(const client of clients){try{await client.query('rollback');}catch{/* connections may already be outside a transaction */}await client.end();}if(created)await admin.query('drop database "'+database+'" with (force)');await admin.end();}
});
