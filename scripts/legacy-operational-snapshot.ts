import dotenv from 'dotenv';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {AesGcmBackupEncryption,FilesystemStorage} from '@save-the-date/adapters';
import {readLegacySnapshot,reconcileLegacySnapshot} from '@save-the-date/persistence';

dotenv.config({path:'.env',quiet:true});
const connection=process.env.LEGACY_SNAPSHOT_CONNECTION,root=process.env.LEGACY_SNAPSHOT_ROOT,keys=process.env.BACKUP_ENCRYPTION_KEYS;
if(!connection||!root||!keys)throw Error('Set LEGACY_SNAPSHOT_CONNECTION, absolute LEGACY_SNAPSHOT_ROOT and BACKUP_ENCRYPTION_KEYS. There is no implicit application database fallback.');
if(!path.isAbsolute(root))throw Error('LEGACY_SNAPSHOT_ROOT must be absolute');
await mkdir(root,{recursive:true,mode:0o700});
const encryption=new AesGcmBackupEncryption(keys),snapshot=await readLegacySnapshot(connection),report=reconcileLegacySnapshot(snapshot);
const key='legacy-'+report.sourceChecksum+'-stdbak';
async function* chunks(){yield Buffer.from(JSON.stringify(snapshot));}
const object=await encryption.encryptTo(chunks(),new FilesystemStorage(root),key);
await writeFile(path.join(root,key+'.report.json'),JSON.stringify({...report,encryptedBackup:{key,checksum:object.checksum}},null,2),{mode:0o600,flag:'wx'});
console.log(JSON.stringify({encryptedBackup:key,report:key+'.report.json',counts:report.tables,exceptions:report.exceptions.length,legacyWrites:0,platformWrites:0}));
