import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {getAllProducts} from "@/lib/products";
const catalogIds = new Set(getAllProducts().map(product => product.id));

interface FavoritesStore {
  productIds: string[];
  isOpen: boolean;
  
  // Actions
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  openFavorites: () => void;
  closeFavorites: () => void;
  toggleFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      isOpen: false,
      
      addFavorite: (productId) => {
        set((state) => {
          if (!catalogIds.has(productId) || state.productIds.includes(productId)) {
            return state;
          }
          return { productIds: [...state.productIds, productId] };
        });
      },
      
      removeFavorite: (productId) => {
        set((state) => ({
          productIds: state.productIds.filter((id) => id !== productId),
        }));
      },
      
      toggleFavorite: (productId) => {
        if (get().productIds.includes(productId)) {
          get().removeFavorite(productId);
        } else {
          get().addFavorite(productId);
        }
      },
      
      isFavorite: (productId) => {
        return get().productIds.includes(productId);
      },
      
      openFavorites: () => {
        set({ isOpen: true });
      },
      
      closeFavorites: () => {
        set({ isOpen: false });
      },
      
      toggleFavorites: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },
    }),
    {
      name: "rrc-favorites-storage",
      skipHydration: true,
      partialize: state => ({productIds: state.productIds}),
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const state = persistedState as {productIds?: unknown};
        return {
          ...currentState,
          productIds: Array.isArray(state?.productIds) ? state.productIds.filter((id): id is string => typeof id === "string" && catalogIds.has(id)) : [],
          isOpen: false, // Don't persist open state
        };
      },
    }
  )
);
