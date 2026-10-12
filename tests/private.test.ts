import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {PrivateSessions,PRIVATE_SESSION_SECONDS} from '../src/lib/private-db';

test('private sessions are independent, persisted, hashed, bounded and revocable',()=>{
 const dir=mkdtempSync(join(tmpdir(),'rrc-private-'));const file=join(dir,'private.sqlite');let db=new PrivateSessions(file);
 try{
  const now=Date.now();const codes=['test-invitation'];
  assert.equal(db.issue('wrong-code',codes,now),null);
  assert.equal(db.issue('',codes,now),null);
  assert.equal(db.issue('x'.repeat(101),codes,now),null);
  const first=db.issue(' TEST-invitation ',codes,now)!;
  const second=db.issue('test-invitation',codes,now)!;
  assert.notEqual(first,second);assert.match(first,/^[a-f0-9]{64}$/);
  assert.equal(db.valid(first,codes,now),true);
  assert.equal(db.valid('a'.repeat(64),codes,now),false);
  assert.equal(db.valid(first+'0',codes,now),false);
  const raw=new DatabaseSync(file);const rows=JSON.stringify(raw.prepare('SELECT * FROM private_sessions').all());raw.close();
  assert.equal(rows.includes(first),false);assert.equal(rows.includes(codes[0]),false);
  db.close();db=new PrivateSessions(file);assert.equal(db.valid(first,codes,now),true);
  assert.equal(db.valid(first,[],now),false);assert.equal(db.valid(first,['rotated-code'],now),false);
  assert.equal(db.valid(first,codes,now+PRIVATE_SESSION_SECONDS*1000),false);
  db.revoke(first);assert.equal(db.valid(first,codes,now),false);assert.equal(db.valid(second,codes,now),true);
 }finally{db.close();rmSync(dir,{recursive:true,force:true})}
});
