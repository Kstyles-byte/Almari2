export interface LocalCartItem {
  productId: string;
  qty: number;
}

export interface LocalCart {
  version: number;
  items: LocalCartItem[];
}

const STORAGE_KEY = 'zervia_cart_v1';
const CURRENT_VERSION = 1;

function safeParse(json: string | null): LocalCart | null {
  try {
    if (!json) return null;
    const data = JSON.parse(json);
    if (data && data.version === CURRENT_VERSION && Array.isArray(data.items)) {
      return data as LocalCart;
    }
    return null;
  } catch {
    return null;
  }
}

function persist(cart: LocalCart) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    /* localStorage quota exceeded – ignore for now */
  }
}

export function readGuestCart(): LocalCartItem[] {
  if (typeof window === 'undefined') return [];
  const stored = safeParse(localStorage.getItem(STORAGE_KEY));
  return stored?.items ?? [];
}

export function writeGuestCart(items: LocalCartItem[]): void {
  persist({ version: CURRENT_VERSION, items });
}

export function clearGuestCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function upsertGuestItem(productId: string, qty: number = 1): void {
  if (!productId || qty <= 0) return;
  const items = readGuestCart();
  const idx = items.findIndex((i) => i.productId === productId);
  if (idx >= 0) {
    items[idx].qty = Math.min(items[idx].qty + qty, 99);
  } else {
    items.push({ productId, qty: Math.min(qty, 99) });
  }
  writeGuestCart(items);
} 