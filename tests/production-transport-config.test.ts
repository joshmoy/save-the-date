import test from 'node:test';
import assert from 'node:assert/strict';
import {loadConfig} from '@save-the-date/config';

test('production config requires explicit verified database TLS and distinguishes worker mode from Next build mode',()=>{
 const before={...process.env};
 try{
  Object.assign(process.env,{PLATFORM_RUNTIME_ENV:'production',NODE_ENV:'test',DB_CONNECTION:'postgresql://synthetic:fixture@db.example.test/std?sslmode=verify-full',API_INTERNAL_ORIGIN:'https://api.example.test',PUBLIC_ORIGIN:'https://weddings.example.test',EMAIL_ADAPTER:'disabled',STORAGE_ADAPTER:'filesystem',STORAGE_ROOT:'/data/storage',TOKEN_HASH_KEYS:'synthetic-production-transport-key'.repeat(3),RETENTION_POLICY:'synthetic-retention',BACKUP_POLICY:'synthetic-backup',API_TLS_CERT_PATH:'',API_TLS_KEY_PATH:''});
  assert.equal(loadConfig().NODE_ENV,'production');
  // Workers need no private API server key; createServer separately enforces it.
  assert.equal(loadConfig().API_TLS_KEY_PATH,undefined);
  for(const mode of ['', 'require','verify-ca','no-verify','disable']){process.env.DB_CONNECTION='postgresql://synthetic:fixture@db.example.test/std'+(mode?'?sslmode='+mode:'');assert.throws(loadConfig,/sslmode=verify-full/);}
  process.env.DB_CONNECTION='postgresql://synthetic:fixture@db.example.test/std?sslmode=verify-full';process.env.API_INTERNAL_ORIGIN='http://api.example.test';assert.throws(loadConfig,/HTTPS/);
  process.env.API_INTERNAL_ORIGIN='https://api.example.test';process.env.API_TLS_CERT_PATH='/synthetic/cert.pem';assert.throws(loadConfig,/both API TLS/);
  process.env.API_TLS_CERT_PATH='';process.env.PLATFORM_RUNTIME_ENV='invalid';assert.throws(loadConfig,/Invalid platform configuration/);
  process.env.PLATFORM_RUNTIME_ENV='development';process.env.NODE_ENV='production';process.env.DB_CONNECTION='postgresql://synthetic:fixture@localhost/std_test';process.env.API_INTERNAL_ORIGIN='http://localhost:4000';process.env.PUBLIC_ORIGIN='http://localhost:3000';assert.equal(loadConfig().NODE_ENV,'development');
 }finally{for(const name of Object.keys(process.env))if(!(name in before))delete process.env[name];Object.assign(process.env,before);}
});
