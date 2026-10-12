# 📐 ПОЛНАЯ СПЕЦИФИКАЦИЯ ИЗОБРАЖЕНИЙ RRC STORE

Где лежат файлы → что подгружается на каждой вкладке → какой размер и пропорции кадрировать.

Все пути относительные от корня проекта. В браузере `/images/...` = файл `public/images/...`.

---

## 1. ТОВАРЫ (вкладка «Магазин» / Shop, карточки, страница товара, корзина, избранное)

### Где подгружаются:
| Вкладка / экран | Файл кода | Что берёт |
|---|---|---|
| Магазин — сетка товаров | `src/app/shop/page.tsx` | `product.images[0]` (front) |
| Главная — блок «Featured» | `src/app/page.tsx` | `product.images[0]` (front) |
| Карточка товара — галерея | `src/components/product/ProductGallery.tsx` | все 4 ракурса + миниатюры |
| Страница товара (`/product/[slug]`) | `src/app/product/[slug]/ProductPageClient.tsx` | `images[0]` для шаринга/JSON-LD |
| Корзина (страница + drawer) | `src/app/cart/page.tsx`, `src/components/cart/CartDrawer.tsx` | миниатюра товара (front) |
| Избранное (drawer) | `src/components/favorites/FavoritesDrawer.tsx` | миниатюра товара (front) |
| Поиск | `src/app/search/page.tsx` | через ProductCard (front) |

Список slugs → путей: **`src/lib/data.ts`**, объект `PRODUCT_IMAGES`
Функция `getProductImages(slug)` сама собирает массив из 4 файлов:
`{база}.jpg`, `{база}-back.jpg`, `{база}-detail.jpg`, `{база}-model.jpg`

### Соотношение сторон (ВАЖНО):
- Контейнеры на сайте: `aspect-[3/4]` (карточки, главная, галерея десктоп),
  `aspect-[2/3]` (карточки магазина на десктопе ≥768px), миниатюры корзины `w-24 h-32` (= 3:4).
- **Кадрируйте все фото товаров в 3:4 (портрет).**
  На десктопе магазина обрежется сверху/снизу до 2:3 — держите объект по центру с запасом ~15% сверху и снизу.

### Пиксели (реальные размеры файла):
| Тип файла | Размер px | Пропорции | Вес |
|---|---|---|---|
| Main (front) `{slug}.jpg` | **1200 × 1600** | 3:4 | 150–300 KB |
| Back `{slug}-back.jpg` | **1200 × 1600** | 3:4 | 150–300 KB |
| Detail `{slug}-detail.jpg` | **1200 × 1600** | 3:4 | 150–300 KB |
| Model `{slug}-model.jpg` | **1200 × 1600** | 3:4 | 150–300 KB |

(Минимум — текущие 800×1000; рекомендую 1200×1600 — Next/Image отдаёт ресайзы.)

### Полный список файлов (48 шт., 12 товаров × 4 ракурса):

**Худи** `public/images/product/hoodies/`
- signature-hoodie-black.jpg / -back.jpg / -detail.jpg / -model.jpg
- archival-hoodie.jpg / -back.jpg / -detail.jpg / -model.jpg

**Зип-худи** `public/images/product/zipups/`
- crown-zipup-bordeaux.jpg / -back.jpg / -detail.jpg / -model.jpg

**Футболки** `public/images/product/tees/`
- eagle-tee-white.jpg / -back.jpg / -detail.jpg / -model.jpg
- basic-tee-black.jpg / -back.jpg / -detail.jpg / -model.jpg

**Лонгсливы** `public/images/product/longsleeves/`
- community-longsleeve-grey.jpg / -back.jpg / -detail.jpg / -model.jpg

**Брюки** `public/images/product/pants/`
- 2026-sweatpants-black.jpg / -back.jpg / -detail.jpg / -model.jpg

**Верхняя одежда** `public/images/product/outerwear/`
- metallic-puffer.jpg / -back.jpg / -detail.jpg / -model.jpg
- limited-bomber.jpg / -back.jpg / -detail.jpg / -model.jpg
- tech-vest.jpg / -back.jpg / -detail.jpg / -model.jpg

**Аксессуары** `public/images/product/accessories/`
- heritage-cap.jpg / -back.jpg / -detail.jpg / -model.jpg
- winter-scarf.jpg / -back.jpg / -detail.jpg / -model.jpg

⚠️ У аксессуаров (кепка, шарф) тоже кадрируйте 3:4 — контейнеры те же.

Порядок в галерее фиксирован: 0=front (главное), 1=back, 2=detail, 3=model.

---

## 2. ГЛАВНАЯ СТРАНИЦА — HERO-КАРУСЕЛЬ

### Где подгружается:
- Конфиг: **`src/config/home-content.ts`** → массив `heroSlides`
- Компонент: `src/components/home/HeroCarousel.tsx`
- Экран: `h-screen` (100vh), полноэкранный баннер на весь viewport

### Соотношение и пиксели:
| Слот | Desktop px | Mobile px | Пропорции | Вес |
|---|---|---|---|---|
| `desktopImage` | **1920 × 1080** (мин.), лучше 2560 × 1440 | — | 16:9 | ≤ 400 KB |
| `mobileImage` | — | **1080 × 1920** | 9:16 | ≤ 300 KB |

Если mobile-версии нет — desktop обрезается `object-cover` по `mobileObjectPosition`.
Текущий focal point: desktop `'center 40%'`, mobile `'center 35%'` — важное (лицо/логотип)
размещайте по вертикали примерно на 35–45% высоты кадра.

### Файлы:
- `public/images/campaigns/slide-1.jpg` ✅ есть (сейчас 1672×941, 2.5 MB — пересобрать!)
- Новый слайд: положить `slide-2.jpg` (+ `slide-2-mobile.jpg`) в `public/images/campaigns/`
  и добавить объект в `heroSlides` (id уникальный!). 1 слайд = статика, 2+ = карусель.

---

## 3. ГЛАВНАЯ СТРАНИЦА — НИЖНИЙ РЕДАКЦИОННЫЙ БЛОК (Mirror Scene)

- Конфиг: `src/config/home-content.ts` → `editorial.mirrorScene`
- Экран: `src/app/page.tsx`, блок высотой 60vh (mobile) / 80vh (desktop), object-cover
- Файл: `public/images/campaigns/editorial-mirror.jpg` ✅ есть (1536×1024, 2.2 MB)

| Параметр | Значение |
|---|---|
| Размер | **1920 × 1280** (или 1920×1080) |
| Пропорции | 3:2 |
| Focal point | `'center 60%'` — важное ниже центра кадра |
| Вес | ≤ 400 KB |

---

## 4. СТАРЫЙ HERO (HeroSection.tsx — legacy-компонент)

- Файл: `public/images/hero-collection.jpg` ✅ есть (1672×941, 2.9 MB)
- Используется только если рендерится `HeroSection` (основной хелпер сейчас — HeroCarousel).
- Те же требования: 1920×1080, 16:9, focal `center 40%`, ≤ 400 KB.

---

## 5. ВКЛАДКА «КОЛЛЕКЦИИ» (Collections)

### Где подгружается:
- Пути: **`src/lib/data.ts`** → объект `COLLECTION_IMAGES`
- Страница: `src/app/collections/page.tsx` (обёртка `<Link>` с классом
  `aspect-[4/3] md:aspect-square` — т.е. **на мобильном 4:3, на десктопе квадрат 1:1**)

### Соотношение (ВАЖНО):
**Кадрируйте 1:1 (квадрат)** — иначе на десктопе обрежется по краям.
Композицию держите по центру, важные элементы — внутри центральной безопасной зоны.

### Файлы и пиксели:
| Коллекция | Путь | Размер px | Пропорции | Вес |
|---|---|---|---|---|
| Осень/Зима 2026 | `public/images/collections/fall-2026.jpg` | **1600 × 1600** | 1:1 | ≤ 300 KB |
| Весна/Лето 2026 | `public/images/collections/spring-2026.jpg` | **1600 × 1600** | 1:1 | ≤ 300 KB |
| Архив | `public/images/collections/archive.jpg` | **1600 × 1600** | 1:1 | ≤ 300 KB |

❌ Папки `public/images/collections/` сейчас НЕТ — изображения не подгружаются (404 → заглушка).
Создайте: `mkdir -p public/images/collections` и положите 3 файла.

Страница `/collections/[slug]` показывает товары коллекции (из раздела 1), отдельного баннера нет.

---

## 6. МАГАЗИН — 3 КАТЕГОРИЙНЫЕ ПЛИТКИ (Current / Objects / Archive)

### Где подгружается:
- `src/app/shop/page.tsx` → объект `categoryImages` (строки 25–27)
- Сейчас все три указывают на несуществующий `/images/editorial/mirror-scene-desktop.jpg` ❌
- Контейнер: `aspect-[3/4] md:aspect-[2/3]` → **кадрируйте 3:4 (портрет)**

### Что сделать:
1. Создать папку: `mkdir -p public/images/editorial`
2. Положить 3 разных портретных баннера (можно временно один общий):

| Плитка | Рекомендуемый путь | Размер px | Пропорции | Вес |
|---|---|---|---|---|
| Current | `public/images/editorial/category-current.jpg` | **1200 × 1600** | 3:4 | ≤ 300 KB |
| Objects | `public/images/editorial/category-objects.jpg` | **1200 × 1600** | 3:4 | ≤ 300 KB |
| Archive | `public/images/editorial/category-archive.jpg` | **1200 × 1600** | 3:4 | ≤ 300 KB |

3. Прописать новые пути в `categoryImages` в `src/app/shop/page.tsx`
   (или просто назвать файлы `mirror-scene-desktop.jpg` — тогда код менять не нужно).

---

## 7. ЗАГЛУШКИ / ПРОЧЕЕ (заглушки)

| Файл | Статус | Назначение |
|---|---|---|
| `public/images/product-placeholder.svg` | ✅ есть | fallback в ProductImage/ProductGallery (SVG, тянется) |
| `public/images/placeholder.svg` | ✅ есть | старая заглушка |
| `public/images/placeholder.jpg` | ❌ НЕТ | упоминается в коде как fallback (`|| "/images/placeholder.jpg"`) — сработает только если у товара пустой массив images; реально используется редко. Можно создать 1200×1600 JPG или заменить ссылки на `.svg` |

---

## 8. ЧЕК-ЛИСТ ПЕРЕД ЗАМЕНОЙ ФОТО

1. Имена файлов — точно как в разделе 1 (kebab-case, `.jpg`, без пробелов).
2. Товары: 3:4, 1200×1600. Коллекции: 1:1, 1600×1600. Hero: 16:9 / 9:16.
3. JPEG качество 80–85%, вес: товар ≤ 300 KB, hero ≤ 400 KB.
4. Единый фон/свет на всех 4 ракурсах одного товара.
5. После замены: `Ctrl+F5` (кэш картинок) или перезапуск `npm run dev`; прод — `npm run build`.
6. Проверить: главная (hero + editorial + featured), /shop (плитки + сетка), карточка товара (галерея + миниатюры), /collections (3 квадрата), корзина, избранное, поиск — и консоль на 404.

### Быстрая конвертация размера (ImageMagick):
```bash
# товар 3:4
magick input.png -resize 1200x1600^ -gravity center -extent 1200x1600 -quality 84 out.jpg
# коллекция 1:1
magick input.png -resize 1600x1600^ -gravity center -extent 1600x1600 -quality 84 out.jpg
# hero desktop 16:9
magick input.png -resize 1920x1080^ -gravity north -extent 1920x1080 -quality 84 out.jpg
```
