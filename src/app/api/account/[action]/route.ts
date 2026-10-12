import {NextRequest,NextResponse} from 'next/server';
import {createHash,timingSafeEqual} from 'node:crypto';
import {AccountError,getAccounts,signupOpen} from '@/lib/account-db';
import {credentialsSchema,registerSchema,recoverSchema,profileSchema,passwordSchema} from '@/lib/account-schema';
import {sameOrigin,allowAttempt} from '@/lib/request-security';
export const runtime='nodejs';export const dynamic='force-dynamic';
const cookie='rrc_account';
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function result(body:unknown,token?:string){const response=json(body);if(token)response.cookies.set(cookie,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:7*86400});return response}
function clear(body:unknown){const response=json(body);response.cookies.set(cookie,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});return response}
const current=(req:NextRequest)=>getAccounts().current(req.cookies.get(cookie)?.value||'');
function admin(req:NextRequest){const secret=process.env.RRC_ACCOUNT_ADMIN_TOKEN||'';if(secret.length<32)return false;const token=req.headers.get('authorization')?.replace(/^Bearer /,'')||'';return timingSafeEqual(createHash('sha256').update(token).digest(),createHash('sha256').update(secret).digest())}
export async function GET(req:NextRequest,{params}:{params:Promise<{action:string}>}){
 const {action}=await params;
 try{
  if(action==='admin'){if(!admin(req))return json({error:'forbidden'},403);return json({users:getAccounts().sharedProfiles()})}
  if(action==='me')return json({user:current(req),signupOpen:signupOpen()});
  if(action==='export'){const user=current(req);if(!user)return json({error:'unauthorized'},401);return new NextResponse(JSON.stringify(user,null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="rrc-profile.json"','Cache-Control':'no-store'}})}
  return json({error:'not_found'},404);
 }catch{return json({error:'service_unavailable'},503)}
}
export async function POST(req:NextRequest,{params}:{params:Promise<{action:string}>}){
 if(!sameOrigin(req))return json({error:'forbidden'},403);
 const {action}=await params;
 if(['register','login','recover','delete'].includes(action)&&!allowAttempt(req))return json({error:'rate_limited'},429);
 if(Number(req.headers.get('content-length')||0)>16000)return json({error:'invalid_data'},400);
 try{
  const db=getAccounts();
  if(action==='logout'){db.logout(req.cookies.get(cookie)?.value||'');return clear({ok:true})}
  const raw=await req.text();if(raw.length>16000)return json({error:'invalid_data'},400);let body:unknown;try{body=JSON.parse(raw)}catch{return json({error:'invalid_data'},400)}
  if(action==='register'){if(!signupOpen())return json({error:'signup_closed'},503);const parsed=registerSchema.safeParse(body);if(!parsed.success)return json({error:'invalid_data'},400);const {token,...data}=await db.register(parsed.data.username,parsed.data.password);return result(data,token)}
  if(action==='login'){const parsed=credentialsSchema.safeParse(body);if(!parsed.success)return json({error:'invalid_data'},400);const {token,...data}=await db.login(parsed.data.username,parsed.data.password);return result(data,token)}
  if(action==='recover'){const parsed=recoverSchema.safeParse(body);if(!parsed.success)return json({error:'invalid_data'},400);const {token,...data}=await db.recover(parsed.data.username,parsed.data.code,parsed.data.password);return result(data,token)}
  const user=current(req);if(!user)return json({error:'unauthorized'},401);
  if(action==='profile'){const parsed=profileSchema.safeParse(body);if(!parsed.success)return json({error:'invalid_data'},400);return json({user:db.save(user.id,parsed.data)})}
  if(action==='delete'){const parsed=passwordSchema.safeParse((body as {password?:unknown})?.password);if(!parsed.success)return json({error:'invalid_data'},400);await db.delete(user.id,parsed.data);return clear({ok:true})}
  return json({error:'not_found'},404);
 }catch(error){if(error instanceof AccountError)return json({error:error.code},error.status);return json({error:'service_unavailable'},503)}
}
