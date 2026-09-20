import { redirect } from 'next/navigation';

export default async function ProductsPage() {
  // این صفحه فقط برای /products است
  // اگر pathname بیشتر از یک سطح داشت، به [...slug] منتقل می‌شود
  redirect('/products/all'); // یا به صفحه لیست اصلی محصولات
}
