import {parentPort,workerData} from 'node:worker_threads';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const convert=require('heic-convert') as (input:{buffer:Buffer;format:'JPEG';quality:number})=>Promise<ArrayBuffer>;
try{const jpeg=await convert({buffer:Buffer.from(workerData as Uint8Array),format:'JPEG',quality:.9});parentPort?.postMessage({bytes:new Uint8Array(jpeg)});}catch{parentPort?.postMessage({error:'MEDIA_PHONE_FORMAT_INVALID'});}
