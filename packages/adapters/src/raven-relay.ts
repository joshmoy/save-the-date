import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from '@save-the-date/contracts';
import type { EmailMessage, EmailPort } from './index.js';

export class EmailAdapterError extends Error {
 constructor(code:string,readonly retryable=false){super(code);}
}
const receiptSchema=z.object({id:z.string().min(1).max(200),status:z.enum(['queued','suppressed']),test_mode:z.boolean().optional()});
export const ravenEventSchema=z.object({id:z.string().min(1).max(200),type:z.enum(['email.sent','email.delivered','email.bounced','email.complained','email.rejected','email.failed','email.delayed','email.suppressed']),created_at:z.iso.datetime(),data:z.object({email_id:z.string().min(1).max(200),project_id:z.string().min(1).max(200),status:z.enum(['sent','delivered','soft_bounced','hard_bounced','complained','rejected','failed','delayed','suppressed']),recipients:z.array(z.email()).min(1).max(50),failure_code:z.string().max(200).optional(),error_code:z.string().max(200).optional()})});
export type RavenEvent=z.infer<typeof ravenEventSchema>;

// SDK and service details stay inside this adapter. One recipient per application message.
export class RavenRelayEmail implements EmailPort {
 readonly capabilities={idempotent:true,deliveryEvents:true};
 constructor(private apiKey:string,private from:string,private baseUrl='https://api-production-1c6a.up.railway.app',private request:typeof fetch=fetch){}
 async send(message:EmailMessage){
  let response:Response;
  try{response=await this.request(new URL('/v1/emails',this.baseUrl),{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${this.apiKey}`,'Content-Type':'application/json','Idempotency-Key':message.id},body:JSON.stringify({from:this.from,to:[message.to],subject:message.subject,text:message.text})});}
  catch{throw new EmailAdapterError('RAVEN_SUBMISSION_RETRY',true);}
  if(!response.ok)throw new EmailAdapterError(response.status===409?'EMAIL_IDEMPOTENCY_CONFLICT':response.status===429?'EMAIL_RATE_LIMITED':response.status>=500?'RAVEN_SUBMISSION_RETRY':'EMAIL_REJECTED',response.status===429||response.status>=500);
  let receipt:z.infer<typeof receiptSchema>;
  try{receipt=receiptSchema.parse(await response.json());}catch{throw new EmailAdapterError('RAVEN_SUBMISSION_RETRY',true);}
  return {state:receipt.status==='suppressed'?'failed' as const:'provider_queued' as const,providerId:receipt.id};
 }
}

export function verifyRavenEvent(raw:Buffer,headers:{timestamp:string;signature:string;eventId:string},secret:string,projectId:string,now=Date.now()):RavenEvent{
 if(!/^\d{1,12}$/.test(headers.timestamp)||Math.abs(now/1000-Number(headers.timestamp))>300||!/^v1=[a-f0-9]{64}$/.test(headers.signature))throw new EmailAdapterError('INVALID_WEBHOOK');
 const expected=createHmac('sha256',secret).update(headers.timestamp+'.').update(raw).digest();
 if(!timingSafeEqual(expected,Buffer.from(headers.signature.slice(3),'hex')))throw new EmailAdapterError('INVALID_WEBHOOK');
 const event=ravenEventSchema.parse(JSON.parse(raw.toString('utf8')));
 const types:Record<string,string[]>={'email.sent':['sent'],'email.delivered':['delivered'],'email.bounced':['soft_bounced','hard_bounced'],'email.complained':['complained'],'email.rejected':['rejected'],'email.failed':['failed'],'email.delayed':['delayed'],'email.suppressed':['suppressed']};
 if(event.id!==headers.eventId||event.data.project_id!==projectId||!types[event.type]?.includes(event.data.status))throw new EmailAdapterError('INVALID_WEBHOOK');
 return event;
}
