import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {PostgresStore,PostgresMedia} from '@save-the-date/persistence';
import {FilesystemStorage,credential,credentialHash} from '@save-the-date/adapters';
import {weddingSchema} from '@save-the-date/contracts';

test('M01 album pages do not truncate media authorisation and recheck assigned albums',async()=>{
 const store=new PostgresStore(process.env.TEST_DB_CONNECTION!),root=await mkdtemp(tmpdir()+'/std-album-pages-'),prefix=randomUUID(),hash=(value:string)=>credentialHash(value,'album-pagination-test-key'.repeat(3));
 async function user(label:string){const token=credential(),email=prefix+label+'@example.test';await store.register(email,'fixture',hash(token));await store.verify(hash(token));const actor=await store.login(email,async()=>true,hash(credential()));assert.ok(actor);return actor;}
 try{
  const owner=await user('owner'),foreign=await user('foreign'),planner=await user('planner'),wedding=await store.createWedding(owner,weddingSchema.parse({displayNames:'Album pagination fixture',slug:'albums-'+prefix,timezone:'UTC'})),media=new PostgresMedia(store,new FilesystemStorage(root),'album-pages');
  await store.pool.query(`insert into std_albums(id,wedding_id,title,position) select gen_random_uuid(),$1,'Synthetic album',0 from generate_series(1,205) n`,[wedding.id]);
  const first=await media.listAlbums(owner,wedding.id),second=await media.listAlbums(owner,wedding.id,first.nextCursor!),third=await media.listAlbums(owner,wedding.id,second.nextCursor!);assert.equal(first.albums.length,100);assert.equal(second.albums.length,100);assert.equal(third.albums.length,5);assert.equal(third.nextCursor,null);const all=[...first.albums,...second.albums,...third.albums];assert.equal(new Set(all.map(a=>a.id)).size,205);
  const assetId=randomUUID(),lastAlbum=third.albums[0].id;await store.pool.query(`insert into std_media_assets(id,wedding_id,album_id,original_key,filename,declared_type,expected_bytes,reserved_bytes) values($1,$2,$3,$4,'metadata.png','image/png',1,0)`,[assetId,wedding.id,lastAlbum,'album-pages/'+wedding.id+'/'+assetId+'/original']);
  const library=await media.list(owner,wedding.id);assert.equal(library.albums.length,100);assert.ok(library.nextAlbumCursor);assert.ok(library.assets.some(a=>a.id===assetId));assert.ok(!library.albums.some(a=>a.id===lastAlbum));
  const token=credential();await store.invite(owner,wedding.id,{email:planner.email,role:'planner',eventIds:[],albumIds:all.map(a=>a.id)},hash(token),'synthetic');await store.acceptInvite(planner,hash(token));
  assert.equal((await media.listAlbums(planner,wedding.id,first.nextCursor!)).albums.length,100);await store.pool.query('delete from std_member_albums where wedding_id=$1 and user_id=$2 and album_id=$3',[wedding.id,planner.userId,lastAlbum]);assert.ok(!(await media.listAlbums(planner,wedding.id,second.nextCursor!)).albums.some(a=>a.id===lastAlbum));assert.ok(!(await media.list(planner,wedding.id)).assets.some(a=>a.id===assetId));
  await assert.rejects(media.listAlbums(foreign,wedding.id,first.nextCursor!),{code:'NOT_FOUND'});await assert.rejects(media.listAlbums(owner,wedding.id,'invalid'),{code:'INVALID_CURSOR'});await store.removeMember(owner,wedding.id,planner.userId);await assert.rejects(media.listAlbums(planner,wedding.id,first.nextCursor!),{code:'NOT_FOUND'});
 }finally{await store.close();await rm(root,{recursive:true,force:true});}
});
