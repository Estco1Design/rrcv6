import {DatabaseSync} from 'node:sqlite';
import {existsSync,mkdirSync,chmodSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const source=resolve(process.env.RRC_ACCOUNT_DB_PATH||'var/accounts.sqlite');
const target=process.argv[2]&&resolve(process.argv[2]);
if(!target||target===source||existsSync(target)||!existsSync(source)){console.error('Укажите новый путь для резервной копии существующей базы.');process.exit(1)}
mkdirSync(dirname(target),{recursive:true,mode:0o700});
const db=new DatabaseSync(source,{timeout:5000});
try{db.prepare('VACUUM INTO ?').run(target);chmodSync(target,0o600);console.log('Резервная копия создана.')}finally{db.close()}
