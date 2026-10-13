import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import pg from 'pg';

// Dedicated throwaway PostgreSQL; never uses application DB_CONNECTION or volumes.
const root=await mkdtemp(tmpdir()+'/std-pg-tls-'),container='std-pg-tls-'+randomUUID().slice(0,8),password=randomUUID(),database='std_tls_test';
const docker=(args:string[])=>execFileSync('docker',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();let started=false;
try{
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',root+'/server.key','-out',root+'/server.crt','-days','1','-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost'],{stdio:'ignore'});
 docker(['run','-d','--rm','--name',container,'-p','127.0.0.1::5432','-v',root+':/tls-input:ro','-e','POSTGRES_DB='+database,'-e','POSTGRES_PASSWORD='+password,'postgres:16.14-bookworm','bash','-c','mkdir /tls && cp /tls-input/server.key /tls-input/server.crt /tls/ && chown postgres:postgres /tls/* && chmod 600 /tls/server.key && exec docker-entrypoint.sh postgres -c ssl=on -c ssl_cert_file=/tls/server.crt -c ssl_key_file=/tls/server.key -c ssl_min_protocol_version=TLSv1.2']);started=true;
 const port=JSON.parse(docker(['inspect','--format','{{json .NetworkSettings.Ports}}',container]))['5432/tcp'][0].HostPort;
 const url=new URL('postgresql://postgres@localhost:'+port+'/'+database);url.password=password;url.searchParams.set('sslmode','verify-full');url.searchParams.set('sslrootcert',root+'/server.crt');
 let ready=false;for(let attempt=0;attempt<60;attempt++){try{const client=new pg.Client({connectionString:url.href,connectionTimeoutMillis:1000});try{await client.connect();ready=true;}finally{await client.end();}if(ready)break;}catch{await new Promise(resolve=>setTimeout(resolve,250));}}
 assert.ok(ready,'Dedicated TLS database did not become ready');
 const client=new pg.Client({connectionString:url.href});await client.connect();let encryption;
 try{encryption=(await client.query('select ssl,version from pg_stat_ssl where pid=pg_backend_pid()')).rows[0];assert.equal(encryption.ssl,true);assert.ok(['TLSv1.2','TLSv1.3'].includes(encryption.version));}finally{await client.end();}
 const untrusted=new URL(url);untrusted.searchParams.delete('sslrootcert');const wrongHost=new URL(url);wrongHost.hostname='127.0.0.1';
 for(const invalid of [untrusted,wrongHost]){const rejected=new pg.Client({connectionString:invalid.href,connectionTimeoutMillis:3000});try{await assert.rejects(rejected.connect());}finally{await rejected.end();}}
 console.log(JSON.stringify({databaseEngine:'PostgreSQL16',tls:encryption.version,encrypted:true,untrustedRejected:true,hostnameMismatchRejected:true,applicationDatabase:'untouched'}));
}finally{if(started)docker(['stop',container]);await rm(root,{recursive:true,force:true});}
