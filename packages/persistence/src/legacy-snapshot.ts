import {createHash} from 'node:crypto';
import pg from 'pg';

type Row=Record<string,unknown>;
export type LegacySnapshot={version:1;capturedAt:string;users:Row[];passes:Row[];scans:Row[];settings:Row[];migrations:Row[];fence?:{version:1;frozen:boolean;frozenAt:string|null}};
const checksum=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export async function withFrozenLegacySource<T>(connection:string,expected:LegacySnapshot,work:()=>Promise<T>):Promise<T>{
 // Validate transport before opening the locking maintenance connection.
 const initial=await readLegacySnapshot(connection);if(!initial.fence?.frozen)throw Error('LEGACY_SOURCE_NOT_FROZEN');
 const client=new pg.Client({connectionString:connection,connectionTimeoutMillis:5000});
 try{
  await client.connect();await client.query('begin');
  const fence=(await client.query('select frozen from public.legacy_write_fence where id=true for share')).rows[0];if(!fence?.frozen)throw Error('LEGACY_SOURCE_NOT_FROZEN');
  const current=await readLegacySnapshot(connection);
  if(!current.fence?.frozen||current.fence.frozenAt!==expected.fence?.frozenAt||JSON.stringify(reconcileLegacySnapshot(current).tables)!==JSON.stringify(reconcileLegacySnapshot(expected).tables))throw Error('LEGACY_SOURCE_CHANGED');
  return await work();
 }finally{try{await client.query('rollback');}finally{await client.end();}}
}
/** A dedicated read-only transaction; no platform or legacy mutation methods exist. */
export async function readLegacySnapshot(connection:string):Promise<LegacySnapshot>{
 let url:URL;try{url=new URL(connection);}catch{throw Error('LEGACY_CONNECTION_INVALID');}
 if(!['postgres:','postgresql:'].includes(url.protocol)||!url.hostname||decodeURIComponent(url.hostname).includes('/')||url.searchParams.has('host')||url.searchParams.has('hostaddr'))throw Error('LEGACY_CONNECTION_INVALID');
 if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname)){
  if(url.searchParams.getAll('sslmode').length!==1||url.searchParams.get('sslmode')!=='verify-full'||url.searchParams.has('host')||url.searchParams.has('hostaddr'))throw Error('LEGACY_REMOTE_REQUIRES_VERIFIED_TLS');
 }
 const client=new pg.Client({connectionString:connection,connectionTimeoutMillis:5000});
 try{
  await client.connect();await client.query('begin isolation level repeatable read read only');
  await client.query("set local statement_timeout='30s'");
  const capturedAt=(await client.query('select transaction_timestamp() as at')).rows[0].at.toISOString();
  const tables=['app_users','hall_passes','scan_attempts','ticket_settings','schema_migrations'] as const;
  const rows:Row[][]=[];
  for(const table of tables)rows.push((await client.query(`select to_jsonb(t) as record from ${table} t order by to_jsonb(t)::text collate "C"`)).rows.map(row=>row.record));
  let fence:LegacySnapshot['fence'];if((await client.query("select to_regclass('legacy_write_fence') as table")).rows[0].table){const row=(await client.query('select frozen,frozen_at from legacy_write_fence where id=true')).rows[0];if(!row)throw Error('LEGACY_FENCE_INVALID');fence={version:1,frozen:row.frozen,frozenAt:row.frozen_at?.toISOString()??null};}
  await client.query('commit');
  return {version:1,capturedAt,users:rows[0],passes:rows[1],scans:rows[2],settings:rows[3],migrations:rows[4],...(fence?{fence}:{})};
 }finally{await client.end();}
}
/** Reports contain IDs and aggregate facts, never names, emails, tokens or password hashes. */
export function reconcileLegacySnapshot(snapshot:LegacySnapshot){
 const exceptions:{recordId:string;code:string}[]=[];
 const passIds=new Set(snapshot.passes.map(pass=>pass.id));
 const successes=new Map<unknown,number>();
 for(const scan of snapshot.scans)if(scan.result==='valid')successes.set(scan.hall_pass_id,(successes.get(scan.hall_pass_id)??0)+1);
 let used=0,revoked=0,unused=0,usedAndRevoked=0;
 for(const pass of snapshot.passes){
  if(pass.used_at){used++;if(pass.invalidated_at)usedAndRevoked++;}else if(pass.invalidated_at)revoked++;else unused++;
  if(!pass.guest_name)exceptions.push({recordId:String(pass.id),code:'GUEST_IDENTITY_MAPPING_REQUIRED'});
  if(pass.used_at&&!pass.used_by)exceptions.push({recordId:String(pass.id),code:'ADMISSION_ACTOR_MAPPING_REQUIRED'});
  const valid=successes.get(pass.id)??0;
  if(valid>1)exceptions.push({recordId:String(pass.id),code:'MULTIPLE_SUCCESSFUL_SCAN_RECORDS'});
  if(valid&&!pass.used_at)exceptions.push({recordId:String(pass.id),code:'SUCCESSFUL_SCAN_WITHOUT_USED_FLAG'});
 }
 for(const scan of snapshot.scans)if(scan.hall_pass_id&&!passIds.has(scan.hall_pass_id))exceptions.push({recordId:String(scan.id),code:'SCAN_PASS_LINEAGE_MISSING'});
 const tables={users:snapshot.users,passes:snapshot.passes,scans:snapshot.scans,settings:snapshot.settings,migrations:snapshot.migrations};
 return {version:1,sourceChecksum:checksum(snapshot),tables:Object.fromEntries(Object.entries(tables).map(([name,rows])=>[name,{count:rows.length,checksum:checksum(rows)}])),passFacts:{used,revoked,unused,usedAndRevoked},exceptions,
  requiredReview:['Map legacy users to explicitly verified platform identities; legacy roles do not grant platform authority.','Map passes to the original wedding, explicit event and attendee IDs; issuance does not establish a confirmed RSVP.','Preserve every used_at admission even if subsequently invalidated; used passes cannot be reissued.','Keep all legacy credentials quarantined. Controlled reissue requires owner review and separately authorised notification.','Legacy ticket_limit limits non-invalidated issued passes, including used passes; it is not an RSVP capacity.','Reconcile asset references, freeze legacy writers and retain encrypted backup before an authorised cutover.']};
}
