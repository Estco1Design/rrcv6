import { z } from "zod";

// Schema для размеров одежды.
// Реальные размеры задаются в product data; если данных нет — пустой массив [].
// Разрешены произвольные строки (например "ONE SIZE"), чтобы не придумывать размерную сетку.
export const sizeSchema = z.string().min(1).max(30);

export type Size = z.infer<typeof sizeSchema>;

// Схема для цветов
export const colorSchema = z.object({
  name: z.string().min(1).max(50),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export type Color = z.infer<typeof colorSchema>;

// Схема для продукта
// Если данных нет (цена, размеры, остатки) — null / [], значения не придумываются.
export const productSchema = z.object({
  id: z.string(),
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().nullish(),
  descriptionEn: z.string().nullish(),
  // Цена: только если реально задана. null = данных нет.
  price: z.number().positive().nullable().default(null),
  // Сниженная цена. null = скидок нет; обычная цена хранится в price.
  salePrice: z.number().positive().nullable().default(null),
  category: z.enum(["outerwear", "hoodies", "tops", "bottoms"]).nullable().default(null),
  // Привязка к витринной коллекции (/collections/*). null = данных нет.
  collectionId: z.string().nullish(),
  // Изображения по цветам: { "Black": ["/...", ...], "White": [...] }
  imagesByColor: z.record(z.string(), z.array(z.string())).default({}),
  sizes: z.array(sizeSchema).default([]),
  inStock: z.boolean().nullable().default(null),
  preorder: z.boolean().default(false),
  catalogStatus: z.enum(["current", "archive", "hidden"]).default("archive"),
  featured: z.boolean().default(false),
  featuredOrder: z.number().int().nullable().default(null),
  materials: z.string().nullish(),
  details: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductBase = z.infer<typeof productSchema>;

// Цвет товара с собственными фотографиями (универсальная архитектура вариантов)
export const productColorVariantSchema = z.object({
  name: z.string().min(1).max(50),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  images: z.array(z.string()).default([]),
});

export type ProductColorVariant = z.infer<typeof productColorVariantSchema>;

// Аудитория товара: 'men' | 'women'. Unisex = оба значения ['men','women'].
// Фильтр МУЖСКОЕ показывает items с 'men' (включая unisex), ЖЕНСКОЕ — с 'women'.
export const audienceValueSchema = z.enum(["men", "women"]);
export type AudienceValue = z.infer<typeof audienceValueSchema>;

// Полный продукт для UI: базовые поля + colors + images (производные от variants/imagesByColor)
export const productSchemaFull = productSchema.extend({
  gender: z.string().nullish(),
  // Аудитория (пол); [] / undefined = данных нет → считается доступной для всех.
  audience: z.array(audienceValueSchema).default([]),
  colors: z.array(productColorVariantSchema).default([]),
  images: z.array(z.string()).default([]),
});

export type Product = z.infer<typeof productSchemaFull>;

// Схема для варианта продукта
export const productVariantSchema = z.object({
  id: z.string(),
  productId: z.string(),
  size: sizeSchema,
  color: z.string(),
  sku: z.string(),
  inventory: z.number().int().nonnegative(),
  isAvailable: z.boolean().default(true),
});

export type ProductVariant = z.infer<typeof productVariantSchema>;

// Схема для корзины
// Цена и размер могут быть null, если данных в каталоге пока нет.
export const cartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  slug: z.string().default(""),
  variantId: z.string(),
  name: z.string(),
  price: z.number().positive().nullable(),
  image: z.string(),
  size: sizeSchema.nullable(),
  fitRequest: z.enum(['regular', 'oversize']).optional(),
  color: z.string(),
  quantity: z.number().int().positive().max(10),
});

export type CartItem = z.infer<typeof cartItemSchema>;

// Схема для заказа
export const orderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
  items: z.array(cartItemSchema),
  subtotal: z.number().nonnegative(),
  shipping: z.number().nonnegative(),
  total: z.number().nonnegative(),
  customer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(5),
  }),
  shippingAddress: z.object({
    country: z.string(),
    city: z.string(),
    address: z.string(),
    postalCode: z.string(),
  }),
  paymentMethod: z.enum(["card", "sbp", "cod"]),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Order = z.infer<typeof orderSchema>;

// Схема для адреса доставки
export const shippingAddressSchema = z.object({
  country: z.string().min(1).default("Россия"),
  city: z.string().min(1),
  address: z.string().min(1),
  postalCode: z.string().min(1),
});

// Схема для клиента при оформлении заказа
export const checkoutCustomerSchema = z.object({
  firstName: z.string().min(1, "Имя обязательно"),
  lastName: z.string().min(1, "Фамилия обязательна"),
  email: z.string().email("Некорректный email"),
  phone: z.string().min(10, "Введите корректный номер телефона"),
});

// Схема для оформления заказа
export const checkoutSchema = z.object({
  customer: checkoutCustomerSchema,
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(["card", "sbp", "cod"]),
  acceptTerms: z.boolean().refine((val) => val === true, "Необходимо принять условия"),
});

export type CheckoutData = z.infer<typeof checkoutSchema>;

// Схема для промокода
export const promoCodeSchema = z.object({
  code: z.string().min(1).max(20),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxUses: z.number().int().positive().optional(),
  usedCount: z.number().int().nonnegative().default(0),
  expiresAt: z.date().optional(),
  isActive: z.boolean().default(true),
});

export type PromoCode = z.infer<typeof promoCodeSchema>;

// Утилиты для валидации
export function validateCartItems(items: unknown[]): CartItem[] {
  return items
    .map((item) => cartItemSchema.safeParse(item))
    .filter((result): result is { success: true; data: CartItem } => result.success)
    .map((result) => result.data);
}

export function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
}
