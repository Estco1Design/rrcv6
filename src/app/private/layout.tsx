import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {currentAccount} from '@/lib/account-session';
import {PrivateHeader} from '@/components/private/PrivateHeader';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Закрытый уровень — RRC',description:'Пространство участников RRC.',robots:{index:false,follow:false}};
export default async function PrivateLayout({children}:{children:React.ReactNode}){
 if(!await currentAccount())redirect('/access');
 return <div data-rrc-private="" className="flex min-h-screen flex-col bg-black"><PrivateHeader/><main className="flex-1">{children}</main></div>;
}
