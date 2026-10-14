import dotenv from 'dotenv';
import {readFile,writeFile,mkdtemp,rm,stat} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {loadConfig} from '@save-the-date/config';
import {PostgresStore,PostgresLegacyPlanner,type LegacySnapshot} from '@save-the-date/persistence';
import {AesGcmBackupEncryption,FilesystemStorage,credentialHash} from '@save-the-date/adapters';

dotenv.config({quiet:true});
const [encryptedFile,mappingFile,outputFile]=process.argv.slice(2),connection=process.env.LEGACY_TARGET_CONNECTION,sessionFile=process.env.LEGACY_PLAN_SESSION_FILE,keys=process.env.BACKUP_ENCRYPTION_KEYS;
if(!encryptedFile||!mappingFile||!outputFile||!connection||!sessionFile||!keys)throw Error('Pass encrypted snapshot, mapping and output paths; configure LEGACY_TARGET_CONNECTION, LEGACY_PLAN_SESSION_FILE and BACKUP_ENCRYPTION_KEYS.');
let endpoint:URL;try{endpoint=new URL(connection);}catch{throw Error('LEGACY_TARGET_CONNECTION_INVALID');}
if(!['localhost','127.0.0.1'].includes(endpoint.hostname)||!endpoint.pathname.endsWith('_test')||endpoint.searchParams.has('host')||endpoint.searchParams.has('hostaddr'))throw Error('Mapping rehearsal requires an explicit local _test target');
for(const file of [mappingFile,sessionFile])if((await stat(file)).mode&0o077)throw Error('Mapping and session files must be private (mode0600)');
if((await stat(encryptedFile)).size>32*1024**2)throw Error('LEGACY_SNAPSHOT_TOO_LARGE');
const config=loadConfig(),scratch=await mkdtemp(tmpdir()+'/std-legacy-plan-'),store=new PostgresStore(connection);
try{
 const actor=await store.authenticate(credentialHash((await readFile(sessionFile,'utf8')).trim(),config.TOKEN_HASH_KEYS));if(!actor)throw Error('A current, recently authenticated primary-owner session is required');
 await new AesGcmBackupEncryption(keys).decryptTo(new FilesystemStorage(path.dirname(path.resolve(encryptedFile))),path.basename(encryptedFile),new FilesystemStorage(scratch),'payload');
 let snapshot:LegacySnapshot,mapping:unknown;try{snapshot=JSON.parse(await readFile(scratch+'/payload','utf8'));mapping=JSON.parse(await readFile(mappingFile,'utf8'));}catch{throw Error('LEGACY_INPUT_JSON_INVALID');}
 if(snapshot.version!==1||typeof snapshot.capturedAt!=='string'||![snapshot.users,snapshot.passes,snapshot.scans,snapshot.settings,snapshot.migrations].every(rows=>Array.isArray(rows)&&rows.length<=100000&&rows.every(row=>row&&typeof row==='object'&&!Array.isArray(row))))throw Error('LEGACY_SNAPSHOT_INVALID');
 const result=await new PostgresLegacyPlanner(store).plan(actor,snapshot,mapping);
 await writeFile(outputFile,JSON.stringify(result,null,2),{mode:0o600,flag:'wx'});
 console.log(JSON.stringify({reportPath:path.resolve(outputFile),mappingComplete:result.mappingComplete,exceptions:result.exceptions.length,cutoverReady:false,sourceWrites:0,targetWrites:0}));
 if(!result.mappingComplete)process.exitCode=2;
}finally{await store.close();await rm(scratch,{recursive:true,force:true});}
