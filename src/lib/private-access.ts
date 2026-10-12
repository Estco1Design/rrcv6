import "server-only";
import { cookies } from "next/headers";
import { resolve } from "node:path";
import { cache } from "react";
import { PrivateSessions } from "./private-db";
export const PRIVATE_ACCESS_COOKIE = "rrc_private_access";
export const getPrivateAccessCodes = () =>
  (process.env.RRC_PRIVATE_CODES ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
let sessions: PrivateSessions | undefined;
export const getPrivateSessions = () =>
  (sessions ??= new PrivateSessions(
    resolve(process.env.RRC_PRIVATE_DB_PATH || "var/private.sqlite"),
  ));
export const hasPrivateAccessSession = cache(async () =>
  getPrivateSessions().valid(
    (await cookies()).get(PRIVATE_ACCESS_COOKIE)?.value ?? "",
    getPrivateAccessCodes(),
  ),
);
