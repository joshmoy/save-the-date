import {randomUUID,randomBytes} from 'node:crypto';
import type {PoolClient} from 'pg';
import type {Actor,GuestSession,UploadSession,UploadRepository} from '@save-the-date/domain';
import {DomainError,requireCapability,notFound} from '@save-the-date/domain';
import type {UploadGrantInput} from '@save-the-date/contracts';
import {PostgresStore} from './index.js';
export class PostgresUploads implements UploadRepository {
 constructor(private store:PostgresStore,private hash:(v:string)=>string,private origin:string){}
 async list(actor:Actor,id:string){requireCapability(await this.store.tenant(actor,id),'publish');return (await this.store.pool.query('select id,event_id,album_id,expires_at,expires_at<=now() as expired,revoked_at,session_file_limit,session_byte_limit,created_at from std_upload_grants where wedding_id=$1 order by created_at desc',[id])).rows;}
 async create(actor:Actor,id:string,input:UploadGrantInput){return this.store.transaction(async tx=>{
  requireCapability(await this.store.tenant(actor,id,tx),'publish');
  const expiry=Date.parse(input.expiresAt);if(expiry<=Date.now()||expiry>Date.now()+180*86400000)throw new DomainError(400,'GRANT_EXPIRY','Choose an expiry within the next 180 days');
  const target=await tx.query("select w.slug from std_weddings w join std_events e on e.wedding_id=w.id join std_albums a on a.wedding_id=w.id where w.id=$1 and e.id=$2 and a.id=$3 and a.deleted_at is null and w.lifecycle<>'archived'",[id,input.eventId,input.albumId]);if(!target.rowCount)throw notFound();
  const token=randomBytes(32).toString('base64url'),code=randomBytes(8).toString('hex').toUpperCase(),grantId=randomUUID();
  await tx.query('insert into std_upload_grants(id,wedding_id,event_id,album_id,token_hash,code_hash,expires_at,session_file_limit,session_byte_limit,created_by) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[grantId,id,input.eventId,input.albumId,this.hash('upload:'+token),this.hash('upload:'+code),input.expiresAt,input.sessionFileLimit,input.sessionByteLimit,actor.userId]);
  await this.store.audit(tx,id,actor.userId,'upload.grant_created',grantId);
  return {id:grantId,code,url:this.origin+'/w/'+target.rows[0].slug+'/memories#upload='+token,expiresAt:input.expiresAt};
 });}
 async revoke(actor:Actor,id:string,grantId:string){return this.store.transaction(async tx=>{requireCapability(await this.store.tenant(actor,id,tx),'publish');const r=await tx.query('update std_upload_grants set revoked_at=coalesce(revoked_at,now()) where wedding_id=$1 and id=$2 returning id',[id,grantId]);if(!r.rowCount)throw notFound();await this.store.audit(tx,id,actor.userId,'upload.grant_revoked',grantId);return {revoked:true};});}
 async exchange(slug:string,credential:string,sessionHash:string){return this.store.transaction(async tx=>{
  const r=await tx.query("select g.* from std_upload_grants g join std_weddings w on w.id=g.wedding_id join std_albums a on a.wedding_id=g.wedding_id and a.id=g.album_id where w.slug=$1 and w.deleted_at is null and w.lifecycle<>'archived' and a.deleted_at is null and g.revoked_at is null and g.expires_at>now() and (g.token_hash=$2 or g.code_hash=$2 or g.code_hash=$3) for share of g",[slug,this.hash('upload:'+credential),this.hash('upload:'+credential.toUpperCase())]);
  if(!r.rowCount)throw new DomainError(401,'UPLOAD_ACCESS_REQUIRED','This upload code is invalid or expired');const g=r.rows[0],id=randomUUID();
  await tx.query("insert into std_upload_sessions(id,wedding_id,token_hash,upload_grant_id,expires_at,file_limit,byte_limit) values($1,$2,$3,$4,least($5,now()+interval '1 day'),$6,$7)",[id,g.wedding_id,sessionHash,g.id,g.expires_at,g.session_file_limit,g.session_byte_limit]);return {signedIn:true};
 });}
 async fromGuest(guest:GuestSession,sessionHash:string){return this.store.transaction(async tx=>{
  const valid=await tx.query("select g.expires_at from std_guest_grants g join std_guest_sessions s on s.grant_id=g.id where g.id=$1 and s.id=$2 and g.wedding_id=$3 and g.revoked_at is null and g.expires_at>now() and s.expires_at>now() for share of g",[guest.grantId,guest.id,guest.weddingId]);if(!valid.rowCount)throw notFound();
  await tx.query("insert into std_upload_sessions(id,wedding_id,token_hash,guest_grant_id,expires_at,file_limit,byte_limit) values($1,$2,$3,$4,least($5,now()+interval '1 day'),20,524288000)",[randomUUID(),guest.weddingId,sessionHash,guest.grantId,valid.rows[0].expires_at]);return {signedIn:true};
 });}
 async authenticate(hash:string){const r=await this.store.pool.query('select id,wedding_id from std_upload_sessions where token_hash=$1',[hash]);if(!r.rowCount)throw new DomainError(401,'UPLOAD_ACCESS_REQUIRED','Enter an upload code or use your private invitation');return this.validate(r.rows[0].id,r.rows[0].wedding_id);}
 async validate(id:string,weddingId:string,tx?:PoolClient):Promise<UploadSession>{
  const r=await (tx??this.store.pool).query("select s.*,w.slug,g.album_id from std_upload_sessions s join std_weddings w on w.id=s.wedding_id left join std_upload_grants g on g.id=s.upload_grant_id left join std_guest_grants r on r.id=s.guest_grant_id left join std_parties p on p.wedding_id=r.wedding_id and p.id=r.party_id where s.id=$1 and s.wedding_id=$2 and s.expires_at>now() and w.deleted_at is null and w.lifecycle<>'archived' and ((g.id is not null and g.revoked_at is null and g.expires_at>now()) or (r.id is not null and r.revoked_at is null and r.expires_at>now() and p.deleted_at is null))"+(tx?' for update of s for share of w':''),[id,weddingId]);if(!r.rowCount)throw new DomainError(401,'UPLOAD_ACCESS_REQUIRED','Upload access expired or was revoked');const s=r.rows[0];
  if(tx){const table=s.upload_grant_id?'std_upload_grants':'std_guest_grants',grant=s.upload_grant_id??s.guest_grant_id;const locked=await tx.query('select id from '+table+' where id=$1 and revoked_at is null and expires_at>now() for share',[grant]);if(!locked.rowCount)throw new DomainError(401,'UPLOAD_ACCESS_REQUIRED','Upload access was revoked');}
  const albums=await (tx??this.store.pool).query('select id,title from std_albums where wedding_id=$1 and deleted_at is null and (($2::uuid is not null and id=$2) or ($2::uuid is null and guest_uploads)) order by position,title',[weddingId,s.album_id]);
  return {id:s.id,weddingId,slug:s.slug,albumIds:albums.rows.map(a=>a.id),albums:albums.rows,filesUsed:s.files_reserved,bytesUsed:Number(s.bytes_reserved),fileLimit:s.file_limit,byteLimit:Number(s.byte_limit)};
 }
 async logout(hash:string){await this.store.pool.query('update std_upload_sessions set expires_at=now() where token_hash=$1',[hash]);return {signedOut:true};}
}
