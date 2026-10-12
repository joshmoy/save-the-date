import type {StoragePort} from './index.js';
export interface DeletionRecord {weddingId:string;state:'requested'|'recovered'|'erased';eraseAfter:string;recordedAt:string}
export interface AccountDeletionRecord {userId:string;eraseAfter:string;recordedAt:string}
export interface DeletionLedgerPort {writeAccount(record:AccountDeletionRecord):Promise<void>;accounts():AsyncIterable<AccountDeletionRecord>;write(record:DeletionRecord):Promise<void>;records():AsyncIterable<DeletionRecord>}
/** Keep this storage outside the database/object backup rollback boundary. */
export class ObjectDeletionLedger implements DeletionLedgerPort {
 constructor(private storage:StoragePort){}
 async writeAccount(record:AccountDeletionRecord){if(!/^[a-f0-9-]{36}$/.test(record.userId))throw Error('INVALID_DELETION_ID');await this.storage.write('account-deletion-ledger/'+record.userId+'/state',Buffer.from(JSON.stringify(record)),'application/json');}
 async *accounts(){for await(const key of this.storage.list('account-deletion-ledger/')){const r=JSON.parse((await this.storage.read(key)).toString()) as AccountDeletionRecord;if(!/^[a-f0-9-]{36}$/.test(r.userId)||!Number.isFinite(Date.parse(r.eraseAfter)))throw Error('INVALID_DELETION_LEDGER');yield r;}}
 async write(record:DeletionRecord){if(!/^[a-f0-9-]{36}$/.test(record.weddingId))throw Error('INVALID_DELETION_ID');await this.storage.write('deletion-ledger/'+record.weddingId+'/state',Buffer.from(JSON.stringify(record)),'application/json');}
 async *records(){for await(const key of this.storage.list('deletion-ledger/')){const r=JSON.parse((await this.storage.read(key)).toString()) as DeletionRecord;if(!/^[a-f0-9-]{36}$/.test(r.weddingId)||!['requested','recovered','erased'].includes(r.state)||!Number.isFinite(Date.parse(r.eraseAfter)))throw Error('INVALID_DELETION_LEDGER');yield r;}}
}
