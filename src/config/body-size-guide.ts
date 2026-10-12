// Body measurements, not finished RRC garment measurements.
// RRC ranges are an editorial grouping of ASOS reference values, not a universal standard.
export const bodySizeGuide = {
 men: [
  {size:'1',label:'S / M',chest:[91,101]},
  {size:'2',label:'M / L',chest:[96,106]},
  {size:'3',label:'L / XL',chest:[101,111]},
 ],
 women: [
  {size:'1',label:'S / M',chest:[83,93],waist:[65,75],hips:[88.5,98.5]},
  {size:'2',label:'M / L',chest:[93,103],waist:[75,85],hips:[98.5,108.5]},
  {size:'3',label:'L / XL',chest:[103,110.5],waist:[85,92.5],hips:[108.5,116]},
 ],
} as const;
export const sizeGuideSources = {
 men:'https://www.asos.com/discover/size-charts/men/hoodies-sweatshirts/',
 women:'https://www.asos.com/discover/size-charts/women/dresses/',
};
