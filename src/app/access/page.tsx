import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import Layout from '@/components/layout/Layout';
import {PrivateCodeForm} from '@/components/private/PrivateCodeForm';
import {hasPrivateAccessSession} from '@/lib/private-access';
export const runtime='nodejs';export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Вход во Внутренний круг — RRC',robots:{index:false,follow:false}};
export default async function AccessPage(){if(await hasPrivateAccessSession())redirect('/private/home');return <Layout><section className="mx-auto max-w-xl px-6 pt-36 pb-24"><PrivateCodeForm/></section></Layout>}
