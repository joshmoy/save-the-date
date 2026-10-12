import {createHash} from 'node:crypto';
export interface ArchiveEntry {path:string;bytes:number;chunks:AsyncIterable<Uint8Array>}
export interface ArchivePort {encode(entries:AsyncIterable<ArchiveEntry>):AsyncIterable<Uint8Array>}
/** POSIX ustar, uncompressed: bounded memory, interoperable and supports the pilot's 10 GiB total. */
export class TarArchive implements ArchivePort {
 async *encode(entries:AsyncIterable<ArchiveEntry>){for await(const e of entries){if(!/^[a-zA-Z0-9/_\-.]+$/.test(e.path)||e.path.includes('..')||e.path.startsWith('/')||Buffer.byteLength(e.path)>100||!Number.isSafeInteger(e.bytes)||e.bytes<0||e.bytes>0o77777777777)throw Error('INVALID_ARCHIVE_ENTRY');const h=Buffer.alloc(512);h.write(e.path);h.write('0000600\0',100);h.write('0000000\0',108);h.write('0000000\0',116);h.write(e.bytes.toString(8).padStart(11,'0')+'\0',124);h.write('00000000000\0',136);h.fill(32,148,156);h.write('0',156);h.write('ustar\0',257);h.write('00',263);const sum=h.reduce((a,b)=>a+b,0);h.write(sum.toString(8).padStart(6,'0')+'\0 ',148);yield h;let total=0;for await(const chunk of e.chunks){total+=chunk.length;if(total>e.bytes)throw Error('ARCHIVE_SIZE_CHANGED');yield chunk;}if(total!==e.bytes)throw Error('ARCHIVE_SIZE_CHANGED');if(total%512)yield Buffer.alloc(512-total%512);}yield Buffer.alloc(1024);}
}
export async function* bytesChunks(bytes:Buffer){yield bytes;}
export async function checksumChunks(chunks:AsyncIterable<Uint8Array>){const h=createHash('sha256');let bytes=0;for await(const c of chunks){bytes+=c.length;h.update(c);}return {bytes,checksum:h.digest('hex')};}
