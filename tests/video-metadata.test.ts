import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createRequire} from 'node:module';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {NativeMediaProcessor} from '@save-the-date/adapters';
const require=createRequire(new URL('../packages/adapters/package.json',import.meta.url)),ffmpeg=require('ffmpeg-static') as string,ffprobe=(require('ffprobe-static') as {path:string}).path,run=promisify(execFile);

test('M02 reports actual encoded video geometry and rejects unsupported declared containers',async()=>{
 const root=await mkdtemp(tmpdir()+'/std-video-metadata-');
 try{
  const input=root+'/input.mp4',output=root+'/output.mp4';await run(ffmpeg,['-v','error','-f','lavfi','-i','color=c=0x2F567C:s=320x240:d=1','-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-y',input]);
  const bytes=await readFile(input),processor=new NativeMediaProcessor(ffmpeg,ffprobe);await assert.rejects(processor.process(bytes,'application/octet-stream'),/MEDIA_TYPE_MISMATCH/);
  const processed=await processor.process(bytes,'video/mp4');await writeFile(output,processed.display);
  const actual=JSON.parse((await run(ffprobe,['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',output])).stdout).streams[0];
  assert.equal(processed.width,actual.width);assert.equal(processed.height,actual.height);assert.ok(processed.width<=1280&&processed.height<=1280);assert.ok(processed.poster?.length);
 }finally{await rm(root,{recursive:true,force:true});}
});
