import {redirect} from 'next/navigation';
import {currentAccount} from '@/lib/account-session';
import type {Metadata} from 'next';
import {ClosedLevelHome} from '@/components/private/ClosedLevelHome';
export const metadata:Metadata={title:'Закрытый уровень — RRC',robots:{index:false,follow:false}};
export default async function PrivateHomePage(){if(!await currentAccount())redirect('/access');return <ClosedLevelHome/>}
