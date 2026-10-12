import {z} from 'zod';
const uuid=z.uuid().transform(v=>v.toLowerCase());
export const uploadGrantSchema=z.object({eventId:uuid,albumId:uuid,expiresAt:z.iso.datetime({offset:true}),sessionFileLimit:z.number().int().min(1).max(100).default(20),sessionByteLimit:z.number().int().min(1).max(2147483648).default(524288000)}).strict();
export const uploadAccessSchema=z.object({slug:z.string().regex(/^[a-z0-9-]{3,64}$/),credential:z.string().min(8).max(200)}).strict();
export type UploadGrantInput=z.infer<typeof uploadGrantSchema>;
