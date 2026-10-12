'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { HOME_CONTENT, shouldRenderCarousel, getHeroSlideCount } from '@/config/home-content';
import { useLanguage } from '@/i18n';
import Link from 'next/link';
import Image from 'next/image';

export function HeroCarousel() {
  const { t, language } = useLanguage();
  const slides = HOME_CONTENT.heroSlides;
  const isCarousel = shouldRenderCarousel();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: isCarousel,
    containScroll: 'trimSnaps',
    dragFree: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityRef = useRef<boolean>(true);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const onScroll = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onScroll);
    emblaApi.on('reInit', onScroll);

    return () => {
      emblaApi.off('select', onScroll);
      emblaApi.off('reInit', onScroll);
    };
  }, [emblaApi, onScroll]);

  const startAutoplay = useCallback(() => {
    if (prefersReducedMotion || userInteracted || !isCarousel) return;
    
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }
    
    autoplayRef.current = setInterval(() => {
      if (visibilityRef.current && !isPaused && emblaApi && !userInteracted) {
        emblaApi.scrollNext();
      }
    }, 6000);
  }, [prefersReducedMotion, userInteracted, isCarousel, isPaused, emblaApi]);

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  // Visibility change handler - pause when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      visibilityRef.current = document.visibilityState === 'visible';
      if (!visibilityRef.current) {
        stopAutoplay();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [stopAutoplay]);


  // Start autoplay on mount
  useEffect(() => {
    if (!prefersReducedMotion && isCarousel) {
      startAutoplay();
    }
    return () => stopAutoplay();
  }, [prefersReducedMotion, isCarousel, startAutoplay, stopAutoplay]);

  // Pause on hover/focus
  const handleMouseEnter = () => {
    setIsPaused(true);
    stopAutoplay();
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    if (!userInteracted && !prefersReducedMotion && isCarousel) {
      startAutoplay();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      emblaApi?.scrollPrev();
      setUserInteracted(true);
      stopAutoplay();
    } else if (e.key === 'ArrowRight') {
      emblaApi?.scrollNext();
      setUserInteracted(true);
      stopAutoplay();
    } else if (e.key === ' ') {
      e.preventDefault();
      if (isPaused) {
        setIsPaused(false);
        if (!userInteracted && !prefersReducedMotion) {
          startAutoplay();
        }
      } else {
        setIsPaused(true);
        stopAutoplay();
      }
    }
  };

  const scrollTo = (index: number) => {
    if (emblaApi) {
      emblaApi.scrollTo(index);
      setUserInteracted(true);
      stopAutoplay();
    }
  };

  const togglePlayPause = () => {
    if (isPaused) {
      setIsPaused(false);
      if (!prefersReducedMotion) {
        startAutoplay();
      }
    } else {
      setIsPaused(true);
      stopAutoplay();
    }
    setUserInteracted(true);
  };

  const scrollPrev = () => {
    if (emblaApi) {
      emblaApi.scrollPrev();
      setUserInteracted(true);
      stopAutoplay();
    }
  };

  const scrollNext = () => {
    if (emblaApi) {
      emblaApi.scrollNext();
      setUserInteracted(true);
      stopAutoplay();
    }
  };

  // Single slide - render static hero
  if (!isCarousel && slides.length === 1) {
    const slide = slides[0];
    const currentLang = language === 'ru' ? 'Ru' : 'En';
    
    return (
      <section className="relative h-screen overflow-hidden bg-rrc-black">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={slide.desktopImage}
            alt={currentLang === 'Ru' ? slide.altRu : slide.altEn}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            style={{ objectPosition: slide.desktopObjectPosition || 'center center' }}
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* Reduced opacity overlay */}
        <div className="absolute inset-0 z-1 bg-gradient-to-b from-rrc-black/30 via-rrc-black/5 to-rrc-black/40" />
        
        {/* Local darkening under interface */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-rrc-black/60 to-transparent z-2" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-rrc-black/70 to-transparent z-2" />

        {/* Content */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4">
          <div className={`transition-all duration-1000 ease-out ${imageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Season tag */}
            <p className="text-t-micro text-rrc-silver tracking-[0.25em] opacity-80 text-center mb-4 md:mb-6">
              {currentLang === 'Ru' ? slide.captionRu : slide.captionEn}
            </p>
            
            {/* Brand name */}
            <h2 className="font-display text-lg md:text-xl font-light tracking-[0.2em] text-rrc-white mb-4 text-center">
              RICHRUSSIANCOMMUNITY
            </h2>
            
            {/* CTA Button */}
            {slide.linkHref && (
              <Link href={slide.linkHref}>
                <button className="group relative inline-flex items-center justify-center px-8 md:px-10 py-4 md:py-4 text-[11px] md:text-[12px] font-mono tracking-[0.2em] uppercase bg-transparent text-rrc-white border border-rrc-white/40 overflow-hidden transition-all duration-500 hover:border-rrc-wine/60">
                  <span className="relative z-10 flex items-center gap-3">
                    {t.hero.viewCollection}
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Compact Navigation - полностью прозрачная, без фона */}
        <div className={`absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 md:px-8 py-5 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <Link href="/shop" className="text-t-ui tracking-widest text-rrc-white/70 hover:text-rrc-white transition-colors text-[10px] md:text-[11px]">
            {t.navigation.shop}
          </Link>
          {/* Убрали центральный RRC - он дублируется в Header */}
          <div className="w-8" /> {/* Пустой spacer для сохранения баланса */}
          <Link href="/collections" className="text-t-ui tracking-widest text-rrc-white/70 hover:text-rrc-white transition-colors text-[10px] md:text-[11px]">
            {language === 'ru' ? 'КОЛЛЕКЦИЯ' : 'COLLECTION'}
          </Link>
        </div>
      </section>
    );
  }

  // Multiple slides - render carousel
  return (
    <section 
      className="relative h-screen overflow-hidden bg-rrc-black"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Campaign carousel"
    >
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .slide-fade {
          animation: fadeIn 0.9s ease-in-out;
        }
      `}</style>

      <div className="absolute inset-0 z-0" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, index) => {
            const currentLang = language === 'ru' ? 'Ru' : 'En';
            const isActive = index === selectedIndex;
            
            return (
              <div 
                key={slide.id}
                className="relative min-w-0 flex-[0_0_100%] h-full"
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${slides.length}`}
              >
                <div className={`absolute inset-0 transition-opacity duration-900 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                  <Image
                    src={slide.desktopImage}
                    alt={currentLang === 'Ru' ? slide.altRu : slide.altEn}
                    fill
                    priority={index === 0}
                    className="object-cover"
                    sizes="100vw"
                    style={{ objectPosition: slide.desktopObjectPosition || 'center center' }}
                    onLoad={() => index === 0 && setImageLoaded(true)}
                  />
                </div>
                
                {/* Overlay gradient */}
                <div className={`absolute inset-0 bg-gradient-to-b from-rrc-black/30 via-rrc-black/5 to-rrc-black/40 transition-opacity duration-900 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Local darkening */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-rrc-black/60 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-rrc-black/70 to-transparent z-10 pointer-events-none" />

      {/* Content Overlay - stable while images change */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 pointer-events-none">
        <div className={`transition-all duration-1000 ease-out ${imageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Season tag - uses first slide caption */}
          <p className="text-t-micro text-rrc-silver tracking-[0.25em] opacity-80 text-center mb-4 md:mb-6">
            {language === 'ru' ? slides[0].captionRu : slides[0].captionEn}
          </p>
          
          {/* Brand name */}
          <h2 className="font-display text-lg md:text-xl font-light tracking-[0.2em] text-rrc-white mb-4 text-center">
            RICHRUSSIANCOMMUNITY
          </h2>
          
          {/* CTA Button */}
          {slides[0].linkHref && (
            <Link href={slides[0].linkHref} className="pointer-events-auto">
              <button className="group relative inline-flex items-center justify-center px-8 md:px-10 py-4 md:py-4 text-[11px] md:text-[12px] font-mono tracking-[0.2em] uppercase bg-transparent text-rrc-white border border-rrc-white/40 overflow-hidden transition-all duration-500 hover:border-rrc-wine/60">
                <span className="relative z-10 flex items-center gap-3">
                  {t.hero.viewCollection}
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Compact Navigation - полностью прозрачная, без фона */}
      <div className={`absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 md:px-8 py-5 pointer-events-auto ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <Link href="/shop" className="text-t-ui tracking-widest text-rrc-white/70 hover:text-rrc-white transition-colors text-[10px] md:text-[11px]">
          {t.navigation.shop}
        </Link>
        {/* Убрали центральный RRC - он дублируется в Header */}
        <div className="w-8" /> {/* Пустой spacer для сохранения баланса */}
        <Link href="/collections" className="text-t-ui tracking-widest text-rrc-white/70 hover:text-rrc-white transition-colors text-[10px] md:text-[11px]">
          {language === 'ru' ? 'КОЛЛЕКЦИЯ' : 'COLLECTION'}
        </Link>
      </div>

      {/* Navigation buttons */}
      {isCarousel && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 text-rrc-white/60 hover:text-rrc-white transition-colors pointer-events-auto"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 text-rrc-white/60 hover:text-rrc-white transition-colors pointer-events-auto"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Slide indicators */}
      {isCarousel && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`transition-all duration-300 pointer-events-auto ${
                index === selectedIndex 
                  ? 'w-8 h-[2px] bg-rrc-white' 
                  : 'w-4 h-[2px] bg-rrc-white/40 hover:bg-rrc-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === selectedIndex ? 'true' : undefined}
            />
          ))}
        </div>
      )}

      {/* Play/Pause button */}
      {isCarousel && (
        <button
          onClick={togglePlayPause}
          className="absolute bottom-8 right-8 z-30 p-2 text-rrc-white/60 hover:text-rrc-white transition-colors pointer-events-auto"
          aria-label={isPaused ? 'Play autoplay' : 'Pause autoplay'}
        >
          {isPaused ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          )}
        </button>
      )}
    </section>
  );
}
