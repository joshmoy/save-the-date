import {createHash} from 'node:crypto';
import {legacyMappingSchema,legacyOperationalSnapshotSchema} from '@save-the-date/contracts';
import {DomainError,notFound,requireRecentAuthentication,type Actor} from '@save-the-date/domain';
import type {PostgresStore} from './index.js';
import {reconcileLegacySnapshot,type LegacySnapshot} from './legacy-snapshot.js';

/** Read-only migration preparation. No credentials, roles, capacity or admission state are changed. */
export class PostgresLegacyPlanner{
 constructor(private store:PostgresStore){}
 async plan(actor:Actor,snapshot:LegacySnapshot,input:unknown){
  requireRecentAuthentication(actor);if(!legacyOperationalSnapshotSchema.safeParse(snapshot).success)throw new DomainError(400,'LEGACY_SNAPSHOT_INVALID','Review the authenticated source snapshot');const parsed=legacyMappingSchema.safeParse(input);if(!parsed.success)throw new DomainError(400,'LEGACY_MAPPING_INVALID','Review the explicit source and target mappings');
  const mapping=parsed.data,source=reconcileLegacySnapshot(snapshot);if(mapping.sourceChecksum!==source.sourceChecksum)throw new DomainError(409,'LEGACY_SOURCE_CHANGED','Reconcile a fresh source snapshot before planning');
  return this.store.transaction(async tx=>{
   await tx.query('set transaction isolation level repeatable read read only');
   const wedding=(await tx.query("select w.id,w.version,w.ownership_recovery_hold from std_weddings w join std_memberships m on m.wedding_id=w.id join std_users u on u.id=m.user_id where w.id=$1 and w.primary_owner_id=$2 and m.user_id=$2 and m.role='owner' and w.deleted_at is null and u.deleted_at is null and u.verified_at is not null",[mapping.weddingId,actor.userId])).rows[0];
   if(!wedding)throw notFound();if(wedding.ownership_recovery_hold)throw new DomainError(409,'RESTORED_OWNERSHIP_REVIEW_REQUIRED','Resolve restored ownership before migration planning');
   const exceptions=[...source.exceptions],add=(recordId:string,code:string)=>exceptions.push({recordId,code}),users=(await tx.query('select id,email,verified_at,deleted_at from std_users where id=any($1::uuid[])',[mapping.users.map(row=>row.targetUserId)])).rows;
   for(const user of snapshot.users){const row=mapping.users.find(value=>value.sourceUserId===user.id),target=row&&users.find(value=>value.id===row.targetUserId);if(!target||!target.verified_at||target.deleted_at)add(String(user.id),'VERIFIED_IDENTITY_MAPPING_REQUIRED');else if(typeof user.email!=='string'||target.email.toLowerCase()!==user.email.toLowerCase())add(String(user.id),'IDENTITY_EMAIL_MISMATCH');}
   for(const row of mapping.users)if(!snapshot.users.some(user=>user.id===row.sourceUserId))add(row.sourceUserId,'UNKNOWN_SOURCE_USER');
   const actions:{sourcePassId:string;attendeeId:string;eventId:string;action:string;usedAt:unknown;invalidatedAt:unknown;admittedByUserId:string|null}[]=[],lineage:unknown[]=[],pairs=new Set<string>();
   for(const pass of snapshot.passes){
    const row=mapping.passes.find(value=>value.sourcePassId===pass.id);if(!row){add(String(pass.id),'PASS_MAPPING_REQUIRED');continue;}
    const pair=row.attendeeId+':'+row.eventId;if(pairs.has(pair))add(row.sourcePassId,'DUPLICATE_TARGET_ATTENDEE_EVENT');pairs.add(pair);
    const target=(await tx.query('select a.id,a.version,e.version as event_version,r.state as rsvp_state from std_attendees a join std_attendee_events ae on ae.wedding_id=a.wedding_id and ae.attendee_id=a.id join std_events e on e.wedding_id=ae.wedding_id and e.id=ae.event_id left join std_rsvps r on r.wedding_id=ae.wedding_id and r.attendee_id=ae.attendee_id and r.event_id=ae.event_id where a.wedding_id=$1 and a.id=$2 and ae.event_id=$3 and a.deleted_at is null',[mapping.weddingId,row.attendeeId,row.eventId])).rows[0];
    if(!target)add(row.sourcePassId,'TARGET_ELIGIBILITY_MAPPING_REQUIRED');else lineage.push({attendeeId:row.attendeeId,eventId:row.eventId,...target});
    if((await tx.query('select id from std_passes where wedding_id=$1 and attendee_id=$2 and event_id=$3',[mapping.weddingId,row.attendeeId,row.eventId])).rowCount)add(row.sourcePassId,'TARGET_ALREADY_HAS_PASS');
    if(pass.used_at){const actorUser=users.find(user=>user.id===row.admittedByUserId);if(!actorUser||!actorUser.verified_at||actorUser.deleted_at||typeof pass.used_by!=='string'||actorUser.email.toLowerCase()!==pass.used_by.toLowerCase())add(row.sourcePassId,'ADMISSION_ACTOR_MAPPING_REQUIRED');}
    actions.push({sourcePassId:row.sourcePassId,attendeeId:row.attendeeId,eventId:row.eventId,action:pass.used_at?'preserve_used_never_reissue':pass.invalidated_at?'preserve_revoked':'quarantine_then_owner_review_before_reissue',usedAt:pass.used_at??null,invalidatedAt:pass.invalidated_at??null,admittedByUserId:pass.used_at?row.admittedByUserId:null});
   }
   for(const row of mapping.passes)if(!snapshot.passes.some(pass=>pass.id===row.sourcePassId))add(row.sourcePassId,'UNKNOWN_SOURCE_PASS');
   const scanActions=snapshot.scans.map(scan=>{const pass=mapping.passes.find(row=>row.sourcePassId===scan.hall_pass_id),actorUser=typeof scan.scanner_email==='string'?users.find(user=>user.email.toLowerCase()===(scan.scanner_email as string).toLowerCase()&&user.verified_at&&!user.deleted_at):undefined;if(!actorUser)add(String(scan.id),'SCAN_ACTOR_MAPPING_REQUIRED');if(scan.hall_pass_id&&!pass)add(String(scan.id),'SCAN_TARGET_LINEAGE_REQUIRED');return {sourceScanId:String(scan.id),sourcePassId:scan.hall_pass_id??null,attendeeId:pass?.attendeeId??null,eventId:pass?.eventId??null,result:scan.result,actorUserId:actorUser?.id??null,action:'preserve_historical_attempt_not_admission_authority'};});
   const unique=[...new Map(exceptions.map(row=>[row.recordId+':'+row.code,row])).values()];
   return {version:1,sourceChecksum:source.sourceChecksum,targetFingerprint:createHash('sha256').update(JSON.stringify({wedding,lineage})).digest('hex'),counts:source.tables,passFacts:source.passFacts,actions,scanActions,exceptions:unique,mappingComplete:unique.length===0,
    cutoverReady:false,remainingGates:['Verified legacy write freeze and final snapshot reconciliation','Authenticated encrypted backup and tested rollback/roll-forward','Owner-reviewed identities, event/attendee mapping and RSVP eligibility','Authorised controlled reissue and notification; old credentials stay quarantined'],rolesGranted:0,credentialsActivated:0,capacityConverted:false,sourceWrites:0,targetWrites:0};
  });
 }
}
