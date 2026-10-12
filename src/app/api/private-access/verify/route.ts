import {NextRequest,NextResponse} from 'next/server';
import {sameOrigin,allowAttempt} from '@/lib/request-security';
import {PRIVATE_ACCESS_COOKIE,getPrivateAccessCodes,getPrivateSessions} from '@/lib/private-access';
import {PRIVATE_SESSION_SECONDS} from '@/lib/private-db';
export const runtime='nodejs';export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:NextRequest){
 if(!sameOrigin(req))return json({ok:false,error:'forbidden'},403);
 if(!allowAttempt(req))return json({ok:false,error:'rate_limited'},429);
 const codes=getPrivateAccessCodes();if(!codes.length)return json({ok:false,error:'not_configured'},503);
 try{
  if(Number(req.headers.get('content-length')||0)>2048)return json({ok:false,error:'invalid_data'},413);
  // Read a bounded stream instead of buffering an untrusted, unbounded body.
  const reader=req.body?.getReader();if(!reader)return json({ok:false,error:'invalid_data'},400);
  const chunks:Uint8Array[]=[];let bytes=0;for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>2048){await reader.cancel();return json({ok:false,error:'invalid_data'},413)}chunks.push(value)}
  let body:unknown;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{return json({ok:false,error:'invalid_data'},400)}
  if(!body||typeof body!=='object'||!('code' in body)||typeof body.code!=='string')return json({ok:false,error:'invalid_data'},400);
  const sessions=getPrivateSessions();const token=sessions.issue(body.code,codes);if(!token)return json({ok:false,error:'invalid_code'},401);
  sessions.revoke(req.cookies.get(PRIVATE_ACCESS_COOKIE)?.value??'');
  const response=json({ok:true,valid:true});response.cookies.set(PRIVATE_ACCESS_COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:PRIVATE_SESSION_SECONDS});return response;
 }catch{return json({ok:false,error:'service_unavailable'},503)}
}
