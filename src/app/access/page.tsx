import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {hasPrivateAccessSession} from '@/lib/private-access';
export const runtime='nodejs';export const dynamic='force-dynamic';
export const metadata:Metadata={title:'PRIVATE ACCESS — RRC',robots:{index:false,follow:false}};
export default async function AccessPage(){redirect(await hasPrivateAccessSession()?'/private/home':'/')}
