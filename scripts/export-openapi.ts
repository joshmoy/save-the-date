import {writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {openApiDocument} from '../apps/api/src/openapi.js';
const root=new URL('../docs/api/',import.meta.url);await mkdir(root,{recursive:true});const target=new URL('openapi.json',root);await writeFile(target,JSON.stringify(openApiDocument(),null,2)+'\n');console.log('Generated '+fileURLToPath(target));
