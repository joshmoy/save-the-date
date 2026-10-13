import {apiSchemas,openApiDocument} from './openapi.js';
import {supportReportSchema,operatorControlsSchema,operatorRenewalSchema,operatorMediaSchema} from '@save-the-date/contracts';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {passIssueSchema,passActionSchema,redemptionSchema,admissionCorrectionSchema} from '@save-the-date/contracts';
import type {PassRepository} from '@save-the-date/domain';
import {guestSaveSchema,guestAccessSchema,guestGrantSchema,rsvpSchema,questionPolicySchema,accessRequestSchema,importSchema,z} from '@save-the-date/contracts';
import type {GuestRepository} from '@save-the-date/domain';
import {designSchema,catalogue,type ResolvedDesign} from '@save-the-date/templates';
import type {InvitationRepository} from '@save-the-date/domain';
import { verifyRavenEvent, credential, credentialHash,credentialHashCandidates, hashPassword, checkPassword } from '@save-the-date/adapters';
import { DomainError, type Actor, type FoundationRepository, type MediaRepository, type NotificationRepository, type PublicationRepository } from '@save-the-date/domain';
import { registerSchema, loginSchema, tokenSchema, recoverSchema, resetSchema, weddingSchema, weddingPatchSchema, eventSchema, eventPatchSchema, inviteSchema, reauthSchema, transferSchema, deleteSchema, uuid, slug, siteSaveSchema, publishSchema, postSaveSchema, revisionSchema, albumSaveSchema, uploadIntentSchema, uploadGrantSchema,uploadAccessSchema,creativeContextSaveSchema,conceptSaveSchema,conceptRevisionSchema,creativeGenerationSchema,mediaEditSchema, mediaDeleteSchema } from '@save-the-date/contracts';
import type { Config } from '@save-the-date/config';
import type { Request, Response } from 'express';

export class Application {
 private activeUploads=0;
 constructor(readonly store:FoundationRepository,readonly config:Config,readonly publication:PublicationRepository,readonly notifications?:NotificationRepository,readonly media?:MediaRepository,readonly invitations?:InvitationRepository,readonly guests?:GuestRepository,readonly passes?:PassRepository,readonly uploads?:import('@save-the-date/domain').UploadRepository,readonly creative?:import('@save-the-date/domain').CreativeRepository,readonly retention?:import('@save-the-date/domain').RetentionRepository,readonly operator?:import('@save-the-date/domain').OperatorRepository){}
 hash(token:string){return credentialHash(token,this.config.TOKEN_HASH_KEYS);}
 hashes(token:string){return credentialHashCandidates(token,this.config.TOKEN_HASH_KEYS);}
 cookie(res:Response,token:string,clear=false){res.cookie('std_session',token,{httpOnly:true,secure:this.config.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:clear?0:7*24*3600*1000});}
 session(req:Request){return req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('std_session='))?.slice(12)??'';}
 async actor(req:Request):Promise<Actor>{const actor=await this.store.authenticate(this.hashes(this.session(req)));if(!actor)throw new DomainError(401,'UNAUTHENTICATED','Sign in to continue');return actor;}
 binary(req:Request,res:Response,file:{bytes:Buffer;contentType:string}){
  res.setHeader('Content-Type',file.contentType);res.setHeader('Accept-Ranges','bytes');const range=req.headers.range;
  if(range){const match=/^bytes=(\d+)-(\d*)$/.exec(range);const start=Number(match?.[1]),end=match?.[2]?Number(match[2]):file.bytes.length-1;if(!match||start>end||start>=file.bytes.length){res.status(416).setHeader('Content-Range','bytes */'+file.bytes.length);res.end();return;}const last=Math.min(end,file.bytes.length-1);res.status(206).setHeader('Content-Range',`bytes ${start}-${last}/${file.bytes.length}`);res.send(file.bytes.subarray(start,last+1));return;}res.send(file.bytes);
 }
 async queued(actor:Actor,weddingId:string,type:'invitation-export'|'planner-brief'|'creative-generation'|'archive-export'|'email',result:unknown){const id=z.object({id:uuid}).parse(result).id,jobs=await this.store.jobReferences(actor,weddingId,type,id);return apiSchemas.asyncResult.parse({...result as Record<string,unknown>,...jobs,statusPath:'/api/v1/weddings/'+weddingId+'/jobs/'+jobs.jobId});}
 async dispatch(req:Request,res:Response){
  res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
  const method=req.method;const parts=req.path.replace(/^\/api\/v1\/?/,'').split('/').filter(Boolean);const body=req.body??{};
  if(method==='GET'&&parts[0]==='openapi.json')return openApiDocument();
  if(method==='GET'&&parts[0]==='health'){await this.store.ping();return {status:'ok',database:'postgres',ai:'disabled'};}
  if(parts[0]==='provider-events'&&parts[1]==='ravenrelay'&&method==='POST'){
   if(!this.config.RAVENRELAY_WEBHOOK_SECRET||!this.config.RAVENRELAY_PROJECT_ID||!this.notifications)throw new DomainError(503,'WEBHOOK_DISABLED','Provider callback is not configured');
   let event;try{event=verifyRavenEvent((req as Request&{rawBody?:Buffer}).rawBody??Buffer.alloc(0),{timestamp:String(req.headers['ravenrelay-timestamp']??''),signature:String(req.headers['ravenrelay-signature']??''),eventId:String(req.headers['ravenrelay-event-id']??'')},this.config.RAVENRELAY_WEBHOOK_SECRET,this.config.RAVENRELAY_PROJECT_ID);}catch{throw new DomainError(401,'INVALID_WEBHOOK','Provider signature or event is invalid');}
   await this.notifications.receive(event);return {received:true};
  }
  if(!['GET','HEAD'].includes(method)){
   if(req.headers.origin!==this.config.PUBLIC_ORIGIN)throw new DomainError(403,'ORIGIN_REJECTED','Use the configured application origin');
   if(req.headers['x-std-csrf']!=='1'||!(req.is('application/json')||method==='PUT'&&((parts[0]==='weddings'&&parts[2]==='media'&&parts[4]==='bytes')||(parts[0]==='uploads'&&parts[1]==='media'&&parts[3]==='bytes'))&&req.is('application/octet-stream')))throw new DomainError(403,'CSRF_REJECTED','Reload and retry this request');
  }
  // Direct API requests use the actual peer IP. Deployment must configure a trusted proxy explicitly.
  await this.store.rateLimit('http:'+this.hash(req.ip??'unknown'),300);
  if(parts[0]==='support'&&this.operator){if(method==='GET')return {email:this.config.SUPPORT_EMAIL.endsWith('.test')?null:this.config.SUPPORT_EMAIL};if(method==='POST'){await this.store.rateLimit('support:'+this.hash(req.ip??'unknown'),5,86400);return this.operator.submitReport(supportReportSchema.parse(body));}}
  if(parts[0]==='identity'){
   const action=parts[1];await this.store.rateLimit('identity:'+action+':'+this.hash(req.ip??'unknown'),action==='session'?120:10);
   if(action==='register'&&method==='POST'){const v=registerSchema.parse(body),token=credential();await this.store.register(v.email,await hashPassword(v.password),this.hash(token),`${this.config.PUBLIC_ORIGIN}/platform?verify=${token}`);res.status(202);return {message:'If this address is available, a verification email is queued'};}
   if(action==='resend-verification'&&method==='POST'){const v=recoverSchema.parse(body),token=credential();await this.store.resendVerification(v.email,this.hash(token),`${this.config.PUBLIC_ORIGIN}/platform?verify=${token}`);res.status(202);return {message:'If the account needs verification, a new link is queued'};}
   if(action==='verify'&&method==='POST'){await this.store.verify(this.hashes(tokenSchema.parse(body).token));return {message:'Email verified. You can now sign in'};}
   if(action==='login'&&method==='POST'){const v=loginSchema.parse(body),token=credential();const actor=await this.store.login(v.email,h=>checkPassword(v.password,h),this.hash(token));if(!actor)throw new DomainError(401,'INVALID_LOGIN','Email or password is incorrect');this.cookie(res,token);return {email:actor.email,verified:actor.verified};}
   if(action==='recover'&&method==='POST'){const v=recoverSchema.parse(body),token=credential();await this.store.recover(v.email,this.hash(token),`${this.config.PUBLIC_ORIGIN}/platform?reset=${token}`);res.status(202);return {message:'If this account exists, a recovery email is queued'};}
   if(action==='reset'&&method==='POST'){const v=resetSchema.parse(body);await this.store.reset(this.hashes(v.token),await hashPassword(v.password));this.cookie(res,'',true);return {message:'Password updated. All previous sessions are revoked'};}
   if(action==='logout'&&method==='POST'){await this.store.logout(this.hashes(this.session(req)));this.cookie(res,'',true);return {message:'Signed out'};}
   const actor=await this.actor(req);
   if(action==='session'&&method==='GET')return {userId:actor.userId,email:actor.email,verified:actor.verified,operator:actor.verified&&this.config.OPERATOR_USER_IDS.split(',').map(v=>v.trim()).includes(actor.userId)};
   if(action==='deletion'&&method==='POST'&&this.retention){apiSchemas.accountDeletion.parse(body);const result=await this.retention.requestAccountDeletion(actor);this.cookie(res,'',true);return result;}
   if(action==='reauthenticate'&&method==='POST'){const v=reauthSchema.parse(body);await this.store.reauthenticate(actor,h=>checkPassword(v.password,h));return {message:'Identity confirmed for fifteen minutes'};}
  }
  if(parts[0]==='public'&&parts[1]==='weddings'){
   const weddingSlug=slug.parse(parts[2]);const cookieName='std_site_'+weddingSlug;const session=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1);
   const guestToken=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('std_guest_session='))?.slice(18);const guestHash=guestToken?this.hashes('guest-session:'+guestToken):undefined;
   if(parts[3]==='media'&&parts.length===5&&method==='GET'&&this.media){const site=await this.publication.publicSite(weddingSlug,session?this.hashes(session):undefined,guestHash,{mode:'asset',id:uuid.parse(parts[4])});const file=await this.media.readPublic(weddingSlug,uuid.parse(parts[4]),site);this.binary(req,res,file);return undefined;}
   if(parts.length===3&&method==='GET')return this.publication.publicSite(weddingSlug,session?this.hashes(session):undefined,guestHash);
   if(parts[3]==='albums'&&method==='GET'){const view=parts[4]?{mode:'album' as const,id:uuid.parse(parts[4]),cursor:req.query.cursor===undefined?undefined:z.string().max(2048).parse(req.query.cursor)}:{mode:'albums' as const,cursor:req.query.cursor===undefined?undefined:z.string().max(2048).parse(req.query.cursor)},site=await this.publication.publicSite(weddingSlug,session?this.hashes(session):undefined,guestHash,view) as {albums?:unknown[];nextAlbumsCursor?:string|null;archived?:boolean};if(site.archived)throw new DomainError(404,'NOT_FOUND','This wedding is archived');return {albums:site.albums??[],nextCursor:site.nextAlbumsCursor??null};}
   if(parts[3]==='posts'&&parts.length===4&&method==='GET'){const site=await this.publication.publicSite(weddingSlug,session?this.hashes(session):undefined,guestHash,{mode:'posts',cursor:req.query.cursor===undefined?undefined:z.string().max(2048).parse(req.query.cursor)}) as {posts?:unknown[];nextPostsCursor?:string|null;archived?:boolean};if(site.archived)throw new DomainError(404,'NOT_FOUND','This wedding is archived');return {posts:site.posts??[],nextCursor:site.nextPostsCursor??null};}
   if(parts[3]==='access'&&method==='POST'){await this.store.rateLimit('site-access:'+this.hash(req.ip??'unknown'),10);const token=credential();await this.publication.exchangeShared(weddingSlug,this.hashes(tokenSchema.parse(body).token),this.hash(token));res.cookie(cookieName,token,{httpOnly:true,secure:this.config.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:7*24*3600*1000});return {message:'Website access granted. This is shared access, not identity verification'};}
   if(parts[3]==='posts'&&parts.length===5&&method==='GET')return this.publication.publicPost(weddingSlug,slug.parse(parts[4]),session?this.hashes(session):undefined,guestHash);
  }
  if(parts[0]==='guest'&&this.guests){
   const sessionToken=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('std_guest_session='))?.slice(18)??'';const sessionHash=this.hashes('guest-session:'+sessionToken);
   if(parts[1]==='access'&&method==='POST'){await this.store.rateLimit('guest-access:'+this.hash(req.ip??'unknown'),10);const v=guestAccessSchema.parse(body),token=credential();await this.guests.exchange(v.slug,v.credential,this.hash('guest-session:'+token));res.cookie('std_guest_session',token,{httpOnly:true,secure:this.config.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:7*24*3600*1000});return {signedIn:true};}
   if(parts[1]==='request'&&method==='POST'){await this.store.rateLimit('guest-request:'+this.hash(req.ip??'unknown'),5);const v=accessRequestSchema.parse(body);return this.guests.request(v.slug,v);}
   if(parts[1]==='logout'&&method==='POST'){await this.guests.logout(sessionHash);res.cookie('std_guest_session','',{httpOnly:true,secure:this.config.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});return {signedOut:true};}
   const session=await this.guests.authenticate(sessionHash);
   if(this.passes&&parts[1]==='passes'){
    if(parts.length===2&&method==='GET')return this.passes.guestList(session);
    if(parts.length===4&&method==='GET'){const format=z.enum(['jpeg','pdf']).parse(parts[3]);res.setHeader('Content-Disposition',`attachment; filename=admission-pass.${format}`);this.binary(req,res,await this.passes.guestDownload(session,uuid.parse(parts[2]),format));return;}
   }
   if(parts[1]==='party'&&method==='GET')return this.guests.party(session);
   if(parts[1]==='events'&&parts[3]==='rsvp'&&method==='POST')return this.guests.submit(sessionHash,uuid.parse(parts[2]),rsvpSchema.parse(body),uuid.parse(req.headers['idempotency-key']));
  }
  if(parts[0]==='uploads'&&this.uploads&&this.media){
   const raw=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('std_upload_session='))?.slice(19)??'',sessionHash=this.hashes('upload-session:'+raw);
   const setCookie=(token:string)=>res.cookie('std_upload_session',token,{httpOnly:true,secure:this.config.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:86400000});
   if(parts[1]==='access'&&method==='POST'){await this.store.rateLimit('upload-access:'+this.hash(req.ip??'unknown'),10);const v=uploadAccessSchema.parse(body),token=credential();await this.uploads.exchange(v.slug,v.credential,this.hash('upload-session:'+token));setCookie(token);return {signedIn:true};}
   if(parts[1]==='from-rsvp'&&method==='POST'&&this.guests){await this.store.rateLimit('upload-session:'+this.hash(req.ip??'unknown'),10,3600);const token=credential(),guestToken=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('std_guest_session='))?.slice(18)??'';await this.uploads.fromGuest(await this.guests.authenticate(this.hashes('guest-session:'+guestToken)),this.hash('upload-session:'+token));setCookie(token);return {signedIn:true};}
   if(parts[1]==='logout'&&method==='POST'){await this.uploads.logout(sessionHash);setCookie('');return {signedOut:true};}
   const session=await this.uploads.authenticate(sessionHash),uploader={userId:null,uploadSessionId:session.id} as const;
   if(parts[1]==='session'&&method==='GET')return session;
   if(parts[1]==='media'&&parts.length===2&&method==='GET')return this.media.uploadStatus(uploader,session.weddingId);
   if(parts[1]==='intents'&&method==='POST'){await this.store.rateLimit('upload-intent:'+session.id,30,3600);const result=await this.media.intent(uploader,session.weddingId,uploadIntentSchema.parse(body)) as {id:string};res.status(201);return {...result,uploadPath:'uploads/media/'+result.id+'/bytes'};}
   if(parts[1]==='media'&&parts[3]==='bytes'&&method==='PUT'){const id=uuid.parse(parts[2]),max=await this.media.expectedUpload(uploader,session.weddingId,id);if(Number(req.headers['content-length'])>max)throw new DomainError(413,'FILE_TOO_LARGE','Transfer exceeds reserved bytes');if(this.activeUploads>=2)throw new DomainError(429,'UPLOAD_BUSY','Uploads are busy. Retry in a moment');await this.store.rateLimit('upload-bytes:'+session.id,30,3600);this.activeUploads++;req.setTimeout(120000);try{const chunks:Buffer[]=[];let size=0;for await(const chunk of req){const b=Buffer.from(chunk);size+=b.length;if(size>max)throw new DomainError(413,'FILE_TOO_LARGE','Transfer exceeds reserved bytes');chunks.push(b);}res.status(202);return this.media.receive(uploader,session.weddingId,id,Buffer.concat(chunks));}finally{this.activeUploads--;}}
  }
  const actor=await this.actor(req);
  if(parts[0]==='invites'&&parts[1]==='accept'&&method==='POST')return this.store.acceptInvite(actor,this.hashes(tokenSchema.parse(body).token));
  if(parts[0]==='operator'&&this.operator){
   if(parts.length===1&&method==='GET')return this.operator.dashboard(actor,req.query.cursor===undefined?undefined:uuid.parse(req.query.cursor));
   if(parts[1]==='accounts'&&parts[3]==='recover'&&method==='POST'){const v=apiSchemas.accountRecovery.parse(body);return this.operator.recoverAccount(actor,uuid.parse(parts[2]),v);}
   if(parts[1]==='media'&&method==='GET'){this.binary(req,res,await this.operator.readMedia(actor,uuid.parse(parts[2])));return;}
   if(parts[1]==='reports'&&method==='POST'){const v=apiSchemas.reportState.parse(body);return this.operator.resolveReport(actor,uuid.parse(parts[2]),v.state,v.reason);}
   if(parts[1]==='weddings'){const wid=uuid.parse(parts[2]);if(parts.length===3&&method==='GET')return this.operator.wedding(actor,wid);if(parts[3]==='ownership-review'&&method==='POST'){const v=apiSchemas.ownershipReview.parse(body);return this.operator.resolveOwnership(actor,wid,v.primaryOwnerId,v.ownershipVerified,v.reason);}if(parts[3]==='admission-holds'&&parts[5]==='resolve'&&method==='POST'){const v=apiSchemas.resolveHold.parse(body);return this.operator.resolveAdmissionHold(actor,wid,uuid.parse(parts[4]),v.reason,v.notAdmittedConfirmed);}if(parts[3]==='controls'&&method==='POST')return this.operator.controls(actor,wid,operatorControlsSchema.parse(body));if(parts[3]==='renew'&&method==='POST')return this.operator.renew(actor,wid,operatorRenewalSchema.parse(body));if(parts[3]==='media'&&method==='POST')return this.operator.grantMedia(actor,wid,operatorMediaSchema.parse(body));}
  }
  if(parts[0]==='weddings'){
   if(parts.length===1){if(method==='GET')return this.store.listWeddings(actor);if(method==='POST'){res.status(201);return this.store.createWedding(actor,weddingSchema.parse(body));}}
   const id=uuid.parse(parts[1]);
   if(parts[2]==='jobs'&&parts.length===4&&method==='GET')return this.store.readJob(actor,id,uuid.parse(parts[3]));
   if(parts.length===2){if(method==='GET')return this.store.readWedding(actor,id);if(method==='PATCH')return this.store.patchWedding(actor,id,weddingPatchSchema.parse(body));if(method==='DELETE'){deleteSchema.parse(body);await this.store.deleteWedding(actor,id);return {message:'Workspace deleted. Recovery available for thirty days',weddingId:id};}}
   if(this.notifications&&parts[2]==='notifications'){if(parts.length===3&&method==='GET')return this.notifications.list(actor,id,req.query.cursor===undefined?undefined:uuid.parse(req.query.cursor));if(parts[4]==='retry'&&method==='POST'){const v=apiSchemas.retryNotification.parse(body);res.status(202);return this.queued(actor,id,'email',await this.notifications.retry(actor,id,uuid.parse(parts[3]),v.recipient,uuid.parse(req.headers['idempotency-key'])));}}
   if(this.retention&&parts[2]==='retention'){
    if(parts.length===3&&method==='GET')return this.retention.status(actor,id,req.query.cursor===undefined?undefined:z.string().max(2048).parse(req.query.cursor));
    if(parts[3]==='review'&&method==='POST')return this.retention.review(actor,id);
    if(parts[3]==='exports'&&parts.length===4&&method==='POST'){const input=apiSchemas.archiveExport.parse(body);res.status(202);return this.queued(actor,id,'archive-export',await this.retention.export(actor,id,input.includeSensitive,uuid.parse(req.headers['idempotency-key'])));}
    if(parts[3]==='exports'&&parts[5]==='retry'&&method==='POST'){res.status(202);return this.retention.retry(actor,id,uuid.parse(parts[4]));}
    if(parts[3]==='exports'&&parts[5]==='access'&&method==='GET'){await this.retention.download(actor,id,uuid.parse(parts[4]));return {ready:true};}
    if(parts[3]==='exports'&&parts.length===5&&method==='GET'){const file=await this.retention.download(actor,id,uuid.parse(parts[4]));res.setHeader('Content-Type',file.contentType);res.setHeader('Content-Length',String(file.bytes));res.setHeader('Content-Disposition','attachment; filename="wedding-archive.tar"');await pipeline(Readable.from(file.chunks),res);return;}
   }
   if(parts[2]==='recover'&&method==='POST'){await this.store.recoverWedding(actor,id);return {message:'Workspace recovered'};}
   if(parts[2]==='transfer'&&method==='POST'){await this.store.transfer(actor,id,transferSchema.parse(body).userId);return {message:'Ownership transferred'};}
   if(this.passes&&parts[2]==='passes'){
    if(parts[3]==='eligible'&&parts.length===4&&method==='GET')return this.passes.listEligible(actor,id,req.query.cursor===undefined?undefined:z.string().max(2048).parse(req.query.cursor));
    if(parts.length===3&&method==='GET')return this.passes.list(actor,id,req.query.cursor===undefined?undefined:z.string().max(2048).parse(req.query.cursor));
    if(parts.length===3&&method==='POST'){const v=passIssueSchema.parse(body);res.status(201);return this.passes.issue(actor,id,v.attendeeId,v.eventId,uuid.parse(req.headers['idempotency-key']));}
    const passId=uuid.parse(parts[3]);
    if(parts[4]==='recipients'&&method==='GET')return this.passes.deliveryRecipients(actor,id,passId);
    if(parts[4]==='send'&&method==='POST'){const v=apiSchemas.passSend.parse(body);return this.passes.send(actor,id,passId,v.expectedVersion,v.recipients,uuid.parse(req.headers['idempotency-key']));}
    if(parts[4]==='revoke'&&method==='POST'){const v=passActionSchema.parse(body);return this.passes.revoke(actor,id,passId,v.expectedVersion,v.reason,uuid.parse(req.headers['idempotency-key']));}
    if(parts[4]==='reissue'&&method==='POST'){const v=passActionSchema.parse(body);return this.passes.reissue(actor,id,passId,v.expectedVersion,v.reason,uuid.parse(req.headers['idempotency-key']));}
    if(parts[5]==='retry'&&method==='POST'){res.status(202);return this.passes.retryTicket(actor,id,passId,z.enum(['jpeg','pdf']).parse(parts[4]));}
    if(parts.length===5&&method==='GET'){const format=z.enum(['jpeg','pdf']).parse(parts[4]);res.setHeader('Content-Disposition',`attachment; filename=admission-pass.${format}`);this.binary(req,res,await this.passes.download(actor,id,passId,format));return;}
   }
   if(this.passes&&parts[2]==='events'&&parts[4]==='redeem'&&method==='POST')return this.passes.redeem(actor,id,uuid.parse(parts[3]),redemptionSchema.parse(body).credential,uuid.parse(req.headers['idempotency-key']));
   if(this.passes&&parts[2]==='events'&&parts[4]==='operational-list'&&method==='GET')return this.passes.operationalList(actor,id,uuid.parse(parts[3]));
   if(this.passes&&parts[2]==='admission-corrections'&&method==='POST')return this.passes.correction(actor,id,admissionCorrectionSchema.parse(body),uuid.parse(req.headers['idempotency-key']));
   if(this.guests&&parts[2]==='guests'){
    if(parts[3]==='requests'&&parts.length===4&&method==='GET')return this.guests.listRequests(actor,id,req.query.cursor===undefined?undefined:z.string().max(2048).parse(req.query.cursor));
    if(parts.length===3&&method==='GET')return this.guests.list(actor,id,apiSchemas.guestListQuery.parse(req.query));
    if(parts[3]==='responses'&&parts[4]==='export'&&method==='GET'){res.setHeader('Content-Disposition','attachment; filename=responses.csv');res.setHeader('Content-Type','text/csv; charset=utf-8');res.send(await this.guests.rsvpExport(actor,id,req.query.sensitive==='true'));return;}
    if(parts[3]==='export'&&method==='GET'){res.setHeader('Content-Disposition','attachment; filename=guests.csv');res.setHeader('Content-Type','text/csv; charset=utf-8');res.send(await this.guests.csvExport(actor,id));return;}
    if(parts[3]==='import'&&method==='POST'){const v=importSchema.parse(body);return parts[4]==='preview'?this.guests.importPreview(actor,id,v.csv):this.guests.importCommit(actor,id,v.csv,v.decisions);}
    if(parts[3]==='requests'&&parts[4]&&method==='POST'){const v=apiSchemas.guestRequestDecision.parse(body);const r=await this.guests.resolveRequest(actor,id,uuid.parse(parts[4]),v.approve,v.eventIds);return r.partyId?{...r,grant:await this.guests.issueGrant(actor,id,r.partyId,180)}:r;}
    if(parts[3]==='grants'&&parts[4]&&method==='DELETE')return this.guests.revokeGrant(actor,id,uuid.parse(parts[4]));
    if(parts[3]==='parties'&&parts[4]&&parts[5]==='grant'&&method==='POST')return this.guests.issueGrant(actor,id,uuid.parse(parts[4]),guestGrantSchema.parse(body).days);
    if(parts[3]==='parties'&&parts[4]&&parts[5]==='send'&&method==='POST'){const v=apiSchemas.guestSend.parse(body);return this.guests.sendAccess(actor,id,uuid.parse(parts[4]),v.grant,v.recipients,uuid.parse(req.headers['idempotency-key']));}
    if(parts.length===3&&method==='POST'){res.status(201);const v=guestSaveSchema.parse(body);return this.guests.save(actor,id,v.guest,v.expectedVersion);}
    if(parts.length===4&&method==='PATCH'){const v=guestSaveSchema.parse(body);return this.guests.save(actor,id,v.guest,v.expectedVersion,uuid.parse(parts[3]));}
    if(parts.length===4&&method==='DELETE')return this.guests.remove(actor,id,uuid.parse(parts[3]),revisionSchema.parse(body).expectedVersion);
   }
   if(this.guests&&parts[2]==='events'&&parts[4]==='answers'&&method==='GET')return this.guests.answers(actor,id,uuid.parse(parts[3]));
   if(this.guests&&parts[2]==='events'&&parts[4]==='questions'&&method==='PATCH')return this.guests.questions(actor,id,uuid.parse(parts[3]),questionPolicySchema.parse(body));
   if(this.guests&&parts[2]==='events'&&parts[4]==='rsvp'&&parts[6]==='approve'&&method==='POST')return this.guests.approve(actor,id,uuid.parse(parts[3]),uuid.parse(parts[5]),revisionSchema.parse(body).expectedVersion);
   if(this.invitations&&parts[2]==='invitations'){
    if(parts[3]==='catalogue'&&method==='GET'){await this.store.readWedding(actor,id);return catalogue;}
    if(parts[3]==='preview'&&method==='POST')return this.invitations.preview(actor,id,designSchema.parse(body));
    if(parts.length===3&&method==='GET')return this.invitations.list(actor,id,req.query.cursor===undefined?undefined:z.string().max(2048).parse(req.query.cursor));
    if((parts.length===3&&method==='POST')||(parts.length===4&&method==='PATCH')){const v=apiSchemas.invitationSave.parse(body);return this.invitations.save(actor,id,v.title,v.design,v.expectedVersion,parts[3]?uuid.parse(parts[3]):undefined);}
    if(parts[3]==='exports'){
     const exportId=uuid.parse(parts[4]),format=z.enum(['jpeg','pdf']).parse(parts[5]);
     if(parts[6]==='retry'&&method==='POST'){res.status(202);return this.invitations.retry(actor,id,exportId,format);}
     if(method==='GET'){res.setHeader('Content-Disposition',`attachment; filename=invitation-${exportId}.${format}`);this.binary(req,res,await this.invitations.download(actor,id,exportId,format));return;}
    }
    if(parts[4]==='export'&&method==='POST'){const v=apiSchemas.invitationExport.parse(body);res.status(202);return this.queued(actor,id,'invitation-export',await this.invitations.queue(actor,id,uuid.parse(parts[3]),v.expectedVersion,v.preview as ResolvedDesign,uuid.parse(req.headers['idempotency-key'])));}
   }
   if(this.creative&&parts[2]==='creative'){
    if(parts[3]==='history'&&parts.length===5&&method==='GET')return this.creative.listPage(actor,id,z.enum(['concepts','briefs','references']).parse(parts[4]),req.query.cursor===undefined?undefined:z.string().max(2048).parse(req.query.cursor));
    if(parts.length===3&&method==='GET')return this.creative.list(actor,id,req.query.cursor===undefined?undefined:z.string().max(2048).parse(req.query.cursor));
    if(parts[3]==='context'&&method==='PUT'){const v=creativeContextSaveSchema.parse(body);return this.creative.saveContext(actor,id,v.context,v.expectedVersion);}
    if(parts[3]==='concepts'){
     if(parts.length===4&&method==='POST'){const v=conceptSaveSchema.parse(body);res.status(201);return this.creative.saveConcept(actor,id,v.concept,v.contextVersion,v.expectedVersion);}
     const cid=uuid.parse(parts[4]);
     if(parts.length===5&&method==='PUT'){const v=conceptSaveSchema.parse(body);return this.creative.saveConcept(actor,id,v.concept,v.contextVersion,v.expectedVersion,cid);}
     if(parts[5]==='approve'&&method==='POST')return this.creative.approve(actor,id,cid,conceptRevisionSchema.parse(body).expectedVersion);
     if(parts[5]==='theme-diff'&&method==='POST')return this.creative.themeDiff(actor,id,cid,conceptRevisionSchema.parse(body).expectedVersion);
     if(parts[5]==='apply'&&method==='POST'){const v=apiSchemas.themeApply.parse(body);return this.creative.applyTheme(actor,id,cid,v.expectedVersion,v.weddingVersion,v.siteVersion);}
     if(parts[5]==='brief'&&method==='POST'){res.status(202);return this.queued(actor,id,'planner-brief',await this.creative.exportBrief(actor,id,cid,conceptRevisionSchema.parse(body).expectedVersion,uuid.parse(req.headers['idempotency-key'])));}
    }
    if(parts[3]==='runs'&&parts.length===4&&method==='POST'){res.status(202);return this.queued(actor,id,'creative-generation',await this.creative.generate(actor,id,creativeGenerationSchema.parse(body),uuid.parse(req.headers['idempotency-key'])));}
    if(parts[3]==='runs'&&parts[5]==='cancel'&&method==='POST')return this.creative.cancel(actor,id,uuid.parse(parts[4]));
    if(parts[3]==='assets'&&method==='GET'){this.binary(req,res,await this.creative.readAsset(actor,id,uuid.parse(parts[4])));return;}
    if(parts[3]==='briefs'){const briefId=uuid.parse(parts[4]),format=z.enum(['json','pdf']).parse(parts[5]);if(parts[6]==='retry'&&method==='POST'){res.status(202);return this.creative.retryBrief(actor,id,briefId,format);}if(parts.length===6&&method==='GET'){res.setHeader('Content-Disposition',`attachment; filename=planner-brief.${format}`);this.binary(req,res,await this.creative.downloadBrief(actor,id,briefId,format));return;}}
   }
   if(this.uploads&&parts[2]==='upload-grants'){
    if(parts.length===3&&method==='GET')return this.uploads.list(actor,id,req.query.cursor===undefined?undefined:z.string().max(2048).parse(req.query.cursor));
    if(parts.length===3&&method==='POST'){res.status(201);return this.uploads.create(actor,id,uploadGrantSchema.parse(body));}
    if(parts.length===4&&method==='DELETE')return this.uploads.revoke(actor,id,uuid.parse(parts[3]));
   }
   if(this.media&&parts[2]==='albums'){
    if(parts.length===3&&method==='POST'){const v=albumSaveSchema.parse(body);res.status(201);return this.media.saveAlbum(actor,id,v.album,v.expectedVersion);}
    if(parts.length===4&&method==='PATCH'){const v=albumSaveSchema.parse(body);return this.media.saveAlbum(actor,id,v.album,v.expectedVersion,uuid.parse(parts[3]));}
   }
   if(this.media&&parts[2]==='media'){
    if(parts.length===3&&method==='GET')return this.media.list(actor,id,req.query.cursor===undefined?undefined:z.string().max(2048).parse(req.query.cursor));
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
    if(parts.length===3&&method==='GET')return this.publication.listPosts(actor,id,req.query.cursor===undefined?undefined:z.string().max(2048).parse(req.query.cursor));
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
