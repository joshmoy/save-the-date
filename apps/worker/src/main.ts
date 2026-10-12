import { randomUUID } from 'node:crypto';
import { loadConfig } from '@save-the-date/config';
import { PostgresStore, PostgresJobs, PostgresMedia, PostgresInvitations, PostgresPasses } from '@save-the-date/persistence';
import { CaptureEmail, MailerooEmail, RavenRelayEmail, createStorage, NativeMediaProcessor, BrowserInvitationRenderer, templateFontDirectory, credentialHash, AesGcmEncryption, type EmailPort } from '@save-the-date/adapters';
const config=loadConfig(),store=new PostgresStore(config.DB_CONNECTION),jobs=new PostgresJobs(store),owner=randomUUID();
if(config.EMAIL_ADAPTER==='maileroo'&&!process.env.MAILEROO_API_KEY)throw new Error('Maileroo adapter requires MAILEROO_API_KEY');
const email:EmailPort=config.EMAIL_ADAPTER==='capture'?new CaptureEmail(config.EMAIL_CAPTURE_ROOT):config.EMAIL_ADAPTER==='ravenrelay'?new RavenRelayEmail(config.RAVENRELAY_API_KEY!,config.EMAIL_FROM,config.RAVENRELAY_API_URL):config.EMAIL_ADAPTER==='maileroo'?new MailerooEmail(process.env.MAILEROO_API_KEY!,config.EMAIL_FROM):{capabilities:{idempotent:false,deliveryEvents:false},async send(){throw new Error('EMAIL_DISABLED');}};
const media=new PostgresMedia(store,createStorage(config),config.STORAGE_NAMESPACE,config.MEDIA_STORAGE_BYTES),processor=new NativeMediaProcessor();
const invitations=new PostgresInvitations(store,createStorage(config),config.STORAGE_NAMESPACE,config.PUBLIC_ORIGIN);
const renderer=new BrowserInvitationRenderer(process.env.INVITATION_BROWSER_PATH??'/usr/bin/chromium',process.env.INVITATION_FONT_DIRECTORY??templateFontDirectory);
const passes=new PostgresPasses(store,token=>credentialHash(token,config.TOKEN_HASH_KEYS),config.ADMISSION_ENCRYPTION_KEYS?new AesGcmEncryption(config.ADMISSION_ENCRYPTION_KEYS):undefined,createStorage(config),config.STORAGE_NAMESPACE,config.PUBLIC_ORIGIN);
let lastSweep=0;let stopping=false;
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{stopping=true;});
console.log(JSON.stringify({event:'worker.started',email:config.EMAIL_ADAPTER}));
while(!stopping){try{if(Date.now()-lastSweep>60000){await media.sweep();await passes.sweep();lastSweep=Date.now();}if(!await jobs.processOne(owner,email,{'pass-issue':job=>passes.process(job,renderer),'pass-ticket':job=>passes.process(job,renderer),'invitation-export':job=>invitations.process(job,renderer),media:job=>media.process(job,processor),'media-delete':job=>media.process(job,processor)}))await new Promise(r=>setTimeout(r,1000));}catch(e){const code=(e as {code?:unknown}).code;console.error(JSON.stringify({event:'worker.failed',code:typeof code==='string'&&/^[A-Z0-9_]{1,64}$/.test(code)?code:'WORKER_ERROR'}));await new Promise(r=>setTimeout(r,1000));}}
await store.close();
