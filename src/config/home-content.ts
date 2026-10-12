// Campaign content configuration for RRC homepage
// Edit this file to update hero slides and editorial images

export interface HeroSlide {
  id: string;
  // Desktop image path (required)
  desktopImage: string;
  // Mobile image path (optional - if not provided, desktop image is used with object-fit cover)
  mobileImage?: string;
  // Focal point positioning (percentages)
  desktopObjectPosition?: string; // e.g., 'center 40%'
  mobileObjectPosition?: string;  // e.g., 'center 35%'
  // Alt text for accessibility
  altRu: string;
  altEn: string;
  // Optional overlay text
  headingRu?: string;
  headingEn?: string;
  captionRu?: string;
  captionEn?: string;
  // Link destination
  linkHref?: string;
}

export interface EditorialImage {
  id: string;
  desktopImage: string;
  mobileImage?: string;
  desktopObjectPosition?: string;
  mobileObjectPosition?: string;
  altRu: string;
  altEn: string;
  linkHref?: string;
}

export const HOME_CONTENT = {
  heroSlides: [
    {
      id: 'slide-1',
      desktopImage: '/images/home/hero.webp',
      mobileImage: '/images/home/hero.webp',
      desktopObjectPosition: 'center 40%',
      mobileObjectPosition: 'center 35%',
      altRu: 'Новая коллекция RICHRUSSIANCOMMUNITY',
      altEn: 'RICHRUSSIANCOMMUNITY new collection',
      captionRu: 'ОСЕНЬ — ЗИМА 2026',
      captionEn: 'FALL / WINTER 2026',
      linkHref: '/shop',
    } as HeroSlide,
    // Add more slides here by copying the structure above
    // Example:
    // {
    //   id: 'slide-2',
    //   desktopImage: '/images/campaigns/slide-2.jpg',
    //   mobileImage: '/images/campaigns/slide-2-mobile.jpg',
    //   desktopObjectPosition: 'center 50%',
    //   mobileObjectPosition: 'center 45%',
    //   altRu: 'Описание на русском',
    //   altEn: 'Description in English',
    //   captionRu: 'Подпись на русском',
    //   captionEn: 'Caption in English',
    //   linkHref: '/collections',
    // }
  ],

  editorial: {
    mirrorScene: {
      id: 'editorial-mirror',
      desktopImage: '/images/campaigns/editorial-mirror.jpg',
      mobileImage: '/images/campaigns/editorial-mirror.jpg',
      desktopObjectPosition: 'center 60%',
      mobileObjectPosition: 'center 55%',
      altRu: 'Редакционный кадр с зеркалом',
      altEn: 'Editorial mirror scene',
      linkHref: '/collections',
    } as EditorialImage,
  },
};

// Helper to get slide count
export function getHeroSlideCount(): number {
  return HOME_CONTENT.heroSlides.length;
}

// Helper to check if carousel should be rendered (more than 1 slide)
export function shouldRenderCarousel(): boolean {
  return HOME_CONTENT.heroSlides.length > 1;
}
