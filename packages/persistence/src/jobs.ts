import { type Job, type JobTransportPort, type EmailPort, type EmailMessage } from '@save-the-date/adapters';
import { EmailAdapterError,CreativeProviderError } from '@save-the-date/adapters';
import { PostgresNotifications } from './notifications.js';
import { PostgresStore } from './index.js';
export class PostgresJobs implements JobTransportPort {
 constructor(private store:PostgresStore){}
 async lease(owner:string):Promise<Job|null>{const r=await this.store.pool.query("update std_jobs set state='leased',lease_owner=$1,lease_until=now()+interval '60 seconds',attempts=attempts+1,updated_at=now() where id=(select id from std_jobs where (state='pending' and retry_at<=now()) or (state in ('leased','running') and lease_until<now()) order by created_at for update skip locked limit 1) returning *",[owner]);if(!r.rowCount)return null;const j=r.rows[0];return {id:j.id,weddingId:j.wedding_id,type:j.type,payload:j.payload,attempts:j.attempts,leaseOwner:owner,requestedBy:j.requested_by};}
 async ack(job:Job,result:unknown){await this.store.pool.query("update std_jobs set state='succeeded',result=$3,lease_until=null,updated_at=now() where id=$1 and lease_owner=$2 and state in ('leased','running')",[job.id,job.leaseOwner,JSON.stringify(result)]);}
 async fail(job:Job,code:string,retryable:boolean){await this.store.pool.query("update std_jobs set state=$3,error_code=$4,retry_at=now()+($5*interval '1 second'),lease_until=null,updated_at=now() where id=$1 and lease_owner=$2 and state in ('leased','running')",[job.id,job.leaseOwner,(code==='UNCERTAIN_SEND'||code==='AI_SUBMISSION_UNCERTAIN'||code==='AI_PROVIDER_UNAVAILABLE')?'unknown_external':retryable&&job.attempts<5?'pending':'failed',code,Math.min(300,2**job.attempts)]);}
 async processOne(owner:string,email:EmailPort,handlers:Record<string,(job:Job)=>Promise<unknown>>={}){const job=await this.lease(owner);if(!job)return false;
  try{
   if(job.type!=='email'){const handler=handlers[job.type];if(!handler)throw new Error('UNSUPPORTED_JOB');const heartbeat=setInterval(()=>{void this.store.pool.query("update std_jobs set lease_until=now()+interval '60 seconds' where id=$1 and lease_owner=$2 and state in ('leased','running')",[job.id,owner]).catch(()=>{});},20000);try{await this.ack(job,await handler(job));}finally{clearInterval(heartbeat);}return true;}
   const message=job.payload as EmailMessage;
   // Persist the send intent before calling a provider. Expired leases must not resend an uncertain effect.
   const allowed=await this.store.transaction(async tx=>{
    const j=await tx.query("select * from std_jobs where id=$1 and lease_owner=$2 and state='leased' for update",[job.id,owner]);if(!j.rowCount)return false;
    const r=await tx.query('select state from std_email_messages where id=$1 for update',[message.id]);if(!r.rowCount)return false;
    if(['provider_queued','accepted','delivered','bounced','complained','delayed'].includes(r.rows[0].state))return false;
    if(r.rows[0].state==='unknown'&&!email.capabilities.idempotent)throw new Error('UNCERTAIN_SEND');
    if(job.weddingId){const w=await tx.query('select deleted_at from std_weddings where id=$1',[job.weddingId]);if(!w.rowCount||w.rows[0].deleted_at)return false;}
    if(message.context){const pass=await tx.query("select id from std_passes where wedding_id=$1 and id=$2 and version=$3 and status='active'",[job.weddingId,message.context.passId,message.context.passVersion]);if(!pass.rowCount)throw new Error('STALE_PASS_DELIVERY');if(j.rows[0].requested_by){const permission=await tx.query("select role from std_memberships where wedding_id=$1 and user_id=$2 and role in ('owner','co_owner')",[job.weddingId,j.rows[0].requested_by]);if(!permission.rowCount)throw new Error('PASS_DELIVERY_PERMISSION_REVOKED');}}
    await tx.query("update std_email_messages set state='unknown',updated_at=now() where id=$1",[message.id]);return true;
   });
   if(allowed){const result=await email.send(message);await new PostgresNotifications(this.store).submitted(message.id,result.state,result.providerId);await this.ack(job,result);}else await this.ack(job,{skipped:true});
  }catch(e){const code=e instanceof CreativeProviderError&&e.uncertain?'AI_SUBMISSION_UNCERTAIN':e instanceof Error?e.message:'JOB_FAILED';await this.fail(job,code,e instanceof EmailAdapterError&&e.retryable);if(job.type==='email')await this.store.pool.query('update std_email_messages set state=$2,error_code=$3,updated_at=now() where id=$1',[(job.payload as EmailMessage).id,code==='UNCERTAIN_SEND'||e instanceof EmailAdapterError&&e.retryable?'unknown':'failed',code]);}
  return true;
 }
}
