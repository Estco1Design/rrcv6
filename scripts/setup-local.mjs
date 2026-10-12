import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
if(Number(process.versions.node.split('.')[0])!==24){console.error('Для этой версии сайта установите Node.js 24 LTS.');process.exit(1)}
const path=resolve('.env.local');
let text=existsSync(path)?readFileSync(path,'utf8'):'# Local development settings. Do not publish this file.\n';
let changed=false;
function setMissing(key,value,valid=v=>!!v) {
 const expression=new RegExp(`^${key}=(.*)$`,'m');const match=text.match(expression);
 if(match && valid(match[1].trim().replace(/^["']|["']$/g,'')))return;
 const line=`${key}=${value}`;
 text=match?text.replace(expression,line):`${text.endsWith('\n')?text:text+'\n'}${line}\n`;changed=true;
}
setMissing('RRC_PRIVATE_SESSION_SECRET',randomBytes(32).toString('hex'),v=>v.length>=32);
setMissing('RRC_PRIVATE_CODES','estco');
setMissing('NEXT_PUBLIC_RRC_TELEGRAM','rrc_support');
setMissing('NEXT_PUBLIC_SITE_URL','https://richrussiancommunity.com');
setMissing('RRC_ACCOUNT_SIGNUPS','1',v=>v==='0'||v==='1');
setMissing('RRC_ACCOUNT_ADMIN_TOKEN',randomBytes(32).toString('hex'),v=>v.length>=32);
if(changed)writeFileSync(path,text,{mode:0o600});
console.log('Локальный PRIVATE настроен в .env.local. При первой настройке код: estco. Ранее заданные коды сохранены.');
