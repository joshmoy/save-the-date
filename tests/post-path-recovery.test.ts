import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {PostgresStore,PostgresPublication} from '@save-the-date/persistence';
import {FilesystemStorage,credential,credentialHash} from '@save-the-date/adapters';
import {weddingSchema,siteConfigSchema,postSchema} from '@save-the-date/contracts';
import {createBackup,restoreBackup} from '../scripts/backup-service';
const connection=process.env.TEST_DB_CONNECTION;
if(!connection||!['localhost','127.0.0.1'].includes(new URL(connection).hostname)||!new URL(connection).pathname.endsWith('_test'))throw Error('Requires isolated local _test administrator');
test('B02/O02 pre-028 encrypted restore expands path approval without exposing reserved draft URLs',async()=>{
 const admin=new PostgresStore(connection!),suffix=randomUUID().replaceAll('-',''),names=['std_paths_source_'+suffix+'_test','std_paths_restore_'+suffix+'_test'],root=await mkdtemp(tmpdir()+'/std-path-restore-'),stores:PostgresStore[]=[];let passed=false;
 try{
  for(const name of names){await admin.pool.query('create database "'+name+'"');const url=new URL(connection!);url.pathname='/'+name;stores.push(new PostgresStore(url.href));}
  const [source,target]=stores;await source.migrate('packages/persistence/migrations');
  const hash=(v:string)=>credentialHash(v,'synthetic-recovery-key'.repeat(3)),token=credential(),email=suffix+'@example.test';
  await source.register(email,'synthetic',hash(token));await source.verify(hash(token));const owner=await source.login(email,async()=>true,hash(credential()));assert.ok(owner);
  const wedding=await source.createWedding(owner,weddingSchema.parse({displayNames:'Path recovery fixture',slug:'restore-path-'+suffix,timezone:'UTC'})),repo=new PostgresPublication(source),site=await repo.saveSite(owner,wedding.id,siteConfigSchema.parse({visibility:'public'}),0);await repo.publish(owner,wedding.id,site.version,wedding.version);
  const input=postSchema.parse({title:'Approved update',slug:'approved-path',body:[{type:'paragraph',text:'Approved content'}]}),post=await repo.savePost(owner,wedding.id,input,0);await repo.publishPost(owner,wedding.id,post.id,post.version,true);await repo.savePost(owner,wedding.id,{...input,slug:'draft-path',title:'Unapproved title'},post.version,post.id);
  await source.pool.query('alter table std_post_paths drop column was_published');await source.pool.query("delete from std_migrations where name='028_published_post_paths.sql'");
  const sourceUrl=new URL(connection!),targetUrl=new URL(connection!);sourceUrl.pathname='/'+names[0];targetUrl.pathname='/'+names[1];
  const backups=new FilesystemStorage(root+'/backup'),keys=JSON.stringify({active:'fixture',keys:{fixture:randomBytes(32).toString('base64')}});
  const backup=await createBackup({connection:sourceUrl.href,source:new FilesystemStorage(root+'/objects'),destination:backups,replica:new FilesystemStorage(root+'/replica'),namespace:'path-recovery',encryptionKeys:keys,dumpExecutable:process.env.PG_DUMP_PATH});
  await restoreBackup({connection:targetUrl.href,source:backups,target:new FilesystemStorage(root+'/restored'),id:backup.record.id,encryptionKeys:keys,restoreExecutable:process.env.PG_RESTORE_PATH});
  await target.migrate('packages/persistence/migrations');const restored=new PostgresPublication(target);
  assert.equal((await restored.publicPost(wedding.slug,'approved-path')).post.title,'Approved update');await assert.rejects(restored.publicPost(wedding.slug,'draft-path'),{code:'NOT_FOUND'});
  assert.deepEqual((await target.pool.query('select slug,was_published from std_post_paths order by slug')).rows,[{slug:'approved-path',was_published:true},{slug:'draft-path',was_published:false}]);
  passed=true;
 }finally{
  for(const store of stores)await store.close();
  if(passed){for(const name of names)await admin.pool.query('drop database "'+name+'" with (force)');await rm(root,{recursive:true,force:true});}
  else console.error('Failed isolated path recovery retained: '+names.join(', ')+'; '+root);
  await admin.close();
 }
});
