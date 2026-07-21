import { describe, expect, it } from 'vitest';
import { Product } from '../../catalog/types';
import { CartState, calculateCartItemCount, calculateCartTotal, cartReducer } from './cart-context';

const snack = {
  id: 'snack-1',
  name: 'Snack test'
};

const otherSnack = {
  id: 'snack-2',
  name: 'Autre snack'
};

const product = {
  id: 'product-1',
  name: 'Sandwich',
  priceCents: 550
} as Product;

const initialState: CartState = {
  snack: null,
  items: []
};

describe('cart reducer', () => {
  it('adds a product and calculates totals', () => {
    const withOneItem = cartReducer(initialState, {
      type: 'addProduct',
      product,
      snack,
      mode: 'append'
    });
    const withTwoItems = cartReducer(withOneItem, {
      type: 'addProduct',
      product,
      snack,
      mode: 'append'
    });

    expect(withTwoItems.items).toHaveLength(1);
    expect(withTwoItems.items[0]?.quantity).toBe(2);
    expect(calculateCartItemCount(withTwoItems.items)).toBe(2);
    expect(calculateCartTotal(withTwoItems.items)).toBe(1100);
  });

  it('removes quantities without allowing negative values', () => {
    const withOneItem = cartReducer(initialState, {
      type: 'addProduct',
      product,
      snack,
      mode: 'append'
    });
    const emptyCart = cartReducer(withOneItem, {
      type: 'decreaseQuantity',
      productId: product.id
    });
    const stillEmpty = cartReducer(emptyCart, {
      type: 'decreaseQuantity',
      productId: product.id
    });

    expect(stillEmpty.items).toEqual([]);
    expect(stillEmpty.snack).toBeNull();
  });

  it('keeps a single snack cart unless replacement is explicit', () => {
    const withSnack = cartReducer(initialState, {
      type: 'addProduct',
      product,
      snack,
      mode: 'append'
    });
    const unchanged = cartReducer(withSnack, {
      type: 'addProduct',
      product: { ...product, id: 'product-2', name: 'Cookie' },
      snack: otherSnack,
      mode: 'append'
    });
    const replaced = cartReducer(withSnack, {
      type: 'addProduct',
      product: { ...product, id: 'product-2', name: 'Cookie' },
      snack: otherSnack,
      mode: 'replace'
    });

    expect(unchanged.snack?.id).toBe(snack.id);
    expect(unchanged.items).toHaveLength(1);
    expect(replaced.snack?.id).toBe(otherSnack.id);
    expect(replaced.items).toHaveLength(1);
    expect(replaced.items[0]?.productId).toBe('product-2');
  });
});
