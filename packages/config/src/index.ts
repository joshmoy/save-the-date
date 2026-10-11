import dotenv from 'dotenv';
import { z } from 'zod';
// Load only explicit platform configuration. Never fall through to a legacy .env.local.
export function loadConfig() {
 if(process.env.PLATFORM_ENV_FILE) dotenv.config({path:process.env.PLATFORM_ENV_FILE,quiet:true});
 const schema = z.object({ NODE_ENV:z.enum(['development','test','production']).default('development'), DB_ADAPTER:z.literal('postgres').default('postgres'), DB_CONNECTION:z.string().url(), PUBLIC_ORIGIN:z.string().url(), API_INTERNAL_ORIGIN:z.string().url().default('http://127.0.0.1:4000'), TOKEN_HASH_KEYS:z.string().min(32), STORAGE_ADAPTER:z.enum(['filesystem','s3']).default('filesystem'), STORAGE_NAMESPACE:z.string().regex(/^[a-z0-9-]+$/).default('weddings'), STORAGE_ROOT:z.string().default('/tmp/std-storage'), EMAIL_ADAPTER:z.enum(['capture','maileroo','disabled']).default('capture'), EMAIL_CAPTURE_ROOT:z.string().default('/tmp/std-mail'), EMAIL_FROM:z.email().default('local@example.test'), LLM_ADAPTER:z.literal('disabled').default('disabled'), IMAGE_ADAPTER:z.literal('disabled').default('disabled'), JOB_TRANSPORT:z.literal('postgres').default('postgres'), PORT:z.coerce.number().int().min(1024).max(65535).default(4000), RETENTION_POLICY:z.string().optional(), BACKUP_POLICY:z.string().optional() });
 const parsed = schema.safeParse(process.env);
 if(!parsed.success) throw new Error('Invalid platform configuration: '+parsed.error.issues.map(x=>x.path.join('.')+' '+x.message).join('; '));
 const c=parsed.data;
 if(c.NODE_ENV==='production'){
  if(!c.PUBLIC_ORIGIN.startsWith('https://'))throw new Error('Production PUBLIC_ORIGIN requires HTTPS');
  if(c.EMAIL_ADAPTER==='capture')throw new Error('Capture email adapter is development/test only');
  if(!c.RETENTION_POLICY||!c.BACKUP_POLICY)throw new Error('Production retention and backup policies required');
  if(c.TOKEN_HASH_KEYS.includes('development'))throw new Error('Development keys are forbidden in production');
  if(c.STORAGE_ADAPTER==='filesystem'&&c.STORAGE_ROOT.startsWith('/tmp'))throw new Error('Production storage must be durable');
 }
 return c;
}
export type Config = ReturnType<typeof loadConfig>;
