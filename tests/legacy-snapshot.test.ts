import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import pg from 'pg';
import {readLegacySnapshot,reconcileLegacySnapshot} from '@save-the-date/persistence';
import {AesGcmBackupEncryption,FilesystemStorage} from '@save-the-date/adapters';

test('legacy operational rehearsal preserves admission and revocation facts without credential leakage or source writes',async()=>{
 const source=process.env.TEST_DB_CONNECTION;
 assert.ok(source,'isolated test connection required');
 const endpoint=new URL(source);
 assert.ok(['localhost','127.0.0.1'].includes(endpoint.hostname)&&endpoint.pathname.endsWith('_test'));
 const database='std_legacy_'+randomUUID().replaceAll('-','')+'_test',admin=new pg.Client({connectionString:source});
 const root=await mkdtemp(tmpdir()+'/std-legacy-rehearsal-');let created=false;
 await admin.connect();
 try{
  await admin.query('create database "'+database+'"');created=true;endpoint.pathname='/'+database;
  const client=new pg.Client({connectionString:endpoint.href});await client.connect();
  try{
   await client.query('create table schema_migrations(filename text primary key,applied_at timestamptz not null default now())');
   for(const file of (await readdir(new URL('../db/migrations/',import.meta.url))).filter(file=>file.endsWith('.sql')).sort()){
    await client.query(await readFile(new URL('../db/migrations/'+file,import.meta.url),'utf8'));
    await client.query('insert into schema_migrations(filename) values($1)',[file]);
   }
   await client.query("insert into app_users(email,password_hash,role) values('synthetic@example.test','private-password-hash','bouncer')");
   const ids=[];
   for(let index=0;index<4;index++)ids.push((await client.query('insert into hall_passes(token,guest_name) values($1,$2) returning id',['private-token-'+index,'Synthetic Guest '+index])).rows[0].id);
   await client.query("update hall_passes set used_at=now(),used_by='synthetic@example.test' where id=any($1::uuid[])",[ids.slice(0,2)]);
   await client.query("update hall_passes set invalidated_at=now(),invalidated_by='synthetic@example.test' where id=any($1::uuid[])",[ids.slice(1,3)]);
   await client.query("insert into scan_attempts(hall_pass_id,token,scanner_email,result) values($1,'private-token-0','synthetic@example.test','valid')",[ids[0]]);
   const snapshot=await readLegacySnapshot(endpoint.href),report=reconcileLegacySnapshot(snapshot);
   assert.deepEqual(report.passFacts,{used:2,revoked:1,unused:1,usedAndRevoked:1});
   assert.equal(report.tables.migrations.count,10);assert.equal(report.tables.scans.count,1);
   assert.equal(report.tables.users.count,1);assert.equal(report.tables.passes.count,4);
   const serialized=JSON.stringify(report);
   for(const secret of ['private-token','private-password-hash','synthetic@example.test','Synthetic Guest'])assert.ok(!serialized.includes(secret));
   const encryption=new AesGcmBackupEncryption(JSON.stringify({active:'rehearsal',keys:{rehearsal:randomBytes(32).toString('base64')}})),storage=new FilesystemStorage(root);
   async function* chunks(){yield Buffer.from(JSON.stringify(snapshot));}
   await encryption.encryptTo(chunks(),storage,'source-stdbak');
   assert.ok(!(await storage.read('source-stdbak')).toString().includes('private-token'));
   await encryption.decryptTo(storage,'source-stdbak',storage,'restored-json');
   assert.deepEqual(JSON.parse((await storage.read('restored-json')).toString()),snapshot);
   const again=await readLegacySnapshot(endpoint.href);
   assert.deepEqual(reconcileLegacySnapshot(again).tables,report.tables);
   assert.deepEqual(again.passes,snapshot.passes);
   await assert.rejects(readLegacySnapshot('postgresql://example.test/source?sslmode=require'),/VERIFIED_TLS/);
  }finally{await client.end();}
 }finally{if(created)await admin.query('drop database "'+database+'" with (force)');await admin.end();await rm(root,{recursive:true,force:true});}
});
