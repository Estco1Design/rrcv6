import {z} from 'zod';
import {measurements} from './measurements';
export const interestOptions = [
 {id:'avantgarde',ru:'Авангард',en:'Avant-garde'}, {id:'streetwear',ru:'Стритвир',en:'Streetwear'},
 {id:'tailoring',ru:'Индивидуальный крой',en:'Tailoring'}, {id:'minimal',ru:'Минимализм',en:'Minimalism'},
 {id:'sport',ru:'Спорт',en:'Sport'}, {id:'dark',ru:'Тёмная эстетика',en:'Dark aesthetic'},
] as const;
const measurement=(min:number,max:number)=>z.number().finite().min(min).max(max).nullable().default(null);
export const profileSchema=z.object({
 displayName:z.string().trim().max(80).default(''),
 email:z.union([z.literal(''),z.email().max(150)]).default(''),
 telegram:z.string().trim().max(40).regex(/^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$|^$/).default(''),
 preferredSize:z.enum(['','1','2','3','ONE SIZE']).default(''),
 fit:z.enum(['regular','fitted','oversize']).default('regular'),
 interests:z.array(z.enum(['avantgarde','streetwear','tailoring','minimal','sport','dark'])).max(6).default([]),
 measurements:z.object({height:measurement(measurements.height.min,measurements.height.max),weight:measurement(measurements.weight.min,measurements.weight.max),neck:measurement(measurements.neck.min,measurements.neck.max),chest:measurement(measurements.chest.min,measurements.chest.max),waist:measurement(measurements.waist.min,measurements.waist.max),hips:measurement(measurements.hips.min,measurements.hips.max),shoulder:measurement(measurements.shoulder.min,measurements.shoulder.max),sleeve:measurement(measurements.sleeve.min,measurements.sleeve.max),upperArm:measurement(measurements.upperArm.min,measurements.upperArm.max),thigh:measurement(measurements.thigh.min,measurements.thigh.max),calf:measurement(measurements.calf.min,measurements.calf.max),inseam:measurement(measurements.inseam.min,measurements.inseam.max)}).strict().default({height:null,weight:null,neck:null,chest:null,waist:null,hips:null,shoulder:null,sleeve:null,upperArm:null,thigh:null,calf:null,inseam:null}),
 note:z.string().trim().max(500).default(''),
 shareWithTeam:z.boolean().default(false),
}).strict();
export type AccountProfile=z.infer<typeof profileSchema>;
export type AccountView={id:string;username:string;profile:AccountProfile;createdAt:string;updatedAt:string};
export const emptyProfile=()=>profileSchema.parse({});
export const usernameSchema=z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,32}$/);
export const passwordSchema=z.string().min(12).max(128);
export const credentialsSchema=z.object({username:usernameSchema,password:passwordSchema}).strict();
export const registerSchema=credentialsSchema.extend({consent:z.literal(true)});
export const recoverSchema=z.object({username:usernameSchema,code:z.string().regex(/^[a-f0-9]{32}$/),password:passwordSchema}).strict();
