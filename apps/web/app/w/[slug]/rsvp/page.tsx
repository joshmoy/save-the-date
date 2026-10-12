import type {Metadata} from 'next';
import {GuestRsvp} from './rsvp';
export const metadata:Metadata={title:'Your private RSVP · Save The Date',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{slug:string}>}){return <GuestRsvp slug={(await params).slug}/>;}
