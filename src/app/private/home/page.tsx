import {redirect} from 'next/navigation';
import {hasPrivateAccessSession} from '@/lib/private-access';
import {InnerCircleHome} from '@/components/private/InnerCircleHome';
export default async function PrivateHomePage(){if(!await hasPrivateAccessSession())redirect('/access');return <InnerCircleHome/>}
