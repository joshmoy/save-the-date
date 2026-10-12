import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {PostgresStore,PostgresMedia,PostgresPublication} from '@save-the-date/persistence';
import {FilesystemStorage,NativeMediaProcessor,credential,credentialHash,type Job} from '@save-the-date/adapters';
import {weddingSchema,albumSchema,uploadIntentSchema,siteConfigSchema} from '@save-the-date/contracts';
import {type Actor,DomainError} from '@save-the-date/domain';
import {loadConfig} from '@save-the-date/config';
import {createServer} from '../apps/api/src/server.js';
const connection=process.env.TEST_DB_CONNECTION;
if(!connection||!['127.0.0.1','localhost'].includes(new URL(connection).hostname)||!new URL(connection).pathname.endsWith('_test'))throw Error('Media tests require an isolated local _test database');
const store=new PostgresStore(connection),publication=new PostgresPublication(store),processor=new NativeMediaProcessor(),require=createRequire(new URL('../packages/adapters/package.json',import.meta.url));
let root:string,storage:FilesystemStorage,media:PostgresMedia,owner:Actor,other:Actor,planner:Actor,weddingId:string,foreignId:string,albumId:string,png:Buffer;
const prefix=randomUUID(),hash=(v:string)=>credentialHash(v,'test-media-key'.repeat(4));
async function user(label:string){const token=credential(),email=prefix+'-'+label+'@example.test';await store.register(email,'synthetic-test-hash',hash(token));await store.verify(hash(token));const actor=await store.login(email,async()=>true,hash(credential()));assert.ok(actor);return actor;}
before(async()=>{await store.migrate(new URL('../packages/persistence/migrations',import.meta.url).pathname);root=await mkdtemp(tmpdir()+'/std-media-test-');storage=new FilesystemStorage(root);media=new PostgresMedia(store,storage,'tests',8*1024**2);owner=await user('owner');other=await user('other');planner=await user('planner');weddingId=(await store.createWedding(owner,weddingSchema.parse({slug:'media-'+prefix,displayNames:'Media test',timezone:'UTC'}))).id;foreignId=(await store.createWedding(other,weddingSchema.parse({slug:'foreign-'+prefix,displayNames:'Foreign test',timezone:'UTC'}))).id;albumId=(await media.saveAlbum(owner,weddingId,albumSchema.parse({title:'Private memories'}),0)).id;const token=credential();await store.invite(owner,weddingId,{email:planner.email,role:'planner',eventIds:[],albumIds:[albumId]},hash(token),'synthetic');await store.acceptInvite(planner,hash(token));png=await require('sharp')({create:{width:64,height:48,channels:3,background:'#2F567C'}}).png().toBuffer();});
after(async()=>{await store.close();await rm(root,{recursive:true,force:true});});
const input=(bytes=png.length)=>uploadIntentSchema.parse({albumId,filename:'memory.png',contentType:'image/png',bytes,alt:'A synthetic blue image',consent:true});
async function job(id:string,type='media'):Promise<Job>{const owner=randomUUID();const r=await store.pool.query("update std_jobs set state='leased',lease_owner=$2,lease_until=now()+interval '5 minutes' where dedupe_key=$1 returning *",[type+':'+id,owner]);assert.equal(r.rowCount,1);const j=r.rows[0];return {id:j.id,weddingId:j.wedding_id,type:j.type,payload:j.payload,attempts:1,leaseOwner:owner};}
test('M01/M02 private image processing, metadata, quota and publication boundaries',async()=>{
 const intent=await media.intent(owner,weddingId,input());await media.receive(owner,weddingId,intent.id,png);await media.process(await job(intent.id),processor);
 const listing=await media.list(owner,weddingId),asset=listing.assets.find(a=>a.id===intent.id);assert.equal(asset.processing,'ready');assert.equal(asset.moderation,'approved');assert.equal(Number(listing.usage.reserved_bytes),0);assert.ok(Number(listing.usage.stored_bytes)>png.length);
 assert.equal((await media.read(owner,weddingId,intent.id)).contentType,'image/webp');assert.deepEqual((await media.read(owner,weddingId,intent.id,true)).bytes,png);await assert.rejects(media.read(other,weddingId,intent.id));await assert.rejects(media.read(owner,foreignId,intent.id));
 const site=siteConfigSchema.parse({visibility:'public',heroAssetId:intent.id});await publication.saveSite(owner,weddingId,site,0);const wedding=await store.readWedding(owner,weddingId);await assert.rejects(publication.publish(owner,weddingId,1,wedding.version),(e:DomainError)=>e.code==='MEDIA_PRIVATE');
 const album=listing.albums.find(a=>a.id===albumId);await media.saveAlbum(owner,weddingId,albumSchema.parse({title:album.title,visibility:'inherit',published:true}),album.version,albumId);await publication.publish(owner,weddingId,1,wedding.version);assert.equal((await media.readPublic('media-'+prefix,intent.id,{})).contentType,'image/webp');
 await assert.rejects(media.readPublic('media-'+prefix,intent.id,{archived:true}));
 await assert.rejects(media.remove(owner,weddingId,intent.id,asset.version,false),(e:DomainError)=>e.code==='PUBLISHED_REFERENCE');await media.remove(owner,weddingId,intent.id,asset.version,true);await assert.rejects(media.readPublic('media-'+prefix,intent.id,{}));await media.process(await job(intent.id,'media-delete'),processor);
 assert.equal(Number((await media.list(owner,weddingId)).usage.stored_bytes),0);
});
test('M02 concurrent reservations never exceed quota and expired uploads release it',async()=>{
 const outcomes=await Promise.allSettled(Array.from({length:5},()=>media.intent(owner,weddingId,input(2*1024**2))));assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,2);const usage=(await media.list(owner,weddingId)).usage;assert.equal(Number(usage.reserved_bytes),8*1024**2);
 for(const result of outcomes)if(result.status==='fulfilled')await store.pool.query("update std_media_assets set expires_at=now()-interval '1 second' where id=$1",[result.value.id]);await media.sweep();assert.equal(Number((await media.list(owner,weddingId)).usage.reserved_bytes),0);
});
test('M02 spoofed, corrupt and oversized input rejected without permanent quota',async()=>{
 await assert.rejects(media.intent(owner,weddingId,input(26*1024**2)),(e:DomainError)=>e.code==='FILE_TOO_LARGE');
 const intent=await media.intent(owner,weddingId,input(10));await media.receive(owner,weddingId,intent.id,Buffer.from('not a png!'));await assert.rejects(media.process(await job(intent.id),processor));const listing=await media.list(owner,weddingId);assert.equal(listing.assets.find(a=>a.id===intent.id).processing,'rejected');assert.equal(Number(listing.usage.reserved_bytes),0);assert.equal(Number(listing.usage.stored_bytes),0);
 await assert.rejects(processor.process(Buffer.from('<script>alert(1)</script>'),'image/jpeg'));
});
test('M04 planner uploads require approval and revoked membership stops worker output',async()=>{
 const intent=await media.intent(planner,weddingId,input());await media.receive(planner,weddingId,intent.id,png);await media.process(await job(intent.id),processor);let asset=(await media.list(owner,weddingId)).assets.find(a=>a.id===intent.id);assert.equal(asset.moderation,'pending');await assert.rejects(media.readPublic('media-'+prefix,intent.id,{}));await assert.rejects(media.edit(planner,weddingId,intent.id,{expectedVersion:asset.version,moderation:'approved'}));asset=await media.edit(owner,weddingId,intent.id,{expectedVersion:asset.version,moderation:'approved'});assert.equal((await media.readPublic('media-'+prefix,intent.id,{})).contentType,'image/webp');
 const pending=await media.intent(planner,weddingId,input());await media.receive(planner,weddingId,pending.id,png);const staleJob=await job(pending.id);await store.removeMember(owner,weddingId,planner.userId);await assert.rejects(media.process(staleJob,processor));assert.equal((await media.list(owner,weddingId)).assets.find(a=>a.id===pending.id).processing,'expired');
});
test('M02 duplicate upload completion has one winner and preserves its original',async()=>{
 const intent=await media.intent(owner,weddingId,input());const results=await Promise.allSettled([media.receive(owner,weddingId,intent.id,png),media.receive(owner,weddingId,intent.id,png)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);await media.process(await job(intent.id),processor);assert.deepEqual((await media.read(owner,weddingId,intent.id,true)).bytes,png);
});
test('M01 real MP4 processing produces playable derivative and poster',async()=>{
 const scratch=await mkdtemp(tmpdir()+'/std-video-test-');try{const filename=scratch+'/synthetic.mp4';await promisify(execFile)(require('ffmpeg-static'),['-nostdin','-v','error','-f','lavfi','-i','color=c=blue:s=64x48:d=1','-c:v','libx264','-threads','1','-y',filename],{timeout:15000});const output=await processor.process(await readFile(filename),'video/mp4');assert.equal(output.contentType,'video/mp4');assert.ok(output.duration&&output.duration<=2);assert.ok(output.poster?.length);assert.ok(output.display.length);}finally{await rm(scratch,{recursive:true,force:true});}
});
test('M01 actual phone HEIC converts in an isolated worker',{skip:!process.env.TEST_HEIC_FIXTURE},async()=>{
 const output=await processor.process(await readFile(process.env.TEST_HEIC_FIXTURE!),'image/heic');assert.equal(output.contentType,'image/webp');assert.ok(output.width>0&&output.width<=1800);assert.ok(output.height>0&&output.height<=1800);
});
test('M01 HTTP streaming upload and private binary access enforce session and size',async()=>{
 const token=credential();await store.login(owner.email,async()=>true,hash(token));const server=await createServer({...loadConfig(),DB_CONNECTION:connection!,TOKEN_HASH_KEYS:'test-media-key'.repeat(4),STORAGE_ROOT:root,STORAGE_ADAPTER:'filesystem',STORAGE_NAMESPACE:'tests'});await server.app.listen(0,'127.0.0.1');
 try{const origin='http://127.0.0.1:'+server.app.getHttpServer().address().port,base=origin+'/api/v1/weddings/'+weddingId+'/media',headers={'Cookie':'std_session='+token,'Origin':loadConfig().PUBLIC_ORIGIN,'x-std-csrf':'1','Content-Type':'application/json'};
  const response=await fetch(base+'/intents',{method:'POST',headers,body:JSON.stringify(input())});assert.equal(response.status,201);const intent=await response.json() as {id:string};
  assert.equal((await fetch(base+'/'+intent.id+'/bytes',{method:'PUT',headers:{...headers,'Content-Type':'application/octet-stream'},body:png})).status,202);
  assert.equal((await fetch(base+'/'+intent.id)).status,401);await media.process(await job(intent.id),processor);const read=await fetch(base+'/'+intent.id,{headers});assert.equal(read.status,200);assert.equal(read.headers.get('content-type'),'image/webp');assert.equal(read.headers.get('cache-control'),'no-store');
  const range=await fetch(base+'/'+intent.id,{headers:{...headers,Range:'bytes=0-9'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,10);
  const original=await fetch(base+'/'+intent.id+'/original',{headers});assert.deepEqual(Buffer.from(await original.arrayBuffer()),png);
 }finally{await server.app.close();await server.store.close();}
});
test('M04 contributor sees only assigned albums and cannot publish or read events',async()=>{
 const contributor=await user('contributor'),privateAlbum=await media.saveAlbum(owner,weddingId,albumSchema.parse({title:'Unassigned album'}),0),token=credential();
 await store.invite(owner,weddingId,{email:contributor.email,role:'media_contributor',eventIds:[],albumIds:[albumId]},hash(token),'synthetic');await store.acceptInvite(contributor,hash(token));
 assert.deepEqual((await media.list(contributor,weddingId)).albums.map(a=>a.id),[albumId]);await assert.rejects(store.listEvents(contributor,weddingId));await assert.rejects(media.intent(contributor,weddingId,{...input(),albumId:privateAlbum.id}));await assert.rejects(media.saveAlbum(contributor,weddingId,albumSchema.parse({title:'Published',visibility:'inherit',published:true}),1,albumId));
 await assert.rejects(store.invite(owner,weddingId,{email:other.email,role:'media_contributor',eventIds:[],albumIds:[randomUUID()]},hash(credential()),'synthetic'));
});
test('M02 public derivatives remove original metadata',async()=>{
 const sharp=require('sharp'),photo=await sharp({create:{width:32,height:32,channels:3,background:'#2F567C'}}).withExif({IFD0:{Artist:'Synthetic private author'}}).jpeg().toBuffer();assert.ok((await sharp(photo).metadata()).exif);const output=await processor.process(photo,'image/jpeg');assert.equal((await sharp(output.display).metadata()).exif,undefined);
});
test('M01 ordering, cover ownership and moving assets preserve album invariants',async()=>{
 const ids:string[]=[];for(let i=0;i<2;i++){const intent=await media.intent(owner,weddingId,input());await media.receive(owner,weddingId,intent.id,png);await media.process(await job(intent.id),processor);ids.push(intent.id);}
 let listing=await media.list(owner,weddingId);for(let i=0;i<2;i++){const asset=listing.assets.find(a=>a.id===ids[i]);await media.edit(owner,weddingId,ids[i],{expectedVersion:asset.version,position:2-i,caption:'Ordered '+i});}
 listing=await media.list(owner,weddingId);assert.deepEqual(listing.assets.filter(a=>ids.includes(a.id)).map(a=>a.id),[ids[1],ids[0]]);
 const album=listing.albums.find(a=>a.id===albumId);await media.saveAlbum(owner,weddingId,albumSchema.parse({title:album.title,visibility:'inherit',published:true,coverAssetId:ids[0]}),album.version,albumId);
 const target=await media.saveAlbum(owner,weddingId,albumSchema.parse({title:'Moved memories'}),0);const asset=(await media.list(owner,weddingId)).assets.find(a=>a.id===ids[0]);await media.edit(owner,weddingId,asset.id,{expectedVersion:asset.version,albumId:target.id});assert.equal((await media.list(owner,weddingId)).albums.find(a=>a.id===albumId).cover_asset_id,null);
 await assert.rejects(media.saveAlbum(owner,weddingId,albumSchema.parse({title:'Wrong cover',coverAssetId:ids[0]}),0));
});
