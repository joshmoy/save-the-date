import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {designSchema,resolveDesign,fontManifest,type ResolvedDesign} from '@save-the-date/templates';
import {BrowserInvitationRenderer,templateFontDirectory} from '@save-the-date/adapters';

test('I03 font validation pins stylesheet and both font formats, rejecting host fonts before browser access',async()=>{
 const root=await mkdtemp(tmpdir()+'/std-font-integrity-'),context={names:'Amélie & O’Connor',url:'https://example.test/w/fonts',palette:{background:'#FFFFFF',primary:'#243449',secondary:'#566779',accent:'#2F567C'},events:[],weddingVersion:1};
 try{
  await cp(templateFontDirectory,root,{recursive:true});const design=designSchema.parse({templateId:'modern-minimal',eventIds:[randomUUID()],fonts:{body:'Work Sans'}}),resolved=resolveDesign(design,context),renderer=new BrowserInvitationRenderer('/not-used-by-validation',root);
  assert.throws(()=>resolveDesign({...design,fonts:{body:'sans-serif'}},context),/LEGACY_SYSTEM_FONT_REQUIRES_REFRESH/);
  await assert.rejects(renderer.render({...resolved,design:{...design,fonts:{body:'sans-serif'}}},'jpeg'),/LEGACY_SYSTEM_FONT_REQUIRES_REFRESH/);
  const css=await readFile(root+'/fonts.css','utf8');await writeFile(root+'/fonts.css',css+'/* unexpected stylesheet revision */');await assert.rejects(renderer.render(resolved,'jpeg'),/FONT_STYLESHEET_CHANGED/);await writeFile(root+'/fonts.css',css);
  const checksums={...fontManifest.checksums} as Record<string,string>,file='cormorant-cyrillic-ext-400-normal.woff';delete checksums[file];await assert.rejects(renderer.render({...resolved,fontManifest:{...fontManifest,checksums}},'jpeg'),/FONT_ASSET_UNPINNED/);
  const font=await readFile(root+'/'+file);await writeFile(root+'/'+file,Buffer.concat([font,Buffer.from('modified')]));await assert.rejects(renderer.render(resolved,'pdf'),/FONT_ASSET_CHANGED/);await writeFile(root+'/'+file,font);
  await writeFile(root+'/fonts-v1.css','/* changed legacy styles */');const legacy:ResolvedDesign={...resolved,design:{...design,fonts:{body:'Lora'}},fontManifest:{version:1,checksums:Object.fromEntries(Object.entries(fontManifest.checksums).filter(([name])=>name.endsWith('.woff2')&&!name.startsWith('work-sans')))}};await assert.rejects(renderer.render(legacy,'jpeg'),/FONT_STYLESHEET_CHANGED/);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('I03 preview-like ambient typography cannot change version-two export layout',{skip:!process.env.TEST_INVITATION_BROWSER_PATH},async()=>{
 const {createHash}=await import('node:crypto'),root=await mkdtemp(tmpdir()+'/std-card-isolation-');
 try{
  await cp(templateFontDirectory,root,{recursive:true});const design=designSchema.parse({templateId:'modern-minimal',eventIds:[randomUUID()],fonts:{body:'Work Sans'},qr:false}),resolved=resolveDesign(design,{names:'Amélie & O’Connor',url:'https://example.test/w/font-isolation',palette:{background:'#FFFFFF',primary:'#243449',secondary:'#566779',accent:'#2F567C'},events:[],weddingVersion:1});
  assert.equal(resolved.rendererVersion,2);const renderer=new BrowserInvitationRenderer(process.env.TEST_INVITATION_BROWSER_PATH!,root,process.env.TEST_RENDER_BROWSER_ENDPOINT),clean=await renderer.render(resolved,'jpeg');
  const css=await readFile(root+'/fonts.css','utf8'),ambient=css+"h1{letter-spacing:-2px;overflow-wrap:anywhere}p{max-width:20px}a{text-decoration:none;text-underline-offset:9px}";
  await writeFile(root+'/fonts.css',ambient);
  const withAmbient=await renderer.render({...resolved,fontManifest:{...resolved.fontManifest,stylesheetChecksum:createHash('sha256').update(ambient).digest('hex')}},'jpeg');
  assert.equal(withAmbient.checksum,clean.checksum,'Preview-like CSS must not alter resolved card pixels');
 }finally{await rm(root,{recursive:true,force:true});}
});
