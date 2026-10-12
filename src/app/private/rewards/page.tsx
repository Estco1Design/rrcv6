import {redirect} from 'next/navigation';
import {hasPrivateAccessSession} from '@/lib/private-access';
import {PrivateSectionPage} from '@/components/private/PrivateSectionPage';
export default async function Page(){if(!await hasPrivateAccessSession())redirect('/access');return <PrivateSectionPage section="rewards"/>}
