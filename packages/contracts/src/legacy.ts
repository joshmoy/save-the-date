import {z} from 'zod';
const https=z.url().refine(value=>{try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}},'Legacy references must use HTTPS without embedded credentials');
export const legacyContentSchema=z.object({schemaVersion:z.literal(1),couple:z.string().min(1).max(200),historicalDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
 posts:z.array(z.object({id:z.string().min(1).max(100),title:z.string().min(1).max(200),image:https,videoUrl:https.optional(),summary:z.string().max(500),details:z.string().min(1).max(5000),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),pageRoute:z.string().regex(/^\/updates\/[a-z0-9]+(?:-[a-z0-9]+)*$/)}).strict()).max(1000),
 albums:z.array(z.object({slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),title:z.string().min(1).max(160),description:z.string().max(2000),hasPhotos:z.boolean(),hasVideos:z.boolean()}).strict()).max(1000),exceptions:z.array(z.string().max(2000)).max(100)}).strict()
 .refine(value=>new Set(value.posts.map(post=>post.id)).size===value.posts.length&&new Set(value.posts.map(post=>post.pageRoute)).size===value.posts.length&&new Set(value.albums.map(album=>album.slug)).size===value.albums.length,'Legacy source IDs and paths must be unique');

const mappingUuid=z.uuid().transform(value=>value.toLowerCase()),instant=z.iso.datetime({offset:true}).nullable();
export const legacyOperationalSnapshotSchema=z.object({version:z.literal(1),capturedAt:z.iso.datetime({offset:true}),
 users:z.array(z.object({id:z.uuid(),email:z.string()}).passthrough()).max(100000),
 passes:z.array(z.object({id:z.uuid(),used_at:instant,invalidated_at:instant,used_by:z.string().nullable(),guest_name:z.string().nullable()}).passthrough()).max(100000),
 scans:z.array(z.object({id:z.uuid(),hall_pass_id:z.uuid().nullable().optional(),result:z.enum(['valid','used','invalid'])}).passthrough()).max(100000),settings:z.array(z.record(z.string(),z.unknown())).max(100),migrations:z.array(z.record(z.string(),z.unknown())).max(1000)}).strict();
export const legacyMappingSchema=z.object({version:z.literal(1),sourceChecksum:z.string().regex(/^[a-f0-9]{64}$/),weddingId:mappingUuid,
 users:z.array(z.object({sourceUserId:mappingUuid,targetUserId:mappingUuid}).strict()).max(10000),
 passes:z.array(z.object({sourcePassId:mappingUuid,attendeeId:mappingUuid,eventId:mappingUuid,admittedByUserId:mappingUuid.nullable().default(null),identityEvidence:z.string().trim().min(20).max(2000)}).strict()).max(10000)}).strict()
 .refine(value=>new Set(value.users.map(row=>row.sourceUserId)).size===value.users.length&&new Set(value.passes.map(row=>row.sourcePassId)).size===value.passes.length,'Source mappings must be unique');
export type LegacyMapping=z.infer<typeof legacyMappingSchema>;
