import 'server-only';
import {cache} from 'react';
import {cookies} from 'next/headers';
import {getAccounts} from './account-db';
/** Cookie presence is not authorization: validate its hash and expiry against SQLite. */
export const currentAccount=cache(async()=>getAccounts().current((await cookies()).get('rrc_account')?.value||''));
