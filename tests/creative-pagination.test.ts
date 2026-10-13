import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {PostgresStore,PostgresCreative,PostgresMedia} from '@save-the-date/persistence';
import {FilesystemStorage,credential,credentialHash} from '@save-the-date/adapters';
import {weddingSchema,creativeContextSchema,conceptSchema} from '@save-the-date/contracts';

test('Creative concept/brief/reference pages include all ties once, preserve approval and recheck reference permissions',async()=>{
 const connection=process.env.TEST_DB_CONNECTION;
 if(!connection||!['localhost','127.0.0.1'].includes(new URL(connection).hostname)||!new URL(connection).pathname.endsWith('_test'))throw Error('Requires isolated local _test database');
 const root=await mkdtemp(tmpdir()+'/std-creative-pages-'),store=new PostgresStore(connection),storage=new FilesystemStorage(root),hash=(v:string)=>credentialHash(v,'creative-pagination-key'.repeat(3)),prefix=randomUUID();
 async function user(label:string){const email=prefix+label+'@example.test',token=credential();await store.register(email,'fixture',hash(token));await store.verify(hash(token));const actor=await store.login(email,async()=>true,hash(credential()));assert.ok(actor);return actor;}
 try{
  await store.migrate('packages/persistence/migrations');const owner=await user('owner'),foreign=await user('foreign'),planner=await user('planner'),wid=(await store.createWedding(owner,weddingSchema.parse({displayNames:'Creative pagination fixture',slug:'creative-pages-'+prefix,timezone:'UTC'}))).id,creative=new PostgresCreative(store,storage,'creative-pages',{conceptLimit:3,boardLimit:1,conceptCredits:1,boardCredits:5,conceptEstimate:0.1,boardEstimate:0.2,llmEnabled:false,imageEnabled:false,storageLimit:10*1024**3,publicOrigin:'https://example.test'});
  await creative.saveContext(owner,wid,creativeContextSchema.parse({}),0);let approved='';
  for(let i=0;i<205;i++){const concept=conceptSchema.parse({name:'Manual concept '+i,rationale:'Synthetic pagination proposal.',palette:{background:'#F4F7FA',primary:'#243449',secondary:'#2F567C',accent:'#B8C9DA'},typography:{websiteFontPair:'classic',invitationHeading:'Lora',notes:'Licensed font.'},eventNotes:[],decorDirections:[],requirements:[],exclusions:[],constraintChecks:[],assumptions:[],openQuestions:[],nextActions:[],board:[]}),saved=await creative.saveConcept(owner,wid,concept,1,0);if(i===0){approved=saved.id;await creative.approve(owner,wid,saved.id,1);}}
  await store.pool.query("update std_concepts set created_at='2026-10-13T00:00:00.123456Z' where wedding_id=$1",[wid]);
  const brief=await creative.exportBrief(owner,wid,approved,1,randomUUID());const exported=(await store.pool.query('select snapshot from std_planner_briefs where id=$1',[brief.id])).rows[0].snapshot.brief;assert.equal(exported.typographyLicences[1].font,'Source Serif 4');assert.equal(exported.typographyLicences[1].substitution,null);
  await store.pool.query("insert into std_planner_briefs(id,wedding_id,concept_id,revision,requested_by,snapshot,created_at) select gen_random_uuid(),wedding_id,concept_id,revision,requested_by,snapshot,'2026-10-13T00:00:00.123456Z' from std_planner_briefs cross join generate_series(1,204) where id=$1",[brief.id]);
  await store.pool.query("insert into std_planner_brief_files(brief_id,format,state,error_code) select id,'json','failed','VERIFICATION_METADATA' from std_planner_briefs where wedding_id=$1 and id<>$2",[wid,brief.id]);
  const media=new PostgresMedia(store,storage,'creative-pages'),album=await media.saveAlbum(owner,wid,{title:'Assigned reference metadata',description:'',position:0,visibility:'private',published:false,coverAssetId:null,guestUploads:false},0),hidden=await media.saveAlbum(owner,wid,{title:'Other private reference metadata',description:'',position:1,visibility:'private',published:false,coverAssetId:null,guestUploads:false},0);
  // Metadata-only fixtures verify authorised selection, not decoding/scanning/file access.
  for(const [aid,count] of [[album.id,205],[hidden.id,1]] as const)await store.pool.query("insert into std_media_assets(id,wedding_id,album_id,original_key,filename,declared_type,expected_bytes,reserved_bytes,created_by,content_type,processing,moderation,created_at) select gen_random_uuid(),$1::uuid,$2::uuid,'creative-pages/'||$1::text||'/'||gen_random_uuid(),'reference.png','image/png',1,0,$3,'image/png','ready','approved','2026-10-13T00:00:00.123456Z' from generate_series(1,$4::int)",[wid,aid,owner.userId,count]);
  const invite=credential();await store.invite(owner,wid,{email:planner.email,role:'planner',eventIds:[],albumIds:[album.id]},hash(invite),'synthetic');await store.acceptInvite(planner,hash(invite));
  for(const kind of ['concepts','briefs','references'] as const){const ids:string[]=[];let cursor:string|undefined;do{const page=await creative.listPage(kind==='references'?planner:owner,wid,kind,cursor);assert.ok(page.items.length<=100);ids.push(...page.items.map(row=>String(row.id)));if(kind==='references')assert.ok(page.items.every(row=>row.album_id===album.id));cursor=page.nextCursor??undefined;}while(cursor);assert.equal(ids.length,205);assert.equal(new Set(ids).size,205);}
  const conceptPage=await creative.listPage(owner,wid,'concepts'),referencePage=await creative.listPage(planner,wid,'references');await assert.rejects(creative.listPage(foreign,wid,'briefs'),{code:'NOT_FOUND'});await assert.rejects(creative.listPage(owner,wid,'briefs',conceptPage.nextCursor!),{code:'INVALID_CURSOR'});
  const approvedRow=(await store.pool.query('select current_revision,approved_revision,state from std_concepts where id=$1',[approved])).rows[0];assert.equal(approvedRow.current_revision,1);assert.equal(approvedRow.approved_revision,1);assert.equal(approvedRow.state,'approved');
  await store.removeMember(owner,wid,planner.userId);await assert.rejects(creative.listPage(planner,wid,'references',referencePage.nextCursor!),{code:'NOT_FOUND'});
 }finally{await store.close();await rm(root,{recursive:true,force:true});}
});
