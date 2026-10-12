# ТАБЛИЦА ИЗОБРАЖЕНИЙ RRC STORE

## Структура папок
```
public/
└── images/
    ├── product/          ← Товары (одежда, аксессуары)
    │   ├── hoodies/      ← Худи
    │   ├── zipups/       ← Зип-худи
    │   ├── tees/         ← Футболки
    │   ├── longsleeves/  ← Лонгсливы
    │   ├── pants/        ← Брюки
    │   ├── outerwear/    ← Верхняя одежда
    │   └── accessories/  ← Аксессуары
    ├── collections/      ← Коллекции
    ├── hero/             ← Герой-баннеры
    └── placeholder.svg   ← Заглушка (уже есть)
```

---

## ТАБЛИЦА ПУТЕЙ К ИЗОБРАЖЕНИЯМ

| № | Товар (EN) | Товар (RU) | Категория | Путь к изображению | Слайд |
|---|------------|------------|-----------|-------------------|-------|
| 1 | RRC SIGNATURE HOODIE | Худи RRC SIGNATURE | Hoodies | `/images/product/hoodies/signature-hoodie-black.jpg` | Главный вид |
| 2 | CROWN ZIPUP | Зип-худи CROWN | Zipups | `/images/product/zipups/crown-zipup-bordeaux.jpg` | Главный вид |
| 3 | EAGLE TEE | Футболка EAGLE | Tees | `/images/product/tees/eagle-tee-white.jpg` | Главный вид |
| 4 | COMMUNITY LONGSLEEVE | Лонгслив COMMUNITY | Longsleeves | `/images/product/longsleeves/community-longsleeve-grey.jpg` | Главный вид |
| 5 | 2026 SWEATPANTS | Джоггеры 2026 | Pants | `/images/product/pants/2026-sweatpants-black.jpg` | Главный вид |
| 6 | METALLIC PUFFER | Пуховик METALLIC | Outerwear | `/images/product/outerwear/metallic-puffer.jpg` | Главный вид |
| 7 | HERITAGE CAP | Кепка HERITAGE | Accessories | `/images/product/accessories/heritage-cap.jpg` | Главный вид |
| 8 | LIMITED BOMBER | Бомбер LIMITED | Outerwear | `/images/product/outerwear/limited-bomber.jpg` | Главный вид |
| 9 | BASIC TEE | Футболка BASIC | Tees | `/images/product/tees/basic-tee-black.jpg` | Главный вид |
| 10 | WINTER SCARF | Шарф WINTER | Accessories | `/images/product/accessories/winter-scarf.jpg` | Главный вид |
| 11 | TECH VEST | Жилет TECH | Outerwear | `/images/product/outerwear/tech-vest.jpg` | Главный вид |
| 12 | ARCHIVAL HOODIE | Худи ARCHIVAL | Hoodies | `/images/product/hoodies/archival-hoodie.jpg` | Главный вид |

---

## ДОПОЛНИТЕЛЬНЫЕ РАКУРСЫ (для карточки товара)

Для каждого товара рекомендуется загрузить 2-4 ракурса:

| Тип ракурса | Описание | Пример пути |
|-------------|----------|-------------|
| Front | Вид спереди | `/images/product/hoodies/signature-hoodie-black-front.jpg` |
| Back | Вид сзади | `/images/product/hoodies/signature-hoodie-black-back.jpg` |
| Detail | Деталь (принт, вышивка) | `/images/product/hoodies/signature-hoodie-black-detail.jpg` |
| Model | На модели | `/images/product/hoodies/signature-hoodie-black-model.jpg` |

---

## КОЛЛЕКЦИИ

| Коллекция (EN) | Коллекция (RU) | Путь к изображению |
|----------------|----------------|-------------------|
| FALL/WINTER 2026 | Осень-Зима 2026 | `/images/collections/fall-2026.jpg` |
| SPRING/SUMMER 2026 | Весна-Лето 2026 | `/images/collections/spring-2026.jpg` |
| ARCHIVE | Архив | `/images/collections/archive.jpg` |

---

## ГЛАВНЫЙ ЭКРАН (HERO)

| Экран | Путь к изображению | Размер рекомендации |
|-------|-------------------|---------------------|
| Hero Section (текущий) | `/images/hero-collection.jpg` | 1920x1080px |
| Альтернативный | `/images/hero/hero-main.jpg` | 1920x1080px |

---

## КАК ЗАМЕНИТЬ ИЗОБРАЖЕНИЯ

1. **Создайте папки** (если не созданы):
   ```bash
   mkdir -p public/images/product/{hoodies,zipups,tees,longsleeves,pants,outerwear,accessories}
   mkdir -p public/images/collections
   mkdir -p public/images/hero
   ```

2. **Поместите файлы** в соответствующие папки с именами как в таблице выше

3. **Обновите `src/lib/data.ts`** — замените `TEMP_PRODUCT_IMAGE` на реальные пути

4. **Перезапустите сервер**:
   ```bash
   npm run dev
   ```

---

## ТЕКУЩИЕ ПУТИ В CODEBASE

| Файл | Текущее использование | Путь |
|------|----------------------|------|
| `src/lib/data.ts` | Все товары | `/images/placeholder.svg` |
| `src/components/home/HeroSection.tsx` | Hero баннер | `/images/hero-collection.jpg` |
| `src/components/home/HeroCarousel.tsx` | Слайды | `/images/campaigns/slide-1.jpg` |
| `src/app/collections/page.tsx` | Коллекции | `/images/placeholder.svg` |

---

## РЕКОМЕНДАЦИИ ПО ИЗОБРАЖЕНИЯМ

- **Формат**: JPG для фото, PNG для графики с прозрачностью, SVG для иконок
- **Размер**: 
  - Карточка товара: 800x1000px (минимум)
  - Страница товара: 1200x1500px (рекомендуется)
  - Hero баннер: 1920x1080px
- **Вес**: Оптимизируйте до 200-500KB для быстрых загрузок
- **Именование**: Используйте lowercase с дефисами (kebab-case)
