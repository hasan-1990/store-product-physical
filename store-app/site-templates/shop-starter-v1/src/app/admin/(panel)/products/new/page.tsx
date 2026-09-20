import { ProductCreateForm } from '@/components/admin/ProductCreateForm';
import { sitePageMetadata } from '@/lib/metadata';

export async function generateMetadata() {
  return sitePageMetadata('افزودن محصول جدید', 'ایجاد محصول جدید در فروشگاه');
}

export default function AdminProductCreatePage() {
  return <ProductCreateForm />;
}
