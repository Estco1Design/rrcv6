const clamp=(n:number,min=0,max=1)=>Math.max(min,Math.min(max,n));
const cubic=(t:number)=>[(-t+2*t*t-t*t*t)/2,1-2.5*t*t+1.5*t*t*t,(t+4*t*t-3*t*t*t)/2,(-t*t+t*t*t)/2];
/** Four precomputed physical drapes. Only sampling and local grab dynamics run
 * in the browser; no full cloth solver, photographs or baked light are loaded.
 */
export class ClothRest {
  readonly columns:number;
  readonly rows:number;
  private profiles:Float32Array[];
  private a=new Float32Array(3);
  private b=new Float32Array(3);
  constructor(buffer:ArrayBuffer){
    const header=new DataView(buffer);
    if(buffer.byteLength<16||header.getUint32(0,true)!==0x44435252)throw new Error('Invalid cloth rest header');
    this.columns=header.getUint16(4,true);this.rows=header.getUint16(6,true);
    const count=header.getUint32(12,true),floats=count*3;
    if(header.getUint32(8,true)!==4||count!==(this.columns+1)*(this.rows+1)||this.columns<2||this.rows<2||buffer.byteLength!==16+floats*4*4)throw new Error('Invalid cloth rest size');
    const all=new Float32Array(buffer,16);
    if(all.some(v=>!Number.isFinite(v)||Math.abs(v)>1))throw new Error('Invalid cloth rest coordinates');
    this.profiles=Array.from({length:4},(_,i)=>new Float32Array(buffer,16+i*floats*4,floats));
  }
  sample(sign:number,u:number,v:number,aspect:number,out:Float32Array,offset=0){
    const x=clamp(u)*this.columns,y=(1-clamp(v))*this.rows,ix=Math.floor(x),iy=Math.floor(y),wx=cubic(x-ix),wy=cubic(y-iy);
    const blend=clamp((aspect-.6)/.8),first=sign>0?0:1,d=this.profiles[first],m=this.profiles[first+2];
    let dx=0,dy=0,dz=0;
    for(let j=0;j<4;j++)for(let i=0;i<4;i++){
      const k=(clamp(iy+j-1,0,this.rows)*(this.columns+1)+clamp(ix+i-1,0,this.columns))*3,w=wx[i]*wy[j];
      dx+=(m[k]*(1-blend)+d[k]*blend)*w;dy+=(m[k+1]*(1-blend)+d[k+1]*blend)*w;dz+=(m[k+2]*(1-blend)+d[k+2]*blend)*w;
    }
    out[offset]=dx*aspect;out[offset+1]=dy;out[offset+2]=dz;
  }
  initialHeight(u:number,v:number,aspect:number){
    const seam=.5+.02/1.035;
    this.sample(1,u,clamp((v-seam)/(1-seam)),aspect,this.a);
    this.sample(-1,u,clamp((seam-v)/seam),aspect,this.b);
    const t=clamp((v-seam+.035)/.07),blend=t*t*(3-2*t);
    return this.b[2]*(1-blend)+this.a[2]*blend;
  }
}
