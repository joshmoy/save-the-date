import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {resolveWebsiteSurfaces} from '@save-the-date/templates/website';
import {contrastRatio} from '@save-the-date/domain';
import {PostgresStore,PostgresPublication} from '@save-the-date/persistence';
import {weddingSchema,siteConfigSchema} from '@save-the-date/contracts';

test('website surfaces preserve a valid palette while preventing tinted-hero contrast loss',()=>{
 const palette=Object.freeze({background:'#FFFFFF',primary:'#767676',accent:'#000000'});
 assert.ok(contrastRatio(palette.primary,palette.background)>=4.5);
 assert.ok(contrastRatio(palette.primary,'#EBEBEB')<4.5,'The previous fixed eight-percent tint was unreadable for normal text');
 const surface=resolveWebsiteSurfaces(palette,'garden');assert.equal(surface.heroBackground,'#FFFFFF');assert.equal(surface.tintPercent,0);
 assert.ok(contrastRatio(palette.primary,surface.heroBackground)>=4.5);
 const harbour={background:'#F4F7FA',primary:'#243449',accent:'#2F567C'};
 assert.equal(resolveWebsiteSurfaces(harbour,'garden').tintPercent,8);
 assert.equal(resolveWebsiteSurfaces(harbour,'modern').heroBackground,harbour.background);
 for(const background of ['#000000','#FFFFFF','#808080','#F4F7FA','#800020'])for(const accent of ['#000000','#FFFFFF','#FF0000','#00FF00','#0000FF']){
  const primary=contrastRatio('#000000',background)>contrastRatio('#FFFFFF',background)?'#000000':'#FFFFFF',resolved=resolveWebsiteSurfaces({background,primary,accent},'garden');
  assert.ok(contrastRatio(primary,resolved.heroBackground)>=4.5);
 }
});

test('publication captures resolved surfaces without changing owner colours or existing published information',async()=>{
 const connection=process.env.TEST_DB_CONNECTION;assert.ok(connection);const endpoint=new URL(connection);
 assert.ok(['localhost','127.0.0.1'].includes(endpoint.hostname)&&endpoint.pathname.endsWith('_test'));
 const store=new PostgresStore(connection),prefix=randomUUID(),email='surface-'+prefix+'@example.test';
 try{
  await store.register(email,'synthetic fixture','verify-'+prefix);await store.verify('verify-'+prefix);const owner=await store.login(email,async()=>true,'session-'+prefix);assert.ok(owner);
  const palette={background:'#FFFFFF',primary:'#767676',secondary:'#111111',accent:'#000000'},wedding=await store.createWedding(owner,weddingSchema.parse({displayNames:'Surface verification couple',slug:'surface-'+prefix,timezone:'UTC',palette})),publication=new PostgresPublication(store);
  const draft=await publication.saveSite(owner,wedding.id,siteConfigSchema.parse({theme:'garden',visibility:'public'}),0);
  await publication.publish(owner,wedding.id,draft.version,wedding.version);
  const published=await publication.publicSite(wedding.slug) as {palette:typeof palette;surfaces:ReturnType<typeof resolveWebsiteSurfaces>};
  assert.deepEqual(published.palette,palette);assert.equal(published.surfaces.heroBackground,'#FFFFFF');
  await store.patchWedding(owner,wedding.id,{expectedVersion:wedding.version,palette:{...palette,primary:'#000000'}});
  assert.deepEqual((await publication.publicSite(wedding.slug) as typeof published).surfaces,published.surfaces);
  assert.deepEqual((await publication.publicSite(wedding.slug) as typeof published).palette,palette);
 }finally{await store.close();}
});
