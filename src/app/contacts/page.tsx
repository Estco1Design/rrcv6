'use client';
import {InfoPage} from '@/components/layout/InfoPage';
import {siteConfig, telegramUrl, channelUrl, sellerConfig} from '@/config/site';
import {useLanguage} from '@/i18n';
export default function ContactsPage() {
 const {language} = useLanguage(); const ru = language === 'ru';
 return <InfoPage title={['КОНТАКТЫ','CONTACTS']} sections={[{title:['СВЯЗАТЬСЯ С RRC','CONTACT RRC'],paragraphs:[['По вопросам изделий, размеров, индивидуального пошива и сотрудничества используйте контакты ниже.','For items, sizing, custom production and collaborations, use the contacts below.']]}]}>
 <div className="space-y-4 text-rrc-off">
 {telegramUrl && <p>{ru ? 'Заказы и поддержка' : 'Orders and support'}: <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="text-rrc-white underline">@{siteConfig.telegram}</a></p>}
 <p>{ru ? 'Канал бренда' : 'Brand channel'}: <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="text-rrc-white underline">@{siteConfig.channel}</a></p>
 <div className="pt-4 border-t border-rrc-line"><p className="mb-3">{ru ? 'Команда — личные обращения' : 'Team — personal enquiries'}</p>{siteConfig.team.map(handle=><p key={handle} className="mb-2"><a href={`https://t.me/${handle}`} target="_blank" rel="noopener noreferrer" className="text-rrc-white underline">@{handle}</a></p>)}</div>
 {siteConfig.email && <p>Email: <a href={`mailto:${siteConfig.email}`} className="text-rrc-white underline">{siteConfig.email}</a></p>}
 {siteConfig.vk && <p>VK: <a href={siteConfig.vk} target="_blank" rel="noopener noreferrer" className="text-rrc-white underline">VK</a></p>}
 <div className="border-t border-rrc-line pt-4"><p>{ru?'Реквизиты ИП':'Sole proprietor details'}</p><p className="mt-2">ИНН {sellerConfig.inn}</p><p>ОГРНИП {sellerConfig.ogrnip}</p></div>
 {!telegramUrl && !siteConfig.email && !siteConfig.vk && <p>{ru ? 'Контакт для заявок скоро появится. Пока можно сохранить выбранные изделия в корзине.' : 'The enquiry contact will be published soon. You can save your selected items in the bag.'}</p>}
 </div></InfoPage>;
}
