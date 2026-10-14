import dotenv from 'dotenv';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {mkdtemp,readdir,access,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import pg from 'pg';
import {testSelection} from './test-selection.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
dotenv.config({path:new URL('../.env',import.meta.url),quiet:true});
const template='postgresql://USER:PASSWORD@127.0.0.1:PORT/std_test';
const connection=process.env.TEST_DB_CONNECTION&&process.env.TEST_DB_CONNECTION!==template?process.env.TEST_DB_CONNECTION:process.env.DB_CONNECTION;
let endpoint;
try{endpoint=new URL(connection);}catch{throw Error('Set DB_CONNECTION or TEST_DB_CONNECTION to a local PostgreSQL _test database. No legacy DATABASE_URL fallback is used.');}
if(!['postgres:','postgresql:'].includes(endpoint.protocol)||!['localhost','127.0.0.1'].includes(endpoint.hostname)||!endpoint.pathname.endsWith('_test'))throw Error('Verification requires a local PostgreSQL _test administrator endpoint. Existing application records are never the test target.');
const available=(await readdir(new URL('../tests/',import.meta.url))).filter(file=>file.endsWith('.test.ts')).sort();
const selection=testSelection(process.argv.slice(2),available),full=selection.full,env={...process.env,NODE_ENV:'test',PLATFORM_RUNTIME_ENV:'test',API_TLS_CERT_PATH:'',API_TLS_KEY_PATH:'',API_TLS_CA_PATH:'',EMAIL_ADAPTER:'capture',LLM_ADAPTER:'disabled',IMAGE_ADAPTER:'disabled',STORAGE_ADAPTER:'filesystem'};
env.TEST_INVITATION_BROWSER_PATH??=env.INVITATION_BROWSER_PATH;
for(const name of ['TEST_HEIC_FIXTURE','TEST_INVITATION_BROWSER_PATH'])if(full){if(!env[name])throw Error('Full verification requires '+name+' in .env.');try{await access(env[name]);}catch{throw Error(name+' is not a readable local verification file.');}}
const name='std_suite_'+randomUUID().replaceAll('-','')+'_test',scratch=await mkdtemp(tmpdir()+'/std-suite-'),target=new URL(endpoint);target.pathname='/'+name;
Object.assign(env,{DB_CONNECTION:target.href,TEST_DB_CONNECTION:target.href,STORAGE_ROOT:scratch+'/storage',DELETION_LEDGER_ROOT:scratch+'/ledger',EMAIL_CAPTURE_ROOT:scratch+'/mail'});
const admin=new pg.Pool({connectionString:endpoint.href});let created=false,passed=false;
function run(args){const result=spawnSync(args[0],args.slice(1),{cwd:root,env,stdio:'inherit'});if(result.error)throw result.error;return result.status??1;}
try{
 console.log('Building tested packages before running the current source.');
 let code=run(['pnpm','exec','turbo','run','build','--filter=@save-the-date/api...','--filter=@save-the-date/worker...']);
 if(code===0){await admin.query('create database "'+name+'"');created=true;console.log('Isolated verification database: '+name);code=run([process.execPath,'--import','tsx','scripts/platform-migrate.ts']);}
 if(code===0){code=run([process.execPath,'--import','tsx','--test','--test-concurrency=1',...selection.nodeOptions,...selection.files]);}
 passed=code===0;process.exitCode=code;
}finally{
 if(created&&passed){await admin.query('drop database "'+name+'" with (force)');await rm(scratch,{recursive:true,force:true});console.log('Disposable test database and files removed; application data preserved.');}
 else if(created)console.error('Failed verification retained only '+name+' and '+scratch+' for inspection.');
 else await rm(scratch,{recursive:true,force:true});
 await admin.end();
}
