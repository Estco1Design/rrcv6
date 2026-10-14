import {redirect} from 'next/navigation';
import {hasPrivateAccessSession} from '@/lib/private-access';
import {PrivateWelcome} from '@/components/private/PrivateWelcome';
export default async function Page(){if(!await hasPrivateAccessSession())redirect('/');return <PrivateWelcome/>}
