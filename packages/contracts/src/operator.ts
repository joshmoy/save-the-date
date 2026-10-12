import {z} from 'zod';
const uuid=z.uuid().transform(v=>v.toLowerCase()),slug=z.string().min(3).max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const supportReportSchema=z.object({kind:z.enum(['abuse','rights','account','technical']),weddingSlug:slug.optional(),contactEmail:z.email().optional(),description:z.string().trim().min(15).max(2000)}).strict();
export const operatorReasonSchema=z.object({reason:z.string().trim().min(15).max(1000)}).strict();
export const operatorControlsSchema=operatorReasonSchema.extend({publicHold:z.boolean().default(false),uploadsEnabled:z.boolean(),aiEnabled:z.boolean(),storageLimitBytes:z.number().int().min(1024**2).max(1024**4),conceptDailyLimit:z.number().int().min(0).max(100).nullable(),boardDailyLimit:z.number().int().min(0).max(100).nullable(),expectedVersion:z.number().int().positive()}).strict();
export const operatorRenewalSchema=operatorReasonSchema.extend({until:z.iso.datetime(),expectedVersion:z.number().int().positive()}).strict();
export const operatorMediaSchema=operatorReasonSchema.extend({assetId:uuid}).strict();
export type OperatorControls=z.infer<typeof operatorControlsSchema>;
