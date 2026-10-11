import type { Metadata } from 'next';
import { Platform } from './platform';
export const metadata:Metadata={title:'Your wedding workspace · Save The Date',description:'Create and manage your wedding workspace.',robots:{index:false,follow:false},referrer:'no-referrer'};
export default function Page(){return <Platform/>;}
