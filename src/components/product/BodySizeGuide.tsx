'use client';
import {useState} from 'react';
import {bodySizeGuide,sizeGuideSources} from '@/config/body-size-guide';
import {useLanguage} from '@/i18n';
export function BodySizeGuide({initialKind='men'}:{initialKind?:'men'|'women'}) {
 const {language}=useLanguage();const ru=language==='ru';const [kind,setKind]=useState(initialKind);
 return <details className="mt-4 border-t border-rrc-line pt-4 text-xs text-rrc-off"><summary className="cursor-pointer uppercase tracking-widest py-2">{ru?'Ориентиры по меркам тела':'Body measurement reference'} ↗</summary>
 <div className="flex gap-2 my-3">{(['men','women'] as const).map(k=><button key={k} type="button" aria-pressed={kind===k} onClick={()=>setKind(k)} className={`border px-3 py-2 ${kind===k?'border-rrc-white text-rrc-white':'border-rrc-line'}`}>{k==='men'?(ru?'Мужская':'Men'):(ru?'Женская':'Women')}</button>)}</div>
 <p className="mb-3 leading-relaxed">{ru?'Справочные обхваты тела в см. Это ориентиры выбора, не замеры готовой вещи RRC. Крой и прибавки согласуем до оплаты.':'Reference body circumferences in cm. These are sizing references, not finished RRC garment measurements. Cut and ease are agreed before payment.'}</p>
 <table className="w-full text-left text-[10px] sm:text-xs"><thead className="text-rrc-silver"><tr><th className="py-2">RRC</th><th>{ru?'Грудь':'Chest'}</th>{kind==='women'&&<><th>{ru?'Талия':'Waist'}</th><th>{ru?'Бёдра':'Hips'}</th></>}</tr></thead><tbody>{bodySizeGuide[kind].map(row=><tr key={row.size} className="border-t border-rrc-line"><td className="py-3">{row.size}<span className="block text-[9px]">{row.label}</span></td><td>{row.chest.join('–')}</td>{'waist' in row&&<><td>{row.waist.join('–')}</td><td>{row.hips.join('–')}</td></>}</tr>)}</tbody></table>
 <p className="mt-3 leading-relaxed">{ru?'Измеряйте грудь и бёдра по наиболее выступающим точкам, талию — по естественной линии. Ленту не затягивайте. Диапазоны пересекаются: посадку уточняем по модели.':'Measure chest and hips at their fullest points, waist at the natural waistline. Do not tighten the tape. Ranges overlap; fit depends on the design.'}</p>
 <a href={sizeGuideSources[kind]} target="_blank" rel="noopener noreferrer" className="inline-block underline mt-3">{ru?'Источник ориентиров: ASOS':'Reference source: ASOS'}</a>
 </details>;
}
