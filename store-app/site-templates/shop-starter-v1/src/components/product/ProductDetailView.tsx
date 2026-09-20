import type { ProductDetail } from '@/lib/products';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductPurchase } from '@/components/product/ProductPurchase';
import { ProductTabs } from '@/components/product/ProductTabs';
import { ProductReviews } from '@/components/product/ProductReviews';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

type ProductDetailViewProps = {
  product: ProductDetail;
};

export function ProductDetailView({ product }: ProductDetailViewProps) {
  return (
    <div className="page-container pb-8 pt-28 md:pt-32">
      <Breadcrumb
        items={[
          { label: 'خانه', href: '/' },
          { label: product.category, href: `/products?cat=${product.categorySlug}` },
          { label: product.name },
        ]}
      />

      <ProductHero product={product} />
      <ProductTabs product={product} />
      <ProductReviews product={product} />
      <RelatedProducts items={product.related} />
    </div>
  );
}

function ProductHero({ product }: ProductDetailViewProps) {
  return (
    <section className="mb-16 grid grid-cols-1 gap-8 lg:mb-[120px] lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-7">
        <ProductGallery images={product.gallery} name={product.name} />
      </div>
      <div className="lg:col-span-5">
        <ProductPurchase product={product} />
      </div>
    </section>
  );
}
