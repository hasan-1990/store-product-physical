export type PaymentMethod = 'online' | 'cod';

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  variant: string;
  price: number;
  quantity: number;
  image: string;
};

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function formatCartPrice(price: number): string {
  return `${price.toLocaleString('fa-IR')} تومان`;
}
