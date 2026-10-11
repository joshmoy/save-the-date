import { cp, mkdir } from 'node:fs/promises';
const root=new URL('../',import.meta.url),target=new URL('.next/standalone/apps/web/',root);
await mkdir(new URL('.next/',target),{recursive:true});
await cp(new URL('public/',root),new URL('public/',target),{recursive:true});
await cp(new URL('.next/static/',root),new URL('.next/static/',target),{recursive:true});
console.log('Standalone public/static assets prepared');
