import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
export interface ObjectMetadata { bytes:number; checksum:string; contentType:string }
export interface StoragePort {
 readonly capabilities: { privateObjects:boolean; immediateGatewayRevocation:boolean };
 write(key:string,bytes:Buffer,contentType:string):Promise<ObjectMetadata>;
 read(key:string):Promise<Buffer>;
 inspect(key:string):Promise<ObjectMetadata>;
 delete(key:string):Promise<void>;
}
export function storageKey(namespace:string,weddingId:string,assetId:string){
 if(!/^[a-z0-9-]+$/.test(namespace)||![weddingId,assetId].every(v=>/^[a-f0-9-]{36}$/.test(v)))throw new Error('Invalid object identifiers');
 return `${namespace}/${weddingId}/${assetId}`;
}
function safeKey(key:string){if(!/^[a-zA-Z0-9/_-]+$/.test(key)||key.includes('..')||key.startsWith('/'))throw new Error('Unsafe object key');return key;}
export class FilesystemStorage implements StoragePort {
 readonly capabilities={privateObjects:true,immediateGatewayRevocation:true};
 constructor(private root:string){}
 private file(key:string){return path.join(this.root,safeKey(key));}
 async write(key:string,bytes:Buffer,contentType:string){const f=this.file(key);await mkdir(path.dirname(f),{recursive:true,mode:0o700});const tmp=f+'.tmp-'+crypto.randomUUID();await writeFile(tmp,bytes,{mode:0o600});await rename(tmp,f);const metadata={bytes:bytes.length,checksum:createHash('sha256').update(bytes).digest('hex'),contentType};await writeFile(f+'.metadata',JSON.stringify(metadata),{mode:0o600});return metadata;}
 async read(key:string){return readFile(this.file(key));}
 async inspect(key:string){const m=JSON.parse(await readFile(this.file(key)+'.metadata','utf8')) as ObjectMetadata;const s=await stat(this.file(key));if(s.size!==m.bytes)throw new Error('Object metadata mismatch');return m;}
 async delete(key:string){await rm(this.file(key),{force:true});await rm(this.file(key)+'.metadata',{force:true});}
}
export class S3Storage implements StoragePort {
 readonly capabilities={privateObjects:true,immediateGatewayRevocation:true};
 constructor(private client:S3Client,private bucket:string){}
 async write(key:string,bytes:Buffer,contentType:string){const checksum=createHash('sha256').update(bytes).digest('hex');await this.client.send(new PutObjectCommand({Bucket:this.bucket,Key:safeKey(key),Body:bytes,ContentType:contentType,Metadata:{sha256:checksum}}));return {bytes:bytes.length,checksum,contentType};}
 async read(key:string){const r=await this.client.send(new GetObjectCommand({Bucket:this.bucket,Key:safeKey(key)}));if(!r.Body)throw new Error('Object missing');return Buffer.from(await r.Body.transformToByteArray());}
 async inspect(key:string){const r=await this.client.send(new HeadObjectCommand({Bucket:this.bucket,Key:safeKey(key)}));return {bytes:r.ContentLength??0,checksum:r.Metadata?.sha256??'',contentType:r.ContentType??'application/octet-stream'};}
 async delete(key:string){await this.client.send(new DeleteObjectCommand({Bucket:this.bucket,Key:safeKey(key)}));}
}
export function createStorage(config:{STORAGE_ADAPTER:'filesystem'|'s3';STORAGE_ROOT:string;S3_BUCKET?:string;S3_ENDPOINT?:string;S3_REGION?:string;S3_ACCESS_KEY_ID?:string;S3_SECRET_ACCESS_KEY?:string}):StoragePort{
 if(config.STORAGE_ADAPTER==='filesystem')return new FilesystemStorage(config.STORAGE_ROOT);
 if(!config.S3_BUCKET||!config.S3_ACCESS_KEY_ID||!config.S3_SECRET_ACCESS_KEY)throw Error('S3 storage requires bucket and credentials');
 return new S3Storage(new S3Client({endpoint:config.S3_ENDPOINT,region:config.S3_REGION??'auto',forcePathStyle:true,credentials:{accessKeyId:config.S3_ACCESS_KEY_ID,secretAccessKey:config.S3_SECRET_ACCESS_KEY}}),config.S3_BUCKET);
}
export interface EmailMessage { id:string; to:string; subject:string; text:string; context?:{passId:string;passVersion:number} }
export interface EmailPort { readonly capabilities:{idempotent:boolean;deliveryEvents:boolean}; send(message:EmailMessage):Promise<{state:'accepted'|'unknown'|'provider_queued'|'failed';providerId:string}> }
export class CaptureEmail implements EmailPort {
 readonly capabilities={idempotent:true,deliveryEvents:false};
 constructor(private root:string){}
 async send(m:EmailMessage){if(!/^[a-f0-9-]{36}$/.test(m.id))throw new Error('Invalid message ID');await mkdir(this.root,{recursive:true,mode:0o700});await writeFile(path.join(this.root,m.id+'.json'),JSON.stringify(m,null,2),{mode:0o600});return {state:'accepted' as const,providerId:m.id};}
}
export class MailerooEmail implements EmailPort {
 readonly capabilities={idempotent:false,deliveryEvents:false};
 constructor(private apiKey:string,private from:string){}
 async send(m:EmailMessage){
  try{const r=await fetch('https://smtp.maileroo.com/api/v2/emails',{method:'POST',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${this.apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from:{address:this.from},to:{address:m.to},subject:m.subject,plain:m.text,tracking:false})});
   if(!r.ok)throw new Error(r.status>=500?'UNCERTAIN_SEND':'EMAIL_REJECTED');
   const body=await r.json() as {success?:boolean;data?:{reference_id?:string}};if(body.success===false)throw new Error('EMAIL_REJECTED');return {state:'accepted' as const,providerId:body.data?.reference_id??m.id};
  }catch(e){if(e instanceof Error&&e.message==='EMAIL_REJECTED')throw e;throw new Error('UNCERTAIN_SEND');}
 }
}
export interface LanguageModelPort { generate(input:{context:unknown;schemaVersion:number;deadline:Date}):Promise<{output:unknown;provider:string;model:string;usage:unknown}> }
export interface ImageGenerationPort { generate(input:{prompt:string;referenceKeys:string[];deadline:Date}):Promise<{key:string;provenance:unknown}> }
export class DisabledLanguageModel implements LanguageModelPort {async generate():Promise<never>{throw new Error('AI_DISABLED');}}
export interface Job {id:string;weddingId:string|null;type:string;payload:unknown;attempts:number;leaseOwner:string}
export interface JobTransportPort { lease(owner:string):Promise<Job|null>; ack(job:Job,result:unknown):Promise<void>; fail(job:Job,code:string,retryable:boolean):Promise<void> }

// Password and opaque credential primitives remain adapter-owned.
export * from './credentials.js';
export * from './raven-relay.js';
export * from './media-processing.js';
export * from './invitation-export.js';
export * from './encryption.js';
export * from './malware.js';
