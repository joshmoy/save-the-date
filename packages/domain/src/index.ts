import type { Role } from '@save-the-date/contracts';
export class DomainError extends Error {
  constructor(public status: number, public code: string, message: string,public retryAfterSeconds?:number) { super(message); }
}
export const notFound = () => new DomainError(404,'NOT_FOUND','Resource not found');
export interface Actor { userId: string; sessionId: string; email: string; verified: boolean; reauthenticatedAt: Date }
export interface TenantContext {ownershipRecoveryHold?:boolean; weddingId: string; actorId: string; role: Role; eventIds: string[]; albumIds: string[] }
export type Capability = 'read'|'edit'|'publish'|'members'|'guests'|'media'|'scan'|'primary';
export function requireCapability(tenant: TenantContext, capability: Capability, resourceId?: string) {
 if(tenant.ownershipRecoveryHold&&['primary','publish','members'].includes(capability))throw new DomainError(409,'OWNERSHIP_REVIEW_REQUIRED','Restored ownership needs independent review before this action. Contact support');
 const owner = tenant.role === 'owner' || tenant.role === 'co_owner';
 const allowed = capability==='primary' ? tenant.role==='owner' : capability==='read' ? true : capability==='publish'||capability==='members' ? owner : capability==='edit'||capability==='guests' ? owner||tenant.role==='planner' : capability==='media' ? owner||(['planner','media_contributor'].includes(tenant.role)&&!!resourceId&&tenant.albumIds.includes(resourceId)) : owner||(tenant.role==='security'&&!!resourceId&&tenant.eventIds.includes(resourceId));
 if(!allowed) throw notFound();
}
export function requireRecentAuthentication(actor: Actor, now = new Date()) {
 if(now.getTime()-actor.reauthenticatedAt.getTime()>15*60*1000) throw new DomainError(403,'REAUTH_REQUIRED','Confirm your password before this action');
}
export interface IdentityRepository {
 register(email:string,passwordHash:string,tokenHash:string):Promise<void>;
 verify(tokenHash:string|string[]):Promise<void>;
 login(email:string,check:(hash:string)=>Promise<boolean>,sessionHash:string):Promise<Actor|null>;
 authenticate(sessionHash:string|string[]):Promise<Actor|null>;
 logout(sessionHash:string|string[]):Promise<void>;
 recover(email:string,tokenHash:string):Promise<void>;
 reset(tokenHash:string|string[],passwordHash:string):Promise<void>;
 reauthenticate(actor:Actor,check:(hash:string)=>Promise<boolean>):Promise<void>;
}
export interface WeddingRepository {
 tenant(actor:Actor,weddingId:string):Promise<TenantContext>;
}
export interface UnitOfWork<T> { run<R>(fn:(transaction:T)=>Promise<R>):Promise<R> }
export interface NotificationRepository {
 list(actor:Actor,weddingId:string,cursor?:string):Promise<unknown>;
 retry(actor:Actor,weddingId:string,messageId:string,recipient:string,operationKey:string):Promise<unknown>;
 receive(event:{id:string;type:string;created_at:string;data:{email_id:string;project_id:string;status:string;recipients:string[];failure_code?:string;error_code?:string}}):Promise<void>;
}
export interface MediaRepository {
 list(actor:Actor,weddingId:string,cursor?:string):Promise<unknown>;
 uploadStatus(actor:{userId:null;uploadSessionId:string},weddingId:string):Promise<unknown>;
 saveAlbum(actor:Actor,weddingId:string,input:import('@save-the-date/contracts').AlbumInput,version:number,albumId?:string):Promise<unknown>;
 intent(actor:MediaUploadActor,weddingId:string,input:import('@save-the-date/contracts').UploadIntent):Promise<unknown>;
 expectedUpload(actor:MediaUploadActor,weddingId:string,id:string):Promise<number>;
 receive(actor:MediaUploadActor,weddingId:string,id:string,bytes:Buffer):Promise<unknown>;
 read(actor:Actor,weddingId:string,id:string,original?:boolean):Promise<{bytes:Buffer;contentType:string}>;
 readPublic(weddingId:string,id:string,publication:unknown):Promise<{bytes:Buffer;contentType:string}>;
 edit(actor:Actor,weddingId:string,id:string,input:import('@save-the-date/contracts').MediaEdit):Promise<unknown>;
 remove(actor:Actor,weddingId:string,id:string,version:number,confirmed:boolean):Promise<unknown>;
}

// The application depends on operations, not a database engine or query API.
export interface FoundationRepository extends IdentityRepository {
 jobReferences(actor:Actor,weddingId:string,type:"invitation-export"|"planner-brief"|"creative-generation"|"archive-export"|"email",resourceId:string):Promise<{jobId:string;jobIds:string[]}>;
 readJob(actor:Actor,weddingId:string,jobId:string):Promise<unknown>;
 ping():Promise<void>;
 resendVerification(email:string,tokenHash:string,link:string):Promise<void>;
 register(email:string,passwordHash:string,tokenHash:string,link?:string):Promise<void>;
 recover(email:string,tokenHash:string,link?:string):Promise<void>;
 rateLimit(key:string,limit:number,seconds?:number):Promise<void>;
 listWeddings(actor:Actor,cursor?:string):Promise<unknown>;
 tenant(actor:Actor,weddingId:string):Promise<TenantContext>;
 createWedding(actor:Actor,input:import('@save-the-date/contracts').WeddingInput):Promise<unknown>;
 readWedding(actor:Actor,id:string):Promise<unknown>;
 patchWedding(actor:Actor,id:string,input:{expectedVersion:number;displayNames?:string;timezone?:string;primaryDate?:string|null;locale?:string;palette?:unknown;lifecycle?:string}):Promise<unknown>;
 listEventPage(actor:Actor,id:string,cursor?:string):Promise<unknown>;
 listEvents(actor:Actor,id:string):Promise<unknown>;
 saveEvent(actor:Actor,id:string,event:import('@save-the-date/contracts').EventInput,eventId?:string,expectedVersion?:number):Promise<unknown>;
 invite(actor:Actor,id:string,input:{email:string;role:Role;eventIds:string[];albumIds:string[]},hash:string,link:string):Promise<unknown>;
 acceptInvite(actor:Actor,hash:string|string[]):Promise<unknown>;
 members(actor:Actor,id:string,options?:{memberCursor?:string;inviteCursor?:string}):Promise<unknown>;
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
 exchangeShared(slug:string,hash:string|string[],sessionHash:string):Promise<void>;
 publicSite(slug:string,sessionHash?:string|string[],guestSessionHash?:string|string[],view?:{mode:'access'|'page'|'asset'|'album'|'albums'|'posts'|'post';id?:string;cursor?:string}):Promise<unknown>;
 publicPost(slug:string,path:string,sessionHash?:string|string[],guestSessionHash?:string|string[]):Promise<unknown>;
 listPosts(actor:Actor,id:string,cursor?:string):Promise<unknown>;
 savePost(actor:Actor,id:string,post:import('@save-the-date/contracts').PostInput,version:number,postId?:string):Promise<unknown>;
 publishPost(actor:Actor,id:string,postId:string,version:number,publish:boolean):Promise<unknown>;
 deletePost(actor:Actor,id:string,postId:string,version:number):Promise<unknown>;
}
export function contrastRatio(a:string,b:string){const luminance=(hex:string)=>{const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;};const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}

export interface InvitationRepository {
 listDesigns(actor:Actor,weddingId:string,cursor?:string):Promise<unknown>;
 list(actor:Actor,weddingId:string,cursor?:string):Promise<unknown>;
 save(actor:Actor,weddingId:string,title:string,design:import('@save-the-date/templates').InvitationDesign,expectedVersion:number,designId?:string):Promise<unknown>;
 preview(actor:Actor,weddingId:string,design:import('@save-the-date/templates').InvitationDesign):Promise<import('@save-the-date/templates').ResolvedDesign>;
 queue(actor:Actor,weddingId:string,designId:string,expectedVersion:number,preview:Pick<import('@save-the-date/templates').ResolvedDesign,'events'|'weddingVersion'>,operationKey?:string):Promise<{id:string}>;
 retry(actor:Actor,weddingId:string,exportId:string,format:'jpeg'|'pdf'):Promise<unknown>;
 download(actor:Actor,weddingId:string,exportId:string,format:'jpeg'|'pdf'):Promise<{bytes:Buffer;contentType:string}>;
}
export type GuestSession={id:string;grantId:string;weddingId:string;partyId:string;slug:string};
export type GuestListOptions={cursor?:string;search?:string;eventId?:string;state?:'unanswered'|'pending'|'confirmed'|'declined'|'waitlisted'};
export interface GuestRepository {
 listRequests(actor:Actor,weddingId:string,cursor?:string):Promise<unknown>;
 list(actor:Actor,weddingId:string,options?:GuestListOptions):Promise<unknown>;
 save(actor:Actor,weddingId:string,input:import('@save-the-date/contracts').GuestInput,version:number,attendeeId?:string):Promise<unknown>;
 remove(actor:Actor,weddingId:string,attendeeId:string,version:number):Promise<unknown>;
 issueGrant(actor:Actor,weddingId:string,partyId:string,days:number):Promise<{id:string;code:string;url:string;expiresInDays:number}>;
 revokeGrant(actor:Actor,weddingId:string,grantId:string):Promise<unknown>;
 exchange(slug:string,credential:string,sessionHash:string):Promise<unknown>;
 authenticate(sessionHash:string|string[]):Promise<GuestSession>;
 logout(sessionHash:string|string[]):Promise<unknown>;
 party(session:GuestSession):Promise<unknown>;
 submit(sessionHash:string|string[],eventId:string,input:import('@save-the-date/contracts').RsvpInput,key:string):Promise<unknown>;
 approve(actor:Actor,weddingId:string,eventId:string,attendeeId:string,version:number):Promise<unknown>;
 questions(actor:Actor,weddingId:string,eventId:string,input:{meal:boolean;dietary:boolean;accessibility:boolean;note:boolean;deleteAnswers:boolean}):Promise<unknown>;
 request(slug:string,input:{name:string;email:string;note:string}):Promise<unknown>;
 resolveRequest(actor:Actor,weddingId:string,requestId:string,approve:boolean,eventIds:string[]):Promise<{partyId:string|null}>;
 csvExport(actor:Actor,weddingId:string):Promise<string>;
 answers(actor:Actor,weddingId:string,eventId:string):Promise<unknown>;
 rsvpExport(actor:Actor,weddingId:string,sensitive?:boolean):Promise<string>;
 importPreview(actor:Actor,weddingId:string,csv:string):Promise<unknown>;
 importCommit(actor:Actor,weddingId:string,csv:string,decisions:Record<string,'create'|'skip'>):Promise<unknown>;
 sendAccess(actor:Actor,weddingId:string,partyId:string,grant:{url:string;code:string},recipients:string[],key:string):Promise<unknown>;
}
export interface PassRepository {
 listEligible(actor:Actor,weddingId:string,cursor?:string):Promise<unknown>;
 list(actor:Actor,weddingId:string,cursor?:string):Promise<unknown>;
 guestList(session:GuestSession):Promise<unknown>;
 issue(actor:Actor,weddingId:string,attendeeId:string,eventId:string,key:string):Promise<unknown>;
 revoke(actor:Actor,weddingId:string,passId:string,version:number,reason:string,key:string):Promise<unknown>;
 reissue(actor:Actor,weddingId:string,passId:string,version:number,reason:string,key:string):Promise<unknown>;
 redeem(actor:Actor,weddingId:string,eventId:string,credential:string,key:string):Promise<unknown>;
 correction(actor:Actor,weddingId:string,input:{attendeeId:string;eventId:string;name?:string;state?:'confirmed'|'declined';reason:string},key:string):Promise<unknown>;
 download(actor:Actor,weddingId:string,passId:string,format:'jpeg'|'pdf'):Promise<{bytes:Buffer;contentType:string}>;
 guestDownload(session:GuestSession,passId:string,format:'jpeg'|'pdf'):Promise<{bytes:Buffer;contentType:string}>;
 operationalList(actor:Actor,weddingId:string,eventId:string):Promise<unknown>;
 deliveryRecipients(actor:Actor,weddingId:string,passId:string):Promise<string[]>;
 send(actor:Actor,weddingId:string,passId:string,version:number,recipients:string[],key:string):Promise<unknown>;
 retryTicket(actor:Actor,weddingId:string,passId:string,format:'jpeg'|'pdf'):Promise<unknown>;
}
export type UploadSession={id:string;weddingId:string;slug:string;albumIds:string[];albums:{id:string;title:string}[];filesUsed:number;bytesUsed:number;fileLimit:number;byteLimit:number};
export type MediaUploadActor=Actor|{userId:null;uploadSessionId:string};
export interface UploadRepository {
 list(actor:Actor,id:string,cursor?:string):Promise<unknown>;
 create(actor:Actor,id:string,input:import('@save-the-date/contracts').UploadGrantInput):Promise<unknown>;
 revoke(actor:Actor,id:string,grantId:string):Promise<unknown>;
 exchange(slug:string,credential:string,sessionHash:string):Promise<unknown>;
 fromGuest(guest:GuestSession,sessionHash:string):Promise<unknown>;
 authenticate(hash:string|string[]):Promise<UploadSession>;
 logout(hash:string|string[]):Promise<unknown>;
}
export interface CreativeRepository {
 listPage(actor:Actor,weddingId:string,kind:'concepts'|'briefs'|'references',cursor?:string):Promise<unknown>;
 list(actor:Actor,weddingId:string,cursor?:string):Promise<unknown>;
 saveContext(actor:Actor,weddingId:string,input:import('@save-the-date/contracts').CreativeContext,version:number):Promise<unknown>;
 saveConcept(actor:Actor,weddingId:string,input:import('@save-the-date/contracts').Concept,contextVersion:number,version:number,conceptId?:string):Promise<unknown>;
 approve(actor:Actor,weddingId:string,conceptId:string,version:number):Promise<unknown>;
 themeDiff(actor:Actor,weddingId:string,conceptId:string,version:number):Promise<unknown>;
 applyTheme(actor:Actor,weddingId:string,conceptId:string,version:number,weddingVersion:number,siteVersion:number):Promise<unknown>;
 generate(actor:Actor,weddingId:string,input:import('@save-the-date/contracts').CreativeGeneration,key:string):Promise<unknown>;
 cancel(actor:Actor,weddingId:string,runId:string):Promise<unknown>;
 exportBrief(actor:Actor,weddingId:string,conceptId:string,version:number,key:string):Promise<unknown>;
 retryBrief(actor:Actor,weddingId:string,briefId:string,format:'json'|'pdf'):Promise<unknown>;
 downloadBrief(actor:Actor,weddingId:string,briefId:string,format:'json'|'pdf'):Promise<{bytes:Buffer;contentType:string}>;
 readAsset(actor:Actor,weddingId:string,assetId:string):Promise<{bytes:Buffer;contentType:string}>;
}
export * from './creative.js';

export interface RetentionRepository {
 requestAccountDeletion(actor:Actor):Promise<unknown>;
 status(actor:Actor,weddingId:string,cursor?:string):Promise<unknown>;
 review(actor:Actor,weddingId:string):Promise<unknown>;
 export(actor:Actor,weddingId:string,sensitive:boolean,operationKey:string):Promise<unknown>;
 retry(actor:Actor,weddingId:string,exportId:string):Promise<unknown>;
 download(actor:Actor,weddingId:string,exportId:string):Promise<{chunks:AsyncIterable<Uint8Array>;bytes:number;contentType:string}>;
}
export interface OperatorRepository {
 resolveOwnership(actor:Actor,weddingId:string,primaryOwnerId:string,ownershipVerified:true,reason:string):Promise<unknown>;
 resolveAdmissionHold(actor:Actor,weddingId:string,passId:string,reason:string,notAdmittedConfirmed:true):Promise<unknown>;
 recoverAccount(actor:Actor,userId:string,input:{reason:string;ownershipVerified:true}):Promise<unknown>;
 dashboard(actor:Actor,cursor?:string):Promise<unknown>;
 wedding(actor:Actor,weddingId:string):Promise<unknown>;
 controls(actor:Actor,weddingId:string,input:import('@save-the-date/contracts').OperatorControls):Promise<unknown>;
 renew(actor:Actor,weddingId:string,input:{until:string;reason:string;expectedVersion:number}):Promise<unknown>;
 grantMedia(actor:Actor,weddingId:string,input:{assetId:string;reason:string}):Promise<unknown>;
 readMedia(actor:Actor,grantId:string):Promise<{bytes:Buffer;contentType:string}>;
 submitReport(input:import('@save-the-date/contracts').z.infer<typeof import('@save-the-date/contracts').supportReportSchema>):Promise<unknown>;
 resolveReport(actor:Actor,reportId:string,state:'reviewing'|'resolved',reason:string):Promise<unknown>;
}
