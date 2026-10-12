import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {Accounts,AccountError,signupOpen} from '../src/lib/account-db';
import {emptyProfile,profileSchema,registerSchema} from '../src/lib/account-schema';
test('accounts persist isolated profiles, hash credentials, honour team consent, revoke sessions',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'rrc-account-'));const file=join(dir,'users.sqlite');let db=new Accounts(file);
 try{
 const alice=await db.register('alice','safe-password-123');const bob=await db.register('bob','other-password-123');
 assert.equal(db.current(alice.token)?.username,'alice');assert.equal(db.current('a'.repeat(64)),null);assert.deepEqual(db.sharedProfiles(),[]);
 db.save(alice.user.id,{...emptyProfile(),displayName:'Alice',measurements:{...emptyProfile().measurements,chest:95},shareWithTeam:true});
 assert.equal(db.current(bob.token)?.profile.displayName,'');assert.equal(db.sharedProfiles().length,1);
 const raw=new DatabaseSync(file);const rows=raw.prepare('SELECT * FROM users').all();assert.ok(!JSON.stringify(rows).includes('safe-password-123'));assert.ok(!JSON.stringify(rows).includes(alice.recoveryCode));raw.close();
 db.close();db=new Accounts(file);assert.equal(db.current(alice.token)?.profile.measurements.chest,95);
 const restored=await db.recover('alice',alice.recoveryCode,'changed-password-123');assert.equal(db.current(alice.token),null);assert.equal(db.current(restored.token)?.username,'alice');
 await assert.rejects(db.recover('alice',alice.recoveryCode,'another-password-123'),(e)=>e instanceof AccountError&&e.status===401);
 await assert.rejects(db.login('alice','safe-password-123'));await db.login('alice','changed-password-123');
 db.save(alice.user.id,{...emptyProfile(),shareWithTeam:false});assert.equal(db.sharedProfiles().length,0);
 await assert.rejects(db.delete(alice.user.id,'wrong-password-123'));await db.delete(alice.user.id,'changed-password-123');assert.equal(db.current(restored.token),null);assert.equal(db.current(bob.token)?.username,'bob');
 assert.ok(!JSON.stringify(bob.user).includes('hash'));
 }finally{db.close();rmSync(dir,{recursive:true,force:true})}
});
test('recovery code is single use even under concurrent requests',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'rrc-recovery-'));const db=new Accounts(join(dir,'users.sqlite'));
 try{const user=await db.register('race','initial-password-123');const results=await Promise.allSettled([db.recover('race',user.recoveryCode,'first-password-123'),db.recover('race',user.recoveryCode,'second-password-123')]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1)}finally{db.close();rmSync(dir,{recursive:true,force:true})}
});
test('registration requires consent and profile rejects injected ownership / unsafe values',()=>{
 assert.equal(registerSchema.safeParse({username:'alice',password:'safe-password-123',consent:false}).success,false);
 assert.equal(profileSchema.safeParse({...emptyProfile(),userId:'someone-else'}).success,false);
 assert.equal(profileSchema.safeParse({...emptyProfile(),measurements:{...emptyProfile().measurements,chest:-1}}).success,false);
});

test('explicit signup gate closes registration even in development',()=>{
 const previous=process.env.RRC_ACCOUNT_SIGNUPS;try{process.env.RRC_ACCOUNT_SIGNUPS='0';assert.equal(signupOpen(),false);process.env.RRC_ACCOUNT_SIGNUPS='1';assert.equal(signupOpen(),true)}finally{if(previous===undefined)delete process.env.RRC_ACCOUNT_SIGNUPS;else process.env.RRC_ACCOUNT_SIGNUPS=previous}
});
