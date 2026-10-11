import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Config } from '@save-the-date/config';
import { PostgresStore } from '@save-the-date/persistence';
import { DomainError } from '@save-the-date/domain';
import { z } from '@save-the-date/contracts';
import type { Request, Response } from 'express';
import { Application } from './application.js';
class ApiModule {}
Module({})(ApiModule);
export async function createServer(config:Config){
 const store=new PostgresStore(config.DB_CONNECTION);const service=new Application(store,config);
 const app=await NestFactory.create<NestExpressApplication>(ApiModule,{logger:['error','warn'],bodyParser:false});
 app.useBodyParser('json',{limit:'1mb'});
 app.use('/api/v1',async(req:Request,res:Response)=>{
  // Express strips the mount prefix; reconstruct only the path, never log credential-bearing queries.
  const original=req.url;req.url='/api/v1'+req.url;
  try{const result=await service.dispatch(req,res);res.json(result);}catch(e){
   if(e instanceof z.ZodError){res.status(400).json({code:'VALIDATION_ERROR',message:'Check the highlighted fields',fields:e.issues.map(v=>({path:v.path,message:v.message}))});}
   else if(e instanceof DomainError){if(e.status===429)res.setHeader('Retry-After','60');res.status(e.status).json({code:e.code,message:e.message});}
   else{console.error(JSON.stringify({event:'request.failed',code:(e as {code?:string}).code??'INTERNAL'}));res.status(500).json({code:'INTERNAL_ERROR',message:'The request could not be completed. Please retry'});}
  }finally{req.url=original;}
 });
 await app.init();return {app,store,service};
}
