'use client';
import {InfoPage} from '@/components/layout/InfoPage';
import {preorderTerms} from '@/config/site';
import Link from 'next/link';
import {useLanguage} from '@/i18n';
export default function DeliveryPage() {
 const {language} = useLanguage(); const ru = language === 'ru';
 return <InfoPage title={['ДОСТАВКА И ВОЗВРАТ','SHIPPING AND RETURNS']} sections={[
 {title:['ДОСТАВКА','SHIPPING'],paragraphs:[['Отправляем из Малаховки. Доставка оплачивается по тарифу выбранного перевозчика; стоимость зависит от адреса или ПВЗ, веса и габаритов посылки. Стоимость и срок подтвердим до оплаты.','Orders ship from Malakhovka. Delivery is charged at the selected carrier’s tariff and depends on the address or pickup point, parcel weight and dimensions. Cost and transit time are confirmed before payment.'],['В запросе можно указать предпочтение: СДЭК или Почта России. Международная доставка — по согласованию. Срок перевозки не входит в срок изготовления.','Specify your preferred carrier in the enquiry: CDEK or Russian Post. International shipping is arranged individually. Transit time is separate from production time.']]},
 {title:['ПРЕДЗАКАЗ','PRE-ORDER'],paragraphs:[[preorderTerms('ru'),preorderTerms('en')],['Размер и посадку необходимо согласовать до оплаты.','Size and fit must be agreed before payment.']]},
 {title:['КАК ЗАКАЗАТЬ','HOW TO ORDER'],paragraphs:[['Выберите изделия, цвет и доступный размер. В корзине отметьте нужные позиции и подготовьте сообщение для бренда. Отправьте его в Telegram; после согласования мы сообщим порядок оплаты.','Choose your items, colour and available size. Select the relevant items in your bag and prepare a message for the brand. Send it in Telegram; after confirmation, we will provide payment instructions.'],['Добавление в корзину и подготовка сообщения не резервируют изделие.','Adding an item to your bag or preparing a message does not reserve it.']]},
 {title:['РАЗМЕР И ПОСАДКА','SIZE AND FIT'],paragraphs:[['Если размерная сетка не опубликована, напишите свои мерки в комментарии к запросу. Посадку согласуем до изготовления или отправки.','If a size chart is not published, include your measurements in the enquiry note. Fit is agreed before production or dispatch.']]},
 {title:['ВОЗВРАТ И ОБМЕН','RETURNS AND EXCHANGES'],paragraphs:[['Для вопроса о возврате или обмене свяжитесь с брендом, укажите изделие и дату покупки. Условия для конкретного изделия, включая индивидуальный пошив, уточняются до оплаты с учётом применимых требований.','For a return or exchange enquiry, contact the brand with the item and purchase date. Terms for the specific item, including custom production, are confirmed before payment under applicable requirements.']]}
 ]}><Link href="/contacts" className="inline-block text-t-ui uppercase tracking-widest border border-rrc-line px-6 py-3">{ru ? 'СВЯЗАТЬСЯ С БРЕНДОМ' : 'CONTACT THE BRAND'}</Link></InfoPage>;
}
