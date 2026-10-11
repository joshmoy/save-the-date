import { loadConfig } from '@save-the-date/config';
import { createServer } from './server.js';
const config=loadConfig();const {app,store}=await createServer(config);
await app.listen(config.PORT,'0.0.0.0');
console.log(JSON.stringify({event:'api.started',port:config.PORT}));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{await app.close();await store.close();process.exit(0);});
