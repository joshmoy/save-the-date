import sharp from 'sharp';
import {createRequire} from 'node:module';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Worker} from 'node:worker_threads';
const run=promisify(execFile),require=createRequire(import.meta.url);
export interface ProcessedMedia {display:Buffer;poster?:Buffer;contentType:string;width:number;height:number;duration:number|null}
export interface MediaProcessorPort {process(bytes:Buffer,declaredType:string):Promise<ProcessedMedia>}
export class NativeMediaProcessor implements MediaProcessorPort {
 constructor(private ffmpeg=process.env.MEDIA_FFMPEG_PATH??require('ffmpeg-static') as string,private ffprobe=process.env.MEDIA_FFPROBE_PATH??(require('ffprobe-static') as {path:string}).path){}
 async process(bytes:Buffer,declaredType:string):Promise<ProcessedMedia>{
  const jpeg=bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff,png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),webp=bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP',iso=bytes.subarray(4,8).toString()==='ftyp';
  if(declaredType.startsWith('image/')){
   if(!(declaredType==='image/jpeg'&&jpeg||declaredType==='image/png'&&png||declaredType==='image/webp'&&webp||['image/heic','image/heif'].includes(declaredType)&&iso))throw Error('MEDIA_TYPE_MISMATCH');
   try{if(['image/heic','image/heif'].includes(declaredType))bytes=await this.convertPhone(bytes);const image=sharp(bytes,{limitInputPixels:40000000,animated:false,failOn:'warning'}),metadata=await image.metadata();if(!metadata.width||!metadata.height||metadata.pages&&metadata.pages>1)throw Error('MEDIA_INVALID_IMAGE');
    const result=await image.rotate().resize({width:1800,height:1800,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer({resolveWithObject:true});
    return {display:result.data,contentType:'image/webp',width:result.info.width,height:result.info.height,duration:null};
   }catch{throw Error(['image/heic','image/heif'].includes(declaredType)?'MEDIA_PHONE_FORMAT_UNSUPPORTED':'MEDIA_INVALID_IMAGE');}
  }
  if(!iso)throw Error('MEDIA_TYPE_MISMATCH');
  const scratch=await mkdtemp(path.join(tmpdir(),'std-media-'));
  try{const input=path.join(scratch,'input'),output=path.join(scratch,'display.mp4'),poster=path.join(scratch,'poster.webp');await writeFile(input,bytes,{mode:0o600});
   const probe=await run(this.ffprobe,['-v','error','-protocol_whitelist','file,pipe','-show_format','-show_streams','-of','json',input],{timeout:15000,maxBuffer:1024*1024});
   const metadata=JSON.parse(probe.stdout) as {format:{duration:string;format_name:string};streams:{codec_type:string;width?:number;height?:number}[]};const duration=Number(metadata.format.duration),video=metadata.streams.find(s=>s.codec_type==='video');
   if(!video?.width||!video.height||video.width*video.height>40000000||!Number.isFinite(duration)||duration<=0||duration>300||!metadata.format.format_name.includes('mov'))throw Error('MEDIA_VIDEO_LIMIT');
   await run(this.ffmpeg,['-nostdin','-v','error','-protocol_whitelist','file,pipe','-threads','1','-i',input,'-map','0:v:0','-map','0:a?','-map_metadata','-1','-vf','scale=1280:1280:force_original_aspect_ratio=decrease:force_divisible_by=2','-c:v','libx264','-preset','fast','-crf','24','-threads','1','-c:a','aac','-movflags','+faststart','-y',output],{timeout:180000,maxBuffer:1024*1024});
   await run(this.ffmpeg,['-nostdin','-v','error','-threads','1','-i',output,'-frames:v','1','-map_metadata','-1','-y',poster],{timeout:15000,maxBuffer:1024*1024});
   return {display:await readFile(output),poster:await readFile(poster),contentType:'video/mp4',width:Math.round(video.width*Math.min(1,1280/video.width,1280/video.height)),height:Math.round(video.height*Math.min(1,1280/video.width,1280/video.height)),duration};
  }catch(e){if(e instanceof Error&&e.message==='MEDIA_VIDEO_LIMIT')throw e;throw Error('MEDIA_VIDEO_PROCESSING_FAILED');}finally{await rm(scratch,{recursive:true,force:true});}
 }
 private async convertPhone(bytes:Buffer):Promise<Buffer>{return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./heic-worker.js',import.meta.url),{workerData:bytes,execArgv:[],resourceLimits:{maxOldGenerationSizeMb:256}});const timer=setTimeout(()=>{void worker.terminate();reject(Error('MEDIA_PHONE_FORMAT_TIMEOUT'));},30000);
  worker.once('message',(result:{bytes?:Uint8Array;error?:string})=>{clearTimeout(timer);void worker.terminate();if(result.bytes)resolve(Buffer.from(result.bytes));else reject(Error(result.error??'MEDIA_PHONE_FORMAT_INVALID'));});worker.once('error',()=>{clearTimeout(timer);reject(Error('MEDIA_PHONE_FORMAT_INVALID'));});worker.once('exit',code=>{if(code!==0){clearTimeout(timer);reject(Error('MEDIA_PHONE_FORMAT_INVALID'));}});
 });}
}
