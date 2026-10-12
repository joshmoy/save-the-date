import {fontManifest} from './font-manifest.js';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {z} from 'zod';
export const catalogue=Object.freeze([
 {id:'royal-elegance',version:1,name:'Royal elegance',font:'Cormorant',ornament:'✦',layouts:['single','compact']},
 {id:'garden-romance',version:1,name:'Garden romance',font:'Lora',ornament:'❧',layouts:['single','compact']},
 {id:'modern-minimal',version:1,name:'Modern minimal',font:'Source Serif 4',ornament:'—',layouts:['single','compact']},
 {id:'photo-story',version:1,name:'Photo story',font:'Lora',ornament:'·',layouts:['single','compact']},
] as const);
export const colourRoles=['background','primary','secondary','accent','names','heading','body','footer','border','ornament'] as const;
const colour=z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const designSchema=z.object({
 templateId:z.enum(['royal-elegance','garden-romance','modern-minimal','photo-story']),templateVersion:z.literal(1).default(1),schemaVersion:z.literal(1).default(1),
 eventIds:z.array(z.uuid().transform(v=>v.toLowerCase())).min(1).max(3),layout:z.enum(['single','compact']).default('single'),
 wording:z.object({heading:z.string().max(100).default('Together with our loved ones'),names:z.string().max(160).optional(),body:z.string().max(280).default('Invite you to celebrate their wedding'),footer:z.string().max(160).default('Find the latest details on our wedding website')}).default({heading:'Together with our loved ones',body:'Invite you to celebrate their wedding',footer:'Find the latest details on our wedding website'}),
 colours:z.object(Object.fromEntries(colourRoles.map(role=>[role,colour.optional()])) as Record<typeof colourRoles[number],z.ZodOptional<typeof colour>>).strict().default({}),
 fonts:z.object({heading:z.enum(['Cormorant','Lora','Source Serif 4']).optional(),body:z.enum(['Lora','Source Serif 4','sans-serif']).default('Lora')} ).default({body:'Lora'}),
 sizes:z.object({names:z.number().min(24).max(54).default(42),heading:z.number().min(12).max(24).default(15),body:z.number().min(12).max(20).default(15),footer:z.number().min(10).max(15).default(11)}).default({names:42,heading:15,body:15,footer:11}),
 alignment:z.enum(['left','center']).default('center'),border:z.boolean().default(true),ornament:z.boolean().default(true),qr:z.boolean().default(true),
 photo:z.object({assetId:z.uuid().transform(v=>v.toLowerCase()),focalX:z.number().min(0).max(100).default(50),focalY:z.number().min(0).max(100).default(50),zoom:z.number().min(1).max(3).default(1)}).nullable().default(null),
}).strict().superRefine((d,c)=>{if(d.layout==='single'&&d.eventIds.length!==1)c.addIssue({code:'custom',path:['eventIds'],message:'Choose one event or use the compact layout'});});
export type InvitationDesign=z.infer<typeof designSchema>;
export type ResolvedDesign={design:InvitationDesign;names:string;url:string;events:{id:string;version:number;title:string;date:string;venue:string;dressCode:string}[];colours:Record<typeof colourRoles[number],string>;photo?:{src:string;checksum:string;alt:string};qrDataUrl?:string;qrLabel?:string;purpose?:'invitation'|'admission';weddingVersion:number;rendererVersion:1;fontManifest:typeof fontManifest;resolvedAt:string};
export function resolveDesign(design:InvitationDesign,context:{names:string;url:string;palette:{background:string;primary:string;secondary:string;accent:string};events:ResolvedDesign['events'];weddingVersion:number;headingFont?:'Cormorant'|'Lora'|'Source Serif 4'}):ResolvedDesign{
 const url=new URL(context.url);if(!['http:','https:'].includes(url.protocol)||url.search||url.hash)throw Error('Canonical website URL required');
 const colours={...context.palette,names:context.palette.primary,heading:context.palette.secondary,body:context.palette.primary,footer:context.palette.secondary,border:context.palette.accent,ornament:context.palette.accent,...design.colours};
 return {design:{...design,fonts:{...design.fonts,heading:design.fonts.heading??context.headingFont}},names:design.wording.names??context.names,url:url.toString(),events:context.events,colours,weddingVersion:context.weddingVersion,rendererVersion:1,fontManifest,resolvedAt:new Date().toISOString()};
}
export function InvitationCard({resolved:r}:{resolved:ResolvedDesign}){
 const d=r.design,t=catalogue.find(t=>t.id===d.templateId)!;const c=r.colours;const text=(field:string,fontSize:number,color:string,maxHeight:number,fontFamily:string=d.fonts.body)=>({style:{fontFamily,fontSize,color,maxHeight,fontWeight:400,overflow:'hidden',margin:d.layout==='compact'?'0 0 8px':'0 0 14px',flexShrink:0,lineHeight:1.25},'data-fit':field});
 return <article data-invitation-card style={{width:480,height:672,boxSizing:'border-box',background:c.background,color:c.body,padding:24,textAlign:d.alignment,position:'relative',overflow:'hidden'}}><div style={{height:'100%',boxSizing:'border-box',border:d.border?(d.templateId==='royal-elegance'?'3px double ':d.templateId==='garden-romance'?'1px dotted ':'1px solid ')+c.border:'none',padding:d.layout==='compact'?16:22,display:'flex',flexDirection:'column',justifyContent:'center'}}>
 {r.photo&&<div style={{height:d.layout==='compact'?72:150,overflow:'hidden',marginBottom:16,flexShrink:0}}><img alt={r.photo.alt} src={r.photo.src} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:`${d.photo?.focalX??50}% ${d.photo?.focalY??50}%`,transform:`scale(${d.photo?.zoom??1})`}}/></div>}
 <p {...text('heading',d.sizes.heading,c.heading,60)}>{d.wording.heading}</p>
 <h1 {...text('names',d.sizes.names,c.names,r.purpose==='admission'?220:130,d.fonts.heading??t.font)}>{r.names}</h1>
 {d.ornament&&d.templateId==='garden-romance'&&<svg aria-hidden viewBox="0 0 140 24" width="140" height="24" style={{color:c.ornament,margin:'0 auto 12px',flexShrink:0}}><path d="M8 20Q70 0 132 20M38 13Q20 1 22 16M57 8Q43 0 43 12M83 8Q94 0 96 12M103 13Q119 1 121 16" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>}{d.ornament&&<div aria-hidden style={{color:c.ornament,fontSize:24,marginBottom:10}}>{t.ornament}</div>}
 <p {...text('body',d.sizes.body,c.body,70)}>{d.wording.body}</p>
 <div data-fit="events" style={{maxHeight:d.layout==='compact'?180:105,overflow:'hidden',flexShrink:0,fontFamily:d.fonts.body,fontSize:d.layout==='compact'?Math.min(d.sizes.body,13):d.sizes.body,lineHeight:1.2}}>{r.events.map(e=><section key={e.id} style={{marginBottom:d.layout==='compact'?6:10}}><span style={{display:'block',letterSpacing:d.templateId==='modern-minimal'?1:0}}>{e.title}</span><div>{e.date}</div><div>{e.venue}</div>{e.dressCode&&<div>{e.dressCode}</div>}</section>)}</div>
 <footer style={{marginTop:12,fontFamily:d.fonts.body,color:c.footer,fontSize:d.sizes.footer,display:d.layout==='compact'?'grid':'block',gridTemplateColumns:d.qr?'1fr 72px':'1fr',columnGap:10,alignItems:'center',flexShrink:0}}><p {...text('footer',d.sizes.footer,c.footer,40)}>{d.wording.footer}</p><a href={r.url} data-fit="url" style={{color:c.footer,display:'block',overflowWrap:'anywhere',maxHeight:40,overflow:'hidden'}}>{r.url}</a>{d.qr&&r.qrDataUrl&&<img alt={r.qrLabel??'Wedding website QR code'} src={r.qrDataUrl} width={72} height={72} style={{display:'block',margin:d.layout==='compact'?'0':'10px auto 0',background:'#fff',gridColumn:2,gridRow:'1 / 3'}}/>}</footer>
 </div></article>;
}
export function invitationHtml(resolved:ResolvedDesign,fontCss:string){return '<!doctype html><html><head><meta charset="utf-8"><style>'+fontCss+'html,body{margin:0;padding:0;}*{box-sizing:border-box;}@page{size:5in 7in;margin:0}</style></head><body>'+renderToStaticMarkup(<InvitationCard resolved={resolved}/>)+'</body></html>';}

export function contrastWarnings(r:ResolvedDesign){const luminance=(hex:string)=>{const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;};const background=luminance(r.colours.background);return (['names','heading','body','footer'] as const).filter(role=>{const text=luminance(r.colours[role]);return (Math.max(text,background)+0.05)/(Math.min(text,background)+0.05)<(r.design.sizes[role]>=24?3:4.5);});}
