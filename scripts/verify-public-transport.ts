import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {execFileSync,spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import {loadConfig} from '@save-the-date/config';
import {PostgresStore,PostgresPublication} from '@save-the-date/persistence';
import {siteConfigSchema,postSchema} from '@save-the-date/contracts';
import type {Actor} from '@save-the-date/domain';

loadConfig();const checkpoint=JSON.parse(await readFile(process.argv[2],'utf8')),connection=(await readFile(checkpoint.root+'/connection.txt','utf8')).trim(),url=new URL(connection);assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&/^std_navigation_[a-f0-9]{32}_test$/.test(url.pathname.slice(1)));
const root=await mkdtemp(tmpdir()+'/std-public-tls-'),store=new PostgresStore(connection),publication=new PostgresPublication(store),processes:ReturnType<typeof spawn>[]=[];
const webOrigin='http://127.0.0.1:3009',apiOrigin='https://localhost:4009',cert=root+'/cert.pem',key=root+'/key.pem';
async function stop(child:ReturnType<typeof spawn>){if(child.exitCode!==null)return;const ended=new Promise(resolve=>child.once('exit',resolve));child.kill('SIGTERM');await ended;}
async function ready(address:string){for(let attempt=0;attempt<60;attempt++){try{const response=await fetch(address,{signal:AbortSignal.timeout(1000)});if(response.status===200)return;}catch{/* The isolated web may still be starting. */}await new Promise(resolve=>setTimeout(resolve,250));}throw Error('Temporary web did not become ready');}
try{
 const wedding=await store.pool.query("select w.id,w.version,u.id as owner_id,u.email from std_weddings w join std_users u on u.id=w.primary_owner_id where w.id=$1 and w.slug='navigation-browser'",[checkpoint.weddingId]);assert.equal(wedding.rowCount,1);const row=wedding.rows[0],actor:Actor={userId:row.owner_id,email:row.email,verified:true,sessionId:randomUUID(),reauthenticatedAt:new Date(0)};
 const draft=await publication.site(actor,row.id),saved=await publication.saveSite(actor,row.id,siteConfigSchema.parse({...draft.config,visibility:'public',story:'Synthetic verified API transport.'}),draft.version);await publication.publish(actor,row.id,saved.version,row.version);
 const existing=(await store.pool.query("select id,version from std_posts where wedding_id=$1 and slug='tls-update' and deleted_at is null",[row.id])).rows[0];const post=await publication.savePost(actor,row.id,postSchema.parse({title:'TLS verified journal',slug:'tls-update',body:[{type:'paragraph',text:'Synthetic journal transport evidence.'}]}),existing?.version??0,existing?.id);await publication.publishPost(actor,row.id,post.id,post.version,true);
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','1','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost'],{stdio:'ignore'});
 const env={...process.env,NODE_ENV:'test',PLATFORM_RUNTIME_ENV:'test',DB_CONNECTION:connection,DATABASE_URL:'',PUBLIC_ORIGIN:webOrigin,API_INTERNAL_ORIGIN:apiOrigin,API_TLS_CERT_PATH:cert,API_TLS_KEY_PATH:key,OPERATOR_USER_IDS:'',EMAIL_ADAPTER:'disabled',LLM_ADAPTER:'disabled',IMAGE_ADAPTER:'disabled',STORAGE_ADAPTER:'filesystem',STORAGE_ROOT:root+'/storage',DELETION_LEDGER_ROOT:root+'/ledger'};
 const code="import {loadConfig} from '@save-the-date/config';import {createServer} from './apps/api/dist/server.js';const {app,store}=await createServer(loadConfig());await app.listen(4009,'::1');for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await app.close();await store.close();process.exit(0);});";
 const api=spawn(process.execPath,['--input-type=module','-e',code],{env,stdio:'ignore'});processes.push(api);
 for(const trusted of [false,true]){
  const web=spawn(process.execPath,['--import','./scripts/load-env.mjs','.next/standalone/apps/web/server.js'],{cwd:'apps/web',env:{...env,API_TLS_CA_PATH:trusted?cert:'',PORT:'3009',WEB_PORT:'3009',HOSTNAME:'127.0.0.1'},stdio:'ignore'});processes.push(web);await ready(webOrigin+'/');
  for(const [path,text] of [['/w/navigation-browser','Navigation verification couple'],['/w/navigation-browser/posts/tls-update','TLS verified journal']]){
   const response=await fetch(webOrigin+path),html=await response.text();assert.equal(response.status,200);assert.ok(html.includes(trusted?text:'temporarily unavailable'));
  }
  await stop(web);
 }
 const result={actualNestTls:true,privateCa:true,weddingPage:'rendered with trusted CA; retry state with no trust',blogPage:'rendered with trusted CA; retry state with no trust',liveEmail:0,paidAi:0,scope:'disposable navigation database only'};await writeFile(root+'/result.json',JSON.stringify(result));console.log(JSON.stringify(result));
}finally{for(const child of processes)await stop(child);await store.close();await rm(root,{recursive:true,force:true});}
