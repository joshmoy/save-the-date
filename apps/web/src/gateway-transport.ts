import {request as httpRequest} from 'node:http';
import {request as httpsRequest} from 'node:https';
import {readFile} from 'node:fs/promises';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';

export function gatewayOrigin(env:Record<string,string|undefined>){
 const value=env.API_INTERNAL_ORIGIN??'http://127.0.0.1:4000',url=new URL(value);
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname))throw Error('Invalid internal API origin');
 const production=env.PLATFORM_RUNTIME_ENV==='production'||env.PUBLIC_ORIGIN?.startsWith('https://');
 if(production&&url.protocol!=='https:')throw Error('Production API transport requires HTTPS');
 return url.origin;
}

/** Streaming HTTP/TLS adapter. A configured CA applies only to this API peer. */
export async function gatewayRequest(url:string,options:{method:string;headers:Headers;body:ReadableStream<Uint8Array>|null;signal:AbortSignal;caPath?:string}){
 const endpoint=new URL(url);if(!['http:','https:'].includes(endpoint.protocol))throw Error('Unsupported API protocol');
 const ca=options.caPath?await readFile(options.caPath):undefined;
 return new Promise<Response>((resolve,reject)=>{
  const request=(endpoint.protocol==='https:'?httpsRequest:httpRequest)(endpoint,{method:options.method,headers:Object.fromEntries(options.headers),signal:options.signal,...(endpoint.protocol==='https:'?{ca,minVersion:'TLSv1.2' as const,rejectUnauthorized:true}:{})},incoming=>{
   const headers=new Headers();for(let i=0;i<incoming.rawHeaders.length;i+=2)headers.append(incoming.rawHeaders[i],incoming.rawHeaders[i+1]);
   const status=incoming.statusCode??502,noBody=options.method==='HEAD'||[204,205,304].includes(status);
   if(noBody)incoming.resume();
   resolve(new Response(noBody?null:Readable.toWeb(incoming) as ReadableStream<Uint8Array>,{status,headers}));
  });
  request.once('error',reject);
  if(options.body)void pipeline(Readable.fromWeb(options.body as import('node:stream/web').ReadableStream),request).catch(reject);else request.end();
 });
}

/** Server-rendered public reads use the same verified peer as the browser gateway. */
export async function publicApiRequest(path:string,cookie:string,env:Record<string,string|undefined>=process.env){
 if(!path.startsWith('/api/v1/public/')||path.includes('..')||path.includes('?')||path.includes('#'))throw Error('Invalid public API path');
 return gatewayRequest(gatewayOrigin(env)+path,{method:'GET',headers:new Headers({Cookie:cookie}),body:null,caPath:env.API_TLS_CA_PATH||undefined,signal:AbortSignal.timeout(10000)});
}

export async function readPublicApi<T>(path:string,cookie:string,env:Record<string,string|undefined>=process.env){
 const response=await publicApiRequest(path,cookie,env);
 return {status:response.status,data:response.ok?await response.json() as T:null};
}
