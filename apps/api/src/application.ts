import {guestSaveSchema,guestAccessSchema,guestGrantSchema,rsvpSchema,questionPolicySchema,accessRequestSchema,importSchema,z} from '@save-the-date/contracts';
import type {GuestRepository} from '@save-the-date/domain';
import {designSchema,catalogue,type ResolvedDesign} from '@save-the-date/templates';
import type {InvitationRepository} from '@save-the-date/domain';
import { verifyRavenEvent, credential, credentialHash, hashPassword, checkPassword } from '@save-the-date/adapters';
import { DomainError, type Actor, type FoundationRepository, type MediaRepository, type NotificationRepository, type PublicationRepository } from '@save-the-date/domain';
import { registerSchema, loginSchema, tokenSchema, recoverSchema, resetSchema, weddingSchema, weddingPatchSchema, eventSchema, eventPatchSchema, inviteSchema, reauthSchema, transferSchema, deleteSchema, uuid, slug, siteSaveSchema, publishSchema, postSaveSchema, revisionSchema, albumSaveSchema, uploadIntentSchema, mediaEditSchema, mediaDeleteSchema } from '@save-the-date/contracts';
import type { Config } from '@save-the-date/config';
import type { Request, Response } from 'express';

export class Application {
 private activeUploads=0;
 constructor(readonly store:FoundationRepository,readonly config:Config,readonly publication:PublicationRepository,readonly notifications?:NotificationRepository,readonly media?:MediaRepository,readonly invitations?:InvitationRepository,readonly guests?:GuestRepository){}
 hash(token:string){return credentialHash(token,this.config.TOKEN_HASH_KEYS);}
 cookie(res:Response,token:string,clear=false){res.cookie('std_session',token,{httpOnly:true,secure:this.config.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:clear?0:7*24*3600*1000});}
 session(req:Request){return req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('std_session='))?.slice(12)??'';}
 async actor(req:Request):Promise<Actor>{const actor=await this.store.authenticate(this.hash(this.session(req)));if(!actor)throw new DomainError(401,'UNAUTHENTICATED','Sign in to continue');return actor;}
 binary(req:Request,res:Response,file:{bytes:Buffer;contentType:string}){
  res.setHeader('Content-Type',file.contentType);res.setHeader('Accept-Ranges','bytes');const range=req.headers.range;
  if(range){const match=/^bytes=(\d+)-(\d*)$/.exec(range);const start=Number(match?.[1]),end=match?.[2]?Number(match[2]):file.bytes.length-1;if(!match||start>end||start>=file.bytes.length){res.status(416).setHeader('Content-Range','bytes */'+file.bytes.length);res.end();return;}const last=Math.min(end,file.bytes.length-1);res.status(206).setHeader('Content-Range',`bytes ${start}-${last}/${file.bytes.length}`);res.send(file.bytes.subarray(start,last+1));return;}res.send(file.bytes);
 }
 async dispatch(req:Request,res:Response){
  res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
  const method=req.method;const parts=req.path.replace(/^\/api\/v1\/?/,'').split('/').filter(Boolean);const body=req.body??{};
  if(method==='GET'&&parts[0]==='health'){await this.store.ping();return {status:'ok',database:'postgres',ai:'disabled'};}
  if(parts[0]==='provider-events'&&parts[1]==='ravenrelay'&&method==='POST'){
   if(!this.config.RAVENRELAY_WEBHOOK_SECRET||!this.config.RAVENRELAY_PROJECT_ID||!this.notifications)throw new DomainError(503,'WEBHOOK_DISABLED','Provider callback is not configured');
   let event;try{event=verifyRavenEvent((req as Request&{rawBody?:Buffer}).rawBody??Buffer.alloc(0),{timestamp:String(req.headers['ravenrelay-timestamp']??''),signature:String(req.headers['ravenrelay-signature']??''),eventId:String(req.headers['ravenrelay-event-id']??'')},this.config.RAVENRELAY_WEBHOOK_SECRET,this.config.RAVENRELAY_PROJECT_ID);}catch{throw new DomainError(401,'INVALID_WEBHOOK','Provider signature or event is invalid');}
   await this.notifications.receive(event);return {received:true};
  }
  if(!['GET','HEAD'].includes(method)){
   if(req.headers.origin!==this.config.PUBLIC_ORIGIN)throw new DomainError(403,'ORIGIN_REJECTED','Use the configured application origin');
   if(req.headers['x-std-csrf']!=='1'||!(req.is('application/json')||method==='PUT'&&parts[0]==='weddings'&&parts[2]==='media'&&parts[4]==='bytes'&&req.is('application/octet-stream')))throw new DomainError(403,'CSRF_REJECTED','Reload and retry this request');
  }
  // Direct API requests use the actual peer IP. Deployment must configure a trusted proxy explicitly.
  await this.store.rateLimit('http:'+this.hash(req.ip??'unknown'),300);
  if(parts[0]==='identity'){
   const action=parts[1];await this.store.rateLimit('identity:'+action+':'+this.hash(req.ip??'unknown'),action==='session'?120:10);
   if(action==='register'&&method==='POST'){const v=registerSchema.parse(body),token=credential();await this.store.register(v.email,await hashPassword(v.password),this.hash(token),`${this.config.PUBLIC_ORIGIN}/platform?verify=${token}`);res.status(202);return {message:'If this address is available, a verification email is queued'};}
   if(action==='resend-verification'&&method==='POST'){const v=recoverSchema.parse(body),token=credential();await this.store.resendVerification(v.email,this.hash(token),`${this.config.PUBLIC_ORIGIN}/platform?verify=${token}`);res.status(202);return {message:'If the account needs verification, a new link is queued'};}
   if(action==='verify'&&method==='POST'){await this.store.verify(this.hash(tokenSchema.parse(body).token));return {message:'Email verified. You can now sign in'};}
   if(action==='login'&&method==='POST'){const v=loginSchema.parse(body),token=credential();const actor=await this.store.login(v.email,h=>checkPassword(v.password,h),this.hash(token));if(!actor)throw new DomainError(401,'INVALID_LOGIN','Email or password is incorrect');this.cookie(res,token);return {email:actor.email,verified:actor.verified};}
   if(action==='recover'&&method==='POST'){const v=recoverSchema.parse(body),token=credential();await this.store.recover(v.email,this.hash(token),`${this.config.PUBLIC_ORIGIN}/platform?reset=${token}`);res.status(202);return {message:'If this account exists, a recovery email is queued'};}
   if(action==='reset'&&method==='POST'){const v=resetSchema.parse(body);await this.store.reset(this.hash(v.token),await hashPassword(v.password));this.cookie(res,'',true);return {message:'Password updated. All previous sessions are revoked'};}
   if(action==='logout'&&method==='POST'){await this.store.logout(this.hash(this.session(req)));this.cookie(res,'',true);return {message:'Signed out'};}
   const actor=await this.actor(req);
   if(action==='session'&&method==='GET')return {userId:actor.userId,email:actor.email,verified:actor.verified};
   if(action==='reauthenticate'&&method==='POST'){const v=reauthSchema.parse(body);await this.store.reauthenticate(actor,h=>checkPassword(v.password,h));return {message:'Identity confirmed for fifteen minutes'};}
  }
  if(parts[0]==='public'&&parts[1]==='weddings'){
   const weddingSlug=slug.parse(parts[2]);const cookieName='std_site_'+weddingSlug;const session=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1);
   if(parts[3]==='media'&&parts.length===5&&method==='GET'&&this.media){const site=await this.publication.publicSite(weddingSlug,session?this.hash(session):undefined);const file=await this.media.readPublic(weddingSlug,uuid.parse(parts[4]),site);this.binary(req,res,file);return undefined;}
   if(parts.length===3&&method==='GET')return this.publication.publicSite(weddingSlug,session?this.hash(session):undefined);
   if(parts[3]==='access'&&method==='POST'){await this.store.rateLimit('site-access:'+this.hash(req.ip??'unknown'),10);const token=credential();await this.publication.exchangeShared(weddingSlug,this.hash(tokenSchema.parse(body).token),this.hash(token));res.cookie(cookieName,token,{httpOnly:true,secure:this.config.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:7*24*3600*1000});return {message:'Website access granted. This is shared access, not identity verification'};}
   if(parts[3]==='posts'&&parts.length===5&&method==='GET')return this.publication.publicPost(weddingSlug,slug.parse(parts[4]),session?this.hash(session):undefined);
  }
  if(parts[0]==='guest'&&this.guests){
   const sessionToken=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('std_guest_session='))?.slice(18)??'';const sessionHash=this.hash('guest-session:'+sessionToken);
   if(parts[1]==='access'&&method==='POST'){await this.store.rateLimit('guest-access:'+this.hash(req.ip??'unknown'),10);const v=guestAccessSchema.parse(body),token=credential();await this.guests.exchange(v.slug,v.credential,this.hash('guest-session:'+token));res.cookie('std_guest_session',token,{httpOnly:true,secure:this.config.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:7*24*3600*1000});return {signedIn:true};}
   if(parts[1]==='request'&&method==='POST'){await this.store.rateLimit('guest-request:'+this.hash(req.ip??'unknown'),5);const v=accessRequestSchema.parse(body);return this.guests.request(v.slug,v);}
   if(parts[1]==='logout'&&method==='POST'){await this.guests.logout(sessionHash);res.cookie('std_guest_session','',{httpOnly:true,secure:this.config.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});return {signedOut:true};}
   const session=await this.guests.authenticate(sessionHash);
   if(parts[1]==='party'&&method==='GET')return this.guests.party(session);
   if(parts[1]==='events'&&parts[3]==='rsvp'&&method==='POST')return this.guests.submit(sessionHash,uuid.parse(parts[2]),rsvpSchema.parse(body),uuid.parse(req.headers['idempotency-key']));
  }
  const actor=await this.actor(req);
  if(parts[0]==='invites'&&parts[1]==='accept'&&method==='POST')return this.store.acceptInvite(actor,this.hash(tokenSchema.parse(body).token));
  if(parts[0]==='weddings'){
   if(parts.length===1){if(method==='GET')return this.store.listWeddings(actor);if(method==='POST'){res.status(201);return this.store.createWedding(actor,weddingSchema.parse(body));}}
   const id=uuid.parse(parts[1]);
   if(parts.length===2){if(method==='GET')return this.store.readWedding(actor,id);if(method==='PATCH')return this.store.patchWedding(actor,id,weddingPatchSchema.parse(body));if(method==='DELETE'){deleteSchema.parse(body);await this.store.deleteWedding(actor,id);return {message:'Workspace deleted. Recovery available for thirty days',weddingId:id};}}
   if(parts[2]==='recover'&&method==='POST'){await this.store.recoverWedding(actor,id);return {message:'Workspace recovered'};}
   if(parts[2]==='transfer'&&method==='POST'){await this.store.transfer(actor,id,transferSchema.parse(body).userId);return {message:'Ownership transferred'};}
   if(this.guests&&parts[2]==='guests'){
    if(parts.length===3&&method==='GET')return this.guests.list(actor,id);
    if(parts[3]==='responses'&&parts[4]==='export'&&method==='GET'){res.setHeader('Content-Disposition','attachment; filename=responses.csv');res.setHeader('Content-Type','text/csv; charset=utf-8');res.send(await this.guests.rsvpExport(actor,id,req.query.sensitive==='true'));return;}
    if(parts[3]==='export'&&method==='GET'){res.setHeader('Content-Disposition','attachment; filename=guests.csv');res.setHeader('Content-Type','text/csv; charset=utf-8');res.send(await this.guests.csvExport(actor,id));return;}
    if(parts[3]==='import'&&method==='POST'){const v=importSchema.parse(body);return parts[4]==='preview'?this.guests.importPreview(actor,id,v.csv):this.guests.importCommit(actor,id,v.csv,v.decisions);}
    if(parts[3]==='requests'&&parts[4]&&method==='POST'){const v=z.object({approve:z.boolean(),eventIds:z.array(uuid).max(50)}).strict().parse(body);const r=await this.guests.resolveRequest(actor,id,uuid.parse(parts[4]),v.approve,v.eventIds);return r.partyId?{...r,grant:await this.guests.issueGrant(actor,id,r.partyId,180)}:r;}
    if(parts[3]==='grants'&&parts[4]&&method==='DELETE')return this.guests.revokeGrant(actor,id,uuid.parse(parts[4]));
    if(parts[3]==='parties'&&parts[4]&&parts[5]==='grant'&&method==='POST')return this.guests.issueGrant(actor,id,uuid.parse(parts[4]),guestGrantSchema.parse(body).days);
    if(parts[3]==='parties'&&parts[4]&&parts[5]==='send'&&method==='POST'){const v=z.object({grant:z.object({url:z.url(),code:z.string().max(128)}),recipients:z.array(z.email()).min(1).max(100)}).strict().parse(body);return this.guests.sendAccess(actor,id,uuid.parse(parts[4]),v.grant,v.recipients,uuid.parse(req.headers['idempotency-key']));}
    if(parts.length===3&&method==='POST'){res.status(201);const v=guestSaveSchema.parse(body);return this.guests.save(actor,id,v.guest,v.expectedVersion);}
    if(parts.length===4&&method==='PATCH'){const v=guestSaveSchema.parse(body);return this.guests.save(actor,id,v.guest,v.expectedVersion,uuid.parse(parts[3]));}
    if(parts.length===4&&method==='DELETE')return this.guests.remove(actor,id,uuid.parse(parts[3]),revisionSchema.parse(body).expectedVersion);
   }
   if(this.guests&&parts[2]==='events'&&parts[4]==='answers'&&method==='GET')return this.guests.answers(actor,id,uuid.parse(parts[3]));
   if(this.guests&&parts[2]==='events'&&parts[4]==='questions'&&method==='PATCH')return this.guests.questions(actor,id,uuid.parse(parts[3]),questionPolicySchema.parse(body));
   if(this.guests&&parts[2]==='events'&&parts[4]==='rsvp'&&parts[6]==='approve'&&method==='POST')return this.guests.approve(actor,id,uuid.parse(parts[3]),uuid.parse(parts[5]),revisionSchema.parse(body).expectedVersion);
   if(this.invitations&&parts[2]==='invitations'){
    const z=(await import('@save-the-date/contracts')).z;
    if(parts[3]==='catalogue'&&method==='GET'){await this.store.readWedding(actor,id);return catalogue;}
    if(parts[3]==='preview'&&method==='POST')return this.invitations.preview(actor,id,designSchema.parse(body));
    if(parts.length===3&&method==='GET')return this.invitations.list(actor,id);
    if((parts.length===3&&method==='POST')||(parts.length===4&&method==='PATCH')){const v=z.object({title:z.string().trim().min(1).max(100),design:designSchema,expectedVersion:z.number().int().min(0)}).strict().parse(body);return this.invitations.save(actor,id,v.title,v.design,v.expectedVersion,parts[3]?uuid.parse(parts[3]):undefined);}
    if(parts[3]==='exports'){
     const exportId=uuid.parse(parts[4]),format=z.enum(['jpeg','pdf']).parse(parts[5]);
     if(parts[6]==='retry'&&method==='POST')return this.invitations.retry(actor,id,exportId,format);
     if(method==='GET'){res.setHeader('Content-Disposition',`attachment; filename=invitation-${exportId}.${format}`);this.binary(req,res,await this.invitations.download(actor,id,exportId,format));return;}
    }
    if(parts[4]==='export'&&method==='POST'){const v=z.object({expectedVersion:z.number().int().positive(),preview:z.object({events:z.array(z.unknown()),weddingVersion:z.number().int()})}).parse(body);res.status(202);return this.invitations.queue(actor,id,uuid.parse(parts[3]),v.expectedVersion,v.preview as ResolvedDesign,uuid.parse(req.headers['idempotency-key']));}
   }
   if(this.media&&parts[2]==='albums'){
    if(parts.length===3&&method==='POST'){const v=albumSaveSchema.parse(body);res.status(201);return this.media.saveAlbum(actor,id,v.album,v.expectedVersion);}
    if(parts.length===4&&method==='PATCH'){const v=albumSaveSchema.parse(body);return this.media.saveAlbum(actor,id,v.album,v.expectedVersion,uuid.parse(parts[3]));}
   }
   if(this.media&&parts[2]==='media'){
    if(parts.length===3&&method==='GET')return this.media.list(actor,id);
    if(parts[3]==='intents'&&method==='POST'){res.status(201);return this.media.intent(actor,id,uploadIntentSchema.parse(body));}
    const assetId=uuid.parse(parts[3]);
    if(parts[4]==='bytes'&&method==='PUT'){const max=await this.media.expectedUpload(actor,id,assetId);const length=Number(req.headers['content-length']);if(Number.isFinite(length)&&length>max)throw new DomainError(413,'FILE_TOO_LARGE','Transfer exceeds the reserved file size');if(this.activeUploads>=2)throw new DomainError(429,'UPLOAD_BUSY','Uploads are busy. Retry this file in a moment');await this.store.rateLimit('upload:'+actor.userId,20,3600);this.activeUploads++;req.setTimeout(120000);try{const chunks:Buffer[]=[];let size=0;for await(const chunk of req){const bytes=Buffer.from(chunk);size+=bytes.length;if(size>max)throw new DomainError(413,'FILE_TOO_LARGE','Transfer exceeds the reserved file size');chunks.push(bytes);}res.status(202);return await this.media.receive(actor,id,assetId,Buffer.concat(chunks));}finally{this.activeUploads--;}}
    if(method==='GET'){if(parts[4]==='original')res.setHeader('Content-Disposition',`attachment; filename="${assetId}"`);const file=await this.media.read(actor,id,assetId,parts[4]==='original');this.binary(req,res,file);return undefined;}
    if(method==='PATCH')return this.media.edit(actor,id,assetId,mediaEditSchema.parse(body));
    if(method==='DELETE'){const v=mediaDeleteSchema.parse(body);return this.media.remove(actor,id,assetId,v.expectedVersion,v.confirmPublishedReferences);}
   }
   if(parts[2]==='site'){
    if(parts.length===3&&method==='GET')return this.publication.site(actor,id);
    if(parts.length===3&&method==='PATCH'){const v=siteSaveSchema.parse(body);return this.publication.saveSite(actor,id,v.config,v.expectedVersion);}
    if(parts[3]==='publish'&&method==='POST'){const v=publishSchema.parse(body);return this.publication.publish(actor,id,v.expectedVersion,v.weddingVersion);}
    if(parts[3]==='shared-code'&&method==='POST'){const token=credential();await this.publication.rotateShared(actor,id,this.hash(token));return {code:token,message:'Old website access codes and sessions are now revoked'};}
   }
   if(parts[2]==='posts'){
    if(parts.length===3&&method==='GET')return this.publication.listPosts(actor,id);
    if(parts.length===3&&method==='POST'){const v=postSaveSchema.parse(body);res.status(201);return this.publication.savePost(actor,id,v.post,v.expectedVersion);}
    const postId=uuid.parse(parts[3]);
    if(parts.length===4&&method==='PATCH'){const v=postSaveSchema.parse(body);return this.publication.savePost(actor,id,v.post,v.expectedVersion,postId);}
    if(parts.length===4&&method==='DELETE')return this.publication.deletePost(actor,id,postId,revisionSchema.parse(body).expectedVersion);
    if(['publish','unpublish'].includes(parts[4])&&method==='POST')return this.publication.publishPost(actor,id,postId,revisionSchema.parse(body).expectedVersion,parts[4]==='publish');
   }
   if(parts[2]==='events'){
    if(parts.length===3&&method==='GET')return this.store.listEvents(actor,id);
    if(parts.length===3&&method==='POST'){res.status(201);return this.store.saveEvent(actor,id,eventSchema.parse(body));}
    if(parts.length===4&&method==='PATCH'){const v=eventPatchSchema.parse(body);return this.store.saveEvent(actor,id,v.event,uuid.parse(parts[3]),v.expectedVersion);}
   }
   if(parts[2]==='members'){
    if(parts.length===3&&method==='GET')return this.store.members(actor,id);
    if(parts.length===4&&method==='DELETE'){await this.store.removeMember(actor,id,uuid.parse(parts[3]));return {message:'Member removed'};}
   }
   if(parts[2]==='invites'){
    if(parts.length===3&&method==='POST'){const v=inviteSchema.parse(body),token=credential();res.status(201);return this.store.invite(actor,id,v,this.hash(token),`${this.config.PUBLIC_ORIGIN}/platform?invite=${token}`);}
    if(parts.length===4&&method==='DELETE'){await this.store.revokeInvite(actor,id,uuid.parse(parts[3]));return {message:'Invitation revoked'};}
   }
  }
  throw new DomainError(404,'NOT_FOUND','Resource not found');
 }
}
