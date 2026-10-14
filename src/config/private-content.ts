export const privateSections = [
  {
    slug: "early-access",
    ru: "Ранний доступ",
    en: "Early access",
    description: "Первые кадры из цеха и будущие релизы.",
  },
  {
    slug: "private-drops",
    ru: "Закрытые дропы",
    en: "Private drops",
    description: "Отдельные выпуски для PRIVATE ACCESS.",
  },
  {
    slug: "preorder",
    ru: "Предзаказ",
    en: "Preorder",
    description: "Силуэт, размер и изготовление — в диалоге с RRC.",
  },
  {
    slug: "rewards",
    ru: "Привилегии",
    en: "Member services",
    description: "Консультация по посадке, стилизация и уход.",
  },
  {
    slug: "archive",
    ru: "Архив",
    en: "Archive",
    description: "Ранее выпущенные изделия и возможность повторения.",
  },
] as const;
export type PrivateSection = (typeof privateSections)[number]["slug"];
export type PrivateRelease = {
  id: string;
  title: string;
  description: string;
  images: string[];
};
/** Add owner-approved workshop photos to var/private-media/<release-id>/ (ignored, retained outside builds).
 * Use /api/private-media/<release-id>/photo.jpg in images: this route checks the circle session.
 * Do not invent release dates, availability or prices. Empty arrays render useful workshop empty states.
 * Public static files are suitable only for photos already approved for public access.
 */
export const earlyAccessReleases: PrivateRelease[] = [];
export const privateDropReleases: PrivateRelease[] = [];

export const privatePrivileges=[
 {id:'gifts',ru:'Подарки для своих',en:'Community gifts',descriptionRu:'Специальные подарки и небольшие сюрпризы для закрытого комьюнити. Условия каждого анонса появятся здесь.',descriptionEn:'Special gifts and small surprises for the private community. Each announcement will include its own terms.'},
 {id:'insights',ru:'Изнутри цеха',en:'Inside the atelier',descriptionRu:'Первые фотографии, эскизы, детали материалов и решения, которые остаются за кадром.',descriptionEn:'First photographs, sketches, material details and decisions behind the finished piece.'},
 {id:'designs',ru:'Не для открытого каталога',en:'Beyond the public catalogue',descriptionRu:'Дизайны и отдельные выпуски, которые будут доступны только здесь. Публикуем реальные изделия после утверждения.',descriptionEn:'Designs and separate releases intended for this space. Actual pieces appear after approval.'},
 {id:'dialogue',ru:'Прямой разговор',en:'Direct dialogue',descriptionRu:'Обсуждения идей, материалов и будущих вещей. Можно задавать вопросы и оставлять обратную связь команде.',descriptionEn:'Discuss ideas, materials and future pieces. Ask questions and share feedback with the team.'},
 {id:'personal',ru:'Личное внимание',en:'Personal attention',descriptionRu:'Индивидуальные советы по посадке, сочетаниям и уходу. Поддержка рассматривает каждый запрос отдельно.',descriptionEn:'Individual guidance on fit, styling and care. The team considers each enquiry personally.'},
 {id:'shows',ru:'Приглашения',en:'Invitations',descriptionRu:'Анонсы показов, встреч и закрытых событий. Даты, места и подтверждение участия — после объявления мероприятия.',descriptionEn:'Show, meetup and private-event announcements. Dates, places and attendance confirmation follow each event announcement.'},
] as const;
