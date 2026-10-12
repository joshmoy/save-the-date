import {createHash} from 'node:crypto';
import type { PoolClient } from 'pg';
import type { RavenEvent } from '@save-the-date/adapters';
import type { NotificationRepository } from '@save-the-date/domain';
import { PostgresStore } from './index.js';

export class PostgresNotifications implements NotificationRepository {
 constructor(private store:PostgresStore){}
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
