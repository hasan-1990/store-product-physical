import { redirect } from 'next/navigation';

// صفحه /category به /categories ریدایرکت می‌شود
export default function CategoryIndexPage() {
  redirect('/categories');
}
