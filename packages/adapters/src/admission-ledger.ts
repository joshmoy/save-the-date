import {z} from '@save-the-date/contracts';
import type {StoragePort} from './index.js';
const schema=z.object({version:z.literal(1),state:z.enum(['intent','committed']),weddingId:z.uuid().transform(v=>v.toLowerCase()),passId:z.uuid().transform(v=>v.toLowerCase()),eventId:z.uuid().transform(v=>v.toLowerCase()),attendeeId:z.uuid().transform(v=>v.toLowerCase()),admissionId:z.uuid().transform(v=>v.toLowerCase()),actorId:z.uuid().transform(v=>v.toLowerCase()),operationKey:z.uuid().transform(v=>v.toLowerCase()),passVersion:z.number().int().positive(),recordedAt:z.iso.datetime()}).strict();
export type AdmissionLedgerRecord=z.infer<typeof schema>;
export interface AdmissionLedgerPort {get(weddingId:string,passId:string):Promise<AdmissionLedgerRecord|null>;write(record:AdmissionLedgerRecord):Promise<void>;records():AsyncIterable<AdmissionLedgerRecord>;eraseWedding(weddingId:string):Promise<void>;discardIntent(weddingId:string,passId:string):Promise<void>}
/** Independent private recovery state. Contains no names, contacts, QR secrets or token hashes. */
export class ObjectAdmissionLedger implements AdmissionLedgerPort {
 constructor(private storage:StoragePort){}
 private key(weddingId:string,passId:string){return 'admission-ledger/'+z.uuid().transform(v=>v.toLowerCase()).parse(weddingId)+'/'+z.uuid().transform(v=>v.toLowerCase()).parse(passId);}
 async get(weddingId:string,passId:string){let bytes:Buffer;try{bytes=await this.storage.read(this.key(weddingId,passId));}catch(error){const value=error as {code?:string;name?:string;$metadata?:{httpStatusCode?:number}};if(value.code==='ENOENT'||value.name==='NoSuchKey'||value.$metadata?.httpStatusCode===404)return null;throw Error('ADMISSION_LEDGER_UNAVAILABLE');}const record=schema.parse(JSON.parse(bytes.toString()));if(record.weddingId!==weddingId.toLowerCase()||record.passId!==passId.toLowerCase())throw Error('ADMISSION_LEDGER_SCOPE');return record;}
 async write(input:AdmissionLedgerRecord){const record=schema.parse(input);await this.storage.write(this.key(record.weddingId,record.passId),Buffer.from(JSON.stringify(record)),'application/json');}
 async *records(){for await(const key of this.storage.list('admission-ledger/')){const record=schema.parse(JSON.parse((await this.storage.read(key)).toString()));if(key!==this.key(record.weddingId,record.passId))throw Error('ADMISSION_LEDGER_SCOPE');yield record;}}
 async discardIntent(weddingId:string,passId:string){const current=await this.get(weddingId,passId);if(current?.state==='committed')throw Error('ADMISSION_CONFIRMED');if(current)await this.storage.delete(this.key(weddingId,passId));}
 async eraseWedding(weddingId:string){const prefix='admission-ledger/'+z.uuid().transform(v=>v.toLowerCase()).parse(weddingId)+'/';for await(const key of this.storage.list(prefix))await this.storage.delete(key);}
}
