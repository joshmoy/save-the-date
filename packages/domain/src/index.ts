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
 const allowed = capability==='primary' ? tenant.role==='owner' : capability==='read' ? true : capability==='publish'||capability==='members' ? owner : capability==='edit'||capability==='guests' ? owner||tenant.role==='planner' : capability==='media' ? owner||tenant.role==='planner'||(tenant.role==='media_contributor'&&!!resourceId&&tenant.albumIds.includes(resourceId)) : owner||(tenant.role==='security'&&!!resourceId&&tenant.eventIds.includes(resourceId));
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
