export type WebsitePalette={background:string;primary:string;accent:string};
export type WebsiteSurfaces={schemaVersion:1;heroBackground:string;tintPercent:number};
const channels=(hex:string)=>{if(!/^#[a-f0-9]{6}$/i.test(hex))throw Error('INVALID_WEBSITE_PALETTE');return [1,3,5].map(index=>Number.parseInt(hex.slice(index,index+2),16));};
const luminance=(hex:string)=>channels(hex).map(channel=>{const value=channel/255;return value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4;}).reduce((total,value,index)=>total+value*[0.2126,0.7152,0.0722][index],0);
const contrast=(first:string,second:string)=>{const a=luminance(first),b=luminance(second);return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);};
/** Shared publication/preview resolver. Preserve chosen colours while keeping normal hero text readable. */
export function resolveWebsiteSurfaces(palette:WebsitePalette,theme:'garden'|'modern'):WebsiteSurfaces{
 if(theme==='modern')return {schemaVersion:1,heroBackground:palette.background,tintPercent:0};
 const base=channels(palette.background),accent=channels(palette.accent);
 for(let percent=8;percent>=0;percent--){
  const background='#'+base.map((value,index)=>Math.round((value*(100-percent)+accent[index]*percent)/100).toString(16).padStart(2,'0')).join('').toUpperCase();
  if(contrast(palette.primary,background)>=4.5)return {schemaVersion:1,heroBackground:background,tintPercent:percent};
 }
 // Invalid base palettes are rejected by the authoritative publication/approval commands.
 return {schemaVersion:1,heroBackground:palette.background,tintPercent:0};
}
