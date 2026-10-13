/** Resolve all authorised event choices through bounded API pages; never silently truncate selectors. */
async function collectionOptions<T>(path:string,key:'events'|'albums'):Promise<T[]>{
 const events:T[]=[],seen=new Set<string>();let cursor:string|null=null;
 do{
  const response:Response=await fetch('/api/v1/'+path+(cursor?'?cursor='+encodeURIComponent(cursor):''),{headers:{'x-std-csrf':'1'},cache:'no-store'});
  const page:{events?:T[];albums?:T[];nextCursor:string|null;message?:string}=await response.json();if(!response.ok)throw Error(page.message??'Choices could not be loaded. Retry.');
  events.push(...(page[key]??[]));cursor=page.nextCursor;
  if(cursor){if(seen.has(cursor))throw Error('Choice list changed. Reload and retry.');seen.add(cursor);}
 }while(cursor);
 return events;
}

export const eventOptions=<T>(path:string)=>collectionOptions<T>(path,'events');
export const albumOptions=<T>(path:string)=>collectionOptions<T>(path,'albums');
