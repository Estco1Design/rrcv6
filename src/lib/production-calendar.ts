import {productionPolicy} from '@/config/site';
// Counts the payment weekday as day one. Weekend payments start on Monday.
// Production holidays must be supplied explicitly when the workshop calendar is known.
export function productionWindow(payment: Date, holidays: readonly string[] = []) {
 if(!Number.isFinite(payment.getTime())) throw new Error('Invalid payment date');
 const parts = new Intl.DateTimeFormat('en-GB', {timeZone: productionPolicy.timeZone, year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(payment);
 const part = (key: string) => parts.find(p=>p.type===key)!.value;
 const day = new Date(`${part('year')}-${part('month')}-${part('day')}T12:00:00Z`);
 const stamp = () => day.toISOString().slice(0,10);
 const working = () => day.getUTCDay()!==0 && day.getUTCDay()!==6 && !holidays.includes(stamp());
 const advance = () => day.setUTCDate(day.getUTCDate()+1);
 while(!working()) advance();
 const start = stamp(); let count=1;
 while(count<productionPolicy.workingDays){advance();if(working()) count++;}
 return {start,deadline:stamp()};
}
