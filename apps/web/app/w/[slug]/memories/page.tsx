import type {Metadata} from 'next';
import {GuestMemories} from './memories';
export const metadata:Metadata={title:'Share your memories · Save The Date',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function Page({params}:{params:Promise<{slug:string}>}){return <GuestMemories slug={(await params).slug}/>;}
