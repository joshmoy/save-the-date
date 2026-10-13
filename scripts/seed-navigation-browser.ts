import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {loadConfig} from '@save-the-date/config';
import {PostgresStore} from '@save-the-date/persistence';
import {weddingSchema} from '@save-the-date/contracts';
import type {Actor} from '@save-the-date/domain';

// Dedicated disposable UI database. No source wedding/member/media records are copied.
const config=loadConfig(),sourceUrl=new URL(config.DB_CONNECTION);
assert.ok(config.NODE_ENV!=='production'&&['localhost','127.0.0.1'].includes(sourceUrl.hostname)&&sourceUrl.pathname.endsWith('_test'));
const source=new PostgresStore(config.DB_CONNECTION),name='std_navigation_'+randomUUID().replaceAll('-','')+'_test',targetUrl=new URL(sourceUrl);targetUrl.pathname='/'+name;
const root=await mkdtemp(tmpdir()+'/std-navigation-');let target:PostgresStore|undefined,created=false;
try{
 const identity=(await source.pool.query("select * from std_users where email='browser-fixture@example.test' and verified_at is not null and deleted_at is null")).rows[0];assert.ok(identity,'Existing synthetic browser identity required');
 await source.pool.query('create database "'+name+'"');created=true;target=new PostgresStore(targetUrl.href);await target.migrate('packages/persistence/migrations');
 // Copy only the synthetic identity; browser authentication uses its existing test password.
 // Trusted fixture verification state is not independent email-delivery evidence.
 await target.pool.query('insert into std_users(id,email,password_hash,verified_at,created_at) values($1,$2,$3,$4,$5)',[identity.id,identity.email,identity.password_hash,identity.verified_at,identity.created_at]);
 const actor:Actor={userId:identity.id,email:identity.email,verified:true,sessionId:randomUUID(),reauthenticatedAt:new Date(0)},wedding=await target.createWedding(actor,weddingSchema.parse({displayNames:'Navigation verification couple',slug:'navigation-browser',timezone:'UTC'}));
 await target.pool.query(`insert into std_weddings(id,slug,primary_owner_id,display_names,timezone,locale,palette,created_at) select gen_random_uuid(),'navigation-'||gen_random_uuid(),primary_owner_id,'Synthetic navigation workspace '||n,timezone,locale,palette,'2020-01-01' from std_weddings cross join generate_series(1,104) n where id=$1`,[wedding.id]);
 await target.pool.query("insert into std_memberships(wedding_id,user_id,role) select id,$1,'owner' from std_weddings where id<>$2",[actor.userId,wedding.id]);
 await target.pool.query(`insert into std_events(id,wedding_id,title,type,timezone,starts_at,to_be_confirmed,created_at) select gen_random_uuid(),$1,'Synthetic celebration '||lpad(n::text,3,'0'),'custom','UTC',case when n<=51 then '2027-08-14T14:00:00Z'::timestamptz else null end,'Date forthcoming','2020-01-01' from generate_series(1,105) n`,[wedding.id]);
 await target.pool.query(`insert into std_albums(id,wedding_id,title,position) select gen_random_uuid(),$1,'Synthetic navigation album '||lpad(n::text,3,'0'),n from generate_series(1,105) n`,[wedding.id]);
 await target.pool.query(`with users as (insert into std_users(id,email,password_hash) select gen_random_uuid(),'synthetic-navigation-'||n||'@example.test','disabled-fixture' from generate_series(1,104) n returning id) insert into std_memberships(wedding_id,user_id,role,created_at) select $1,id,'planner','2020-01-01' from users`,[wedding.id]);
 await target.pool.query(`insert into std_member_invites(id,wedding_id,email,role,token_hash,invited_by,expires_at,revoked_at,created_at) select gen_random_uuid(),$1,'synthetic-expired-'||n||'@example.test','planner',gen_random_uuid()::text,$2,'2020-01-01','2020-01-01','2020-01-01' from generate_series(1,105) n`,[wedding.id,actor.userId]);
 // No operational jobs or fake processed files; this fixture verifies metadata navigation only.
 assert.equal(Number((await target.pool.query('select count(*) from std_jobs')).rows[0].count),0);
 const result={databaseName:name,root,weddingId:wedding.id,origin:'http://localhost:3007',apiOrigin:'http://127.0.0.1:4007',workspaces:105,events:105,albums:105,members:105,revokedInvites:105,scope:'new disposable metadata; source weddings untouched; trusted synthetic identity setup; fresh browser login'};
 await writeFile(root+'/checkpoint.json',JSON.stringify(result,null,2));await writeFile(root+'/connection.txt',targetUrl.href,{mode:0o600});console.log(JSON.stringify(result));
}catch(error){await target?.close();target=undefined;if(created)await source.pool.query('drop database "'+name+'" with (force)');throw error;}finally{await target?.close();await source.close();}
