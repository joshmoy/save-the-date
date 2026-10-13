import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp,readFile,readdir,rm } from 'node:fs/promises';
import { PostgresStore,PostgresJobs } from '@save-the-date/persistence';
import { credential,credentialHash,hashPassword,checkPassword,CaptureEmail,FilesystemStorage,storageKey } from '@save-the-date/adapters';
import { weddingSchema,eventSchema,inviteSchema } from '@save-the-date/contracts';
import { type Actor, DomainError } from '@save-the-date/domain';
import { createServer } from '../apps/api/src/server.js';
import { loadConfig } from '@save-the-date/config';

const connection=process.env.TEST_DB_CONNECTION;
if(!connection||!['127.0.0.1','localhost'].includes(new URL(connection).hostname)||!new URL(connection).pathname.endsWith('_test'))throw new Error('Set TEST_DB_CONNECTION to an isolated localhost database ending in _test');
const store=new PostgresStore(connection),key='test-key-'.repeat(8),hash=(v:string)=>credentialHash(v,key);
const prefix=randomUUID();let owner:Actor,other:Actor,partner:Actor,planner:Actor,security:Actor,weddingId:string,secondId:string,eventId:string;
const identityTokens=new Map<string,string>();
async function user(name:string,verified=true){const email=`${prefix}-${name}@example.test`,token=credential(),secret=credential();await store.register(email,await hashPassword('correct horse battery staple'),hash(token));identityTokens.set(email,token);if(verified)await store.verify(hash(token));const actor=await store.login(email,h=>checkPassword('correct horse battery staple',h),hash(secret));assert.ok(actor);return {...actor,secret};}
const weddingInput=(slug:string)=>weddingSchema.parse({displayNames:'Adéola & Joshua',slug,timezone:'Africa/Lagos'});
before(async()=>{await store.migrate(new URL('../packages/persistence/migrations/',import.meta.url).pathname);owner=await user('owner');other=await user('other');partner=await user('partner');planner=await user('planner');security=await user('security');});
after(async()=>{await store.close();});

test('W01: verified creation, two separate weddings and concealed foreign tenant',async()=>{
 const unverified=await user('unverified',false);await assert.rejects(store.createWedding(unverified,weddingInput('unverified-'+prefix)),(e:DomainError)=>e.code==='VERIFY_EMAIL');
 const a=await store.createWedding(owner,{...weddingInput('a-'+prefix),primaryDate:'2026-08-01'}),b=await store.createWedding(owner,weddingInput('b-'+prefix));weddingId=a.id;secondId=b.id;
 assert.equal(a.site_visibility,'shared');assert.equal(a.primary_date,'2026-08-01');assert.equal((await store.listWeddings(owner)).weddings.length,2);
 await assert.rejects(store.readWedding(other,a.id),(e:DomainError)=>e.status===404);
 await assert.rejects(store.createWedding(other,weddingInput(a.slug)),(e:DomainError)=>e.status===409);
 for(const slug of ['api','UPPER','a','invalid--path'])assert.equal(weddingSchema.safeParse({...weddingInput('valid-path'),slug}).success,false);
});
test('identity: verification renewal expires old links and resists replay',async()=>{
 const u=await user('renew',false),token=credential();await store.resendVerification(u.email,hash(token),'safe test link');await assert.rejects(store.verify(hash(identityTokens.get(u.email)!)));await store.verify(hash(token));await assert.rejects(store.verify(hash(token)));
});
test('W02: five events, foreign event updates rejected, optimistic conflicts',async()=>{
 for(let i=0;i<5;i++){const e=await store.saveEvent(owner,weddingId,eventSchema.parse({title:'Ceremony '+i,type:'custom',timezone:'Africa/Lagos'}));if(i===0)eventId=e.id;}
 assert.equal((await store.listEvents(owner,weddingId)).length,5);assert.equal((await store.listEvents(owner,secondId)).length,0);
 await assert.rejects(store.saveEvent(owner,secondId,eventSchema.parse({title:'Foreign',type:'civil',timezone:'Africa/Lagos'}),eventId,1),(e:DomainError)=>e.status===404);
 const event=eventSchema.parse({title:'Updated',type:'custom',timezone:'America/New_York',startsAt:'2027-11-07T01:30:00-04:00'});
 await store.saveEvent(owner,weddingId,event,eventId,1);await assert.rejects(store.saveEvent(owner,weddingId,event,eventId,1),(e:DomainError)=>e.code==='VERSION_CONFLICT');
 assert.equal(eventSchema.safeParse({...event,endsAt:'2027-11-07T01:00:00-04:00'}).success,false);
 assert.equal(inviteSchema.safeParse({email:'a@example.test',role:'security'}).success,false);
});
test('W02: simultaneous draft saves commit one revision',async()=>{
 const e=await store.saveEvent(owner,weddingId,eventSchema.parse({title:'Version race',type:'custom',timezone:'UTC'}));const results=await Promise.allSettled(Array.from({length:12},()=>store.saveEvent(owner,weddingId,eventSchema.parse({title:'Concurrent edit',type:'custom',timezone:'UTC'}),e.id,e.version)));assert.equal(results.filter(r=>r.status==='fulfilled').length,1);for(const r of results)if(r.status==='rejected')assert.equal(r.reason.code,'VERSION_CONFLICT');
});
test('W01/W02: invite is addressed, single-use, expiring and event-scoped',async()=>{
 const token=credential();await store.invite(owner,weddingId,{email:partner.email,role:'co_owner',eventIds:[],albumIds:[]},hash(token),'local link');
 await assert.rejects(store.acceptInvite(other,hash(token)),(e:DomainError)=>e.code==='INVALID_LINK');
 assert.equal((await store.listWeddings(partner)).weddings.length,0);await store.acceptInvite(partner,hash(token));assert.equal((await store.listWeddings(partner)).weddings.length,1);
 await assert.rejects(store.acceptInvite(partner,hash(token)));
 const p=credential();await store.invite(owner,weddingId,{email:planner.email,role:'planner',eventIds:[],albumIds:[]},hash(p),'local link');await store.acceptInvite(planner,hash(p));
 await assert.rejects(store.invite(planner,weddingId,{email:other.email,role:'co_owner',eventIds:[],albumIds:[]},hash(credential()),'local link'),(e:DomainError)=>e.status===404);
 const s=credential();await store.invite(owner,weddingId,{email:security.email,role:'security',eventIds:[eventId],albumIds:[]},hash(s),'local link');await store.acceptInvite(security,hash(s));assert.equal((await store.listEvents(security,weddingId)).length,1);
 await assert.rejects(store.readWedding(security,weddingId),(e:DomainError)=>e.status===404);
 const expired=credential();await store.invite(owner,weddingId,{email:other.email,role:'planner',eventIds:[],albumIds:[]},hash(expired),'local link');await store.pool.query("update std_member_invites set expires_at=now()-interval '1 second' where token_hash=$1",[hash(expired)]);await assert.rejects(store.acceptInvite(other,hash(expired)));
 const revoked=credential(),inv=await store.invite(owner,weddingId,{email:other.email,role:'planner',eventIds:[],albumIds:[]},hash(revoked),'local link');await store.revokeInvite(owner,weddingId,inv.id);await assert.rejects(store.acceptInvite(other,hash(revoked)));
 await assert.rejects(store.invite(owner,weddingId,{email:other.email,role:'security',eventIds:[randomUUID()],albumIds:[]},hash(credential()),'local link'));
});
test('W03/W04: lifecycle, removal and ownership/recovery protections',async()=>{
 const w=await store.readWedding(owner,weddingId);await assert.rejects(store.patchWedding(planner,weddingId,{expectedVersion:w.version,lifecycle:'memories'}));
 const changed=await store.patchWedding(owner,weddingId,{expectedVersion:w.version,lifecycle:'memories'});assert.equal(changed.slug,w.slug);await assert.rejects(store.patchWedding(owner,weddingId,{expectedVersion:w.version,displayNames:'Stale'}),(e:DomainError)=>e.code==='VERSION_CONFLICT');
 await store.removeMember(owner,weddingId,security.userId);await assert.rejects(store.listEvents(security,weddingId));
 await assert.rejects(store.transfer({...owner,reauthenticatedAt:new Date(0)},weddingId,partner.userId),(e:DomainError)=>e.code==='REAUTH_REQUIRED');
 await assert.rejects(store.transfer(owner,weddingId,planner.userId));await assert.rejects(store.deleteWedding(partner,weddingId));
 await store.transfer(owner,weddingId,partner.userId);assert.equal((await store.readWedding(partner,weddingId)).primary_owner_id,partner.userId);await assert.rejects(store.deleteWedding(owner,weddingId));
 await store.deleteWedding(partner,weddingId);await assert.rejects(store.readWedding(partner,weddingId));await assert.rejects(store.recoverWedding(other,weddingId));await store.recoverWedding(partner,weddingId);assert.equal((await store.readWedding(partner,weddingId)).slug,w.slug);
});
test('W04: deleted workspace leaves a restore tombstone and cancels outstanding work',async()=>{
 const w=await store.createWedding(owner,weddingInput('deleted-'+prefix));await store.deleteWedding(owner,w.id);const t=await store.pool.query('select * from std_deletion_tombstones where wedding_id=$1',[w.id]);assert.equal(t.rowCount,1);assert.ok(t.rows[0].erase_after>t.rows[0].requested_at);await assert.rejects(store.tenant(owner,w.id));
});
test('identity recovery: one-use tokens and revocation of every prior session',async()=>{
 const u=await user('recovery'),reset=credential();await store.recover(u.email,hash(reset));await store.reset(hash(reset),await hashPassword('a new sufficiently long password'));
 assert.equal(await store.authenticate(hash(u.secret)),null);assert.equal(await store.login(u.email,h=>checkPassword('correct horse battery staple',h),hash(credential())),null);
 assert.ok(await store.login(u.email,h=>checkPassword('a new sufficiently long password',h),hash(credential())));await assert.rejects(store.reset(hash(reset),await hashPassword('another sufficiently long password')));
 await assert.rejects(store.verify(hash(identityTokens.get(u.email)!)));
});
test('durable email jobs: concurrent leases, capture dedupe and uncertainty',async()=>{
 const folder=await mkdtemp('/tmp/std-email-test-'),capture=new CaptureEmail(folder),jobs=new PostgresJobs(store);
 try{for(let i=0;i<12;i++)await store.transaction(tx=>store.email(tx,'synthetic@example.test','fixture '+i,'safe test fixture'));await Promise.all(Array.from({length:12},(_,i)=>jobs.processOne('worker-'+i,capture)));while(await jobs.processOne('drain',capture)){ /* drain durable fixtures */ }const files=await readdir(folder);assert.ok(files.length>=12);let fixtures=0;for(const f of files){const m=JSON.parse(await readFile(folder+'/'+f,'utf8'));if(m.subject.startsWith('fixture '))fixtures++;await capture.send(m);}assert.equal(fixtures,12);assert.equal((await readdir(folder)).length,files.length);
 await store.transaction(tx=>store.email(tx,'synthetic@example.test','uncertainty test','test'));
 await jobs.processOne('uncertain',{capabilities:{idempotent:false,deliveryEvents:false},async send(){throw new Error('UNCERTAIN_SEND');}});
 const uncertain=await store.pool.query("select j.state,m.state as delivery from std_jobs j join std_email_messages m on m.id=(j.payload->>'id')::uuid where m.subject='uncertainty test'");assert.deepEqual(uncertain.rows[0],{state:'unknown_external',delivery:'unknown'});
 }finally{await rm(folder,{recursive:true,force:true});}
});
test('storage: private filesystem, checksum, path rejection and deletion',async()=>{
 const root=await mkdtemp('/tmp/std-storage-test-'),storage=new FilesystemStorage(root),object=storageKey('weddings',weddingId,randomUUID());try{await storage.write(object,Buffer.from('synthetic media'),'text/plain');assert.equal((await storage.inspect(object)).bytes,15);assert.equal((await storage.read(object)).toString(),'synthetic media');await assert.rejects(storage.read('../escape'));await storage.delete(object);await assert.rejects(storage.read(object));}finally{await rm(root,{recursive:true,force:true});}
});
test('HTTP API: secure session cookie, CSRF/origin, invalid schemas, tenant errors',async()=>{
 const config=loadConfig(),{app,store:apiStore}=await createServer(config);await app.listen(0,'127.0.0.1');const base=await app.getUrl();
 async function call(path:string,method='GET',body?:unknown,cookie?:string,origin=config.PUBLIC_ORIGIN,csrf='1'){return fetch(base+'/api/v1/'+path,{method,headers:{'Content-Type':'application/json',Origin:origin,'x-std-csrf':csrf,...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});}
 try{assert.equal((await call('health')).status,200);assert.equal((await call('identity/login','POST',{email:other.email,password:'correct horse battery staple'},undefined,'https://evil.test')).status,403);assert.equal((await call('identity/login','POST',{email:other.email,password:'correct horse battery staple'},undefined,config.PUBLIC_ORIGIN,'')).status,403);
 const login=await call('identity/login','POST',{email:other.email,password:'correct horse battery staple'});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie')!;assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);assert.equal((await call('weddings/'+weddingId,'GET',undefined,cookie)).status,404);
 assert.equal((await call('weddings','POST',{displayNames:'x'},cookie)).status,400);assert.equal((await call('identity/logout','POST',{},cookie)).status,200);assert.equal((await call('identity/session','GET',undefined,cookie)).status,401);
 }finally{await app.close();await apiStore.close();}
});
