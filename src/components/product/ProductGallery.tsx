'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import useEmblaCarousel from 'embla-carousel-react';
import {DialogFocus} from '@/components/ui/DialogFocus';
import {useLanguage} from '@/i18n';
import {createPortal} from 'react-dom';
import {RemoveScroll} from 'react-remove-scroll';

interface ProductGalleryProps {
  images: string[];
  altText: {
    ru: string[];
    en: string[];
  };
  productName: string;
}

const PLACEHOLDER_IMAGE = '/images/product-placeholder.svg';

// Helper to get high-res image URL for PhotoSwipe
// Assumes images follow pattern: /images/.../file.jpg -> can use same URL or _highRes variant
const getHighResImage = (imageUrl: string): string => {
  // For Next.js Image optimization, we'll use the same URL but Photoswipe will handle it
  // In production, you could append a query param or use a different CDN URL
  return imageUrl;
};

export function ProductGallery({ images, altText, productName }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'center',
    watchDrag: true,
  });
  
  const galleryRef = useRef<HTMLDivElement>(null);

  const totalImages = Math.max(images.length, 1);
  const displayImages = useMemo(() => images.length > 0 ? images : [PLACEHOLDER_IMAGE], [images]);

  const {language} = useLanguage(); const isRussian = language === 'ru';

  const currentAlt = isRussian 
    ? (altText.ru?.[currentIndex] || altText.en?.[currentIndex] || productName)
    : (altText.en?.[currentIndex] || altText.ru?.[currentIndex] || productName);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {const next = (prev + 1) % totalImages; emblaApi?.scrollTo(next); return next;});
  }, [totalImages, emblaApi]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => {const next = (prev - 1 + totalImages) % totalImages; emblaApi?.scrollTo(next); return next;});
  }, [totalImages, emblaApi]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
    // Scroll embla to the selected thumbnail index
    if (emblaApi) {
      emblaApi.scrollTo(index);
    }
  }, [emblaApi]);

  // Sync Embla slide change with currentIndex
  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap());
    };
    
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isZoomed) {
        if (e.key === 'Escape') {
          setIsZoomed(false);
        }
        return;
      }
      
      if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomed, goToNext, goToPrevious]);

  const openZoom = () => {
    setIsZoomed(true);
  };

  const closeZoom = () => {
    setIsZoomed(false);
  };

  // Preload next and previous images
  useEffect(() => {
    const nextIdx = (currentIndex + 1) % totalImages;
    const prevIdx = (currentIndex - 1 + totalImages) % totalImages;
    
    [nextIdx, prevIdx].forEach((idx) => {
      const img = new (typeof window !== "undefined" ? window.Image : Object)() as HTMLImageElement;
      img.src = displayImages[idx];
    });
  }, [currentIndex, totalImages, displayImages]);

  return (
    <div className="relative" ref={galleryRef}>
      {/* Main Image with Embla Carousel for mobile swipe */}
      <div 
        className="group relative aspect-[3/4] bg-rrc-panel overflow-hidden cursor-default"
        onClick={openZoom}
      >
        {/* Embla Carousel Viewport - used primarily on mobile for swipe */}
        <div className="h-full w-full md:hidden" ref={emblaRef}>
          <div className="flex h-full">
            {displayImages.map((img, idx) => (
              <div key={idx} className="relative min-w-full h-full flex-shrink-0">
                <Image
                  src={img}
                  alt={isRussian ? (altText.ru?.[idx] || altText.en?.[idx] || productName) : (altText.en?.[idx] || altText.ru?.[idx] || productName)}
                  fill
                  priority={idx === 0}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  className={cn(
                    "object-cover transition-opacity duration-300",
                    isLoading && idx === 0 ? "opacity-0" : "opacity-100"
                  )}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  quality={75}
                  onLoad={() => idx === 0 && setIsLoading(false)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.endsWith(PLACEHOLDER_IMAGE)) {target.srcset = ''; target.src = PLACEHOLDER_IMAGE;}
                    setIsLoading(false);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop View - Single image with keyboard nav */}
        <div className="hidden md:block relative h-full w-full">
          <Image
            src={displayImages[currentIndex]}
            alt={currentAlt}
            fill
            priority
            className={cn(
              "object-cover transition-transform duration-700 ease-out",
              isLoading ? "opacity-0 scale-105" : "opacity-100 scale-100"
            )}
            sizes="(max-width: 768px) 100vw, 50vw"
            onLoad={() => setIsLoading(false)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.endsWith(PLACEHOLDER_IMAGE)) {target.srcset = ''; target.src = PLACEHOLDER_IMAGE;}
              setIsLoading(false);
            }}
          />
        </div>

        {/* Image Counter */}
        <div className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-rrc-black/70 text-t-micro text-rrc-white tracking-widest">
          {String(currentIndex + 1).padStart(2, '0')} / {String(totalImages).padStart(2, '0')}
        </div>

        {/* Navigation Arrows (desktop) */}
        {totalImages > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-rrc-black/70 hover:bg-rrc-wine/90 text-rrc-white opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:block"
              aria-label={isRussian ? "Предыдущее фото" : "Previous image"}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-rrc-black/70 hover:bg-rrc-wine/90 text-rrc-white opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:block"
              aria-label={isRussian ? "Следующее фото" : "Next image"}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {images.length === 0 && <p className="text-t-micro text-rrc-off text-center uppercase mt-3">{isRussian ? 'Фотографии этого цвета скоро появятся' : 'Photos of this colour are coming soon'}</p>}
      {/* Thumbnails */}
      {totalImages > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => goToIndex(idx)}
              className={cn(
                "relative flex-shrink-0 w-20 h-24 md:w-24 md:h-32 overflow-hidden bg-rrc-panel transition-all duration-200",
                currentIndex === idx 
                  ? "ring-2 ring-rrc-wine ring-offset-2 ring-offset-rrc-black" 
                  : "ring-1 ring-rrc-line hover:ring-rrc-white/50"
              )}
              aria-label={`View image ${idx + 1}`}
              aria-current={currentIndex === idx ? 'true' : 'false'}
            >
              <Image
                src={img}
                alt={`${productName} - view ${idx + 1}`}
                fill
                className="object-cover"
                sizes="100px"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* PhotoSwipe Fullscreen Modal */}
      {isZoomed && (
        <PhotoSwipeModal
          images={displayImages}
          altText={altText}
          productName={productName}
          initialIndex={currentIndex}
          onClose={closeZoom}
          isRussian={isRussian}
        />
      )}
    </div>
  );
}

// PhotoSwipe Modal Component with pinch-to-zoom and high-res support
function PhotoSwipeModal({
  images,
  altText,
  productName,
  initialIndex,
  onClose,
  isRussian,
}: {
  images: string[];
  altText: { ru: string[]; en: string[] };
  productName: string;
  initialIndex: number;
  onClose: () => void;
  isRussian: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartDist = useRef<number>(0);
  const initialScale = useRef<number>(1);
  const currentScale = useRef<number>(1);
  const isPinching = useRef<boolean>(false);
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const panOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const totalImages = images.length;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalImages);
    resetTransform();
  }, [totalImages]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
    resetTransform();
  }, [totalImages]);

  const resetTransform = () => {
    currentScale.current = 1;
    panOffset.current = { x: 0, y: 0 };
    const img = containerRef.current?.querySelector('img');
    if (img) {
      img.style.transform = 'scale(1) translate(0px, 0px)';
      img.style.transition = 'transform 0.3s ease-out';
    }
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const img = containerRef.current?.querySelector('img');
    if (!img) return;

    const delta = e.deltaY * -0.01;
    const newScale = Math.min(Math.max(1, currentScale.current + delta), 4);
    
    currentScale.current = newScale;
    img.style.transition = 'none';
    img.style.transform = `scale(${newScale}) translate(${panOffset.current.x}px, ${panOffset.current.y}px)`;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      isPinching.current = true;
      touchStartDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialScale.current = currentScale.current;
    } else if (e.touches.length === 1 && currentScale.current > 1) {
      // Pan start (only if zoomed in)
      panStart.current = {
        x: e.touches[0].clientX - panOffset.current.x,
        y: e.touches[0].clientY - panOffset.current.y,
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const img = containerRef.current?.querySelector('img');
    if (!img) return;

    if (isPinching.current && e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = Math.min(Math.max(1, initialScale.current * (currentDist / touchStartDist.current)), 4);
      currentScale.current = scale;
      img.style.transition = 'none';
      img.style.transform = `scale(${scale}) translate(${panOffset.current.x}px, ${panOffset.current.y}px)`;
    } else if (panStart.current && e.touches.length === 1 && currentScale.current > 1) {
      // Panning
      e.preventDefault();
      const newX = e.touches[0].clientX - panStart.current.x;
      const newY = e.touches[0].clientY - panStart.current.y;
      
      // Limit pan based on scale
      const maxPan = (currentScale.current - 1) * 200;
      panOffset.current = {
        x: Math.max(-maxPan, Math.min(maxPan, newX)),
        y: Math.max(-maxPan, Math.min(maxPan, newY)),
      };
      
      img.style.transition = 'none';
      img.style.transform = `scale(${currentScale.current}) translate(${panOffset.current.x}px, ${panOffset.current.y}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isPinching.current = false;
    panStart.current = null;
    
    // Snap back if zoomed out
    if (currentScale.current <= 1) {
      resetTransform();
    }
  }, []);

  // Keyboard navigation in fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goToNext, goToPrevious]);

  const currentAlt = isRussian 
    ? (altText.ru?.[currentIndex] || altText.en?.[currentIndex] || productName)
    : (altText.en?.[currentIndex] || altText.ru?.[currentIndex] || productName);

  const highResImage = getHighResImage(images[currentIndex]);

  return createPortal(
    <RemoveScroll><div role="dialog" aria-modal="true" aria-label={productName} 
      className="fixed inset-0 z-[150] bg-rrc-black/98 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <DialogFocus/>
      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-6 right-6 z-50 p-3 bg-rrc-black/70 hover:bg-rrc-wine/90 text-rrc-white transition-colors rounded-full"
        aria-label={isRussian ? "Закрыть фото" : "Close fullscreen"}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Image Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-full max-w-7xl max-h-[95vh] p-4 flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={highResImage}
          alt={currentAlt}
          fill
          className="object-contain transition-transform duration-200"
          sizes="95vw"
          priority
          quality={100}
          unoptimized={false}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.endsWith(PLACEHOLDER_IMAGE)) {target.srcset = ''; target.src = PLACEHOLDER_IMAGE;}
          }}
        />
      </div>

      {/* Navigation Arrows */}
      {totalImages > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-rrc-black/70 hover:bg-rrc-wine/90 text-rrc-white transition-colors rounded-full z-50"
            aria-label={isRussian ? "Предыдущее фото" : "Previous image"}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-rrc-black/70 hover:bg-rrc-wine/90 text-rrc-white transition-colors rounded-full z-50"
            aria-label={isRussian ? "Следующее фото" : "Next image"}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-rrc-black/70 text-t-ui text-rrc-white tracking-widest rounded-full z-50">
        {String(currentIndex + 1).padStart(2, '0')} / {String(totalImages).padStart(2, '0')}
      </div>

      {/* Thumbnail strip at bottom */}
      {totalImages > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-50 max-w-full overflow-x-auto px-4">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
                resetTransform();
              }}
              className={cn(
                "relative flex-shrink-0 w-12 h-16 overflow-hidden bg-rrc-panel transition-all duration-200",
                currentIndex === idx 
                  ? "ring-2 ring-rrc-wine" 
                  : "ring-1 ring-rrc-line opacity-60 hover:opacity-100"
              )}
              aria-label={`${isRussian ? "Фото" : "Image"} ${idx + 1}`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="50px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom hint */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-rrc-black/50 text-t-micro text-rrc-off tracking-wide rounded-full z-40 pointer-events-none">
        {isRussian ? 'МАСШТАБ: КОЛЕСО ИЛИ ДВА ПАЛЬЦА' : 'ZOOM: SCROLL OR PINCH'}
      </div>
    </div></RemoveScroll>, document.body
  );
}
