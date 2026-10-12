import {existsSync,cpSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
require('@next/env').loadEnvConfig(root,false);
const args=process.argv.slice(2);
let port=process.env.PORT||'3000',host='127.0.0.1';
for(let i=0;i<args.length;i++){
 if(args[i]==='--port'||args[i]==='-p')port=args[++i];
 else if(args[i]==='--hostname'||args[i]==='-H')host=args[++i];
 else throw new Error(`Unsupported option: ${args[i]}`);
}
if(!/^\d+$/.test(port)||Number(port)<1||Number(port)>65535||!host)throw new Error('Invalid port or hostname');
const output=resolve(root,'.next/standalone');
if(!existsSync(resolve(output,'server.js')))throw new Error('Production build is missing. Run npm run build first.');
// Next standalone intentionally omits these assets. Refresh generated copies after each build.
cpSync(resolve(root,'public'),resolve(output,'public'),{recursive:true});
cpSync(resolve(root,'.next/static'),resolve(output,'.next/static'),{recursive:true});
const child=spawn(process.execPath,[resolve(output,'server.js')],{cwd:root,stdio:'inherit',env:{...process.env,NODE_ENV:'production',PORT:port,HOSTNAME:host,RRC_ACCOUNT_DB_PATH:resolve(root,process.env.RRC_ACCOUNT_DB_PATH||'var/accounts.sqlite'),RRC_PRIVATE_DB_PATH:resolve(root,process.env.RRC_PRIVATE_DB_PATH||'var/private.sqlite'),RRC_PRIVATE_MEDIA_PATH:resolve(root,process.env.RRC_PRIVATE_MEDIA_PATH||'var/private-media')}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',(code,signal)=>{process.exitCode=code??(signal?1:0);});
