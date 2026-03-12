'use client';

import React from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'UPDATE_STOCK'; payload: { productId: string; stock: number } }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; payload: CartItem[] };

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  addItem: (product: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemStock: (productId: string, stock: number) => void;
  clearCart: () => void;
}

function storageKey(userId: string | null): string {
  return userId ? `marketplace_cart_${userId}` : 'marketplace_cart_guest';
}

function loadFromStorage(userId: string | null): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[], userId: string | null) {
  try {
    sessionStorage.setItem(storageKey(userId), JSON.stringify(items));
  } catch {
    // sessionStorage not available (e.g., private mode quota)
  }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (i) => i.productId === action.payload.productId,
      );
      if (existing) {
        const newQty = existing.quantity + 1;
        const clamped = Math.min(newQty, existing.stock);
        if (newQty > existing.stock) {
          toast.warning(
            `Apenas ${existing.stock} unidade(s) disponível(is) para "${existing.name}"`,
          );
        }
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.payload.productId
              ? { ...i, quantity: clamped }
              : i,
          ),
        };
      }
      // New item — quantity always starts at 1 (stock >= 1 guaranteed by caller)
      return {
        ...state,
        items: [
          ...state.items,
          { ...action.payload, quantity: 1 },
        ],
      };
    }

    case 'UPDATE_QUANTITY': {
      const item = state.items.find(
        (i) => i.productId === action.payload.productId,
      );
      if (!item) return state;

      const clamped = Math.max(1, Math.min(action.payload.quantity, item.stock));
      if (action.payload.quantity > item.stock) {
        toast.warning(
          `Apenas ${item.stock} unidade(s) disponível(is) para "${item.name}"`,
        );
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.payload.productId
            ? { ...i, quantity: clamped }
            : i,
        ),
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (i) => i.productId !== action.payload.productId,
        ),
      };

    case 'UPDATE_STOCK': {
      const item = state.items.find(
        (i) => i.productId === action.payload.productId,
      );
      if (!item) return state;

      const newStock = action.payload.stock;
      const clampedQty = Math.min(item.quantity, newStock);
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.payload.productId
            ? { ...i, stock: newStock, quantity: clampedQty }
            : i,
        ),
      };
    }

    case 'CLEAR':
      return { items: [] };

    case 'LOAD':
      return { items: action.payload };

    default:
      return state;
  }
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

function mergeGuestIntoUser(guestItems: CartItem[], userItems: CartItem[]): CartItem[] {
  if (guestItems.length === 0) return userItems;

  const merged = [...userItems];
  for (const guestItem of guestItems) {
    const existing = merged.find((i) => i.productId === guestItem.productId);
    if (existing) {
      const newQty = Math.min(existing.quantity + guestItem.quantity, existing.stock);
      existing.quantity = newQty;
    } else {
      merged.push(guestItem);
    }
  }
  return merged;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [state, dispatch] = React.useReducer(cartReducer, { items: [] }, () => ({
    items: loadFromStorage(userId),
  }));

  // When user changes (login/logout), reload cart.
  // On login (null → userId): merge guest cart into user cart, then clear guest storage.
  // On logout (userId → null): just load guest cart.
  const prevUserIdRef = React.useRef<string | null>(userId);
  React.useEffect(() => {
    const prevUserId = prevUserIdRef.current;
    prevUserIdRef.current = userId;

    if (userId && !prevUserId) {
      // User just logged in — merge guest items into user cart
      const guestItems = loadFromStorage(null);
      const userItems = loadFromStorage(userId);
      const merged = mergeGuestIntoUser(guestItems, userItems);
      dispatch({ type: 'LOAD', payload: merged });
      // Clear guest cart after merging
      try { sessionStorage.removeItem(storageKey(null)); } catch { /* ignore */ }
    } else {
      dispatch({ type: 'LOAD', payload: loadFromStorage(userId) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Persist to sessionStorage whenever items change
  React.useEffect(() => {
    saveToStorage(state.items, userId);
  }, [state.items, userId]);

  const addItem = React.useCallback(
    (product: Omit<CartItem, 'quantity'>) => {
      if (product.stock <= 0) {
        toast.error(`"${product.name}" está sem estoque.`);
        return;
      }
      dispatch({ type: 'ADD_ITEM', payload: product });
    },
    [],
  );

  const removeItem = React.useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
  }, []);

  const updateQuantity = React.useCallback(
    (productId: string, quantity: number) => {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
    },
    [],
  );

  const updateItemStock = React.useCallback(
    (productId: string, stock: number) => {
      dispatch({ type: 'UPDATE_STOCK', payload: { productId, stock } });
    },
    [],
  );

  const clearCart = React.useCallback(() => {
    dispatch({ type: 'CLEAR' });
    saveToStorage([], userId);
  }, [userId]);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = state.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  );

  const value = React.useMemo(
    () => ({
      items: state.items,
      totalItems,
      totalAmount,
      addItem,
      removeItem,
      updateQuantity,
      updateItemStock,
      clearCart,
    }),
    [
      state.items,
      totalItems,
      totalAmount,
      addItem,
      removeItem,
      updateQuantity,
      updateItemStock,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
