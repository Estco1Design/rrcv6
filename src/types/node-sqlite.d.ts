declare module 'node:sqlite' {
 export class DatabaseSync {
  constructor(path: string, options?:{timeout?:number});
  exec(sql:string):void;
  prepare(sql:string):{run(...params:(string|number|null)[]):unknown;get(...params:(string|number|null)[]):Record<string,unknown>|undefined;all(...params:(string|number|null)[]):Record<string,unknown>[]};
  close():void;
 }
}
