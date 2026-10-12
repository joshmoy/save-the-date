import {z} from 'zod';
export const passIssueSchema=z.object({attendeeId:z.uuid().transform(v=>v.toLowerCase()),eventId:z.uuid().transform(v=>v.toLowerCase())}).strict();
export const passActionSchema=z.object({expectedVersion:z.number().int().positive(),reason:z.string().trim().min(3).max(300)}).strict();
export const redemptionSchema=z.object({credential:z.string().trim().min(8).max(200)}).strict();
export const admissionCorrectionSchema=z.object({attendeeId:z.uuid().transform(v=>v.toLowerCase()),eventId:z.uuid().transform(v=>v.toLowerCase()),name:z.string().trim().min(1).max(160).optional(),state:z.enum(['confirmed','declined']).optional(),reason:z.string().trim().min(3).max(300)}).strict().refine(v=>!!v.name||!!v.state,'Specify a name or attendance correction');
