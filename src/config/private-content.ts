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
    description: "Отдельные выпуски для Внутреннего круга.",
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
