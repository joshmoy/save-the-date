'use client';
import {useState} from 'react';
export function MediaView({src,alt,video=false}:{src:string;alt:string;video?:boolean}){const [failed,setFailed]=useState(false);if(failed)return <p role="status">This media is currently unavailable. The rest of this story is still here.</p>;return video?<video src={src} controls preload="metadata" aria-label={alt} onError={()=>setFailed(true)} style={{width:'100%',maxHeight:600}}/>:<img src={src} alt={alt} loading="lazy" onError={()=>setFailed(true)} style={{width:'100%',maxHeight:600,objectFit:'cover',borderRadius:12}}/>;}
