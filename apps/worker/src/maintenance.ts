type MaintenanceTask={name:'media'|'passes'|'retention';run:()=>Promise<unknown>};
/** A failed sweep retries next minute without starving independent queued jobs. */
export async function runMaintenance(tasks:MaintenanceTask[],report:(event:{event:string;task:string;code:string})=>void){
 for(const task of tasks)try{await task.run();}catch(error){const code=(error as {code?:unknown})?.code;report({event:'worker.maintenance_failed',task:task.name,code:typeof code==='string'&&/^[A-Z0-9_]{1,64}$/.test(code)?code:'MAINTENANCE_ERROR'});}
}
