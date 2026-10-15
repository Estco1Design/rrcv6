// Read the approved artwork without resampling or modifying its pixels.
// Extract only the two silhouette curves for matching geometry and CPU hits.
import sharp from 'sharp';
import {writeFileSync} from 'node:fs';
const result={};
for(const [profile,name] of [['desktop','cloth-plate.webp'],['mobile','cloth-plate-mobile.webp']]){
 const {data,info}=await sharp(new URL('../../public/intro/'+name,import.meta.url).pathname).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h,channels:c}=info;const top=[],bottom=[];
 const lit=(x,y)=>{let value=0;for(let dx=-2;dx<=2;dx++){const k=(y*w+Math.max(0,Math.min(w-1,x+dx)))*c;value+=Math.max(data[k],data[k+1],data[k+2]);}return value/5>11;};
 for(let i=0;i<w;i++){
  const x=i;let a=0,b=h-1;
  for(let y=0;y<Math.floor(h*.44);y++)if(lit(x,y))a=y;
  for(let y=h-1;y>Math.floor(h*.54);y--)if(lit(x,y))b=y;
  top.push(Math.min(.445,(a+2)/h));bottom.push(Math.max(.535,(b-2)/h));
 }
 result[profile]={file:name,width:w,height:h,top,bottom};
}
writeFileSync(new URL('../../src/components/intro/reference-contours.json',import.meta.url),JSON.stringify(result)+'\n');
