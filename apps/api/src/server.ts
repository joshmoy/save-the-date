import 'reflect-metadata';
import { Module, Controller, All, Req, Res } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {creativeOptions,type Config} from '@save-the-date/config';
import { PostgresRetention,PostgresStore, PostgresPublication, PostgresNotifications, PostgresMedia, PostgresInvitations, PostgresGuests, PostgresPasses,PostgresCreative,PostgresUploads } from '@save-the-date/persistence';
import {FilesystemStorage,ObjectDeletionLedger,createStorage,credentialHash,AesGcmEncryption} from '@save-the-date/adapters';
import { DomainError } from '@save-the-date/domain';
import { z } from '@save-the-date/contracts';
import type { Request, Response } from 'express';
import { Application } from './application.js';

export async function createServer(config:Config){
 const store=new PostgresStore(config.DB_CONNECTION,new ObjectDeletionLedger(config.STORAGE_ADAPTER==='filesystem'?new FilesystemStorage(config.DELETION_LEDGER_ROOT):createStorage({...config,S3_BUCKET:config.DELETION_LEDGER_S3_BUCKET??config.S3_BUCKET}))),service=new Application(store,config,new PostgresPublication(store),new PostgresNotifications(store),new PostgresMedia(store,createStorage(config),config.STORAGE_NAMESPACE,config.MEDIA_STORAGE_BYTES),new PostgresInvitations(store,createStorage(config),config.STORAGE_NAMESPACE,config.PUBLIC_ORIGIN),new PostgresGuests(store,token=>credentialHash(token,config.TOKEN_HASH_KEYS),config.PUBLIC_ORIGIN),new PostgresPasses(store,token=>credentialHash(token,config.TOKEN_HASH_KEYS),config.ADMISSION_ENCRYPTION_KEYS?new AesGcmEncryption(config.ADMISSION_ENCRYPTION_KEYS):undefined,createStorage(config),config.STORAGE_NAMESPACE,config.PUBLIC_ORIGIN),new PostgresUploads(store,token=>credentialHash(token,config.TOKEN_HASH_KEYS),config.PUBLIC_ORIGIN),new PostgresCreative(store,createStorage(config),config.STORAGE_NAMESPACE,creativeOptions(config)),new PostgresRetention(store,createStorage(config),config.STORAGE_NAMESPACE,config.PUBLIC_ORIGIN));
 await new PostgresRetention(store,createStorage(config),config.STORAGE_NAMESPACE,config.PUBLIC_ORIGIN).reconcileRestoration();
 async function handle(req:Request,res:Response){
  try{const result=await service.dispatch(req,res);if(!res.headersSent)res.json(result);}catch(e){if(res.headersSent){res.destroy();return;}
   if(e instanceof z.ZodError)res.status(400).json({code:'VALIDATION_ERROR',message:'Check the highlighted fields',fields:e.issues.map(v=>({path:v.path,message:v.message}))});
   else if(e instanceof DomainError){if(e.status===429)res.setHeader('Retry-After','60');res.status(e.status).json({code:e.code,message:e.message});}
   else{console.error(JSON.stringify({event:'request.failed',code:(e as {code?:string}).code??'INTERNAL'}));res.status(500).json({code:'INTERNAL_ERROR',message:'The request could not be completed. Please retry'});}
  }
 }
 // Feature modules share application policy ports; Nest owns route registration and request parsing.
 // Apply decorators explicitly so the workspace can retain standard NodeNext TypeScript semantics.
 const modules=['identity','weddings','invites','public','provider-events','guest','uploads'].map(prefix=>{
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
