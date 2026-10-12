import { DatabaseSync } from "node:sqlite";
import { mkdirSync, chmodSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
export const PRIVATE_SESSION_SECONDS = 7 * 86400;
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const normalizePrivateCode = (value: string) =>
  value.trim().toUpperCase();
export class PrivateSessions {
  private db: DatabaseSync;
  constructor(file: string) {
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(file, { timeout: 5000 });
    chmodSync(file, 0o600);
    this.db.exec(
      "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS private_sessions(token_hash TEXT PRIMARY KEY,code_hash TEXT NOT NULL,expires INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS private_expiry ON private_sessions(expires)",
    );
  }
  close() {
    this.db.close();
  }
  issue(input: string, codes: string[], now = Date.now()): string | null {
    const normalized = normalizePrivateCode(input);
    if (!normalized || normalized.length > 100) return null;
    const digest = hash(normalized);
    const valid = codes.some((code) =>
      timingSafeEqual(
        Buffer.from(digest, "hex"),
        Buffer.from(hash(normalizePrivateCode(code)), "hex"),
      ),
    );
    if (!valid) return null;
    const token = randomBytes(32).toString("hex");
    this.db.prepare("DELETE FROM private_sessions WHERE expires<=?").run(now);
    this.db
      .prepare("INSERT INTO private_sessions VALUES(?,?,?)")
      .run(hash(token), digest, now + PRIVATE_SESSION_SECONDS * 1000);
    return token;
  }
  valid(token: string, codes: string[], now = Date.now()): boolean {
    if (!/^[a-f0-9]{64}$/.test(token)) return false;
    const row = this.db
      .prepare(
        "SELECT code_hash FROM private_sessions WHERE token_hash=? AND expires>?",
      )
      .get(hash(token), now);
    return (
      !!row &&
      codes.some((code) => hash(normalizePrivateCode(code)) === row.code_hash)
    );
  }
  revoke(token: string) {
    if (/^[a-f0-9]{64}$/.test(token))
      this.db
        .prepare("DELETE FROM private_sessions WHERE token_hash=?")
        .run(hash(token));
  }
}
