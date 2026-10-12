import type { Role } from '@save-the-date/contracts';
export class DomainError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const notFound = () => new DomainError(404,'NOT_FOUND','Resource not found');
export interface Actor { userId: string; sessionId: string; email: string; verified: boolean; reauthenticatedAt: Date }
export interface TenantContext { weddingId: string; actorId: string; role: Role; eventIds: string[]; albumIds: string[] }
export type Capability = 'read'|'edit'|'publish'|'members'|'guests'|'media'|'scan'|'primary';
export function requireCapability(tenant: TenantContext, capability: Capability, resourceId?: string) {
 const owner = tenant.role === 'owner' || tenant.role === 'co_owner';
 const allowed = capability==='primary' ? tenant.role==='owner' : capability==='read' ? true : capability==='publish'||capability==='members' ? owner : capability==='edit'||capability==='guests' ? owner||tenant.role==='planner' : capability==='media' ? owner||(['planner','media_contributor'].includes(tenant.role)&&!!resourceId&&tenant.albumIds.includes(resourceId)) : owner||(tenant.role==='security'&&!!resourceId&&tenant.eventIds.includes(resourceId));
 if(!allowed) throw notFound();
}
export function requireRecentAuthentication(actor: Actor, now = new Date()) {
 if(now.getTime()-actor.reauthenticatedAt.getTime()>15*60*1000) throw new DomainError(403,'REAUTH_REQUIRED','Confirm your password before this action');
}
export interface IdentityRepository {
 register(email:string,passwordHash:string,tokenHash:string):Promise<void>;
 verify(tokenHash:string):Promise<void>;
 login(email:string,check:(hash:string)=>Promise<boolean>,sessionHash:string):Promise<Actor|null>;
 authenticate(sessionHash:string):Promise<Actor|null>;
 logout(sessionHash:string):Promise<void>;
 recover(email:string,tokenHash:string):Promise<void>;
 reset(tokenHash:string,passwordHash:string):Promise<void>;
 reauthenticate(actor:Actor,check:(hash:string)=>Promise<boolean>):Promise<void>;
}
export interface WeddingRepository {
 tenant(actor:Actor,weddingId:string):Promise<TenantContext>;
}
export interface UnitOfWork<T> { run<R>(fn:(transaction:T)=>Promise<R>):Promise<R> }
export interface NotificationRepository {
 receive(event:{id:string;type:string;created_at:string;data:{email_id:string;project_id:string;status:string;recipients:string[];failure_code?:string;error_code?:string}}):Promise<void>;
}
export interface MediaRepository {
 list(actor:Actor,weddingId:string):Promise<unknown>;
 saveAlbum(actor:Actor,weddingId:string,input:import('@save-the-date/contracts').AlbumInput,version:number,albumId?:string):Promise<unknown>;
 intent(actor:Actor,weddingId:string,input:import('@save-the-date/contracts').UploadIntent):Promise<unknown>;
 expectedUpload(actor:Actor,weddingId:string,id:string):Promise<number>;
 receive(actor:Actor,weddingId:string,id:string,bytes:Buffer):Promise<unknown>;
 read(actor:Actor,weddingId:string,id:string,original?:boolean):Promise<{bytes:Buffer;contentType:string}>;
 readPublic(weddingId:string,id:string,publication:unknown):Promise<{bytes:Buffer;contentType:string}>;
 edit(actor:Actor,weddingId:string,id:string,input:import('@save-the-date/contracts').MediaEdit):Promise<unknown>;
 remove(actor:Actor,weddingId:string,id:string,version:number,confirmed:boolean):Promise<unknown>;
}

// The application depends on operations, not a database engine or query API.
export interface FoundationRepository extends IdentityRepository {
 ping():Promise<void>;
 resendVerification(email:string,tokenHash:string,link:string):Promise<void>;
 register(email:string,passwordHash:string,tokenHash:string,link?:string):Promise<void>;
 recover(email:string,tokenHash:string,link?:string):Promise<void>;
 rateLimit(key:string,limit:number,seconds?:number):Promise<void>;
 listWeddings(actor:Actor):Promise<unknown>;
 tenant(actor:Actor,weddingId:string):Promise<TenantContext>;
 createWedding(actor:Actor,input:import('@save-the-date/contracts').WeddingInput):Promise<unknown>;
 readWedding(actor:Actor,id:string):Promise<unknown>;
 patchWedding(actor:Actor,id:string,input:{expectedVersion:number;displayNames?:string;timezone?:string;primaryDate?:string|null;locale?:string;palette?:unknown;lifecycle?:string}):Promise<unknown>;
 listEvents(actor:Actor,id:string):Promise<unknown>;
 saveEvent(actor:Actor,id:string,event:import('@save-the-date/contracts').EventInput,eventId?:string,expectedVersion?:number):Promise<unknown>;
 invite(actor:Actor,id:string,input:{email:string;role:Role;eventIds:string[];albumIds:string[]},hash:string,link:string):Promise<unknown>;
 acceptInvite(actor:Actor,hash:string):Promise<unknown>;
 members(actor:Actor,id:string):Promise<unknown>;
 removeMember(actor:Actor,id:string,userId:string):Promise<void>;
 revokeInvite(actor:Actor,id:string,inviteId:string):Promise<void>;
 transfer(actor:Actor,id:string,userId:string):Promise<void>;
 deleteWedding(actor:Actor,id:string):Promise<void>;
 recoverWedding(actor:Actor,id:string):Promise<void>;
}
export interface PublicationRepository {
 site(actor:Actor,id:string):Promise<unknown>;
 saveSite(actor:Actor,id:string,config:import('@save-the-date/contracts').SiteConfig,version:number):Promise<unknown>;
 publish(actor:Actor,id:string,version:number,weddingVersion:number):Promise<unknown>;
 rotateShared(actor:Actor,id:string,hash:string):Promise<void>;
 exchangeShared(slug:string,hash:string,sessionHash:string):Promise<void>;
 publicSite(slug:string,sessionHash?:string):Promise<unknown>;
 publicPost(slug:string,path:string,sessionHash?:string):Promise<unknown>;
 listPosts(actor:Actor,id:string):Promise<unknown>;
 savePost(actor:Actor,id:string,post:import('@save-the-date/contracts').PostInput,version:number,postId?:string):Promise<unknown>;
 publishPost(actor:Actor,id:string,postId:string,version:number,publish:boolean):Promise<unknown>;
 deletePost(actor:Actor,id:string,postId:string,version:number):Promise<unknown>;
}
export function contrastRatio(a:string,b:string){const luminance=(hex:string)=>{const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;};const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}

export interface InvitationRepository {
 list(actor:Actor,weddingId:string):Promise<unknown>;
 save(actor:Actor,weddingId:string,title:string,design:import('@save-the-date/templates').InvitationDesign,expectedVersion:number,designId?:string):Promise<unknown>;
 preview(actor:Actor,weddingId:string,design:import('@save-the-date/templates').InvitationDesign):Promise<import('@save-the-date/templates').ResolvedDesign>;
 queue(actor:Actor,weddingId:string,designId:string,expectedVersion:number,preview:Pick<import('@save-the-date/templates').ResolvedDesign,'events'|'weddingVersion'>,operationKey?:string):Promise<{id:string}>;
 retry(actor:Actor,weddingId:string,exportId:string,format:'jpeg'|'pdf'):Promise<unknown>;
 download(actor:Actor,weddingId:string,exportId:string,format:'jpeg'|'pdf'):Promise<{bytes:Buffer;contentType:string}>;
}
