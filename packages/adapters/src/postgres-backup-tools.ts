import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
/** Version-matched PostgreSQL CLI transport. Passwords never appear in command arguments. */
export class PostgresBackupTools {
 constructor(private dumpExecutable='pg_dump',private restoreExecutable='pg_restore'){}
 private connection(connection:string){const url=new URL(connection);if(!['postgres:','postgresql:'].includes(url.protocol))throw Error('BACKUP_DATABASE_INVALID');const password=url.password?decodeURIComponent(url.password):url.searchParams.get('password')??'';url.password='';url.searchParams.delete('password');return {argument:url.href,environment:{...process.env,PGPASSWORD:password,PGTZ:'UTC'}};}
 async dump(connection:string,path:string,snapshot:string){const input=this.connection(connection);try{await run(this.dumpExecutable,['--format=custom','--no-owner','--no-privileges','--snapshot='+snapshot,'--file='+path,'--dbname='+input.argument],{env:input.environment,maxBuffer:1024*1024,timeout:3600000});}catch{throw Error('POSTGRES_BACKUP_FAILED');}}
 async restore(connection:string,path:string){const input=this.connection(connection);try{await run(this.restoreExecutable,['--exit-on-error','--no-owner','--no-privileges','--single-transaction','--dbname='+input.argument,path],{env:input.environment,maxBuffer:1024*1024,timeout:3600000});}catch{throw Error('POSTGRES_RESTORE_FAILED');}}
}
