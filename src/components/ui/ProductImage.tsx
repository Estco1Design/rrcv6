'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface ProductImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

const PLACEHOLDER_IMAGE = '/images/product-placeholder.svg';

export function ProductImage({ src, alt, sizes, className = '', priority = false }: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src || PLACEHOLDER_IMAGE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Сброс состояния при смене src
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
    setCurrentSrc(src || PLACEHOLDER_IMAGE);
  }, [src]);

  const handleError = () => {
    // Только если ещё не было ошибки и текущий src не заглушка
    if (!hasError && currentSrc !== PLACEHOLDER_IMAGE && currentSrc !== src) {
      setHasError(true);
      setCurrentSrc(PLACEHOLDER_IMAGE);
    } else if (!hasError && currentSrc === src) {
      // Первая ошибка - пробуем заглушку
      setHasError(true);
      setCurrentSrc(PLACEHOLDER_IMAGE);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      className={`object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      sizes={sizes}
      quality={72}
      onError={handleError}
      onLoad={handleLoad}
      priority={priority}
      style={{ objectFit: 'cover' }}
    />
  );
}
