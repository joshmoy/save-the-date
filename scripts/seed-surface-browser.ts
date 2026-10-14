import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {loadConfig} from '@save-the-date/config';
import {PostgresStore,PostgresPublication} from '@save-the-date/persistence';
import {credential,credentialHash,checkPassword} from '@save-the-date/adapters';
import {weddingSchema,siteConfigSchema} from '@save-the-date/contracts';

const checkpointFile=process.argv[2];assert.ok(checkpointFile,'Pass the isolated navigation checkpoint');
const checkpoint=JSON.parse(await readFile(checkpointFile,'utf8')),connection=(await readFile(checkpoint.root+'/connection.txt','utf8')).trim(),endpoint=new URL(connection),config=loadConfig();
assert.ok(['localhost','127.0.0.1'].includes(endpoint.hostname)&&/^std_navigation_[a-f0-9]{32}_test$/.test(endpoint.pathname.slice(1)));assert.equal(checkpoint.origin,'http://localhost:3007');
const store=new PostgresStore(connection),file=checkpoint.root+'/surface-browser.json';
try{
 const owner=await store.login('browser-fixture@example.test',hash=>checkPassword('synthetic browser password',hash),credentialHash(credential(),config.TOKEN_HASH_KEYS));assert.ok(owner?.verified);
 try{const existing=JSON.parse(await readFile(file,'utf8'));await store.readWedding(owner,existing.weddingId);console.log('Existing synthetic surface checkpoint retained: '+file);}
 catch(error){if((error as {code?:string}).code!=='ENOENT')throw error;
  const palette={background:'#FFFFFF',primary:'#767676',secondary:'#111111',accent:'#000000'},wedding=await store.createWedding(owner,weddingSchema.parse({displayNames:'Surface contrast verification',slug:'surface-contrast-browser',timezone:'UTC',palette})),publication=new PostgresPublication(store),draft=await publication.saveSite(owner,wedding.id,siteConfigSchema.parse({visibility:'public',theme:'garden',welcome:'Synthetic normal-size text at the supported contrast boundary.'}),0);
  const result=await publication.publish(owner,wedding.id,draft.version,wedding.version);
  await writeFile(file,JSON.stringify({weddingId:wedding.id,url:checkpoint.origin+'/w/'+wedding.slug,palette,surfaces:result.snapshot.surfaces}),{mode:0o600,flag:'wx'});console.log('Synthetic surface verification published locally: '+file);
 }
}finally{await store.close();}
