import dotenv from 'dotenv';
import pg from 'pg';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';

dotenv.config({quiet:true});
const template='postgresql://USER:PASSWORD@127.0.0.1:PORT/std_test';
const connection=process.env.TEST_DB_CONNECTION&&process.env.TEST_DB_CONNECTION!==template?process.env.TEST_DB_CONNECTION:process.env.DB_CONNECTION;
let endpoint;try{endpoint=new URL(connection);}catch{throw Error('Set DB_CONNECTION or TEST_DB_CONNECTION to a valid local PostgreSQL _test administrator endpoint');}
if(!['localhost','127.0.0.1'].includes(endpoint.hostname)||!endpoint.pathname.endsWith('_test'))throw Error('Use a local PostgreSQL _test administrator endpoint');
if(!process.env.TEST_INVITATION_BROWSER_PATH)throw Error('Set TEST_INVITATION_BROWSER_PATH to the real local Chrome executable');
const admin=new pg.Client({connectionString:endpoint.href}),name='std_pilot_'+randomUUID().replaceAll('-','')+'_test',root=await mkdtemp(tmpdir()+'/std-pilot-driver-');let created=false;
await admin.connect();
try{
 await admin.query('create database "'+name+'"');created=true;endpoint.pathname='/'+name;
 const env={...process.env,DB_CONNECTION:endpoint.href,TEST_DB_CONNECTION:endpoint.href,PILOT_POPULATION:'1',NODE_ENV:'test',PLATFORM_RUNTIME_ENV:'test',API_TLS_CERT_PATH:'',API_TLS_KEY_PATH:'',EMAIL_ADAPTER:'capture',LLM_ADAPTER:'disabled',IMAGE_ADAPTER:'disabled',STORAGE_ADAPTER:'filesystem'};
 const result=spawnSync(process.execPath,['--import','tsx','scripts/verify-release-performance.ts'],{env,encoding:'utf8',maxBuffer:16*1024**2});
 await writeFile(root+'/output.log',result.stdout??'',{mode:0o600});await writeFile(root+'/errors.log',result.stderr??'',{mode:0o600});
 if(result.status!==0){console.error('Pilot verification failed; disposable database '+name+' and logs '+root+' retained.');process.exitCode=result.status??1;}
 else{const match=result.stdout.match(/"reportPath":\s*"([^"]+)"/);if(!match)throw Error('Pilot did not produce its report');console.log(JSON.stringify({reportPath:match[1],driverLogs:root,database:name,sourceDatabase:'untouched'}));await admin.query('drop database "'+name+'" with (force)');created=false;}
}finally{if(created)console.error('Retained isolated pilot database '+name);await admin.end();}
