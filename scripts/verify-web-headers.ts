import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

const origin=new URL(process.env.VERIFY_WEB_ORIGIN??'http://localhost:3003');
if(!['localhost','127.0.0.1'].includes(origin.hostname))throw Error('This check only reads a local verification server');
const results=[];
for(const path of ['/', '/platform', '/support', '/api/v1/health']){
  const response=await fetch(new URL(path,origin));
  assert.equal(response.status,200,path);
  assert.equal(response.headers.get('referrer-policy'),'no-referrer',path);
  assert.equal(response.headers.get('x-content-type-options'),'nosniff',path);
  assert.equal(response.headers.get('x-frame-options'),'DENY',path);
  assert.match(response.headers.get('content-security-policy')??'',/frame-ancestors 'none'/,path);
  assert.match(response.headers.get('permissions-policy')??'',/camera=\(self\)/,path);
  assert.equal(response.headers.get('x-powered-by'),null,path);
  results.push({path,status:response.status,headers:Object.fromEntries([...response.headers].filter(([key])=>['referrer-policy','x-content-type-options','x-frame-options','content-security-policy','permissions-policy'].includes(key)))});
}
await writeFile('docs/verification/security/web-headers.json',JSON.stringify({checkedAt:new Date().toISOString(),origin:origin.origin,results},null,2)+'\n');
console.log('Verified actual page and API gateway security headers on four local routes');
