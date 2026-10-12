import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHmac} from 'node:crypto';
import {RavenRelayEmail,verifyRavenEvent,EmailAdapterError,type RavenEvent} from '@save-the-date/adapters';
import {PostgresStore,PostgresNotifications} from '@save-the-date/persistence';
import {loadConfig} from '@save-the-date/config';
import {createServer} from '../apps/api/src/server.js';
const connection=process.env.TEST_DB_CONNECTION;
if(!connection||!['127.0.0.1','localhost'].includes(new URL(connection).hostname)||!new URL(connection).pathname.endsWith('_test'))throw Error('Email tests require an isolated local _test database');
const store=new PostgresStore(connection),notifications=new PostgresNotifications(store),secret='test-webhook-secret',projectId=randomUUID();
before(async()=>{await store.migrate(new URL('../packages/persistence/migrations',import.meta.url).pathname);});
after(async()=>{await store.close();});
const event=(providerId:string,status:RavenEvent['data']['status'],time:string):RavenEvent=>({id:randomUUID(),type:status==='hard_bounced'?'email.bounced':status==='complained'?'email.complained':status==='sent'?'email.sent':'email.delivered',created_at:time,data:{email_id:providerId,project_id:projectId,status,recipients:['synthetic@example.test']}});
test('N02 Raven submission is queued, uses stable idempotency and classifies failures',async()=>{
 const requests:RequestInit[]=[];const id=randomUUID(),providerId=randomUUID();
 const adapter=new RavenRelayEmail('test-key','sender@example.test','https://example.test',async(_url,init)=>{requests.push(init!);return new Response(JSON.stringify({id:providerId,status:'queued',test_mode:true}),{status:202});});
 const message={id,to:'synthetic@example.test',subject:'Synthetic verification',text:'No real mail'};
 assert.deepEqual(await adapter.send(message),{state:'provider_queued',providerId});await adapter.send(message);
 assert.deepEqual(requests[0],requests[1]);assert.equal((requests[0].headers as Record<string,string>)['Idempotency-Key'],id);
 for(const [status,retryable] of [[429,true],[503,true],[409,false],[422,false]] as const){const failing=new RavenRelayEmail('key','sender@example.test','https://example.test',async()=>new Response('{}',{status}));await assert.rejects(failing.send(message),(e:EmailAdapterError)=>e.retryable===retryable);}
 const timedOut=new RavenRelayEmail('key','sender@example.test','https://example.test',async()=>{throw Error('lost acknowledgement');});await assert.rejects(timedOut.send(message),(e:EmailAdapterError)=>e.retryable);
 const suppressed=new RavenRelayEmail('key','sender@example.test','https://example.test',async()=>new Response(JSON.stringify({id:providerId,status:'suppressed'}),{status:202}));assert.equal((await suppressed.send(message)).state,'failed');
});
test('N02 signature rejects altered bytes, expired timestamps and foreign projects',()=>{
 const payload=event(randomUUID(),'delivered',new Date().toISOString()),raw=Buffer.from(JSON.stringify(payload)),timestamp=String(Math.floor(Date.now()/1000));
 const headers={timestamp,signature:'v1='+createHmac('sha256',secret).update(timestamp+'.').update(raw).digest('hex'),eventId:payload.id};
 assert.equal(verifyRavenEvent(raw,headers,secret,projectId).id,payload.id);
 assert.throws(()=>verifyRavenEvent(Buffer.from('{}'),headers,secret,projectId));assert.throws(()=>verifyRavenEvent(raw,headers,secret,'another-project'));assert.throws(()=>verifyRavenEvent(raw,headers,secret,projectId,Date.now()+301000));
});
test('N02 durable inbox handles duplicate, late and acknowledgement-racing events',async()=>{
 const id=randomUUID(),providerId=randomUUID();await store.pool.query('insert into std_email_messages(id,recipient,subject) values($1,$2,$3)',[id,'synthetic@example.test','Synthetic']);
 const delivered=event(providerId,'delivered','2026-10-12T12:00:00.000Z');await notifications.receive(delivered);await notifications.receive(delivered);
 await notifications.submitted(id,'provider_queued',providerId);assert.equal((await store.pool.query('select state from std_email_messages where id=$1',[id])).rows[0].state,'delivered');
 await notifications.receive(event(providerId,'sent','2026-10-12T11:59:00.000Z'));
 await notifications.receive(event(providerId,'hard_bounced','2026-10-12T11:58:00.000Z'));
 await notifications.receive(event(providerId,'delivered','2026-10-12T13:00:00.000Z'));
 assert.equal((await store.pool.query('select state from std_email_messages where id=$1',[id])).rows[0].state,'bounced');
 assert.equal((await store.pool.query('select count(*)::int as n from std_provider_inbox where event_id=$1',[delivered.id])).rows[0].n,1);
});
test('N02 HTTP verifies original bytes before origin-free provider callback acceptance',async()=>{
 const config={...loadConfig(),DB_CONNECTION:connection!,RAVENRELAY_WEBHOOK_SECRET:secret,RAVENRELAY_PROJECT_ID:projectId};const server=await createServer(config);await server.app.listen(0,'127.0.0.1');
 try{const address=server.app.getHttpServer().address(),origin=`http://127.0.0.1:${address.port}`;const payload=event(randomUUID(),'delivered',new Date().toISOString()),raw=JSON.stringify(payload),timestamp=String(Math.floor(Date.now()/1000));const headers={'Content-Type':'application/json','RavenRelay-Timestamp':timestamp,'RavenRelay-Event-Id':payload.id,'RavenRelay-Signature':'v1='+createHmac('sha256',secret).update(timestamp+'.'+raw).digest('hex')};
  assert.equal((await fetch(origin+'/api/v1/provider-events/ravenrelay',{method:'POST',headers,body:raw})).status,200);
  assert.equal((await fetch(origin+'/api/v1/provider-events/ravenrelay',{method:'POST',headers,body:'{}'})).status,401);
 }finally{await server.app.close();await server.store.close();}
});
