"""Approved aperture geometry shared by the offline drape preparation steps."""
C,R=96,48
top=[.31,.29,.205,.23,.3,.34,.355,.37,.4];bottom=[.575,.585,.645,.71,.735,.705,.66,.62,.585]
def contour(points,u):
 x=min(1,max(0,u))*8;i=min(7,int(x));t=x-i
 def slope(k):
  if k==0:return points[1]-points[0]
  if k==8:return points[8]-points[7]
  a=points[k]-points[k-1];b=points[k+1]-points[k]
  return 0 if a*b<=0 else 2*a*b/(a+b)
 return (2*t**3-3*t*t+1)*points[i]+(t**3-2*t*t+t)*slope(i)+(-2*t**3+3*t*t)*points[i+1]+(t**3-t*t)*slope(i+1)
def template(aspect,sign,u,v):
 center=.315 if sign==1 else .66
 edge=1-2*(center+(contour(top if sign==1 else bottom,u)-center)*min(1,max(.4,aspect/.95)))
 return ((2*u-1)*aspect,edge+(sign*1.035-edge)*v)
