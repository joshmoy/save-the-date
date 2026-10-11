import pg from 'pg';
import assert from 'node:assert/strict';
const source=process.env.TEST_DB_CONNECTION,target=process.env.RESTORE_DB_CONNECTION;
for(const c of [source,target])if(!c||!['localhost','127.0.0.1'].includes(new URL(c).hostname)||!new URL(c).pathname.endsWith('_test'))throw new Error('Restore verification requires two explicit isolated local _test databases');
const a=new pg.Pool({connectionString:source}),b=new pg.Pool({connectionString:target});
try{for(const table of ['std_users','std_weddings','std_memberships','std_events','std_sessions','std_identity_tokens','std_member_invites','std_audit_events','std_jobs','std_email_messages','std_legacy_snapshots','std_deletion_tombstones','std_migrations']){
 const sql=`select md5(coalesce(string_agg(row_to_json(t)::text,',' order by row_to_json(t)::text),'')) as checksum,count(*)::integer as count from ${table} t`;
 const [left,right]=await Promise.all([a.query(sql),b.query(sql)]);assert.deepEqual(right.rows,left.rows,table+' restore mismatch');console.log(table+': '+left.rows[0].count+' records, checksum matched');
}console.log('R0 database restore verified; media/pass/tombstone replay drill remains R3');}finally{await a.end();await b.end();}
