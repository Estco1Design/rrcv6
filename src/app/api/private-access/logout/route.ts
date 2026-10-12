import {NextRequest,NextResponse} from 'next/server';
import {sameOrigin} from '@/lib/request-security';
import {PRIVATE_ACCESS_COOKIE,getPrivateSessions} from '@/lib/private-access';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
 if(!sameOrigin(req))return NextResponse.json({ok:false},{status:403});
 try{getPrivateSessions().revoke(req.cookies.get(PRIVATE_ACCESS_COOKIE)?.value??'');const response=NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});response.cookies.set(PRIVATE_ACCESS_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});return response}catch{return NextResponse.json({ok:false},{status:503})}
}
