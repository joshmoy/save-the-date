import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {PostgresStore,PostgresPublication} from '@save-the-date/persistence';
import {weddingSchema,postSchema} from '@save-the-date/contracts';
import {updates} from '../apps/web/src/data/updates.js';
import {mediaCategories} from '../apps/web/src/data/mediaCategories.js';

test('legacy content seed is tenant-owned, private, restartable and preserves owner edits',async()=>{
 const connection=process.env.TEST_DB_CONNECTION;assert.ok(connection);
 const endpoint=new URL(connection);assert.ok(['localhost','127.0.0.1'].includes(endpoint.hostname)&&endpoint.pathname.endsWith('_test'));
 const store=new PostgresStore(connection),prefix=randomUUID(),email='legacy-content-'+prefix+'@example.test';
 const source={schemaVersion:1,couple:'Adeola & Joshua',historicalDate:'2026-08-01',posts:updates,albums:mediaCategories,exceptions:['External references require reviewed asset import']};
 const checksum=createHash('sha256').update(JSON.stringify(source)).digest('hex'),input=weddingSchema.parse({displayNames:source.couple,slug:'legacy-'+prefix,timezone:'Africa/Lagos',primaryDate:source.historicalDate});
 try{
  await store.register(email,'synthetic password hash','verify-'+prefix);
  await assert.rejects(store.importLegacy(email,input,source,checksum),/verified platform/);
  await store.verify('verify-'+prefix);const owner=await store.login(email,async()=>true,'session-'+prefix);assert.ok(owner);
  await assert.rejects(store.importLegacy(email,input,source,'0'.repeat(64)),/checksum/);
  const ids=await Promise.all([store.importLegacy(email,input,source,checksum),store.importLegacy(email,input,source,checksum)]);assert.equal(ids[0],ids[1]);
  const weddingId=ids[0],posts=(await store.pool.query('select * from std_posts where wedding_id=$1 order by slug',[weddingId])).rows,albums=(await store.pool.query('select * from std_albums where wedding_id=$1 order by position',[weddingId])).rows;
  assert.equal(posts.length,updates.length);assert.equal(albums.length,mediaCategories.length);
  assert.ok(posts.every(post=>post.published===null&&post.published_at===null&&post.draft.coverAssetId===null&&post.draft.attachments.length===0));
  assert.ok(albums.every(album=>album.visibility==='private'&&!album.published&&!album.guest_uploads));
  assert.deepEqual(albums.map(album=>album.title),mediaCategories.map(album=>album.title));
  const publication=new PostgresPublication(store),post=posts[0];
  await publication.savePost(owner,weddingId,postSchema.parse({...post.draft,title:'Owner reviewed wording'}),post.version,post.id);
  await store.importLegacy(email,input,source,checksum);
  assert.equal((await store.pool.query('select draft from std_posts where id=$1',[post.id])).rows[0].draft.title,'Owner reviewed wording');
  assert.equal((await store.pool.query('select count(*) from std_active_publications where wedding_id=$1',[weddingId])).rows[0].count,'0');
  assert.equal((await store.pool.query('select count(*) from std_media_assets where wedding_id=$1',[weddingId])).rows[0].count,'0');
  assert.equal((await store.readWedding(owner,weddingId)).primary_date,'2026-08-01');
  const other='legacy-other-'+prefix+'@example.test';await store.register(other,'synthetic','other-'+prefix);await store.verify('other-'+prefix);
  await assert.rejects(store.importLegacy(other,input,source,checksum),/different ownership/);
 }finally{await store.close();}
});
