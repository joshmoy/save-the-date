import {z} from 'zod';
const https=z.url().refine(value=>value.startsWith('https://'),'Legacy references must use HTTPS');
export const legacyContentSchema=z.object({schemaVersion:z.literal(1),couple:z.string().min(1).max(200),historicalDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
 posts:z.array(z.object({id:z.string().min(1).max(100),title:z.string().min(1).max(200),image:https,videoUrl:https.optional(),summary:z.string().max(500),details:z.string().min(1).max(5000),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),pageRoute:z.string().regex(/^\/updates\/[a-z0-9]+(?:-[a-z0-9]+)*$/)}).strict()).max(1000),
 albums:z.array(z.object({slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),title:z.string().min(1).max(160),description:z.string().max(2000),hasPhotos:z.boolean(),hasVideos:z.boolean()}).strict()).max(1000),exceptions:z.array(z.string().max(2000)).max(100)}).strict()
 .refine(value=>new Set(value.posts.map(post=>post.id)).size===value.posts.length&&new Set(value.posts.map(post=>post.pageRoute)).size===value.posts.length&&new Set(value.albums.map(album=>album.slug)).size===value.albums.length,'Legacy source IDs and paths must be unique');
