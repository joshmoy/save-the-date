import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { WeddingSite, type PublishedSite } from './site';
import { SharedAccess } from './access';
import styles from './wedding.module.css';
export const dynamic='force-dynamic';
export const metadata={title:'A celebration · Save The Date',robots:{index:false,follow:false},referrer:'no-referrer' as const};
async function read(slug:string){try{const r=await fetch((process.env.API_INTERNAL_ORIGIN??'http://127.0.0.1:4000')+'/api/v1/public/weddings/'+slug,{headers:{Cookie:(await cookies()).toString()},cache:'no-store',signal:AbortSignal.timeout(10000)});return {status:r.status,site:r.ok?await r.json() as PublishedSite:null};}catch{return null;}}
export default async function Page({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;if(!/^[a-z0-9-]{3,64}$/.test(slug))notFound();const result=await read(slug);
 if(result?.status===404)notFound();if(result?.status===403)return <SharedAccess slug={slug}/>;
 if(!result?.site)return <main className={styles.notice}><h1>The wedding website is temporarily unavailable</h1><p>Please try refreshing in a moment.</p><a href={'/w/'+slug}>Try again</a></main>;
 return <WeddingSite site={result.site}/>;
}
