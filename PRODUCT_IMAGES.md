# Product Images Guide - RICHRUSSIANCOMMUNITY

## Overview

This document explains how product images are organized, how to add new ones, and which images are currently available.

## Image Generation Status

**✅ COMPLETED:** 48 demo product images have been generated using Pillow (Python imaging library).

- **Total images created:** 48 JPEG files
- **Products covered:** 12 products across all categories
- **Views per product:** 4 distinct views (front, back, detail, model/styled)

These are **provisional demo images** - stylized geometric representations of each garment type with appropriate colors and basic design elements. They serve as functional placeholders until real product photography is provided.

---

## Directory Structure

Product images are stored in:

```
public/images/product/
├── hoodies/
│   ├── signature-hoodie-black.jpg        (front view)
│   ├── signature-hoodie-black-back.jpg   (back view)
│   ├── signature-hoodie-black-detail.jpg (detail/close-up)
│   └── signature-hoodie-black-model.jpg  (styled/model view)
├── zipups/
│   ├── crown-zipup-bordeaux.jpg
│   ├── crown-zipup-bordeaux-back.jpg
│   ├── crown-zipup-bordeaux-detail.jpg
│   └── crown-zipup-bordeaux-model.jpg
├── tees/
│   ├── eagle-tee-white.jpg
│   ├── eagle-tee-white-back.jpg
│   ├── eagle-tee-white-detail.jpg
│   ├── eagle-tee-white-model.jpg
│   ├── basic-tee-black.jpg
│   ├── basic-tee-black-back.jpg
│   ├── basic-tee-black-detail.jpg
│   └── basic-tee-black-model.jpg
├── longsleeves/
│   ├── community-longsleeve-grey.jpg
│   ├── community-longsleeve-grey-back.jpg
│   ├── community-longsleeve-grey-detail.jpg
│   └── community-longsleeve-grey-model.jpg
├── pants/
│   ├── 2026-sweatpants-black.jpg
│   ├── 2026-sweatpants-black-back.jpg
│   ├── 2026-sweatpants-black-detail.jpg
│   └── 2026-sweatpants-black-model.jpg
├── outerwear/
│   ├── metallic-puffer.jpg
│   ├── metallic-puffer-back.jpg
│   ├── metallic-puffer-detail.jpg
│   ├── metallic-puffer-model.jpg
│   ├── limited-bomber.jpg
│   ├── limited-bomber-back.jpg
│   ├── limited-bomber-detail.jpg
│   ├── limited-bomber-model.jpg
│   ├── tech-vest.jpg
│   ├── tech-vest-back.jpg
│   ├── tech-vest-detail.jpg
│   └── tech-vest-model.jpg
└── accessories/
    ├── heritage-cap.jpg
    ├── heritage-cap-back.jpg
    ├── heritage-cap-detail.jpg
    ├── heritage-cap-model.jpg
    ├── winter-scarf.jpg
    ├── winter-scarf-back.jpg
    ├── winter-scarf-detail.jpg
    └── winter-scarf-model.jpg
```

---

## How to Connect Four Images to a Product

### Step 1: Add Product Entry in data.ts

In `src/lib/data.ts`, ensure your product slug is in the `PRODUCT_IMAGES` object:

```typescript
const PRODUCT_IMAGES = {
  "your-product-slug": "/images/product/category/your-product-slug",
  // ... other products
};
```

### Step 2: Naming Convention

For a product with slug `your-product-slug`, create these 4 files:

| View | Filename | Purpose |
|------|----------|---------|
| Front | `your-product-slug.jpg` | Main/primary image |
| Back | `your-product-slug-back.jpg` | Rear view |
| Detail | `your-product-slug-detail.jpg` | Close-up of fabric, logo, or construction |
| Model | `your-product-slug-model.jpg` | Styled view showing how it looks worn |

### Step 3: Automatic Gallery Connection

The `getProductImages()` function in `src/lib/data.ts` automatically builds the image array:

```typescript
function getProductImages(slug: string): string[] {
  const basePath = PRODUCT_IMAGES[slug as keyof typeof PRODUCT_IMAGES];
  if (!basePath) {
    return [PLACEHOLDER_IMAGE];
  }

  return [
    `${basePath}.jpg`,           // Front view (main)
    `${basePath}-back.jpg`,      // Back view
    `${basePath}-detail.jpg`,    // Detail/close-up
    `${basePath}-model.jpg`,     // Model/styled view
  ];
}
```

---

## Image Order Configuration

Images are always returned in this fixed order:
1. **Index 0** - Front view (displayed first on product cards and as main gallery image)
2. **Index 1** - Back view
3. **Index 2** - Detail view
4. **Index 3** - Model/styled view

To change the order, modify the array returned by `getProductImages()`.

---

## Color Variant Associations

Currently, all color variants of a product share the same image set. To implement variant-specific images:

1. Create separate image sets for each color variant
2. Use a naming convention like: `your-product-slug-{color}.jpg`
3. Modify `getProductImages()` to accept a color parameter
4. Update the ProductGallery component to receive variant-specific images

Example:
```typescript
function getProductImages(slug: string, color?: string): string[] {
  const baseSlug = color ? `${slug}-${color}` : slug;
  const basePath = PRODUCT_IMAGES[baseSlug as keyof typeof PRODUCT_IMAGES];
  // ... rest of logic
}
```

---

## Alt Text (RU/EN)

The ProductGallery component supports bilingual alt text:

```tsx
<ProductGallery
  images={product.images}
  altText={{
    ru: ["Вид спереди", "Вид сзади", "Деталь", "На модели"],
    en: ["Front view", "Back view", "Detail", "Styled look"]
  }}
  productName={product.name}
/>
```

---

## Current Demo Images Summary

| Category | Products | Images |
|----------|----------|--------|
| Hoodies | signature-hoodie-black, archival-hoodie | 8 |
| Zipups | crown-zipup-bordeaux | 4 |
| Tees | eagle-tee-white, basic-tee-black | 8 |
| Longsleeves | community-longsleeve-grey | 4 |
| Pants | 2026-sweatpants-black | 4 |
| Outerwear | metallic-puffer, limited-bomber, tech-vest | 12 |
| Accessories | heritage-cap, winter-scarf | 8 |
| **Total** | **12 products** | **48 images** |

---

## Placeholder Handling

If an image fails to load:
- The ProductGallery component falls back to `/images/product-placeholder.svg`
- Missing images do NOT trigger retry loops
- Error state resets when image source changes
- A styled SVG placeholder displays with RRC branding

---

## Replacing Demo Images with Real Photography

When real product photos become available:

1. Keep the same filenames and directory structure
2. Replace the generated JPEG files with your photographs
3. Ensure images are optimized for web (recommended: 800x1000px, ~50-150KB each)
4. Maintain consistent lighting and background across all 4 views
5. Test that all gallery features work (thumbnails, zoom, swipe, autoplay)

---

## Verification Checklist

After adding or replacing images, verify:

- [ ] All 4 views exist for each product
- [ ] Filenames match the naming convention exactly
- [ ] Images are valid JPEG format (not renamed PNGs or SVGs)
- [ ] File sizes are web-optimized (< 200KB recommended)
- [ ] Homepage hero displays correctly
- [ ] Shop page product cards show images
- [ ] Product detail page gallery works (thumbnails, arrows, zoom, swipe)
- [ ] Cart thumbnails display correctly
- [ ] Favorites page shows images
- [ ] No 404 errors in browser console

---

## Notes

- Demo images were generated programmatically using Pillow
- These are **functional placeholders**, not actual product photography
- Each demo image is distinct (front, back, detail, model views differ visually)
- Garment shapes are category-appropriate (hoodies, tees, pants, outerwear, accessories)
- Colors match the product specifications in data.ts
- All images include "RRC" branding watermark

---

**Last Updated:** Generated 48 demo images for 12 products
**Status:** ✅ Functional demo images in place
