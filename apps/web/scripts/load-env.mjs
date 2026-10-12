import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
// Preload root configuration for Next's CLI, standalone server and child workers.
// Existing host environment values take precedence.
const inheritedPort=process.env.PORT;
dotenv.config({path:fileURLToPath(new URL('../../../.env',import.meta.url)),quiet:true});

// A shared .env must not make the web process bind the API port.
process.env.PORT=inheritedPort??process.env.WEB_PORT??'3000';
