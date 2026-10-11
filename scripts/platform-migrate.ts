import { loadConfig } from '@save-the-date/config';
import { PostgresStore } from '@save-the-date/persistence';
const c=loadConfig(),store=new PostgresStore(c.DB_CONNECTION);
try{await store.migrate(new URL('../packages/persistence/migrations/',import.meta.url).pathname);console.log('Platform migrations applied with checksums and advisory lock');}finally{await store.close();}
