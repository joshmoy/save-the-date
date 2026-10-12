import 'reflect-metadata';
import { Module, Controller, All, Req, Res } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Config } from '@save-the-date/config';
import { PostgresStore, PostgresPublication, PostgresNotifications } from '@save-the-date/persistence';
import { DomainError } from '@save-the-date/domain';
import { z } from '@save-the-date/contracts';
import type { Request, Response } from 'express';
import { Application } from './application.js';

export async function createServer(config:Config){
 const store=new PostgresStore(config.DB_CONNECTION),service=new Application(store,config,new PostgresPublication(store),new PostgresNotifications(store));
 async function handle(req:Request,res:Response){
  try{res.json(await service.dispatch(req,res));}catch(e){
   if(e instanceof z.ZodError)res.status(400).json({code:'VALIDATION_ERROR',message:'Check the highlighted fields',fields:e.issues.map(v=>({path:v.path,message:v.message}))});
   else if(e instanceof DomainError){if(e.status===429)res.setHeader('Retry-After','60');res.status(e.status).json({code:e.code,message:e.message});}
   else{console.error(JSON.stringify({event:'request.failed',code:(e as {code?:string}).code??'INTERNAL'}));res.status(500).json({code:'INTERNAL_ERROR',message:'The request could not be completed. Please retry'});}
  }
 }
 // Feature modules share application policy ports; Nest owns route registration and request parsing.
 // Apply decorators explicitly so the workspace can retain standard NodeNext TypeScript semantics.
 const modules=['identity','weddings','invites','public','provider-events'].map(prefix=>{
  class FeatureController {async dispatch(req:Request,res:Response){await handle(req,res);}}
  Controller('api/v1/'+prefix)(FeatureController);
  All(['','{*path}'])(FeatureController.prototype,'dispatch',Object.getOwnPropertyDescriptor(FeatureController.prototype,'dispatch')!);
  Req()(FeatureController.prototype,'dispatch',0);Res()(FeatureController.prototype,'dispatch',1);
  class FeatureModule {} Module({controllers:[FeatureController]})(FeatureModule);return FeatureModule;
 });
 class HealthController {async health(req:Request,res:Response){await handle(req,res);}}
 Controller('api/v1')(HealthController);All('health')(HealthController.prototype,'health',Object.getOwnPropertyDescriptor(HealthController.prototype,'health')!);Req()(HealthController.prototype,'health',0);Res()(HealthController.prototype,'health',1);
 class ApiModule {} Module({imports:modules,controllers:[HealthController]})(ApiModule);
 const app=await NestFactory.create<NestExpressApplication>(ApiModule,{logger:['error','warn'],bodyParser:false,rawBody:true});app.useBodyParser('json',{limit:'1mb'});await app.init();return {app,store,service};
}
