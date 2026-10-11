import { randomBytes, scrypt as derive, timingSafeEqual, createHmac } from 'node:crypto';
export const credential = () => randomBytes(32).toString('base64url');
export function credentialHash(token:string,key:string){return createHmac('sha256',key).update(token).digest('hex');}
function scrypt(password:string,salt:string):Promise<Buffer>{return new Promise((resolve,reject)=>derive(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key)));}
export async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');const key=await scrypt(password,salt);return `scrypt:32768:8:1:${salt}:${key.toString('hex')}`;}
export async function checkPassword(password:string,encoded:string){const parts=encoded.split(':');if(parts.length!==6||parts.slice(0,4).join(':')!=='scrypt:32768:8:1')return false;const actual=await scrypt(password,parts[4]);const expected=Buffer.from(parts[5],'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);}
