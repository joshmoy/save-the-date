import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {loadConfig} from '@save-the-date/config';
import {PostgresStore,PostgresGuests} from '@save-the-date/persistence';
import {credential,credentialHash,checkPassword} from '@save-the-date/adapters';
import {guestSchema} from '@save-the-date/contracts';

const checkpointFile=process.argv[2];assert.ok(checkpointFile,'Pass the isolated navigation checkpoint');
const checkpoint=JSON.parse(await readFile(checkpointFile,'utf8')),connection=(await readFile(checkpoint.root+'/connection.txt','utf8')).trim(),url=new URL(connection),config=loadConfig();
assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&/^std_navigation_[a-f0-9]{32}_test$/.test(url.pathname.slice(1)));
assert.equal(checkpoint.origin,'http://localhost:3007');
const store=new PostgresStore(connection),hash=(value:string)=>credentialHash(value,config.TOKEN_HASH_KEYS);
try{
 const actor=await store.login('browser-fixture@example.test',encoded=>checkPassword('synthetic browser password',encoded),hash(credential()));assert.ok(actor?.verified,'Existing verified synthetic identity required');
 const wedding=await store.readWedding(actor,checkpoint.weddingId);assert.equal(wedding.slug,'navigation-browser');
 const file=checkpoint.root+'/guest-accessibility.json';
 try{const existing=JSON.parse(await readFile(file,'utf8'));assert.equal(existing.weddingId,wedding.id);assert.equal(existing.origin,checkpoint.origin);const active=await store.pool.query('select id from std_guest_grants where wedding_id=$1 and party_id=$2 and code_hash=$3 and revoked_at is null and expires_at>now()',[wedding.id,existing.partyId,hash('rsvp:'+existing.code)]);assert.equal(active.rowCount,1,'Existing fixture grant requires review; do not recreate records automatically');console.log('Existing private guest checkpoint retained: '+file);process.exitCode=0;}catch(error){if((error as {code?:string}).code!=='ENOENT')throw error;
 const events=(await store.listEvents(actor,wedding.id)).slice(0,2);assert.equal(events.length,2);
 const guests=new PostgresGuests(store,hash,checkpoint.origin),attendee=await guests.save(actor,wedding.id,guestSchema.parse({name:'Synthetic keyboard guest',household:'Keyboard verification household',eventIds:events.map(event=>event.id),plusOnes:1}),0);
 const grant=await guests.issueGrant(actor,wedding.id,attendee.party_id,30);
 await writeFile(file,JSON.stringify({version:1,weddingId:wedding.id,partyId:attendee.party_id,attendeeId:attendee.id,eventIds:events.map(event=>event.id),code:grant.code,origin:checkpoint.origin,slug:wedding.slug}),{mode:0o600,flag:'wx'});
 console.log('Synthetic household and one allocated plus-one created. Private grant checkpoint: '+file);
 }
}finally{await store.close();}
