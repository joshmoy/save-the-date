import { loadConfig } from '@save-the-date/config';
import { PostgresStore } from '@save-the-date/persistence';
import { credential,credentialHash,hashPassword } from '@save-the-date/adapters';
const c=loadConfig(),url=new URL(c.DB_CONNECTION);
if(c.NODE_ENV==='production'||!['127.0.0.1','localhost'].includes(url.hostname)||!url.pathname.endsWith('_test'))throw new Error('Synthetic fixture requires a local database ending _test');
const store=new PostgresStore(c.DB_CONNECTION),token=credential();
try{await store.register('browser-fixture@example.test',await hashPassword('synthetic browser password'),credentialHash(token,c.TOKEN_HASH_KEYS));const u=await store.pool.query('select verified_at from std_users where email=$1',['browser-fixture@example.test']);if(!u.rows[0].verified_at)await store.verify(credentialHash(token,c.TOKEN_HASH_KEYS));console.log('Synthetic browser account ready: browser-fixture@example.test');}finally{await store.close();}
