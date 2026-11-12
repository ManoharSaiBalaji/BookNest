import { createContext, useContext, useEffect, useState } from 'react';

const CART_STORAGE_KEY = 'booknest_cart';
const CartContext = createContext(null);

function loadStoredCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadStoredCart);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  /**
   * Add a book to cart while preventing quantity from exceeding available stock.
   * Returns { ok, message }.
   */
  function addToCart(book, quantityToAdd = 1) {
    if (!book || book.stock <= 0) {
      return { ok: false, message: 'This book is currently out of stock.' };
    }

    const existing = items.find((item) => item.bookId === book._id);
    const currentQty = existing ? existing.quantity : 0;
    const nextQty = currentQty + quantityToAdd;

    if (nextQty > book.stock) {
      return {
        ok: false,
        message: `Only ${book.stock} copies available in stock.`,
      };
    }

    setItems((prev) => {
      if (existing) {
        return prev.map((item) =>
          item.bookId === book._id
            ? {
                ...item,
                quantity: item.quantity + quantityToAdd,
                stock: book.stock,
                price: book.price,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          bookId: book._id,
          title: book.title,
          author: book.author,
          price: book.price,
          coverImage: book.coverImage,
          stock: book.stock,
          quantity: quantityToAdd,
        },
      ];
    });

    return { ok: true, message: `"${book.title}" added to cart.` };
  }

  function updateQuantity(bookId, nextQuantity) {
    if (nextQuantity < 1) {
      removeFromCart(bookId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.bookId !== bookId) return item;
        const capped = Math.min(nextQuantity, item.stock);
        return { ...item, quantity: capped };
      })
    );
  }

  function removeFromCart(bookId) {
    setItems((prev) => prev.filter((item) => item.bookId !== bookId));
  }

  function clearCart() {
    setItems([]);
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = Number(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
