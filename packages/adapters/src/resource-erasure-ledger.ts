import {z} from '@save-the-date/contracts';
import type {StoragePort} from './index.js';
const schema=z.object({version:z.literal(1),kind:z.enum(['media','guest','post','member','rsvp_answers']),weddingId:z.uuid().transform(v=>v.toLowerCase()),resourceId:z.uuid().transform(v=>v.toLowerCase()),recordedAt:z.iso.datetime()}).strict();
export type ResourceErasureRecord=z.infer<typeof schema>;
export interface ResourceErasureLedgerPort {write(record:ResourceErasureRecord):Promise<void>;records():AsyncIterable<ResourceErasureRecord>;eraseWedding(weddingId:string):Promise<void>}
/** Minimal deletion/revocation markers, outside the database and object-backup rollback boundary. */
export class ObjectResourceErasureLedger implements ResourceErasureLedgerPort {
 constructor(private storage:StoragePort){}
 private key(record:ResourceErasureRecord){return 'resource-erasure-ledger/'+record.weddingId+'/'+record.kind+'/'+record.resourceId;}
 async write(input:ResourceErasureRecord){const record=schema.parse(input);await this.storage.write(this.key(record),Buffer.from(JSON.stringify(record)),'application/json');}
 async *records(){for await(const key of this.storage.list('resource-erasure-ledger/')){const record=schema.parse(JSON.parse((await this.storage.read(key)).toString()));if(key!==this.key(record))throw Error('RESOURCE_ERASURE_SCOPE');yield record;}}
 async eraseWedding(weddingId:string){for await(const key of this.storage.list('resource-erasure-ledger/'+z.uuid().transform(v=>v.toLowerCase()).parse(weddingId)+'/'))await this.storage.delete(key);}
}
