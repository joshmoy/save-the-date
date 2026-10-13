import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {openRenderBrowser} from './render-browser.js';
import {PDFDocument} from 'pdf-lib';
import {invitationHtml,type ResolvedDesign} from '@save-the-date/templates';
export interface InvitationRendererPort{render(snapshot:ResolvedDesign,format:'jpeg'|'pdf'):Promise<{bytes:Buffer;contentType:string;checksum:string;width:number;height:number}>}
export class BrowserInvitationRenderer implements InvitationRendererPort{
 constructor(private executablePath:string,private fontDirectory:string,private browserEndpoint?:string){}
 async render(snapshot:ResolvedDesign,format:'jpeg'|'pdf'){
  let fonts=await readFile(path.join(this.fontDirectory,'fonts.css'),'utf8');
  for(const match of [...fonts.matchAll(/url\(\.\/([^)]*)\)/g)]){if(!/^[a-z0-9-]+\.woff2?$/.test(match[1]))throw Error('FONT_ASSET_INVALID');const bytes=await readFile(path.join(this.fontDirectory,match[1]));const expected=(snapshot.fontManifest.checksums as Record<string,string>)[match[1]];if(expected&&createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('FONT_ASSET_CHANGED');fonts=fonts.replace(match[0],`url(data:font/woff2;base64,${bytes.toString('base64')})`);}
  if(snapshot.photo&&!snapshot.photo.src.startsWith('data:image/'))throw Error('PHOTO_NOT_SNAPSHOTTED');
  const browser=await openRenderBrowser(this.executablePath,this.browserEndpoint);
  try{const page=await browser.newPage();await page.setViewport({width:480,height:672,deviceScaleFactor:3.125});await page.setRequestInterception(true);page.on('request',r=>{if(r.url().startsWith('data:')||r.url()==='about:blank')void r.continue();else void r.abort();});
   await page.setContent(invitationHtml(snapshot,fonts),{waitUntil:'load',timeout:30000});
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
   const overflow=await page.evaluate(()=>[...document.querySelectorAll<HTMLElement>('[data-fit]')].filter(e=>e.scrollHeight>e.clientHeight+1||e.scrollWidth>e.clientWidth+1).map(e=>e.dataset.fit));if(overflow.length)throw Error('TEXT_OVERFLOW:'+overflow.join(','));
   const bodyOverflow=await page.evaluate(()=>{const e=document.querySelector('[data-invitation-card]')!;return e.scrollHeight>672;});if(bodyOverflow)throw Error('TEXT_OVERFLOW:layout');
   const bytes=format==='jpeg'?Buffer.from(await page.screenshot({type:'jpeg',quality:96,clip:{x:0,y:0,width:480,height:672}})):Buffer.from(await page.pdf({width:'5in',height:'7in',printBackground:true,preferCSSPageSize:true,margin:{top:0,bottom:0,left:0,right:0}}));
   if(format==='pdf'){const pdf=await PDFDocument.load(bytes);if(pdf.getPageCount()!==1||pdf.getPage(0).getWidth()!==360||pdf.getPage(0).getHeight()!==504)throw Error('PDF_DIMENSIONS_INVALID');}
   return {bytes,contentType:format==='jpeg'?'image/jpeg':'application/pdf',checksum:createHash('sha256').update(bytes).digest('hex'),width:format==='jpeg'?1500:360,height:format==='jpeg'?2100:504};
  }finally{await browser.close();}
 }
}
export const templateFontDirectory=fileURLToPath(new URL('../../templates/assets',import.meta.url));
