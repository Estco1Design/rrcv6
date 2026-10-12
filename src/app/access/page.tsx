import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import Layout from '@/components/layout/Layout';
import {AccessGate} from '@/components/private/AccessGate';
import {currentAccount} from '@/lib/account-session';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Закрытый уровень — RRC',robots:{index:false,follow:false}};
export default async function AccessPage(){if(await currentAccount())redirect('/private/home');return <Layout><AccessGate/></Layout>}
