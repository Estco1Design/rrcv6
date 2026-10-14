import {hasPrivateAccessSession} from '@/lib/private-access';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{return Response.json({active:await hasPrivateAccessSession()},{headers:{'Cache-Control':'private, no-store'}})}catch{return Response.json({active:false},{status:503,headers:{'Cache-Control':'private, no-store'}})}}
