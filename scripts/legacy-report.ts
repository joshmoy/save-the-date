import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { updates } from '../apps/web/src/data/updates.js';
import { mediaCategories } from '../apps/web/src/data/mediaCategories.js';
import { weddingSchema } from '@save-the-date/contracts';
import { loadConfig } from '@save-the-date/config';
import { PostgresStore } from '@save-the-date/persistence';
const snapshot={schemaVersion:1,couple:'Adeola & Joshua',historicalDate:'2026-08-01',posts:updates,albums:mediaCategories,exceptions:['External asset references remain legacy public dependencies; no external listing attempted.','Users require an explicit verified owner mapping.','Passes/scans/settings are unchanged; operational migration requires R2 invariants and a private backup.','Album names are not evidence of ceremony times. Only the known reception date is imported; schedule remains unconfirmed.']};
const checksum=createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
const report={checksum,counts:{posts:updates.length,albums:mediaCategories.length,videoCollections:mediaCategories.filter(v=>v.hasVideos).length},exceptions:snapshot.exceptions};
const output=process.env.LEGACY_REPORT_PATH??'/tmp/std-legacy-report.json';
await writeFile(output,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
if(process.env.LEGACY_APPLY==='1'){
 const c=loadConfig(),endpoint=new URL(c.DB_CONNECTION),email=process.env.LEGACY_OWNER_EMAIL;
 if(!['localhost','127.0.0.1'].includes(endpoint.hostname)||!endpoint.pathname.endsWith('_test'))throw Error('Legacy apply is a local _test rehearsal only; production cutover needs a separately reviewed migration.');
 if(!email)throw new Error('LEGACY_OWNER_EMAIL must identify an explicitly verified account');
 const store=new PostgresStore(c.DB_CONNECTION);
 try{
  const id=await store.importLegacy(email,weddingSchema.parse({displayNames:snapshot.couple,slug:'adeola-and-joshua',timezone:'Africa/Lagos',primaryDate:snapshot.historicalDate}),snapshot,checksum);console.log('Imported private seed '+id+' with '+updates.length+' blog drafts and '+mediaCategories.length+' albums; external assets await reviewed import. Nothing was published.');
 }finally{await store.close();}
}
