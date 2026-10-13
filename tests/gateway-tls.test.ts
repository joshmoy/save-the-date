import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:https';
import {execFileSync} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {loadConfig} from '@save-the-date/config';
import {createServer as createApi} from '../apps/api/src/server.js';
import {gatewayOrigin,gatewayRequest,publicApiRequest,readPublicApi} from '../apps/web/src/gateway-transport.js';

test('gateway origins enforce production TLS and reject credential-bearing or non-origin URLs',()=>{
 assert.equal(gatewayOrigin({}), 'http://127.0.0.1:4000');
 assert.equal(gatewayOrigin({PLATFORM_RUNTIME_ENV:'production',API_INTERNAL_ORIGIN:'https://api.example.test'}),'https://api.example.test');
 for(const API_INTERNAL_ORIGIN of ['http://api.example.test','https://user:secret@api.example.test','https://api.example.test/path','https://api.example.test?credential=secret','file:///tmp/api'])assert.throws(()=>gatewayOrigin({PLATFORM_RUNTIME_ENV:'production',API_INTERNAL_ORIGIN}));
 assert.throws(()=>gatewayOrigin({PUBLIC_ORIGIN:'https://weddings.example.test',API_INTERNAL_ORIGIN:'http://api.example.test'}));
});

test('streaming gateway verifies certificate trust and hostname while preserving bytes and cookies',async()=>{
 const directory=await mkdtemp(tmpdir()+'/std-gateway-tls-'),key=directory+'/key.pem',cert=directory+'/cert.pem';
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','1','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost'],{stdio:'ignore'});
 const bytes=Buffer.from('Wedding — café 💐\u0000','utf8');
 const server=createServer({key:await readFile(key),cert:await readFile(cert),minVersion:'TLSv1.2'},async(req,res)=>{
  if(req.url?.endsWith('/broken-json')){res.setHeader('content-type','application/json');res.end('{');return;}
  if(req.url?.startsWith('/api/v1/public/')){res.setHeader('content-type','application/json');res.end(JSON.stringify({path:req.url,cookie:req.headers.cookie??''}));return;}
  if(req.url==='/empty'){res.writeHead(204);res.end();return;}
  if(req.url==='/slow'){return;}
  const chunks:Buffer[]=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));
  res.setHeader('set-cookie',['first=one; HttpOnly','second=two; HttpOnly']);res.end(Buffer.concat(chunks));
 });
 await new Promise<void>(resolve=>server.listen(0,'::',resolve));
 const address=server.address();assert.ok(address&&typeof address!=='string');const origin='https://localhost:'+address.port;
 const options={method:'POST',headers:new Headers({'content-type':'application/octet-stream'}),body:new ReadableStream<Uint8Array>({start(controller){controller.enqueue(bytes);controller.close();}}),signal:AbortSignal.timeout(5000),caPath:cert};
 try{
  const response=await gatewayRequest(origin,options);assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);assert.equal(response.headers.getSetCookie().length,2);
  const publicEnv={PLATFORM_RUNTIME_ENV:'production',API_INTERNAL_ORIGIN:origin,API_TLS_CA_PATH:cert};
  for(const path of ['/api/v1/public/weddings/synthetic','/api/v1/public/weddings/synthetic/posts/update']){const result=await publicApiRequest(path,'std_site=synthetic',publicEnv);assert.deepEqual(await result.json(),{path,cookie:'std_site=synthetic'});}
  await assert.rejects(publicApiRequest('/api/v1/public/weddings/synthetic','std_site=synthetic',{...publicEnv,API_TLS_CA_PATH:''}));
  assert.equal((await readPublicApi('/api/v1/public/weddings/synthetic','std_site=synthetic',publicEnv)).status,200);
  await assert.rejects(readPublicApi('/api/v1/public/weddings/broken-json','',publicEnv));
  await assert.rejects(publicApiRequest('/api/v1/identity/session','synthetic',publicEnv));
  const get={method:'GET',headers:new Headers(),body:null,signal:AbortSignal.timeout(5000)};
  await assert.rejects(gatewayRequest(origin,get));
  await assert.rejects(gatewayRequest('https://127.0.0.1:'+address.port,{...get,caPath:cert}));
  assert.equal((await gatewayRequest(origin+'/empty',{...get,caPath:cert})).status,204);
  await assert.rejects(gatewayRequest(origin+'/slow',{...get,caPath:cert,signal:AbortSignal.timeout(30)}));
 }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));await rm(directory,{recursive:true,force:true});}
});


test('actual Nest API serves database readiness through verified TLS and production requires mounted keys',async()=>{
 const directory=await mkdtemp(tmpdir()+'/std-api-tls-'),key=directory+'/key.pem',cert=directory+'/cert.pem';
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','1','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost'],{stdio:'ignore'});
 const config={...loadConfig(),API_TLS_CERT_PATH:cert,API_TLS_KEY_PATH:key,DELETION_LEDGER_ROOT:directory+'/ledger'};
 await assert.rejects(createApi({...config,NODE_ENV:'production',API_TLS_CERT_PATH:undefined,API_TLS_KEY_PATH:undefined}),/mounted TLS/);
 const server=await createApi(config);
 try{
  await server.app.listen(0,'::');const {port}=server.app.getHttpServer().address() as {port:number};
  const response=await gatewayRequest('https://localhost:'+port+'/api/v1/health',{method:'GET',headers:new Headers(),body:null,caPath:cert,signal:AbortSignal.timeout(5000)});
  assert.equal(response.status,200);assert.ok(await response.json());
  await assert.rejects(fetch('http://localhost:'+port+'/api/v1/health',{signal:AbortSignal.timeout(1000)}));
 }finally{await server.app.close();await server.store.close();await rm(directory,{recursive:true,force:true});}
});
