import {NextResponse} from 'next/server';
import {query} from './db';

export async function assertLegacyWritable(){
 const exists=await query<{table:string|null}>("select to_regclass('legacy_write_fence') as table");
 if(!exists.rows[0].table)return; // Earlier deployments remain compatible until the expand migration is authorised.
 const state=await query<{frozen:boolean}>('select frozen from legacy_write_fence where id=true');
 if(state.rows[0]?.frozen)throw Object.assign(new Error('LEGACY_WRITES_FROZEN'),{code:'55000'});
}
export function withLegacyWriteFence<Args extends unknown[]>(handler:(...args:Args)=>Promise<Response>){
 return async(...args:Args)=>{try{return await handler(...args);}catch(error){if((error as {code?:string}).code==='55000'&&error instanceof Error&&error.message==='LEGACY_WRITES_FROZEN')return NextResponse.json({code:'LEGACY_WRITES_FROZEN',error:'Legacy updates are paused for a controlled migration. Reconcile uncertain admissions with the event lead before retrying.'},{status:503,headers:{'Cache-Control':'no-store','Retry-After':'60'}});throw error;}};
}
