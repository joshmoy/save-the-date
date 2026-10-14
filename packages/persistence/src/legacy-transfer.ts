import {createHash,randomUUID} from 'node:crypto';
import {legacyMappingSchema} from '@save-the-date/contracts';
import {DomainError,notFound,requireRecentAuthentication,type Actor} from '@save-the-date/domain';
import type {PoolClient} from 'pg';
import type {AdmissionLedgerRecord} from '@save-the-date/adapters';
import type {PostgresStore} from './index.js';
import {PostgresLegacyPlanner} from './legacy-plan.js';
import {withFrozenLegacySource,reconcileLegacySnapshot,type LegacySnapshot} from './legacy-snapshot.js';

/** Historical transfer only. Admission remains held; no old credential or role becomes active. */
export class PostgresLegacyTransfer{
 constructor(private store:PostgresStore){}
 private async primary(actor:Actor,id:string,tx?:PoolClient){const row=(await (tx??this.store.pool).query("select w.ownership_recovery_hold from std_weddings w join std_memberships m on m.wedding_id=w.id and m.user_id=w.primary_owner_id join std_users u on u.id=m.user_id where w.id=$1 and w.primary_owner_id=$2 and m.role='owner' and w.deleted_at is null and u.deleted_at is null and u.verified_at is not null",[id,actor.userId])).rows[0];if(!row)throw notFound();if(row.ownership_recovery_hold)throw new DomainError(409,'RESTORED_OWNERSHIP_REVIEW_REQUIRED','Resolve restored ownership before transfer');}
 async transfer(actor:Actor,sourceConnection:string,snapshot:LegacySnapshot,input:unknown){
  requireRecentAuthentication(actor);const mapping=legacyMappingSchema.parse(input),mappingChecksum=createHash('sha256').update(JSON.stringify(mapping)).digest('hex');
  if(!this.store.admissionLedger)throw new DomainError(503,'ADMISSION_LEDGER_REQUIRED','Historical admissions require independent recovery storage');
  return withFrozenLegacySource(sourceConnection,snapshot,async()=>{
   const previous=(await this.store.pool.query('select * from std_legacy_transfers where wedding_id=$1',[mapping.weddingId])).rows[0];
   await this.primary(actor,mapping.weddingId);
   let plan:Awaited<ReturnType<PostgresLegacyPlanner['plan']>>;
   if(previous){if(previous.created_by!==actor.userId||previous.source_checksum!==mapping.sourceChecksum||previous.mapping_checksum!==mappingChecksum)throw new DomainError(409,'LEGACY_TRANSFER_CONFLICT','Review the existing held transfer');plan=previous.reconciliation;}
   else{
    plan=await new PostgresLegacyPlanner(this.store).plan(actor,snapshot,mapping);if(!plan.mappingComplete)throw new DomainError(409,'LEGACY_MAPPING_INCOMPLETE','Resolve all mapping exceptions before historical transfer');
    await this.store.transaction(async tx=>{await tx.query('select id from std_weddings where id=$1 for update',[mapping.weddingId]);await this.primary(actor,mapping.weddingId,tx);if((await tx.query("select id from std_events where wedding_id=$1 and admission_policy<>'disabled' limit 1",[mapping.weddingId])).rowCount)throw new DomainError(409,'LEGACY_TARGET_NOT_DISABLED','Disable all target event admission policies before transfer');if((await tx.query('select id from std_passes where wedding_id=$1 limit 1',[mapping.weddingId])).rowCount)throw new DomainError(409,'LEGACY_TARGET_NOT_EMPTY','Use a target without existing passes');await tx.query('insert into std_legacy_transfers(wedding_id,source_checksum,mapping_checksum,source_frozen_at,reconciliation,created_by) values($1,$2,$3,$4,$5,$6)',[mapping.weddingId,mapping.sourceChecksum,mappingChecksum,snapshot.fence!.frozenAt,plan,actor.userId]);});
   }
   const records:AdmissionLedgerRecord[]=plan.actions.filter(action=>action.usedAt).map(action=>({version:1,state:'intent',weddingId:mapping.weddingId,passId:action.sourcePassId,eventId:action.eventId,attendeeId:action.attendeeId,admissionId:action.sourcePassId,actorId:action.admittedByUserId!,operationKey:action.sourcePassId,passVersion:1,recordedAt:new Date().toISOString()}));
   for(const record of records){const existing=await this.store.admissionLedger!.get(record.weddingId,record.passId);if(existing&&(existing.eventId!==record.eventId||existing.attendeeId!==record.attendeeId||existing.actorId!==record.actorId))throw Error('LEGACY_LEDGER_LINEAGE_CONFLICT');if(!existing)await this.store.admissionLedger!.write(record);}
   await this.store.transaction(async tx=>{
    await tx.query('select id from std_weddings where id=$1 for update',[mapping.weddingId]);await this.primary(actor,mapping.weddingId,tx);const held=(await tx.query('select * from std_legacy_transfers where wedding_id=$1 for update',[mapping.weddingId])).rows[0];if(held.completed_at){
     for(const action of plan.actions){const row=(await tx.query('select p.*,a.admitted_at,a.actor_id as admission_actor from std_passes p left join std_admissions a on a.wedding_id=p.wedding_id and a.pass_id=p.id where p.wedding_id=$1 and p.id=$2',[mapping.weddingId,action.sourcePassId])).rows[0];if(!row||row.attendee_id!==action.attendeeId||row.event_id!==action.eventId||row.status!==(action.usedAt?'used':'revoked')||row.credential_hash!==null||row.manual_hash!==null||row.encrypted_payload!==null||(action.usedAt&&(row.used_at?.getTime()!==new Date(String(action.usedAt)).getTime()||row.admitted_at?.getTime()!==new Date(String(action.usedAt)).getTime()||row.used_by!==action.admittedByUserId||row.admission_actor!==action.admittedByUserId)))throw new DomainError(409,'LEGACY_TARGET_CHANGED','Reconcile historical target facts before retrying');}
     return;
    }
    for(const action of plan.actions){if(!(await tx.query('select a.id from std_attendees a join std_attendee_events ae on ae.wedding_id=a.wedding_id and ae.attendee_id=a.id join std_events e on e.wedding_id=ae.wedding_id and e.id=ae.event_id where a.wedding_id=$1 and a.id=$2 and ae.event_id=$3 and a.deleted_at is null',[mapping.weddingId,action.attendeeId,action.eventId])).rowCount)throw new DomainError(409,'LEGACY_TARGET_CHANGED','Restore the reviewed attendee and event eligibility before retrying');}

    for(const action of plan.actions){
     const used=!!action.usedAt;await tx.query('insert into std_passes(id,wedding_id,attendee_id,event_id,status,used_at,used_by,revoked_reason) values($1,$2,$3,$4,$5,$6,$7,$8)',[action.sourcePassId,mapping.weddingId,action.attendeeId,action.eventId,used?'used':'revoked',action.usedAt,used?action.admittedByUserId:null,used?null:'Legacy credential quarantined; RSVP and reissue require owner review']);
     if(used)await tx.query('insert into std_admissions(id,wedding_id,pass_id,event_id,attendee_id,admitted_at,actor_id) values($1,$2,$1,$3,$4,$5,$6)',[action.sourcePassId,mapping.weddingId,action.eventId,action.attendeeId,action.usedAt,action.admittedByUserId]);
     await tx.query('insert into std_pass_history(id,wedding_id,pass_id,action,actor_id,reason) values($1,$2,$3,$4,$5,$6)',[randomUUID(),mapping.weddingId,action.sourcePassId,'legacy.transferred',actor.userId,'Source '+mapping.sourceChecksum+'; '+action.action]);
     if(action.invalidatedAt)await tx.query('insert into std_pass_history(id,wedding_id,pass_id,action,actor_id,reason,created_at) values($1,$2,$3,$4,$5,$6,$7)',[randomUUID(),mapping.weddingId,action.sourcePassId,'legacy.invalidated',actor.userId,'Original credential revocation preserved',action.invalidatedAt]);
    }
    await tx.query('update std_legacy_transfers set completed_at=now() where wedding_id=$1',[mapping.weddingId]);await this.store.audit(tx,mapping.weddingId,actor.userId,'legacy.history_transferred',mapping.weddingId);
   });
   for(const record of records)await this.store.admissionLedger!.write({...record,state:'committed'});
   return {weddingId:mapping.weddingId,held:true,passes:plan.actions.length,admissions:records.length,legacyCredentialsActivated:0,rolesGranted:0,capacityConverted:false,sourceCounts:reconcileLegacySnapshot(snapshot).tables};
  });
 }
}
