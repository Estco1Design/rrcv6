'use client';
import {selectedSizeLabel} from '@/lib/sizing';
import {useState, useRef, useEffect} from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import {useCartStore} from '@/store/cart';
import {useLanguage} from '@/i18n';
import {CartSummary} from '@/components/cart/CartSummary';
import {buildOrderRequest} from '@/lib/order-request';
import {siteConfig, telegramUrl, productionPolicy, preorderTerms} from '@/config/site';
import {colorName} from '@/lib/catalog-utils';
import {getAllProducts} from '@/lib/products';
export default function CheckoutPage() { return <Layout><RequestContent /></Layout>; }
function RequestContent() {
  const {language} = useLanguage(); const ru = language === 'ru';
  const {items, selectedItems} = useCartStore();
  const selected = items.filter(item => selectedItems.has(item.variantId));
  const unavailable = selected.some(item => { const product = getAllProducts().find(p => p.id === item.productId); return !product || (product.inStock === false && !product.preorder); });
  const [name, setName] = useState(''); const [city, setCity] = useState(''); const [note, setNote] = useState('');
  const [carrier,setCarrier] = useState('CDEK'); const [postalCode,setPostalCode] = useState(''); const [destination,setDestination] = useState('');
  const [prepared, setPrepared] = useState(false); const [copied, setCopied] = useState(false); const [copyError, setCopyError] = useState(false);
  const [origin, setOrigin] = useState('');
  const preview = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {setOrigin(window.location.origin);}, []);
  useEffect(() => {setCopied(false);setCopyError(false);}, [items, selectedItems, name, city, note, carrier, postalCode, destination, language]);
  const message = buildOrderRequest(selected, language, name, city, note, origin, {carrier:carrier==='CDEK' ? 'СДЭК / CDEK' : carrier==='POST' ? 'Почта России / Russian Post' : (ru?'Согласовать':'To confirm'),postalCode,destination});
  const longMessage = Array.from(message).length > 3800;
  const hasContact = !!(siteConfig.telegram || siteConfig.email);
  const inputClass = 'w-full px-4 py-3 bg-rrc-panel border border-rrc-line text-rrc-white focus:border-rrc-wine focus:outline-none text-sm';
  const buttonClass = 'block w-full px-6 py-4 text-[11px] font-mono tracking-widest uppercase bg-rrc-wine text-rrc-white hover:bg-rrc-bordeaux transition-colors text-center';
  if (!selected.length) return <div className="min-h-[60vh] pt-24 px-4 md:px-8"><div className="max-w-2xl mx-auto text-center py-20"><h1 className="font-display text-2xl uppercase mb-4">{ru ? 'ЗАПРОС ЗАКАЗА' : 'ORDER ENQUIRY'}</h1><p className="text-rrc-off mb-8">{ru ? 'Выберите изделия в корзине.' : 'Select items in your bag.'}</p><Link href="/cart" className="text-t-ui uppercase tracking-widest">{ru ? 'В КОРЗИНУ' : 'OPEN BAG'}</Link></div></div>;
  return <div className="pt-24 md:pt-32 px-4 md:px-8 pb-16"><div className="max-w-6xl mx-auto">
    <Link href="/cart" className="inline-block text-t-ui uppercase tracking-widest text-rrc-off mb-6">← {ru ? 'В КОРЗИНУ' : 'BACK TO BAG'}</Link>
    <h1 className="font-display text-2xl md:text-3xl font-medium uppercase tracking-wide mb-6">{ru ? 'ЗАПРОС ЗАКАЗА' : 'ORDER ENQUIRY'}</h1>
    <p className="text-rrc-off leading-relaxed max-w-2xl mb-8">{preorderTerms(language)} {ru ? 'Размер и детали согласуем перед оплатой.' : 'Sizing and details are agreed before payment.'}</p>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={e => {e.preventDefault();if (!unavailable) setPrepared(true);}} className="bg-rrc-coal p-6 border border-rrc-line space-y-5">
          <h2 className="font-display text-lg uppercase">{ru ? 'ДЕТАЛИ ЗАПРОСА' : 'ENQUIRY DETAILS'}</h2>
          <div><label htmlFor="request-name" className="block text-t-ui text-rrc-off mb-2">{ru ? 'ИМЯ (НЕОБЯЗАТЕЛЬНО)' : 'NAME (OPTIONAL)'}</label><input id="request-name" autoComplete="given-name" maxLength={80} value={name} onChange={e => setName(e.target.value)} className={inputClass}/></div>
          <div><label htmlFor="request-city" className="block text-t-ui text-rrc-off mb-2">{ru ? 'ГОРОД (НЕОБЯЗАТЕЛЬНО)' : 'CITY (OPTIONAL)'}</label><input id="request-city" autoComplete="address-level2" maxLength={100} value={city} onChange={e => setCity(e.target.value)} className={inputClass}/></div>
          <fieldset className="space-y-4 border-t border-rrc-line pt-5"><legend className="text-t-ui pt-4">{ru ? 'ДОСТАВКА' : 'SHIPPING'}</legend>
            <div><label htmlFor="request-carrier" className="block text-t-ui text-rrc-off mb-2">{ru ? 'ПРЕДПОЧИТАЕМЫЙ ПЕРЕВОЗЧИК' : 'PREFERRED CARRIER'}</label><select id="request-carrier" value={carrier} onChange={e=>setCarrier(e.target.value)} className={inputClass}><option value="CDEK">{ru?'СДЭК':'CDEK'}</option><option value="POST">{ru?'Почта России':'Russian Post'}</option><option value="CONFIRM">{ru?'Согласовать / международная доставка':'To confirm / international delivery'}</option></select></div>
            <div><label htmlFor="request-postal" className="block text-t-ui text-rrc-off mb-2">{ru ? 'ПОЧТОВЫЙ ИНДЕКС (НЕОБЯЗАТЕЛЬНО)' : 'POSTAL CODE (OPTIONAL)'}</label><input id="request-postal" autoComplete="postal-code" maxLength={16} value={postalCode} onChange={e=>setPostalCode(e.target.value)} className={inputClass}/></div>
            <div><label htmlFor="request-destination" className="block text-t-ui text-rrc-off mb-2">{ru ? 'АДРЕС ИЛИ ПВЗ (НЕОБЯЗАТЕЛЬНО)' : 'ADDRESS OR PICKUP POINT (OPTIONAL)'}</label><input id="request-destination" autoComplete="street-address" maxLength={250} value={destination} onChange={e=>setDestination(e.target.value)} className={inputClass}/></div>
            <p className="text-xs text-rrc-off">{ru ? 'Отправление из Малаховки. Стоимость доставки по тарифу перевозчика и полный итог подтвердим до оплаты.' : 'Ships from Malakhovka. Carrier shipping cost and the full total will be confirmed before payment.'}</p>
          </fieldset>
          <div><label htmlFor="request-note" className="block text-t-ui text-rrc-off mb-2">{ru ? 'КОММЕНТАРИЙ ИЛИ МЕРКИ' : 'NOTE OR MEASUREMENTS'}</label><textarea id="request-note" rows={4} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} className={inputClass}/></div>
          <p className="text-xs text-rrc-off">{ru ? 'Сообщение уйдёт бренду только после того, как вы отправите его в Telegram или почте.' : 'Your message reaches the brand only after you send it in Telegram or email.'} <Link href="/privacy-policy" className="underline">{ru ? 'Конфиденциальность' : 'Privacy'}</Link></p>
          <button disabled={unavailable} type="submit" className={buttonClass}>{ru ? 'ПОДГОТОВИТЬ СООБЩЕНИЕ' : 'PREPARE MESSAGE'}</button>
          {unavailable && <p role="alert" className="text-sm text-rrc-off">{ru ? 'В выборе есть недоступное изделие. Вернитесь в корзину и снимите выбор.' : 'A selected item is unavailable. Deselect it in your bag.'}</p>}
        </form>
        {prepared && <section className="bg-rrc-coal p-6 border border-rrc-line space-y-4" aria-live="polite">
          <h2 className="font-display text-lg uppercase">{ru ? 'СООБЩЕНИЕ ГОТОВО' : 'MESSAGE READY'}</h2>
          <p className="text-sm text-rrc-off">{ru ? 'Проверьте текст и отправьте его. Подготовка сообщения не резервирует изделие.' : 'Review the text and send it. Preparing a message does not reserve an item.'}</p>
          <label htmlFor="request-preview" className="sr-only">{ru ? 'Текст сообщения' : 'Message text'}</label>
          <textarea id="request-preview" ref={preview} readOnly rows={12} value={message} className={inputClass}/>
          <button type="button" className={buttonClass} onClick={async () => {try {await navigator.clipboard.writeText(message);setCopied(true);setCopyError(false);}catch {preview.current?.focus();preview.current?.select();setCopyError(true);}}}>{copied ? (ru ? 'СКОПИРОВАНО' : 'COPIED') : (ru ? 'СКОПИРОВАТЬ СООБЩЕНИЕ' : 'COPY MESSAGE')}</button>
          {copyError && <p role="status" className="text-xs text-rrc-off">{ru ? 'Выделили текст. Скопируйте его вручную.' : 'Text selected. Copy it manually.'}</p>}
          {longMessage && siteConfig.telegram && <p className="text-sm text-rrc-off">{ru ? 'Сообщение длинное. Скопируйте текст и отправьте его в Telegram частями.' : 'This is a long message. Copy the text and send it in Telegram in parts.'}</p>}
          {siteConfig.telegram && <a href={longMessage ? telegramUrl : `${telegramUrl}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={buttonClass}>{ru ? 'ОТКРЫТЬ TELEGRAM' : 'OPEN TELEGRAM'}</a>}
          {siteConfig.email && <a href={`mailto:${siteConfig.email}?subject=${encodeURIComponent('RRC — order enquiry')}&body=${encodeURIComponent(message)}`} className="block text-center text-t-ui uppercase tracking-widest py-3">{ru ? 'ОТПРАВИТЬ ПИСЬМО' : 'OPEN EMAIL'}</a>}
          {!hasContact && <p className="text-sm text-rrc-off">{ru ? 'Приём заявок откроется после публикации контакта бренда. Сохраните сообщение; выбранные изделия остаются в корзине.' : 'Enquiries will open once the brand contact is published. Save your message; your items remain in the bag.'}</p>}
        </section>}
      </div>
      <aside className="lg:col-span-1"><div className="bg-rrc-coal p-6 sticky top-24 border border-rrc-line"><h2 className="font-display text-lg uppercase mb-6">{ru ? 'ВАШ ВЫБОР' : 'YOUR SELECTION'}</h2><ul className="space-y-4 mb-6">{selected.map(item => <li key={item.variantId} className="text-sm"><Link href={`/product/${item.slug}`}>{item.name}</Link><p className="text-rrc-off mt-1">{colorName(item.color, language)}{` / ${selectedSizeLabel(item, language)}`} × {item.quantity}</p></li>)}</ul><CartSummary items={selected}/><p className="text-xs text-rrc-off">{ru ? `PRE-ORDER: до ${productionPolicy.workingDays} рабочих дней, доставка отдельно.` : `PRE-ORDER: up to ${productionPolicy.workingDays} working days; shipping is additional.`}</p></div></aside>
    </div>
  </div></div>;
}
