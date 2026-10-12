import {createHash,randomUUID} from 'node:crypto';
import type { PoolClient } from 'pg';
import type { RavenEvent } from '@save-the-date/adapters';
import {DomainError,notFound,requireCapability,type Actor,type NotificationRepository} from '@save-the-date/domain';
import { PostgresStore } from './index.js';
import type {EmailMessage} from '@save-the-date/adapters';

export class PostgresNotifications implements NotificationRepository {
 constructor(private store:PostgresStore){}
 async list(actor:Actor,id:string,cursor?:string){requireCapability(await this.store.tenant(actor,id),'members');const rows=await this.store.pool.query(`select m.id,m.recipient,m.subject,m.state,m.created_at,m.updated_at,m.retry_of,
 case when m.error_code ~ '^[A-Z0-9_]{1,80}$' then m.error_code else null end as error_code,
 (m.state='failed' and not exists(select 1 from std_email_messages r where r.retry_of=m.id) and exists(select 1 from std_jobs j where j.type='email' and j.wedding_id=m.wedding_id and j.payload->>'id'=m.id::text)) as can_retry
 from std_email_messages m where m.wedding_id=$1 and ($2::uuid is null or (m.created_at,m.id)<(select created_at,id from std_email_messages where wedding_id=$1 and id=$2)) order by m.created_at desc,m.id desc limit 51`,[id,cursor??null]);return {messages:rows.rows.slice(0,50),nextCursor:rows.rows.length>50?rows.rows[49].id:null};}
 async retry(actor:Actor,id:string,messageId:string,recipient:string,key:string){requireCapability(await this.store.tenant(actor,id),'members');await this.store.rateLimit('notification-retry:'+id,20);return this.store.transaction(async tx=>{await tx.query('select id from std_weddings where id=$1 for update',[id]);requireCapability(await this.store.tenant(actor,id,tx),'members');const requestHash=createHash('sha256').update(JSON.stringify({messageId,recipient})).digest('hex');const previous=await tx.query("select request_hash,result from std_operation_keys where wedding_id=$1 and actor_id=$2 and operation='email-retry' and key=$3",[id,actor.userId,key]);if(previous.rowCount){if(previous.rows[0].request_hash!==requestHash)throw new DomainError(409,'IDEMPOTENCY_CONFLICT','The reviewed message changed');return previous.rows[0].result;}const old=await tx.query('select * from std_email_messages where wedding_id=$1 and id=$2 for update',[id,messageId]);if(!old.rowCount)throw notFound();if(old.rows[0].state!=='failed'||old.rows[0].recipient!==recipient)throw new DomainError(409,'RETRY_UNAVAILABLE','Only a definite failed send to the reviewed recipient can be retried');const existing=await tx.query('select id from std_email_messages where retry_of=$1',[messageId]);if(existing.rowCount)throw new DomainError(409,'RETRY_ALREADY_QUEUED','This failed attempt already has a retry; refresh delivery history');const job=await tx.query("select payload from std_jobs where wedding_id=$1 and type='email' and payload->>'id'=$2 order by created_at desc limit 1",[id,messageId]);if(!job.rowCount)throw new DomainError(409,'RETRY_UNAVAILABLE','Message contents are no longer retained');const message:EmailMessage={...job.rows[0].payload,id:randomUUID()};await validateEmailContext(tx,message,id,actor.userId);await tx.query('insert into std_email_messages(id,wedding_id,recipient,subject,retry_of) values($1,$2,$3,$4,$5)',[message.id,id,recipient,message.subject,messageId]);await tx.query("insert into std_jobs(id,wedding_id,requested_by,type,dedupe_key,payload) values($1,$2,$3,'email',$4,$5)",[randomUUID(),id,actor.userId,'email:'+message.id,message]);const result={id:message.id,queued:true};await tx.query("insert into std_operation_keys(wedding_id,actor_id,operation,key,request_hash,result) values($1,$2,'email-retry',$3,$4,$5)",[id,actor.userId,key,requestHash,result]);await this.store.audit(tx,id,actor.userId,'notification.retried',messageId,{retryId:message.id});return result;});}
 async receive(event:RavenEvent){await this.store.transaction(async tx=>{
  await tx.query('select pg_advisory_xact_lock(hashtext($1))',['email:'+event.data.email_id]);if((await tx.query("select 1 from std_erased_provider_refs where adapter='ravenrelay' and provider_hash=$1",[createHash('sha256').update(event.data.email_id).digest('hex')])).rowCount)return;
  await tx.query("insert into std_provider_inbox(adapter,event_id,provider_id,status,occurred_at,recipients,failure_code) values('ravenrelay',$1,$2,$3,$4,$5,$6) on conflict do nothing",[event.id,event.data.email_id,event.data.status,event.created_at,event.data.recipients,event.data.failure_code??event.data.error_code??null]);
  await this.reconcile(tx,event.data.email_id);
 });}
 async submitted(id:string,state:string,providerId:string){await this.store.transaction(async tx=>{
  await tx.query('select pg_advisory_xact_lock(hashtext($1))',['email:'+providerId]);
  await tx.query('update std_email_messages set state=$2,provider_id=$3,updated_at=now() where id=$1 and provider_event_at is null',[id,state,providerId]);
  await this.reconcile(tx,providerId);
 });}
 private async reconcile(tx:PoolClient,providerId:string){
  const messages=await tx.query('select * from std_email_messages where provider_id=$1 for update',[providerId]);
  if(!messages.rowCount)return; // Delivery may race the submission acknowledgement.
  const events=await tx.query("select * from std_provider_inbox where adapter='ravenrelay' and provider_id=$1 and processed_at is null order by occurred_at,event_id for update",[providerId]);
  for(const event of events.rows){
   for(const m of messages.rows){
    if(!event.recipients.includes(m.recipient))continue;
    const target=event.status==='sent'?'accepted':event.status==='delivered'?'delivered':event.status==='hard_bounced'?'bounced':event.status==='complained'?'complained':event.status==='soft_bounced'||event.status==='delayed'?'delayed':event.failure_code==='delivery_unknown'?'unknown':'failed';
    const sticky=['bounced','complained'].includes(m.state);
    const newer=!m.provider_event_at||new Date(event.occurred_at)>=new Date(m.provider_event_at);
    if((!sticky&&(target==='bounced'||target==='complained'||newer&&(m.state!=='delivered'||target==='delivered')))||(m.state==='bounced'&&target==='complained')){
     await tx.query('update std_email_messages set state=$2,provider_event_at=$3,error_code=$4,updated_at=now() where id=$1',[m.id,target,event.occurred_at,event.failure_code]);
     m.state=target;m.provider_event_at=event.occurred_at;
    }
   }
   await tx.query("update std_provider_inbox set processed_at=now() where adapter='ravenrelay' and event_id=$1",[event.event_id]);
  }
 }
}

// Current resource validity is checked immediately before submitting any private link.
export async function validateEmailContext(tx:PoolClient,message:EmailMessage,weddingId?:string|null,requestedBy?:string|null){const c=message.context;if(!c){if(['Verify your Save The Date account','Recover your Save The Date account','You are invited to a wedding workspace','Your private wedding invitation','Wedding response saved','Your private entry pass is ready','Your wedding service expiry is approaching'].includes(message.subject))throw new DomainError(409,'DELIVERY_CONTEXT_MISSING','Create a fresh current notification before sending an older queued link');return;}
 if(c.identityTokenId&&!(await tx.query('select 1 from std_identity_tokens t join std_users u on u.id=t.user_id where t.id=$1 and t.consumed_at is null and t.expires_at>now() and u.deleted_at is null and u.email=$2',[c.identityTokenId,message.to])).rowCount)throw new DomainError(409,'STALE_IDENTITY_DELIVERY','The account link is no longer current');
 if(weddingId&&requestedBy&&!(await tx.query("select 1 from std_memberships where wedding_id=$1 and user_id=$2 and role in ('owner','co_owner')",[weddingId,requestedBy])).rowCount)throw new DomainError(409,'DELIVERY_PERMISSION_REVOKED','The sender no longer has permission');
 if(c.passId&&!(await tx.query("select 1 from std_passes p join std_events e on e.wedding_id=p.wedding_id and e.id=p.event_id where p.wedding_id=$1 and p.id=$2 and p.version=$3 and p.status='active' and (e.admission_ends_at is null or e.admission_ends_at>now()) and exists(select 1 from std_attendees a join std_attendees contact on contact.wedding_id=a.wedding_id and contact.party_id=a.party_id where a.wedding_id=p.wedding_id and a.id=p.attendee_id and a.deleted_at is null and contact.deleted_at is null and contact.email=$4)",[weddingId,c.passId,c.passVersion,message.to])).rowCount)throw new DomainError(409,'STALE_PASS_DELIVERY','The entry pass is no longer current');
 if(c.guestGrantId&&!(await tx.query('select 1 from std_guest_grants g join std_attendees a on a.wedding_id=g.wedding_id and a.party_id=g.party_id where g.wedding_id=$1 and g.id=$2 and g.revoked_at is null and g.expires_at>now() and a.email=$3 and a.deleted_at is null',[weddingId,c.guestGrantId,message.to])).rowCount)throw new DomainError(409,'STALE_GUEST_DELIVERY','The household access or recipient changed');
 if(c.memberInviteId&&!(await tx.query('select 1 from std_member_invites where wedding_id=$1 and id=$2 and email=$3 and revoked_at is null and accepted_at is null and expires_at>now()',[weddingId,c.memberInviteId,message.to])).rowCount)throw new DomainError(409,'STALE_MEMBER_DELIVERY','The collaborator invitation changed');
 if(c.retentionExpiry&&!(await tx.query("select 1 from std_weddings w join std_memberships m on m.wedding_id=w.id join std_users u on u.id=m.user_id where w.id=$1 and w.service_expires_at=$2::timestamptz and m.role in ('owner','co_owner') and u.email=$3 and u.deleted_at is null",[weddingId,c.retentionExpiry,message.to])).rowCount)throw new DomainError(409,'STALE_RETENTION_DELIVERY','The service date or owner changed');
}
