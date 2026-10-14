import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {loadConfig} from '@save-the-date/config';
import {PostgresStore,PostgresPublication} from '@save-the-date/persistence';
import {credential,credentialHash,checkPassword} from '@save-the-date/adapters';
import {weddingSchema,siteConfigSchema,eventSchema} from '@save-the-date/contracts';

const checkpointFile=process.argv[2];assert.ok(checkpointFile,'Pass the isolated navigation checkpoint');
const checkpoint=JSON.parse(await readFile(checkpointFile,'utf8')),connection=(await readFile(checkpoint.root+'/connection.txt','utf8')).trim(),endpoint=new URL(connection),config=loadConfig();
assert.ok(['localhost','127.0.0.1'].includes(endpoint.hostname)&&/^std_navigation_[a-f0-9]{32}_test$/.test(endpoint.pathname.slice(1)));assert.equal(checkpoint.origin,'http://localhost:3007');
const store=new PostgresStore(connection),file=checkpoint.root+'/section-browser.json';
try{
 const owner=await store.login('browser-fixture@example.test',hash=>checkPassword('synthetic browser password',hash),credentialHash(credential(),config.TOKEN_HASH_KEYS));assert.ok(owner?.verified);
 try{const existing=JSON.parse(await readFile(file,'utf8'));await store.readWedding(owner,existing.weddingId);console.log('Existing synthetic section checkpoint retained: '+file);}
 catch(error){if((error as {code?:string}).code!=='ENOENT')throw error;
  const wedding=await store.createWedding(owner,weddingSchema.parse({displayNames:'Website section verification',slug:'section-visibility-browser',timezone:'UTC'})),publication=new PostgresPublication(store);
  await store.saveEvent(owner,wedding.id,eventSchema.parse({title:'Hidden celebration',type:'reception',timezone:'UTC',visibility:'public',toBeConfirmed:'Date to be confirmed'}));
  const draft=await publication.saveSite(owner,wedding.id,siteConfigSchema.parse({visibility:'public',theme:'garden',welcome:'Synthetic section visibility check.',sections:['gifting','rsvp'],gifting:'',registryUrl:'https://example.test/registry'}),0),current=await store.readWedding(owner,wedding.id);
  await publication.publish(owner,wedding.id,draft.version,current.version);
  await writeFile(file,JSON.stringify({weddingId:wedding.id,url:checkpoint.origin+'/w/'+wedding.slug}),{mode:0o600,flag:'wx'});console.log('Synthetic section verification published locally: '+file);
 }
}finally{await store.close();}
