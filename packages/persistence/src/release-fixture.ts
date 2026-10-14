import type {PostgresStore} from './index.js';
/** Synthetic population only; there is no application route for this maintenance fixture. */
export async function populatePilotAttendees(store:PostgresStore,weddingIds:string[]){
 const database=(await store.pool.query('select current_database() as name')).rows[0].name;
 if(!/^std_pilot_[a-f0-9]{32}_test$/.test(database)||weddingIds.length!==100||new Set(weddingIds).size!==100)throw Error('PILOT_REQUIRES_FRESH_DISPOSABLE_DATABASE');
 await store.transaction(async tx=>{
  const current=await tx.query('select id from std_weddings order by id');
  if(current.rows.length!==100||current.rows.some(row=>!weddingIds.includes(row.id)))throw Error('PILOT_DATABASE_HAS_UNEXPECTED_WEDDINGS');
  const counts=await tx.query('select wedding_id,count(*)::int as count from std_attendees where wedding_id=any($1::uuid[]) group by wedding_id',[weddingIds]);
  if(counts.rows.some(row=>row.count>1000))throw Error('PILOT_ATTENDEE_LIMIT');
  for(const id of weddingIds){
   const existing=counts.rows.find(row=>row.wedding_id===id)?.count??0;
   await tx.query(`with parties as (insert into std_parties(id,wedding_id,name) select gen_random_uuid(),$1,'Synthetic pilot household '||n from generate_series($2::int,1000) n returning id,wedding_id) insert into std_attendees(id,wedding_id,party_id,name) select gen_random_uuid(),wedding_id,id,'Synthetic pilot attendee' from parties`,[id,existing+1]);
  }
  await tx.query('insert into std_attendee_events(wedding_id,attendee_id,event_id) select a.wedding_id,a.id,e.id from std_attendees a join std_events e on e.wedding_id=a.wedding_id on conflict do nothing');
  await tx.query("insert into std_rsvps(wedding_id,attendee_id,event_id,state) select wedding_id,attendee_id,event_id,'unanswered' from std_attendee_events on conflict do nothing");
 });
 return {weddings:100,events:(await store.pool.query('select count(*)::int as n from std_events')).rows[0].n,attendees:(await store.pool.query('select count(*)::int as n from std_attendees')).rows[0].n};
}
