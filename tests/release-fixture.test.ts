import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PostgresStore,populatePilotAttendees} from '@save-the-date/persistence';

test('pilot bulk fixture refuses an ordinary test database before writing population',async()=>{
 const connection=process.env.TEST_DB_CONNECTION;assert.ok(connection);const endpoint=new URL(connection);
 assert.ok(['localhost','127.0.0.1'].includes(endpoint.hostname)&&endpoint.pathname.endsWith('_test'));
 const store=new PostgresStore(connection);
 try{
  const before=(await store.pool.query('select count(*) from std_attendees')).rows[0].count;
  await assert.rejects(populatePilotAttendees(store,Array.from({length:100},()=>randomUUID())),/FRESH_DISPOSABLE_DATABASE/);
  assert.equal((await store.pool.query('select count(*) from std_attendees')).rows[0].count,before);
 }finally{await store.close();}
});
