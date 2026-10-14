import {randomUUID} from 'node:crypto';
import type {PoolClient} from 'pg';
/** Caller serializes wedding access. No contacts or answers enter the cleanup job or ledger. */
export async function eraseRsvpAnswers(tx:PoolClient,weddingId:string,eventId:string,recordedAt:string){
 await tx.query("update std_rsvps set meal='',dietary='',accessibility='',note='',version=version+1 where wedding_id=$1 and event_id=$2 and updated_at<=$3 and (meal<>'' or dietary<>'' or accessibility<>'' or note<>'')",[weddingId,eventId,recordedAt]);
 const archives=(await tx.query('delete from std_archive_exports where wedding_id=$1 and include_sensitive and created_at<=$2 returning id',[weddingId,recordedAt])).rows;
 if(archives.length){
  const ids=archives.map(row=>row.id as string);
  await tx.query("update std_jobs set state='cancelled',error_code='RSVP_ANSWERS_ERASED' where wedding_id=$1 and type='archive-export' and payload->>'exportId'=any($2::text[])",[weddingId,ids]);
  for(const id of ids)await tx.query("insert into std_jobs(id,wedding_id,type,dedupe_key,payload) values($1,$2,'rsvp-answer-delete',$3,$4) on conflict(dedupe_key) do update set state='pending',retry_at=now(),error_code=null",[randomUUID(),weddingId,'rsvp-answer-delete:'+id,{exportIds:[id]}]);
 }
 return archives.length;
}
