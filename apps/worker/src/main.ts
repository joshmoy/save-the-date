import { randomUUID } from 'node:crypto';
import { loadConfig } from '@save-the-date/config';
import { PostgresStore, PostgresJobs, PostgresMedia, PostgresInvitations } from '@save-the-date/persistence';
import { CaptureEmail, MailerooEmail, RavenRelayEmail, createStorage, NativeMediaProcessor, BrowserInvitationRenderer, templateFontDirectory, type EmailPort } from '@save-the-date/adapters';
const config=loadConfig(),store=new PostgresStore(config.DB_CONNECTION),jobs=new PostgresJobs(store),owner=randomUUID();
if(config.EMAIL_ADAPTER==='maileroo'&&!process.env.MAILEROO_API_KEY)throw new Error('Maileroo adapter requires MAILEROO_API_KEY');
const email:EmailPort=config.EMAIL_ADAPTER==='capture'?new CaptureEmail(config.EMAIL_CAPTURE_ROOT):config.EMAIL_ADAPTER==='ravenrelay'?new RavenRelayEmail(config.RAVENRELAY_API_KEY!,config.EMAIL_FROM,config.RAVENRELAY_API_URL):config.EMAIL_ADAPTER==='maileroo'?new MailerooEmail(process.env.MAILEROO_API_KEY!,config.EMAIL_FROM):{capabilities:{idempotent:false,deliveryEvents:false},async send(){throw new Error('EMAIL_DISABLED');}};
const media=new PostgresMedia(store,createStorage(config),config.STORAGE_NAMESPACE,config.MEDIA_STORAGE_BYTES),processor=new NativeMediaProcessor();
const invitations=new PostgresInvitations(store,createStorage(config),config.STORAGE_NAMESPACE,config.PUBLIC_ORIGIN);
const renderer=new BrowserInvitationRenderer(process.env.INVITATION_BROWSER_PATH??'/usr/bin/chromium',process.env.INVITATION_FONT_DIRECTORY??templateFontDirectory);
let lastSweep=0;let stopping=false;
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{stopping=true;});
console.log(JSON.stringify({event:'worker.started',email:config.EMAIL_ADAPTER}));
while(!stopping){try{if(Date.now()-lastSweep>60000){await media.sweep();lastSweep=Date.now();}if(!await jobs.processOne(owner,email,{'invitation-export':job=>invitations.process(job,renderer),media:job=>media.process(job,processor),'media-delete':job=>media.process(job,processor)}))await new Promise(r=>setTimeout(r,1000));}catch{console.error(JSON.stringify({event:'worker.failed',code:'DATABASE_UNAVAILABLE'}));await new Promise(r=>setTimeout(r,1000));}}
await store.close();
