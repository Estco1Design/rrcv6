import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cartTotals, effectivePrice} from '../src/lib/catalog-utils';
import {restoreCart, useCartStore} from '../src/store/cart';
import {getAllProducts} from '../src/lib/products';
import {buildOrderRequest} from '../src/lib/order-request';
import type {CartItem} from '../src/lib/schemas';
const leggings = getAllProducts().find(p => p.slug === 'rrc-high-waist-flared-leggings')!;
const variant = (index: number): CartItem => ({id: leggings.id,productId: leggings.id,slug:leggings.slug,variantId:`${leggings.id}-${leggings.colors[index].name}-default`,name:leggings.name,price:leggings.price,image:leggings.colors[index].images[0],size:null,color:leggings.colors[index].name,quantity:1});
test('different colours remain independent after quantity changes, removal and reload migration', () => {
 const store=useCartStore;store.getState().clearCart();store.getState().addItem(variant(0));store.getState().addItem(variant(1));
 const [green,black]=store.getState().items;assert.notEqual(green.id,black.id);
 store.getState().updateQuantity(green.variantId,3);assert.equal(store.getState().items[1].quantity,1);
 const restored=restoreCart({items:store.getState().items,selectedItems:[black.variantId]});assert.deepEqual([...restored.selectedItems],[black.variantId]);
 store.getState().removeItem(green.variantId);assert.equal(store.getState().items.length,1);assert.equal(store.getState().items[0].color,'Black');
 store.getState().updateQuantity(black.variantId,11);assert.equal(store.getState().items[0].quantity,1);
});
test('legacy product IDs migrate to distinct variant IDs without losing selection',()=>{
 const restored=restoreCart({items:[variant(0),variant(1)],selectedItems:[leggings.id]});assert.equal(restored.items.length,2);assert.equal(restored.selectedItems.size,2);
 assert.equal(restoreCart({items:[{...variant(0),quantity:-1}, {garbage:1}]}).items.length,0);
 assert.equal(restoreCart({items:'broken',selectedItems:{}}).items.length,0);
});
test('unknown prices never imply a free item or a delivery-only payment',()=>{
 assert.deepEqual(cartTotals([]),{subtotal:0,shipping:0,total:0,hasUnpricedItems:false,itemCount:0});
 const unknown=cartTotals([{...variant(0),price:null}]);assert.equal(unknown.shipping,null);assert.equal(unknown.total,null);
 const priced={...variant(0),price:1000};assert.equal(cartTotals([priced]).total,null);
 assert.equal(cartTotals([{...priced,price:15000}]).shipping,null);
 assert.equal(cartTotals([priced,{...variant(1),price:null}]).total,null);
 assert.equal(effectivePrice({price:2000,salePrice:1500}),1500);
 assert.equal(effectivePrice({price:null,salePrice:1500}),null);
});
test('a request includes only the supplied selection and does not invent prices',()=>{
 const message=buildOrderRequest([{...variant(1),price:null}],'ru','Даня','Москва','Рост 180','https://rrc.example');
 assert(message.includes('Чёрный'));assert(!message.includes('Кислотный'));assert(!message.includes('500'));assert(message.includes('/product/rrc-high-waist-flared-leggings'));assert(message.includes('Рост 180'));
});
// Public Host can differ from Next's internal request hostname.
test('same-origin checks allow the public host and reject foreign or missing origins', async () => {
 const {sameOrigin} = await import('../src/lib/request-security');
 const request = (origin: string | null, protocol = 'http') => ({headers: new Headers({... (origin ? {origin} : {}), host: '127.0.0.1:3100', 'x-forwarded-proto': protocol}), nextUrl: new URL('http://localhost:3100/api/private-access/verify')}) as Parameters<typeof sameOrigin>[0];
 assert.equal(sameOrigin(request('http://127.0.0.1:3100')), true);
 assert.equal(sameOrigin(request('https://127.0.0.1:3100', 'https')), true);
 assert.equal(sameOrigin(request('https://foreign.example')), false);
 assert.equal(sameOrigin(request(null)), false);
 assert.equal(sameOrigin(request('https://127.0.0.1:3100')), false);
});

test('hidden products never leak into public routes, search, collections or featured items',async()=>{
 const catalog=await import('../src/lib/products');const {getProductsBySection}=await import('../src/lib/data');
 assert.equal(catalog.getPricingCatalog().length,15);assert.equal(catalog.getAllProducts().length,15);
 assert(!catalog.getPricingCatalog().some(p=>p.id==='rrc-10'));
 assert.equal(catalog.getProductBySlug('rrc-coordinate-zip-hoodie'),undefined);assert.equal(catalog.searchProducts('координат').length,0);
 assert.equal(getProductsBySection('current').length,5);assert.equal(getProductsBySection('archive').length,10);
 assert.deepEqual(catalog.getFeaturedProducts().map(p=>p.slug),catalog.getCurrentCollectionPriority());
 assert.equal(catalog.getProductsByCollection('archive').length,10);
 for(const section of ['current','objects','archive'] as const)assert(!getProductsBySection(section).some(p=>p.catalogStatus==='hidden'));
});

test('local setup enables accounts and preserves existing settings',async()=>{
 const fs=await import('node:fs');const os=await import('node:os');const path=await import('node:path');const {spawnSync}=await import('node:child_process');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rrc-setup-'));const script=path.resolve('scripts/setup-local.mjs');
 try{
  assert.equal(spawnSync(process.execPath,[script],{cwd:dir}).status,0);
  const file=path.join(dir,'.env.local');const initial=fs.readFileSync(file,'utf8');
  assert.match(initial,/RRC_ACCOUNT_SIGNUPS=1/);assert.match(initial,/RRC_ACCOUNT_ADMIN_TOKEN=[a-f0-9]{64}/);assert.match(initial,/RRC_PRIVATE_CODES=ESTCO/);
  assert.equal(spawnSync(process.execPath,[script],{cwd:dir}).status,0);assert.equal(fs.readFileSync(file,'utf8'),initial);
  fs.writeFileSync(file,initial.replace('RRC_ACCOUNT_SIGNUPS=1','RRC_ACCOUNT_SIGNUPS=0')+'NEXT_PUBLIC_RRC_TELEGRAM=existing_account\n');
  const custom=fs.readFileSync(file,'utf8');assert.equal(spawnSync(process.execPath,[script],{cwd:dir}).status,0);assert.equal(fs.readFileSync(file,'utf8'),custom);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('size and oversize requests remain independent after reload and in messages',()=>{
 const base={...variant(1),size:'1'};const loose={...base,fitRequest:'oversize' as const};
 const restored=restoreCart({items:[base,loose]});assert.equal(restored.items.length,2);assert.notEqual(restored.items[0].variantId,restored.items[1].variantId);
 assert.equal(restoreCart({items:restored.items}).items[1].fitRequest,'oversize');
 const msg=buildOrderRequest([restored.items[1]],'ru','','Москва','','https://rrc.example',{carrier:'СДЭК',postalCode:'123456',destination:'ПВЗ тест'});
 assert.match(msg,/1 \(S \/ M\)/);assert.match(msg,/Свободнее — запрос/);assert.match(msg,/100% предоплата/);assert.match(msg,/СДЭК/);assert.match(msg,/123456/);assert.match(msg,/Стоимость изделий: 3\s*000/);assert(!msg.includes('500 ₽'));assert(!msg.includes('Бесплатно'));
});
test('production window counts weekdays from Moscow payment date, excluding weekends and configured holidays',async()=>{
 const {productionWindow}=await import('../src/lib/production-calendar');
 assert.deepEqual(productionWindow(new Date('2026-10-09T12:00:00+03:00')),{start:'2026-10-09',deadline:'2026-10-28'});
 assert.deepEqual(productionWindow(new Date('2026-10-10T12:00:00+03:00')),{start:'2026-10-12',deadline:'2026-10-29'});
 assert.deepEqual(productionWindow(new Date('2026-10-08T21:30:00Z')),{start:'2026-10-09',deadline:'2026-10-28'});
 assert.deepEqual(productionWindow(new Date('2026-10-09T12:00:00+03:00'),['2026-10-12']),{start:'2026-10-09',deadline:'2026-10-29'});
 assert.throws(()=>productionWindow(new Date('invalid')));
});
