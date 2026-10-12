import type {Concept,CreativeContext} from '@save-the-date/contracts';
import {DomainError,contrastRatio} from './index.js';
export function validateCreativeConstraints(concept:Concept,context:CreativeContext,eventIds:string[]){
 const close=(a:string,b:string)=>Math.sqrt([1,3,5].reduce((sum,i)=>sum+(parseInt(a.slice(i,i+2),16)-parseInt(b.slice(i,i+2),16))**2,0))<32;
 if(Object.values(concept.palette).some(value=>context.excludedColours.some(excluded=>close(value,excluded))))throw new DomainError(400,'CONSTRAINT_VIOLATION','This palette uses an excluded colour or a close shade');
 const colours={black:(r:number,g:number,b:number)=>Math.max(r,g,b)<55,white:(r:number,g:number,b:number)=>Math.min(r,g,b)>235,red:(r:number,g:number,b:number)=>r>g*1.4&&r>b*1.2&&r>75,blue:(r:number,g:number,b:number)=>b>r*1.25&&b>g*1.08,green:(r:number,g:number,b:number)=>g>r*1.2&&g>b*1.15,yellow:(r:number,g:number,b:number)=>r>150&&g>120&&b<Math.min(r,g)*0.6,orange:(r:number,g:number,b:number)=>r>150&&g>60&&g<r*.8&&b<g*.8};
 for(const [name,matches] of Object.entries(colours))if(context.exclusions.some(e=>new RegExp('\\b(?:no|exclude|avoid|without)\\s+(?:(?:the|colour|color)\\s+)*'+name+'\\b','i').test(e))&&Object.values(concept.palette).some(v=>matches(...[1,3,5].map(i=>parseInt(v.slice(i,i+2),16)) as [number,number,number])))throw new DomainError(400,'CONSTRAINT_VIOLATION','This palette conflicts with the named colour exclusion: '+name);
 for(const role of ['primary','secondary'] as const)if(contrastRatio(concept.palette[role],concept.palette.background)<4.5)throw new DomainError(400,'LOW_CONTRAST','Text palette roles must contrast at least 4.5:1 with the background');
 if(concept.eventNotes.some(note=>!eventIds.includes(note.eventId)))throw new DomainError(400,'CONSTRAINT_VIOLATION','A concept references an unrelated event');
 const expected=[...context.requirements,...context.exclusions,...context.excludedColours.map(hex=>'Exclude colour '+hex)];
 for(const value of expected){const check=concept.constraintChecks.find(c=>c.constraint.trim().toLowerCase()===value.trim().toLowerCase());if(!check?.satisfied)throw new DomainError(400,'CONSTRAINT_VIOLATION','A requirement or exclusion lacks a satisfied check: '+value);}
 if(context.exclusions.some(e=>/no hanging|no suspended|no ceiling/i.test(e))&&concept.decorDirections.some(d=>/hanging|suspended|ceiling/i.test(d.replace(/\b(no|avoid|without|never|exclude)\s+(?:any\s+)?(hanging|suspended|ceiling)\b/gi,''))))throw new DomainError(400,'CONSTRAINT_VIOLATION','Hanging decor contradicts the stated exclusion');
 if(concept.nextActions.some(a=>a.estimatedCost!==null&&(!a.currency||!a.assumption)))throw new DomainError(400,'CONSTRAINT_VIOLATION','Approximate costs require currency and an assumption');
 if(concept.board.some(tile=>tile.type==='note'?tile.assetId!==null:tile.assetId===null)||concept.board.some(tile=>tile.generated!==(tile.type==='generated')))throw new DomainError(400,'CONSTRAINT_VIOLATION','Board image type and provenance must agree');
 return concept;
}
