import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PostgresStore} from '@save-the-date/persistence';
import {designSchema} from '@save-the-date/templates';
const checkpoint=JSON.parse(await readFile('/tmp/std-navigation-checkpoint.json','utf8')),connection=(await readFile(checkpoint.root+'/connection.txt','utf8')).trim(),url=new URL(connection);
if(!['localhost','127.0.0.1'].includes(url.hostname)||!/^std_navigation_[a-f0-9]{32}_test$/.test(url.pathname.slice(1)))throw Error('Isolated navigation fixture required');
const store=new PostgresStore(connection);
try{
 const wedding=(await store.pool.query('select primary_owner_id from std_weddings where id=$1',[checkpoint.weddingId])).rows[0],event=(await store.pool.query('select id from std_events where wedding_id=$1 order by id limit 1',[checkpoint.weddingId])).rows[0];
 if(!wedding||!event)throw Error('Synthetic navigation wedding required');
 const existing=(await store.pool.query("select id from std_invitation_designs where wedding_id=$1 and title='Legacy font portability verification'",[checkpoint.weddingId])).rows[0];
 const id=existing?.id??randomUUID();
 if(!existing)await store.pool.query('insert into std_invitation_designs(id,wedding_id,title,config,created_by) values($1,$2,$3,$4,$5)',[id,checkpoint.weddingId,'Legacy font portability verification',designSchema.parse({templateId:'modern-minimal',eventIds:[event.id],fonts:{body:'sans-serif'}}),wedding.primary_owner_id]);
 await writeFile(checkpoint.root+'/legacy-font-browser.json',JSON.stringify({id,weddingId:checkpoint.weddingId,title:'Legacy font portability verification'}),{mode:0o600});console.log('Synthetic legacy font draft ready; no credentials or memberships changed');
}finally{await store.close();}
