/** Resolve all authorised event choices through bounded API pages; never silently truncate selectors. */
export async function eventOptions<T>(path:string):Promise<T[]>{
 const events:T[]=[],seen=new Set<string>();let cursor:string|null=null;
 do{
  const response:Response=await fetch('/api/v1/'+path+(cursor?'?cursor='+encodeURIComponent(cursor):''),{headers:{'x-std-csrf':'1'},cache:'no-store'});
  const page:{events:T[];nextCursor:string|null;message?:string}=await response.json();if(!response.ok)throw Error(page.message??'Events could not be loaded. Retry.');
  events.push(...page.events);cursor=page.nextCursor;
  if(cursor){if(seen.has(cursor))throw Error('Event list changed. Reload and retry.');seen.add(cursor);}
 }while(cursor);
 return events;
}
