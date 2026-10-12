// Server-only imports. No passwords, hashes or sessions are returned to the UI.
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,chmodSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {randomBytes,randomUUID,createHash,scrypt,timingSafeEqual} from 'node:crypto';
import {emptyProfile,profileSchema,type AccountProfile,type AccountView} from './account-schema';
const sha=(value:string)=>createHash('sha256').update(value).digest('hex');
export class AccountError extends Error {constructor(public status:number,public code:string){super(code)}}
function derive(password:string,salt:string):Promise<Buffer>{return new Promise((resolve,reject)=>scrypt(password,salt,32,{N:16384,r:8,p:1},(error,key)=>error?reject(error):resolve(key)))}
async function passwordHash(password:string){const salt=randomBytes(16).toString('hex');return `${salt}:${(await derive(password,salt)).toString('hex')}`}
async function passwordMatches(password:string,stored:string){const [salt,hex]=stored.split(':');const actual=await derive(password,salt);const expected=Buffer.from(hex,'hex');return expected.length===actual.length&&timingSafeEqual(expected,actual)}
function view(row:Record<string,unknown>):AccountView{return {id:String(row.id),username:String(row.username),profile:profileSchema.parse(JSON.parse(String(row.profile))),createdAt:String(row.created_at),updatedAt:String(row.updated_at)}}
export class Accounts {
 private db:DatabaseSync;
 constructor(file:string){mkdirSync(dirname(file),{recursive:true,mode:0o700});this.db=new DatabaseSync(file,{timeout:5000});chmodSync(file,0o600);this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,recovery_hash TEXT NOT NULL,profile TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,consent_at TEXT NOT NULL,policy_version TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);`)}
 close(){this.db.close()}
 private session(id:string){const token=randomBytes(32).toString('hex');this.db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());this.db.prepare('INSERT INTO sessions(token_hash,user_id,expires) VALUES(?,?,?)').run(sha(token),id,Date.now()+7*86400000);return token}
 async register(username:string,password:string){const hash=await passwordHash(password);const code=randomBytes(16).toString('hex');const id=randomUUID();const now=new Date().toISOString();
  try{this.db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?)').run(id,username,hash,sha(code),JSON.stringify(emptyProfile()),now,now,now,'2026-10-09')}catch(error){if(this.db.prepare('SELECT id FROM users WHERE username=?').get(username))throw new AccountError(409,'username_taken');throw error}
  return {token:this.session(id),recoveryCode:code,user:this.getById(id)!};
 }
 async login(username:string,password:string){const row=this.db.prepare('SELECT * FROM users WHERE username=?').get(username);
  // A dummy derivation keeps nonexistent usernames on the same expensive code path.
  if(!row){await derive(password,'0'.repeat(32));throw new AccountError(401,'invalid_credentials')}
  if(!await passwordMatches(password,String(row.password_hash)))throw new AccountError(401,'invalid_credentials');const latest=this.db.prepare('SELECT * FROM users WHERE id=? AND password_hash=?').get(String(row.id),String(row.password_hash));if(!latest)throw new AccountError(401,'invalid_credentials');return {token:this.session(String(row.id)),user:view(latest)};
 }
 getById(id:string){const row=this.db.prepare('SELECT * FROM users WHERE id=?').get(id);return row?view(row):null}
 current(token:string){if(!/^[a-f0-9]{64}$/.test(token))return null;const row=this.db.prepare('SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires>?').get(sha(token),Date.now());return row?view(row):null}
 logout(token:string){this.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sha(token))}
 save(id:string,profile:AccountProfile){const safe=profileSchema.parse(profile);this.db.prepare('UPDATE users SET profile=?,updated_at=? WHERE id=?').run(JSON.stringify(safe),new Date().toISOString(),id);return this.getById(id)!}
 async delete(id:string,password:string){const row=this.db.prepare('SELECT password_hash FROM users WHERE id=?').get(id);if(!row||!await passwordMatches(password,String(row.password_hash)))throw new AccountError(401,'invalid_credentials');const latest=this.db.prepare('SELECT id FROM users WHERE id=? AND password_hash=?').get(id,String(row.password_hash));if(!latest)throw new AccountError(401,'invalid_credentials');this.db.prepare('DELETE FROM users WHERE id=?').run(id)}
 async recover(username:string,code:string,password:string){const row=this.db.prepare('SELECT * FROM users WHERE username=?').get(username);const expected=Buffer.from(row?String(row.recovery_hash):sha('unavailable'),'hex');const actual=Buffer.from(sha(code),'hex');if(!row||!timingSafeEqual(expected,actual))throw new AccountError(401,'invalid_credentials');const hash=await passwordHash(password);const nextCode=randomBytes(16).toString('hex');this.db.exec('BEGIN IMMEDIATE');try{const latest=this.db.prepare('SELECT id FROM users WHERE id=? AND recovery_hash=?').get(String(row.id),sha(code));if(!latest)throw new AccountError(401,'invalid_credentials');this.db.prepare('UPDATE users SET password_hash=?,recovery_hash=?,updated_at=? WHERE id=?').run(hash,sha(nextCode),new Date().toISOString(),String(row.id));this.db.prepare('DELETE FROM sessions WHERE user_id=?').run(String(row.id));this.db.exec('COMMIT')}catch(error){this.db.exec('ROLLBACK');throw error}return {token:this.session(String(row.id)),recoveryCode:nextCode,user:this.getById(String(row.id))!}}
 sharedProfiles(){return this.db.prepare("SELECT * FROM users WHERE json_extract(profile, '$.shareWithTeam')=1 ORDER BY updated_at DESC LIMIT 500").all().map(view).filter(user=>user.profile.shareWithTeam)}
}
let accounts:Accounts|undefined;
export function getAccounts(){return accounts??=new Accounts(resolve(process.env.RRC_ACCOUNT_DB_PATH||'var/accounts.sqlite'))}
export function signupOpen(){return process.env.RRC_ACCOUNT_SIGNUPS!==undefined?process.env.RRC_ACCOUNT_SIGNUPS==='1':process.env.NODE_ENV==='development'}
