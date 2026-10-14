import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {hasPrivateAccessSession} from '@/lib/private-access';
import {PrivateHeader} from '@/components/private/PrivateHeader';
export const runtime='nodejs';export const dynamic='force-dynamic';
export const metadata:Metadata={title:'PRIVATE ACCESS — RRC',description:'Закрытое пространство PRIVATE ACCESS.',robots:{index:false,follow:false}};
export default async function PrivateLayout({children}:{children:React.ReactNode}){
 if(!await hasPrivateAccessSession())redirect('/access');
 return <div data-rrc-private="" className="min-h-screen bg-black text-white"><PrivateHeader/><main>{children}</main></div>;
}
