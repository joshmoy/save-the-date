import { NextRequest } from 'next/server';
export const dynamic='force-dynamic';
async function gateway(request:NextRequest,{params}:{params:Promise<{path:string[]}>}){
 const {path}=await params;
 const origin=process.env.API_INTERNAL_ORIGIN??'http://127.0.0.1:4000';
 const headers=new Headers();for(const key of ['content-type','cookie','origin','x-std-csrf','idempotency-key','x-request-id','range']){const v=request.headers.get(key);if(v)headers.set(key,v);}
 try{
  const response=await fetch(`${origin}/api/v1/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`,{method:request.method,headers,...(['GET','HEAD'].includes(request.method)?{}:{body:request.body,duplex:'half' as const}),cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(request.method==='PUT'?120000:15000)});
  const out=new Headers({'Content-Type':response.headers.get('content-type')??'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer'});
  for(const cookie of response.headers.getSetCookie())out.append('Set-Cookie',cookie);
  for(const name of ['content-range','accept-ranges','content-disposition','x-content-type-options','x-request-id']){const value=response.headers.get(name);if(value)out.set(name,value);}
  const retry=response.headers.get('retry-after');if(retry)out.set('Retry-After',retry);
  return new Response(response.body,{status:response.status,headers:out});
 }catch{return Response.json({code:'API_UNAVAILABLE',message:'The service is unavailable. Retry in a moment.'},{status:503});}
}
export {gateway as GET,gateway as POST,gateway as PATCH,gateway as DELETE,gateway as PUT};
