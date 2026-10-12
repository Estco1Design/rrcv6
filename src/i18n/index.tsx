'use client';

import {useCartStore} from '@/store/cart';
import {useFavoritesStore} from '@/store/favorites';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

type Language = 'ru' | 'en';

interface Translations {
  navigation: {
    home: string;
    shop: string;
    allProducts: string;
    collections: string;
    about: string;
    contacts: string;
    delivery: string;
    privacyPolicy: string;
  };
  hero: {
    fallWinter: string;
    newCollection: string;
    viewCollection: string;
    brandDescription: string;
    aboutBrand: string;
    learnMore: string;
  };
  shop: {
    all: string;
    tops: string;
    bottoms: string;
    outerwear: string;
    hoodies: string;
    accessories: string;
    filters: string;
    sort: string;
    noProducts: string;
    products: string;
    currentCollection: string;
    objects: string;
    archive: string;
    showProducts: string;
    inStock: string;
    preOrder: string;
    soldOut: string;
  };
  product: {
    addToCart: string;
    selectSize: string;
    sizeSelected: string;
    oneSize: string;
    description: string;
    details: string;
    availability: string;
    inStock: string;
    preOrder: string;
    numbered: string;
    backToCatalog: string;
    color: string;
    size: string;
    composition: string;
    care: string;
    relatedProducts: string;
    cotton: string;
    gentleWash: string;
    freeDeliveryFrom: string;
    selectSizeError: string;
    outOfStock: string;
  };
  about: {
    title: string;
    description: string;
    philosophy: string;
    motto: string;
    materialsDesc: string;
    productionDesc: string;
    materials: string;
    production: string;
  };
  footer: {
    shop: string;
    allProducts: string;
    information: string;
    about: string;
    privacyPolicy: string;
    allRightsReserved: string;
    digitalFashionHouse: string;
    architecturalSilhouettes: string;
    premiumMaterials: string;
    attentionToDetail: string;
    est: string;
  };
  collections: {
    title: string;
    description: string;
    viewCollection: string;
    collection: string;
  };
  cart: {
    title: string;
    empty: string;
    subtotal: string;
    shipping: string;
    total: string;
    checkout: string;
    continueShopping: string;
    remove: string;
    quantity: string;
    selectAll: string;
    deselectAll: string;
    selectedCount: string;
    deleteSelected: string;
    selectedTotal: string;
    selectItems: string;
    checkoutSelected: string;
    freeShipping: string;
    leftForFreeShipping: string;
  };
  favorites: {
    title: string;
    empty: string;
    addToCart: string;
    remove: string;
    goToCatalog: string;
  };
  checkout: {
    title: string;
    orderSummary: string;
    customerInfo: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    address: string;
    comment: string;
    placeOrder: string;
    processing: string;
    success: string;
    contactDetails: string;
    firstName: string;
    lastName: string;
    country: string;
    postalCode: string;
    deliveryAddress: string;
    paymentMethod: string;
    bankCard: string;
    sbp: string;
    cod: string;
    agreeTerms: string;
    privacyPolicyLink: string;
    termsLink: string;
    yourOrder: string;
    confirmOrder: string;
    demoMode: string;
    emptyCart: string;
    goToCatalog: string;
  };
  delivery: {
    title: string;
    russia: string;
    pickup: string;
    return: string;
    contacts: string;
    disclaimer: string;
  };
  contacts: {
    title: string;
    contactUs: string;
    email: string;
    workHours: string;
    showroom: string;
    press: string;
    disclaimer: string;
  };
  search: {
    title: string;
    placeholder: string;
    enterQuery: string;
    nothingFound: string;
    viewAllProducts: string;
    found: string;
    clearSearch: string;
  };
  common: {
    loading: string;
    error: string;
    skip: string;
    close: string;
    search: string;
    noResults: string;
    oneSize: string;
    soldOut: string;
    preOrder: string;
    limited: string;
    sale: string;
  };
  categories: {
    all: string;
    tees: string;
    longsleeves: string;
    hoodies: string;
    zipups: string;
    pants: string;
    shorts: string;
    outerwear: string;
    accessories: string;
    caps: string;
    bags: string;
    tops: string;
    bottoms: string;
  };
  itemsCount: {
    one: string;
    few: string;
    many: string;
  };
}

const translations: Record<Language, Translations> = {
  ru: {
    navigation: {
      home: 'Главная',
      shop: 'МАГАЗИН',
      allProducts: 'ВСЕ ТОВАРЫ',
      collections: 'КОЛЛЕКЦИИ',
      about: 'О БРЕНДЕ',
      contacts: 'КОНТАКТЫ',
      delivery: 'ДОСТАВКА',
      privacyPolicy: 'ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ',
    },
    hero: {
      fallWinter: 'ОСЕНЬ–ЗИМА 2026',
      newCollection: 'НОВАЯ КОЛЛЕКЦИЯ',
      viewCollection: 'СМОТРЕТЬ КОЛЛЕКЦИЮ',
      brandDescription:
        'Тёмные тона. Плотные ткани. Архитектурные силуэты. Осенне-зимняя коллекция 2026 — исследование формы и содержания в контексте современной уличной моды.',
      aboutBrand: 'О БРЕНДЕ',
      learnMore: 'УЗНАТЬ БОЛЬШЕ',
    },
    shop: {
      all: 'ВСЁ',
      tops: 'ВЕРХ',
      bottoms: 'НИЗ',
      outerwear: 'ВЕРХНЯЯ ОДЕЖДА',
      hoodies: 'ХУДИ',
      accessories: 'АКСЕССУАРЫ',
      filters: 'ФИЛЬТРЫ',
      sort: 'СОРТИРОВКА',
      noProducts: 'Нет товаров в этой категории',
      products: 'товаров',
      currentCollection: 'ТЕКУЩАЯ КОЛЛЕКЦИЯ',
      objects: 'ОБЪЕКТЫ',
      archive: 'АРХИВ',
      showProducts: 'ПОКАЗАТЬ ИЗДЕЛИЯ',
      inStock: 'В НАЛИЧИИ',
      preOrder: 'ПРЕДЗАКАЗ',
      soldOut: 'ПРОДАНО',
    },
    product: {
      addToCart: 'ДОБАВИТЬ В КОРЗИНУ',
      selectSize: 'ВЫБЕРИТЕ РАЗМЕР',
      sizeSelected: 'РАЗМЕР ВЫБРАН',
      oneSize: 'ЕДИНЫЙ РАЗМЕР',
      description: 'ОПИСАНИЕ',
      details: 'ДЕТАЛИ',
      availability: 'НАЛИЧИЕ',
      inStock: 'В НАЛИЧИИ',
      preOrder: 'ПРЕДЗАКАЗ',
      numbered: 'НУМЕРНОЙ ТОВАР',
      backToCatalog: 'НАЗАД В КАТАЛОГ',
      color: 'ЦВЕТ',
      size: 'РАЗМЕР',
      composition: 'СОСТАВ',
      care: 'УХОД',
      relatedProducts: 'СВЯЗАННЫЕ ТОВАРЫ',
      cotton: 'Хлопок 100%',
      gentleWash: 'Бережная стирка при 30°C',
      freeDeliveryFrom: 'По тарифу перевозчика',
      selectSizeError: 'ВЫБЕРИТЕ РАЗМЕР',
      outOfStock: 'НЕТ В НАЛИЧИИ',
    },
    about: {
      title: 'RICHRUSSIANCOMMUNITY',
      description:
        'Цифровой дом одежды. Мы создаём вещи вне времени — архитектурные силуэты, премиальные материалы, внимание к деталям.',
      philosophy:
        'Наша философия основана на идее современной идентичности — мы исследуем, как одежда становится частью личной истории, выражением внутренней свободы и принадлежности к сообществу.',
      motto:
        'ВСЁ ИМЕЕТ СВОЮ ЦЕНУ. НО ЧЕЛОВЕК В RRC — БЕСЦЕНЕН.',
      materialsDesc:
        'Премиальный хлопок, французский футер, натуральная шерсть. Мы работаем только с проверенными поставщиками.',
      productionDesc:
        'Локальное производство небольшими партиями. Контроль качества на каждом этапе.',
      materials: 'МАТЕРИАЛЫ',
      production: 'ПРОИЗВОДСТВО',
    },
    footer: {
      shop: 'МАГАЗИН',
      allProducts: 'ВСЕ ТОВАРЫ',
      information: 'ИНФОРМАЦИЯ',
      about: 'О БРЕНДЕ',
      privacyPolicy: 'ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ',
      allRightsReserved: 'Все права защищены',
      digitalFashionHouse: 'ЦИФРОВОЙ МОДНЫЙ ДОМ',
      architecturalSilhouettes: 'АРХИТЕКТУРНЫЕ СИЛУЭТЫ',
      premiumMaterials: 'ПРЕМИАЛЬНЫЕ МАТЕРИАЛЫ',
      attentionToDetail: 'ВНИМАНИЕ К ДЕТАЛЯМ',
      est: 'ОСН. 2026',
    },
    collections: {
      title: 'КОЛЛЕКЦИИ',
      description: 'Сезонные коллекции RICHRUSSIANCOMMUNITY. Исследование формы, материала и современной идентичности.',
      viewCollection: 'СМОТРЕТЬ КОЛЛЕКЦИЮ',
      collection: 'КОЛЛЕКЦИЯ',
    },
    cart: {
      title: 'КОРЗИНА',
      empty: 'Ваша корзина пуста',
      subtotal: 'Промежуточный итог',
      shipping: 'Доставка',
      total: 'Итого',
      checkout: 'ОФОРМИТЬ ЗАКАЗ',
      continueShopping: 'ПРОДОЛЖИТЬ ПОКУПКИ',
      remove: 'УДАЛИТЬ',
      quantity: 'КОЛИЧЕСТВО',
      selectAll: 'ВЫБРАТЬ ВСЁ',
      deselectAll: 'СНЯТЬ ВЫБОР',
      selectedCount: 'выбрано',
      deleteSelected: 'УДАЛИТЬ ВЫБРАННЫЕ',
      selectedTotal: 'ИТОГО',
      selectItems: 'ВЫБЕРИТЕ ТОВАРЫ',
      checkoutSelected: 'ОФОРМИТЬ ВЫБРАННЫЕ',
      freeShipping: 'БЕСПЛАТНО',
      leftForFreeShipping: 'ДО БЕСПЛАТНОЙ ДОСТАВКИ ОСТАЛОСЬ',
    },
    favorites: {
      title: 'ИЗБРАННОЕ',
      empty: 'Список избранного пуст',
      addToCart: 'В КОРЗИНУ',
      remove: 'УДАЛИТЬ',
      goToCatalog: 'ПЕРЕЙТИ В КАТАЛОГ',
    },
    delivery: {
      title: 'ДОСТАВКА И ВОЗВРАТ',
      russia: 'ДОСТАВКА ПО РОССИИ',
      pickup: 'ПРИМЕРКА ПЕРЕД ПОКУПКОЙ',
      return: 'ВОЗВРАТ ТОВАРА',
      contacts: 'КОНТАКТЫ СЛУЖБЫ ДОСТАВКИ',
      disclaimer: '* Информация о доставке и возврате является демонстрационной. Перед запуском проекта необходимо согласовать реальные условия с логистическими партнёрами.',
    },
    contacts: {
      title: 'КОНТАКТЫ',
      contactUs: 'СВЯЗАТЬСЯ С НАМИ',
      email: 'Email',
      workHours: 'РЕЖИМ РАБОТЫ',
      showroom: 'ШОУРУМ',
      press: 'ПРЕССА И СОТРУДНИЧЕСТВО',
      disclaimer: '* Контактная информация является демонстрационной. Перед запуском проекта необходимо указать реальные контакты бренда.',
    },
    search: {
      title: 'ПОИСК',
      placeholder: 'Введите название товара...',
      enterQuery: 'Введите запрос для поиска товаров',
      nothingFound: 'Ничего не найдено по запросу',
      viewAllProducts: 'СМОТРЕТЬ ВСЕ ТОВАРЫ',
      found: 'НАЙДЕНО',
      clearSearch: 'Очистить поиск',
    },
    checkout: {
      title: 'ОФОРМЛЕНИЕ ЗАКАЗА',
      orderSummary: 'СОДЕРЖИМОЕ ЗАКАЗА',
      customerInfo: 'ДАННЫЕ ПОКУПАТЕЛЯ',
      name: 'Имя',
      email: 'Email',
      phone: 'Телефон',
      city: 'Город',
      address: 'Адрес',
      comment: 'Комментарий к заказу',
      placeOrder: 'Оформить заказ',
      processing: 'ОБРАБОТКА...',
      success: 'ЗАКАЗ ОФОРМЛЕН',
      contactDetails: 'КОНТАКТНЫЕ ДАННЫЕ',
      firstName: 'Имя',
      lastName: 'Фамилия',
      country: 'Страна',
      postalCode: 'Индекс',
      deliveryAddress: 'Адрес доставки',
      paymentMethod: 'Способ оплаты',
      bankCard: 'Банковская карта',
      sbp: 'СБП',
      cod: 'Наложенный платёж',
      agreeTerms: 'Я согласен с условиями',
      privacyPolicyLink: 'политикой конфиденциальности',
      termsLink: 'условиями оферты',
      yourOrder: 'ВАШ ЗАКАЗ',
      confirmOrder: 'ПОДТВЕРДИТЬ ЗАКАЗ',
      demoMode: 'DEMO-РЕЖИМ: Оплата не производится',
      emptyCart: 'Ваша корзина пуста',
      goToCatalog: 'ПЕРЕЙТИ В КАТАЛОГ',
    },
    common: {
      loading: 'Загрузка...',
      error: 'Ошибка',
      skip: 'ПРОПУСТИТЬ',
      close: 'ЗАКРЫТЬ',
      search: 'ПОИСК',
      noResults: 'Ничего не найдено',
      oneSize: 'ЕДИНЫЙ РАЗМЕР',
      soldOut: 'SOLD OUT',
      preOrder: 'PRE-ORDER',
      limited: 'LIMITED',
      sale: 'SALE',
    },
    categories: {
      all: 'ВСЁ',
      tees: 'ФУТБОЛКИ',
      longsleeves: 'ЛОНГСЛИВЫ',
      hoodies: 'ХУДИ',
      zipups: 'ЗИП-ХУДИ',
      pants: 'БРЮКИ',
      shorts: 'ШОРТЫ',
      outerwear: 'ВЕРХНЯЯ ОДЕЖДА',
      accessories: 'АКСЕССУАРЫ',
      caps: 'КЕПКИ',
      bags: 'СУМКИ',
      tops: 'TOPS',
      bottoms: 'BOTTOMS',
    },
    itemsCount: {
      one: 'ТОВАР',
      few: 'ТОВАРА',
      many: 'ТОВАРОВ',
    },
  },
  en: {
    navigation: {
      home: 'Home',
      shop: 'SHOP',
      allProducts: 'ALL PRODUCTS',
      collections: 'COLLECTIONS',
      about: 'ABOUT',
      contacts: 'CONTACTS',
      delivery: 'DELIVERY',
      privacyPolicy: 'PRIVACY POLICY',
    },
    hero: {
      fallWinter: 'FALL–WINTER 2026',
      newCollection: 'NEW COLLECTION',
      viewCollection: 'VIEW COLLECTION',
      brandDescription:
        'Dark tones. Dense fabrics. Architectural silhouettes. Fall/Winter 2026 collection — an exploration of form and content within contemporary streetwear.',
      aboutBrand: 'ABOUT THE BRAND',
      learnMore: 'LEARN MORE',
    },
    shop: {
      all: 'ALL',
      tops: 'TOPS',
      bottoms: 'BOTTOMS',
      outerwear: 'OUTERWEAR',
      hoodies: 'HOODIES',
      accessories: 'ACCESSORIES',
      filters: 'FILTERS',
      sort: 'SORT',
      noProducts: 'No products in this category',
      products: 'products',
      currentCollection: 'CURRENT COLLECTION',
      objects: 'OBJECTS',
      archive: 'ARCHIVE',
      showProducts: 'SHOW PRODUCTS',
      inStock: 'IN STOCK',
      preOrder: 'PRE-ORDER',
      soldOut: 'SOLD OUT',
    },
    product: {
      addToCart: 'ADD TO CART',
      selectSize: 'SELECT SIZE',
      sizeSelected: 'SIZE SELECTED',
      oneSize: 'ONE SIZE',
      description: 'DESCRIPTION',
      details: 'DETAILS',
      availability: 'AVAILABILITY',
      inStock: 'IN STOCK',
      preOrder: 'PRE-ORDER',
      numbered: 'NUMBERED ITEM',
      backToCatalog: 'BACK TO CATALOG',
      color: 'COLOR',
      size: 'SIZE',
      composition: 'COMPOSITION',
      care: 'CARE',
      relatedProducts: 'RELATED PRODUCTS',
      cotton: 'Cotton 100%',
      gentleWash: 'Gentle wash at 30°C',
      freeDeliveryFrom: 'Carrier rates',
      selectSizeError: 'SELECT SIZE',
      outOfStock: 'OUT OF STOCK',
    },
    cart: {
      title: 'CART',
      empty: 'Your cart is empty',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      total: 'Total',
      checkout: 'CHECKOUT',
      continueShopping: 'CONTINUE SHOPPING',
      remove: 'REMOVE',
      quantity: 'QUANTITY',
      selectAll: 'SELECT ALL',
      deselectAll: 'DESELECT ALL',
      selectedCount: 'selected',
      deleteSelected: 'DELETE SELECTED',
      selectedTotal: 'TOTAL',
      selectItems: 'SELECT ITEMS',
      checkoutSelected: 'CHECKOUT SELECTED',
      freeShipping: 'FREE',
      leftForFreeShipping: 'LEFT FOR FREE SHIPPING',
    },
    favorites: {
      title: 'FAVORITES',
      empty: 'Your favorites list is empty',
      addToCart: 'ADD TO CART',
      remove: 'REMOVE',
      goToCatalog: 'GO TO CATALOG',
    },
    checkout: {
      title: 'CHECKOUT',
      orderSummary: 'ORDER SUMMARY',
      customerInfo: 'CUSTOMER INFORMATION',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      city: 'City',
      address: 'Address',
      comment: 'Order comment',
      placeOrder: 'Proceed to checkout',
      processing: 'PROCESSING...',
      success: 'ORDER PLACED',
      contactDetails: 'CONTACT DETAILS',
      firstName: 'First Name',
      lastName: 'Last Name',
      country: 'Country',
      postalCode: 'Postal Code',
      deliveryAddress: 'Delivery Address',
      paymentMethod: 'Payment Method',
      bankCard: 'Bank Card',
      sbp: 'SBP',
      cod: 'Cash on Delivery',
      agreeTerms: 'I agree with the terms',
      privacyPolicyLink: 'privacy policy',
      termsLink: 'terms of offer',
      yourOrder: 'YOUR ORDER',
      confirmOrder: 'CONFIRM ORDER',
      demoMode: 'DEMO MODE: No payment required',
      emptyCart: 'Your cart is empty',
      goToCatalog: 'GO TO CATALOG',
    },
    about: {
      title: 'RICHRUSSIANCOMMUNITY',
      description:
        'Digital fashion house. We create timeless pieces — architectural silhouettes, premium materials, attention to detail.',
      philosophy:
        'Our philosophy is built on the idea of modern identity — we explore how clothing becomes part of a personal narrative, an expression of inner freedom and belonging to a community.',
      motto:
        'EVERYTHING HAS ITS PRICE. BUT A PERSON IN RRC IS PRICELESS.',
      materialsDesc:
        'Premium cotton, French fleece, natural wool. We work only with trusted suppliers.',
      productionDesc:
        'Local production in small batches. Quality control at every stage.',
      materials: 'MATERIALS',
      production: 'PRODUCTION',
    },
    footer: {
      shop: 'SHOP',
      allProducts: 'ALL PRODUCTS',
      information: 'INFORMATION',
      about: 'ABOUT',
      privacyPolicy: 'PRIVACY POLICY',
      allRightsReserved: 'All rights reserved',
      digitalFashionHouse: 'DIGITAL FASHION HOUSE',
      architecturalSilhouettes: 'ARCHITECTURAL SILHOUETTES',
      premiumMaterials: 'PREMIUM MATERIALS',
      attentionToDetail: 'ATTENTION TO DETAIL',
      est: 'EST. 2026',
    },
    collections: {
      title: 'COLLECTIONS',
      description: 'Seasonal RICHRUSSIANCOMMUNITY collections. Exploration of form, material and contemporary identity.',
      viewCollection: 'VIEW COLLECTION',
      collection: 'COLLECTION',
    },
    delivery: {
      title: 'DELIVERY & RETURNS',
      russia: 'DELIVERY IN RUSSIA',
      pickup: 'TRY BEFORE YOU BUY',
      return: 'PRODUCT RETURN',
      contacts: 'DELIVERY SERVICE CONTACTS',
      disclaimer: '* Delivery and return information is for demonstration purposes. Before launching the project, you must coordinate actual terms with logistics partners.',
    },
    contacts: {
      title: 'CONTACTS',
      contactUs: 'CONTACT US',
      email: 'Email',
      workHours: 'WORK HOURS',
      showroom: 'SHOWROOM',
      press: 'PRESS & COLLABORATION',
      disclaimer: '* Contact information is for demonstration purposes. Before launching the project, you must specify actual brand contacts.',
    },
    search: {
      title: 'SEARCH',
      placeholder: 'Enter product name...',
      enterQuery: 'Enter query to search products',
      nothingFound: 'Nothing found for',
      viewAllProducts: 'VIEW ALL PRODUCTS',
      found: 'FOUND',
      clearSearch: 'Clear search',
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      skip: 'SKIP',
      close: 'CLOSE',
      search: 'SEARCH',
      noResults: 'Nothing found',
      oneSize: 'ONE SIZE',
      soldOut: 'SOLD OUT',
      preOrder: 'PRE-ORDER',
      limited: 'LIMITED',
      sale: 'SALE',
    },
    categories: {
      all: 'ALL',
      tees: 'T-SHIRTS',
      longsleeves: 'LONGSLEEVES',
      hoodies: 'HOODIES',
      zipups: 'ZIP HOODIES',
      pants: 'PANTS',
      shorts: 'SHORTS',
      outerwear: 'OUTERWEAR',
      accessories: 'ACCESSORIES',
      caps: 'CAPS',
      bags: 'BAGS',
      tops: 'TOPS',
      bottoms: 'BOTTOMS',
    },
    itemsCount: {
      one: 'ITEM',
      few: 'ITEMS',
      many: 'ITEMS',
    },
  },
};

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
} | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru');

  useEffect(() => {
    void useCartStore.persist.rehydrate();
    void useFavoritesStore.persist.rehydrate();
    if (typeof window !== 'undefined') {
      let saved: Language | null = null;
      try { saved = localStorage.getItem('rrc-language') as Language | null; } catch {}
      if (saved && (saved === 'ru' || saved === 'en')) {
        setLanguageState(saved);
      }

    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('rrc-language', lang); } catch {}
    }
  }, []);

  useEffect(() => { document.documentElement.lang = language; }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export { translations };
export type { Language, Translations };
