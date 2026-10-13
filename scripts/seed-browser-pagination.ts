import 'dotenv/config';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {loadConfig} from '@save-the-date/config';
import {PostgresStore,PostgresMedia,PostgresPublication,PostgresGuests,PostgresInvitations,PostgresJobs} from '@save-the-date/persistence';
import {createStorage,credentialHash,NativeMediaProcessor,ClamdMalwareScanner,BrowserInvitationRenderer,templateFontDirectory,type Job} from '@save-the-date/adapters';
import {weddingSchema,eventSchema,guestSchema,siteConfigSchema,postSchema,uploadIntentSchema} from '@save-the-date/contracts';
import {designSchema} from '@save-the-date/templates';
import type {Actor} from '@save-the-date/domain';

// Add one new synthetic workspace only; never change the fixture account, grants,
// existing weddings or production data. Historical failed/expired rows are explicitly
// metadata fixtures, not invented completed exports, issued credentials or AI results.
const config=loadConfig(),url=new URL(config.DB_CONNECTION),ownerEmail=process.env.PAGINATION_OWNER_EMAIL??'browser-fixture@example.test';
if(config.NODE_ENV==='production'||!['localhost','127.0.0.1'].includes(url.hostname)||!url.pathname.endsWith('_test')||!ownerEmail.endsWith('@example.test'))throw Error('Requires local _test database and an existing example.test verification account');
const store=new PostgresStore(config.DB_CONNECTION),storage=createStorage(config),media=new PostgresMedia(store,storage,config.STORAGE_NAMESPACE),publication=new PostgresPublication(store),guests=new PostgresGuests(store,v=>credentialHash(v,config.TOKEN_HASH_KEYS),config.PUBLIC_ORIGIN),invitations=new PostgresInvitations(store,storage,config.STORAGE_NAMESPACE,config.PUBLIC_ORIGIN),transport=new PostgresJobs(store),require=createRequire(new URL('../apps/web/package.json',import.meta.url)),sharp=require('sharp'),prefix=randomUUID().slice(0,8),slug='browser-pages-'+prefix;
async function processJobs(wid:string,type:string,handler:(job:Job)=>Promise<unknown>){const rows=await store.pool.query("select id from std_jobs where wedding_id=$1 and type=$2 and state='pending' order by created_at,id",[wid,type]);for(const {id} of rows.rows){const leaseOwner=randomUUID(),row=(await store.pool.query("update std_jobs set state='leased',lease_owner=$2,lease_until=now()+interval '5 minutes' where id=$1 and wedding_id=$3 and state='pending' returning *",[id,leaseOwner,wid])).rows[0];assert.ok(row);const job:Job={id,weddingId:wid,type,payload:row.payload,attempts:1,leaseOwner,requestedBy:row.requested_by};await transport.ack(job,await handler(job));}}
async function renderAndVerify(wid:string,exportId:string,actor:Actor){const renderer=new BrowserInvitationRenderer(process.env.TEST_INVITATION_BROWSER_PATH??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',templateFontDirectory);await processJobs(wid,'invitation-export',job=>invitations.process(job,renderer));const jpeg=await invitations.download(actor,wid,exportId,'jpeg'),pdf=await invitations.download(actor,wid,exportId,'pdf'),metadata=await sharp(jpeg.bytes).metadata(),PDFDocument=require('pdf-lib').PDFDocument,document=await PDFDocument.load(pdf.bytes);assert.equal(metadata.width,1500);assert.equal(metadata.height,2100);assert.equal(document.getPageCount(),1);assert.equal(document.getPage(0).getWidth(),360);assert.equal(document.getPage(0).getHeight(),504);}
try{
 await store.migrate('packages/persistence/migrations');
 const user=(await store.pool.query('select id,email from std_users where email=$1 and verified_at is not null and deleted_at is null',[ownerEmail])).rows[0];assert.ok(user,'Existing verified synthetic browser account required');
 const actor:Actor={userId:user.id,sessionId:randomUUID(),email:user.email,verified:true,reauthenticatedAt:new Date(0)};
 if(process.env.PAGINATION_REPAIR_WEDDING_ID){const wid=process.env.PAGINATION_REPAIR_WEDDING_ID,fixture=(await store.pool.query("select id from std_weddings where id=$1 and primary_owner_id=$2 and slug like 'browser-pages-%' and display_names='Pagination verification couple'",[wid,actor.userId])).rows[0];assert.ok(fixture,'Only this owned synthetic fixture may be repaired');const exports=(await store.pool.query("select distinct e.id from std_invitation_exports e join std_invitation_files f on f.export_id=e.id where e.wedding_id=$1 and f.state in ('queued','processing')",[wid])).rows;assert.equal(exports.length,1);await renderAndVerify(wid,exports[0].id,actor);console.log(JSON.stringify({weddingId:wid,realInvitationExport:exports[0].id,verified:'actual 1500x2100 JPEG and 360x504 one-page PDF'}));
 }else{
 const wedding=await store.createWedding(actor,weddingSchema.parse({displayNames:'Pagination verification couple',slug,timezone:'UTC',palette:{background:'#F4F7FA',primary:'#243449',secondary:'#2F567C',accent:'#B8C9DA'}})),wid=wedding.id,event=await store.saveEvent(actor,wid,eventSchema.parse({title:'Synthetic reception',type:'reception',timezone:'UTC',startsAt:'2027-08-14T14:00:00Z',endsAt:'2027-08-14T18:00:00Z',venue:'Synthetic Harbour House',visibility:'public',admissionPolicy:'owner',capacity:1000})),albums=[];
 const scanner=new ClamdMalwareScanner('127.0.0.1',Number(process.env.PAGINATION_CLAMD_PORT??53310)),processor=new NativeMediaProcessor();
 for(let i=0;i<11;i++){
  let album=await media.saveAlbum(actor,wid,{title:'Verification album '+String(i).padStart(2,'0'),description:'Synthetic colour studies for browser pagination checks.',position:i,visibility:'inherit',published:false,coverAssetId:null,guestUploads:false},0);albums.push(album.id);
  for(let j=0;j<(i===0?9:1);j++){
   const bytes=await sharp({create:{width:720,height:480,channels:3,background:['#2F567C','#B8C9DA','#243449'][j%3]}}).png().toBuffer(),intent=await media.intent(actor,wid,uploadIntentSchema.parse({albumId:album.id,filename:'verification-'+i+'-'+j+'.png',contentType:'image/png',bytes:bytes.length,alt:'Synthetic colour study '+i+' '+j,consent:true}));
   await media.receive(actor,wid,intent.id,bytes);await processJobs(wid,'media',job=>media.process(job,processor,scanner));const asset=(await media.list(actor,wid)).assets.find(a=>a.id===intent.id);assert.ok(asset);assert.equal(asset.processing,'ready');await media.edit(actor,wid,intent.id,{expectedVersion:asset.version,alt:'Synthetic colour study '+i+' '+j,caption:'Processed and safety-scanned verification image.',position:j,moderation:'approved'});
  }
  album=await media.saveAlbum(actor,wid,{title:album.title,description:album.description,position:i,visibility:'inherit',published:true,coverAssetId:null,guestUploads:false},album.version,album.id);
 }
 const draft=await publication.saveSite(actor,wid,siteConfigSchema.parse({theme:'modern',fontPair:'sans',visibility:'public',welcome:'A synthetic celebration for verification.',story:'This separate test workspace verifies navigation across multiple pages.'}),0);await publication.publish(actor,wid,draft.version,(await store.readWedding(actor,wid)).version);
 for(let i=0;i<105;i++){const post=await publication.savePost(actor,wid,postSchema.parse({title:'Verification update '+String(i).padStart(3,'0'),slug:'update-'+i,excerpt:'A synthetic journal entry for pagination verification.',body:[{type:'paragraph',text:'Published content in a separate verification workspace.'}]}),0);if(i<25)await publication.publishPost(actor,wid,post.id,post.version,true);}
 for(let i=0;i<205;i++)await guests.save(actor,wid,guestSchema.parse({name:'Verification guest '+String(i).padStart(3,'0'),household:'Verification household '+String(i).padStart(3,'0'),group:'Synthetic fixtures',eventIds:[event.id],plusOnes:i===204?1:0}),0);
 await store.transaction(async tx=>{
  await tx.query("insert into std_rsvps(wedding_id,attendee_id,event_id,state) select wedding_id,attendee_id,event_id,'confirmed' from std_attendee_events where wedding_id=$1",[wid]);
  await tx.query('insert into std_reservations(wedding_id,attendee_id,event_id) select wedding_id,attendee_id,event_id from std_attendee_events where wedding_id=$1',[wid]);
  await tx.query('update std_events set confirmed_count=206 where wedding_id=$1 and id=$2',[wid,event.id]);
  await tx.query("insert into std_passes(id,wedding_id,attendee_id,event_id,status,issued_at,revoked_reason) select gen_random_uuid(),wedding_id,id,$2,'revoked','2020-01-01','Historical pagination metadata; no credential issued' from std_attendees where wedding_id=$1 and plus_one_of is null",[wid,event.id]);
  await tx.query("insert into std_upload_grants(id,wedding_id,event_id,album_id,token_hash,code_hash,expires_at,revoked_at,created_by,created_at) select gen_random_uuid(),$1::uuid,$2,$3,$1::text||':fixture-token:'||n,$1::text||':fixture-code:'||n,'2020-01-01','2020-01-01',$4,'2020-01-01' from generate_series(1,105) n",[wid,event.id,albums[0],actor.userId]);
  await tx.query("insert into std_access_requests(id,wedding_id,name,email,note,state,created_at) select gen_random_uuid(),$1,'Verification visitor '||n,$2||n||'@example.test','Synthetic pending-request metadata','pending','2020-01-01' from generate_series(1,105) n",[wid,prefix]);
 });
 const design=designSchema.parse({templateId:'modern-minimal',eventIds:[event.id]}),saved=await invitations.save(actor,wid,'Verification invitation',design,0),queued=await invitations.queue(actor,wid,saved.id,saved.version,await invitations.preview(actor,wid,design),randomUUID());
 await renderAndVerify(wid,queued.id,actor);
 await store.pool.query("insert into std_invitation_exports(id,wedding_id,design_id,design_version,snapshot,requested_by,created_at) select gen_random_uuid(),wedding_id,design_id,design_version,snapshot,requested_by,'2020-01-01' from std_invitation_exports cross join generate_series(1,104) where id=$1",[queued.id]);
 await store.pool.query("insert into std_invitation_files(export_id,format,state,error_code) select id,'jpeg','failed','VERIFICATION_METADATA' from std_invitation_exports where wedding_id=$1 and id<>$2",[wid,queued.id]);
 console.log(JSON.stringify({weddingId:wid,slug,website:config.PUBLIC_ORIGIN+'/w/'+slug,processedApprovedMedia:19,publishedPosts:25,totalDrafts:105,households:205,pendingRequests:105,realInvitationExport:queued.id,historicalMetadata:'104 failed exports,205 revoked credential-free pass rows,105 expired/revoked upload grants',realGuestEmails:0,paidAI:0}));
 }
}finally{await store.close();}
