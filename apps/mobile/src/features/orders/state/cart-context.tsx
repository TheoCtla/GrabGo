import { ReactNode, createContext, useContext, useMemo, useReducer } from 'react';
import { Product, Snack } from '../../catalog/types';

export type CartSnack = Pick<Snack, 'id' | 'name'>;

export type CartItem = {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
};

export type CartProduct = Pick<Product, 'id' | 'name' | 'priceCents'>;

export type CartState = {
  snack: CartSnack | null;
  items: CartItem[];
};

type AddProductMode = 'append' | 'replace';

type CartAction =
  | { type: 'addProduct'; product: CartProduct; snack: CartSnack; mode: AddProductMode }
  | { type: 'decreaseQuantity'; productId: string }
  | { type: 'removeProduct'; productId: string }
  | { type: 'setQuantity'; productId: string; quantity: number }
  | { type: 'clear' };

type CartContextValue = {
  state: CartState;
  itemCount: number;
  productsTotalCents: number;
  addProduct: (product: CartProduct, snack: CartSnack, mode?: AddProductMode) => void;
  decreaseQuantity: (productId: string) => void;
  removeProduct: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const initialState: CartState = {
  snack: null,
  items: []
};

const CartContext = createContext<CartContextValue | null>(null);

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.priceCents * item.quantity, 0);
}

export function calculateCartItemCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  if (action.type === 'clear') {
    return initialState;
  }

  if (action.type === 'addProduct') {
    const shouldReplaceSnack = state.snack?.id && state.snack.id !== action.snack.id;
    const baseItems = shouldReplaceSnack && action.mode === 'replace' ? [] : state.items;

    if (shouldReplaceSnack && action.mode !== 'replace') {
      return state;
    }

    const existingItem = baseItems.find((item) => item.productId === action.product.id);
    const nextItems = existingItem
      ? baseItems.map((item) =>
          item.productId === action.product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      : [
          ...baseItems,
          {
            productId: action.product.id,
            name: action.product.name,
            priceCents: action.product.priceCents,
            quantity: 1
          }
        ];

    return {
      snack: action.snack,
      items: nextItems
    };
  }

  if (action.type === 'decreaseQuantity') {
    const nextItems = state.items
      .map((item) =>
        item.productId === action.productId ? { ...item, quantity: item.quantity - 1 } : item
      )
      .filter((item) => item.quantity > 0);

    return {
      snack: nextItems.length > 0 ? state.snack : null,
      items: nextItems
    };
  }

  if (action.type === 'removeProduct') {
    const nextItems = state.items.filter((item) => item.productId !== action.productId);

    return {
      snack: nextItems.length > 0 ? state.snack : null,
      items: nextItems
    };
  }

  if (action.type === 'setQuantity') {
    const normalizedQuantity = Math.max(Math.floor(action.quantity), 0);
    const nextItems = state.items
      .map((item) =>
        item.productId === action.productId ? { ...item, quantity: normalizedQuantity } : item
      )
      .filter((item) => item.quantity > 0);

    return {
      snack: nextItems.length > 0 ? state.snack : null,
      items: nextItems
    };
  }

  return state;
}

type CartProviderProps = {
  children: ReactNode;
};

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const value = useMemo<CartContextValue>(
    () => ({
      state,
      itemCount: calculateCartItemCount(state.items),
      productsTotalCents: calculateCartTotal(state.items),
      addProduct: (product, snack, mode = 'append') => {
        dispatch({ type: 'addProduct', product, snack, mode });
      },
      decreaseQuantity: (productId) => {
        dispatch({ type: 'decreaseQuantity', productId });
      },
      removeProduct: (productId) => {
        dispatch({ type: 'removeProduct', productId });
      },
      setQuantity: (productId, quantity) => {
        dispatch({ type: 'setQuantity', productId, quantity });
      },
      clearCart: () => {
        dispatch({ type: 'clear' });
      }
    }),
    [state]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }

  return context;
}
