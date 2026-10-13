import {readPublicApi} from '../../../../../src/gateway-transport';
import { cookies } from 'next/headers';
import { notFound,redirect } from 'next/navigation';
import Link from 'next/link';
import { RichText,type TextNode } from '../../site';
import { SharedAccess } from '../../access';
import styles from '../../wedding.module.css';
import {MediaView} from '../../media-view';
export const dynamic='force-dynamic';
export const metadata={title:'Wedding journal · Save The Date',robots:{index:false,follow:false},referrer:'no-referrer' as const};
type PublicPost={redirect:string|null;post:{title:string;body:TextNode[];coverAssetId?:string;attachments:{assetId:string;alt:string;caption:string;contentType:string}[]};site:{displayNames:string}};
function Unavailable({slug,post}:{slug:string;post:string}){return <main className={styles.notice}><h1>This update is temporarily unavailable</h1><p>Try refreshing in a moment.</p><nav aria-label="Update recovery"><a href={'/w/'+slug+'/posts/'+post}>Try again</a>{' '}<Link href={'/w/'+slug}>Return to the wedding</Link></nav></main>;}
export default async function Page({params}:{params:Promise<{slug:string;post:string}>}){
 const {slug,post}=await params;if(![slug,post].every(v=>/^[a-z0-9-]{3,64}$/.test(v)))notFound();
 const result=await readPublicApi<PublicPost>('/api/v1/public/weddings/'+slug+'/posts/'+post,(await cookies()).toString()).catch(()=>null);
 if(!result)return <Unavailable slug={slug} post={post}/>;
 if(result.status===404)notFound();if(result.status===403)return <SharedAccess slug={slug}/>;
 const data=result.data;if(!data)return <Unavailable slug={slug} post={post}/>;
 if(data.redirect)redirect('/w/'+slug+'/posts/'+data.redirect);
 return <main className={styles.article}><Link href={'/w/'+slug}>Back to {data.site.displayNames}</Link><h1>{data.post.title}</h1>{data.post.coverAssetId&&<MediaView src={'/api/v1/public/weddings/'+slug+'/media/'+data.post.coverAssetId} alt={'Cover for '+data.post.title}/>}<RichText nodes={data.post.body}/>{data.post.attachments.map(a=><figure key={a.assetId}><MediaView src={'/api/v1/public/weddings/'+slug+'/media/'+a.assetId} alt={a.alt} video={a.contentType.startsWith('video/')}/>{a.caption&&<figcaption>{a.caption}</figcaption>}</figure>)}</main>;
}
