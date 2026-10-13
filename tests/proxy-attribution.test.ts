import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {loadConfig} from '@save-the-date/config';
import {credentialHash} from '@save-the-date/adapters';
import {createServer} from '../apps/api/src/server.js';
import {gatewayClientIp} from '../apps/web/src/gateway-client-ip.js';

test('Gateway client attribution ignores browser forwarding by default and rejects malformed trusted ingress values',()=>{
  const headers=new Headers({'x-forwarded-for':'198.51.100.7','x-verified-client-ip':'203.0.113.8'});
  assert.equal(gatewayClientIp(headers),null);
  assert.equal(gatewayClientIp(headers,'x-verified-client-ip'),'203.0.113.8');
  assert.throws(()=>gatewayClientIp(new Headers(),'x-verified-client-ip'));
  assert.throws(()=>gatewayClientIp(new Headers({'x-verified-client-ip':'203.0.113.8,198.51.100.7'}),'x-verified-client-ip'));
  assert.throws(()=>gatewayClientIp(headers,'bad header'));
});

test('Actual API rate limits use peer by default and distinct clients only through an explicitly trusted gateway',async()=>{
  const connection=process.env.TEST_DB_CONNECTION;
  if(!connection||!['localhost','127.0.0.1'].includes(new URL(connection).hostname)||!new URL(connection).pathname.endsWith('_test'))throw Error('Requires isolated local _test database');
  for(const trusted of ['', '127.0.0.1/32']){
    const root=await mkdtemp(tmpdir()+'/std-proxy-'),config={...loadConfig(),DB_CONNECTION:connection,EMAIL_ADAPTER:'capture' as const,API_TRUSTED_PROXY_CIDRS:trusted,DELETION_LEDGER_ROOT:root},server=await createServer(config),keys:string[]=[],limit=server.store.rateLimit.bind(server.store);
    server.store.rateLimit=async(key,max,seconds)=>{keys.push(key);return limit(key,max,seconds);};
    try{
      await server.app.listen(0,'127.0.0.1');const {port}=server.app.getHttpServer().address() as {port:number};
      for(const ip of ['203.0.113.7','203.0.113.8']){const response=await fetch('http://127.0.0.1:'+port+'/api/v1/identity/session',{headers:{'x-forwarded-for':ip}});assert.equal(response.status,401);}
      const expected=(ip:string)=>'http:'+credentialHash(ip,config.TOKEN_HASH_KEYS),http=keys.filter(k=>k.startsWith('http:'));
      assert.deepEqual(http,trusted?[expected('203.0.113.7'),expected('203.0.113.8')]:[expected('127.0.0.1'),expected('127.0.0.1')]);
    }finally{await server.app.close();await server.store.close();await rm(root,{recursive:true,force:true});}
  }
});
