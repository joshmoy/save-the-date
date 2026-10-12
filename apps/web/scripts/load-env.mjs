import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
// Preload root configuration for Next's CLI, standalone server and child workers.
// Existing host environment values take precedence.
dotenv.config({path:fileURLToPath(new URL('../../../.env',import.meta.url)),quiet:true});
