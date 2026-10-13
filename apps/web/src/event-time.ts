type EventTime={starts_at:string|null;ends_at?:string|null;timezone:string;to_be_confirmed?:string|null};
export function eventTime(event:EventTime,dateStyle?:'full'|'medium'){
 if(!event.starts_at)return event.to_be_confirmed??'Date to be confirmed';
 const start=new Date(event.starts_at),format=(date:Date,style?:'full'|'medium')=>date.toLocaleString('en',{timeZone:event.timezone,...(style?{dateStyle:style}:{}),timeStyle:'short'});
 const first=format(start,dateStyle);if(!event.ends_at)return first;
 const end=new Date(event.ends_at),day=(date:Date)=>date.toLocaleDateString('en-CA',{timeZone:event.timezone});
 return first+' – '+format(end,day(start)===day(end)?undefined:dateStyle??'medium');
}
