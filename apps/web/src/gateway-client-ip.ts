import {isIP} from 'node:net';

/** Only enable behind an ingress that overwrites this header and owns web access. */
export function gatewayClientIp(headers:Headers,configuredHeader?:string){
  if(!configuredHeader)return null;
  if(!/^[a-z][a-z0-9-]{0,63}$/i.test(configuredHeader))throw Error('Invalid WEB_CLIENT_IP_HEADER');
  const value=headers.get(configuredHeader)?.trim();
  if(!value||!isIP(value))throw Error('The trusted ingress did not supply one valid client IP');
  return value;
}
