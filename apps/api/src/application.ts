import { credential, credentialHash, hashPassword, checkPassword } from '@save-the-date/adapters';
import { DomainError, type Actor, type FoundationRepository } from '@save-the-date/domain';
import { registerSchema, loginSchema, tokenSchema, recoverSchema, resetSchema, weddingSchema, weddingPatchSchema, eventSchema, eventPatchSchema, inviteSchema, reauthSchema, transferSchema, deleteSchema, uuid } from '@save-the-date/contracts';
import type { Config } from '@save-the-date/config';
import type { Request, Response } from 'express';

export class Application {
 constructor(readonly store:FoundationRepository,readonly config:Config){}
 hash(token:string){return credentialHash(token,this.config.TOKEN_HASH_KEYS);}
 cookie(res:Response,token:string,clear=false){res.cookie('std_session',token,{httpOnly:true,secure:this.config.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:clear?0:7*24*3600*1000});}
 session(req:Request){return req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('std_session='))?.slice(12)??'';}
 async actor(req:Request):Promise<Actor>{const actor=await this.store.authenticate(this.hash(this.session(req)));if(!actor)throw new DomainError(401,'UNAUTHENTICATED','Sign in to continue');return actor;}
 async dispatch(req:Request,res:Response){
  res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
  const method=req.method;const parts=req.path.replace(/^\/api\/v1\/?/,'').split('/').filter(Boolean);const body=req.body??{};
  if(method==='GET'&&parts[0]==='health'){await this.store.ping();return {status:'ok',database:'postgres',ai:'disabled'};}
  if(!['GET','HEAD'].includes(method)){
   if(req.headers.origin!==this.config.PUBLIC_ORIGIN)throw new DomainError(403,'ORIGIN_REJECTED','Use the configured application origin');
   if(req.headers['x-std-csrf']!=='1'||!req.is('application/json'))throw new DomainError(403,'CSRF_REJECTED','Reload and retry this request');
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
  const actor=await this.actor(req);
  if(parts[0]==='invites'&&parts[1]==='accept'&&method==='POST')return this.store.acceptInvite(actor,this.hash(tokenSchema.parse(body).token));
  if(parts[0]==='weddings'){
   if(parts.length===1){if(method==='GET')return this.store.listWeddings(actor);if(method==='POST'){res.status(201);return this.store.createWedding(actor,weddingSchema.parse(body));}}
   const id=uuid.parse(parts[1]);
   if(parts.length===2){if(method==='GET')return this.store.readWedding(actor,id);if(method==='PATCH')return this.store.patchWedding(actor,id,weddingPatchSchema.parse(body));if(method==='DELETE'){deleteSchema.parse(body);await this.store.deleteWedding(actor,id);return {message:'Workspace deleted. Recovery available for thirty days',weddingId:id};}}
   if(parts[2]==='recover'&&method==='POST'){await this.store.recoverWedding(actor,id);return {message:'Workspace recovered'};}
   if(parts[2]==='transfer'&&method==='POST'){await this.store.transfer(actor,id,transferSchema.parse(body).userId);return {message:'Ownership transferred'};}
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
