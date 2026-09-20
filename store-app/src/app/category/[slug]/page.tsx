import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import CategoryClient from '@/components/CategoryClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ساخت مسیر کامل دسته‌بندی از روی parentId
async function buildCategoryPath(categoryId: any, db: any): Promise<Array<{slug: string, name: string}>> {
  const category = await db.categories.findOne({ _id: categoryId });
  if (!category) return [];
  
  if (category.parentId) {
    const parentPath = await buildCategoryPath(category.parentId, db);
    return [...parentPath, { slug: category.slug, name: category.name }];
  }
  
  return [{ slug: category.slug, name: category.name }];
}

// generateMetadata برای SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // دریافت اطلاعات دسته‌بندی مستقیماً از دیتابیس
  let categoryData = null;
  try {
    const db = await connectDB();
    categoryData = await db.categories.findOne({ slug, active: true });
  } catch (error) {
    console.error('خطا در دریافت اطلاعات دسته‌بندی:', error);
  }

  if (!categoryData) {
    return {
      title: 'دسته‌بندی پیدا نشد | فروشگاه آنلاین',
      description: 'دسته‌بندی مورد نظر یافت نشد'
    };
  }

  // ✅ SEO: عنوان و توضیحات متمایز برای صفحه دسته‌بندی
  // این صفحه فقط برای دسته‌های والد که زیردسته دارند نمایش داده می‌شود
  const title = `دسته‌بندی ${categoryData.name} - انواع و زیردسته‌ها | فروشگاه آنلاین`;
  const description = categoryData.description 
    ? `${categoryData.description} - مشاهده زیردسته‌ها و انواع ${categoryData.name}` 
    : `مشاهده زیردسته‌های ${categoryData.name} و انتخاب دسته مورد نظر خود`;

  return {
    title,
    description,
    keywords: `دسته‌بندی ${categoryData.name}, انواع ${categoryData.name}, زیردسته ${categoryData.name}`,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/category/${slug}`,
      type: 'website',
      images: (categoryData.imageUrl || categoryData.image) ? [
        {
          url: categoryData.imageUrl || categoryData.image,
          width: 1200,
          height: 630,
          alt: categoryData.name
        }
      ] : []
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: (categoryData.imageUrl || categoryData.image) ? [categoryData.imageUrl || categoryData.image] : []
    },
    alternates: {
      canonical: `${baseUrl}/category/${slug}`
    }
  };
}

// صفحه اصلی
export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  try {
    const db = await connectDB();
    
    // دریافت اطلاعات دسته‌بندی مستقیماً از دیتابیس
    const categoryData = await db.categories.findOne({ slug, active: true });

    if (!categoryData) {
      console.error('Category not found:', slug);
      notFound();
    }

    // دریافت زیردسته‌های این دسته‌بندی با آمار کامل
    const subcategories = await db.categories.aggregate([
      {
        $match: {
          parentId: categoryData._id,
          active: true
        }
      },
      {
        $lookup: {
          from: 'products',
          let: { categoryId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$categoryId', '$$categoryId'] },
                    { $eq: ['$active', true] }
                  ]
                }
              }
            },
            { $count: 'total' }
          ],
          as: 'productCount'
        }
      },
      {
        $lookup: {
          from: 'categories',
          let: { parentId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$parentId', '$$parentId'] },
                    { $eq: ['$active', true] }
                  ]
                }
              }
            }
          ],
          as: 'subcategories'
        }
      },
      {
        $addFields: {
          productCount: { 
            $ifNull: [{ $arrayElemAt: ['$productCount.total', 0] }, 0] 
          },
          subcategoryCount: { $size: '$subcategories' }
        }
      },
      {
        $sort: { order: 1, name: 1 }
      }
    ]).toArray();

    // ✅ SEO: بررسی زیردسته‌ها و تصمیم‌گیری برای redirect
    const hasSubcategories = subcategories && subcategories.length > 0;
    
    if (!hasSubcategories) {
      // دسته‌های بدون زیردسته همیشه به /products redirect می‌شوند
      const categoryPath = await buildCategoryPath(categoryData._id, db);
      const redirectPath = `/products/${categoryPath.map(c => c.slug).join('/')}`;
      console.log(`🔄 SEO Redirect: /category/${slug} → ${redirectPath} (دسته بدون زیردسته)`);
      redirect(redirectPath);
    }

    // دریافت محصولات ویژه برای نمایش (فقط برای دسته‌های با زیردسته)
    // ✅ SEO: فقط 4 محصول ویژه برای جلوگیری از duplicate content با /products/{slug}
    let products = await db.products.find({
      categoryId: categoryData._id,
      active: true,
      featured: true  // اول سعی کن ویژه پیدا کنی
    }).limit(4).toArray();

    // Fallback: اگر محصول ویژه نبود، از محصولات عادی استفاده کن
    if (products.length === 0) {
      products = await db.products.find({
        categoryId: categoryData._id,
        active: true
      }).limit(4).toArray();
    }

    // تبدیل ObjectId به string برای سریالایز کردن
    const serializedCategory = JSON.parse(JSON.stringify({
      _id: categoryData._id.toString(),
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description || '',
      image: categoryData.image || categoryData.imageUrl || '',
      imageUrl: categoryData.imageUrl || categoryData.image || '',
      imageAlt: categoryData.imageAlt || categoryData.name,
      parentId: categoryData.parentId ? categoryData.parentId.toString() : null
    }));

    // ساخت category path برای هر subcategory
    const subcategoriesWithPath = await Promise.all(
      subcategories.map(async (sub: any) => {
        // ساخت مسیر کامل برای این زیردسته
        const categoryPath = await buildCategoryPath(categoryData._id, db);
        return {
          _id: sub._id.toString(),
          name: sub.name,
          slug: sub.slug,
          description: sub.description || '',
          image: sub.image || sub.imageUrl || '',
          imageUrl: sub.imageUrl || sub.image || '',
          imageAlt: sub.imageAlt || sub.name,
          parentId: sub.parentId ? sub.parentId.toString() : null,
          productCount: sub.productCount || 0,
          subcategoryCount: sub.subcategoryCount || 0,
          categoryPath: [...categoryPath, { slug: sub.slug, name: sub.name }]
        };
      })
    );
    
    const serializedSubcategories = JSON.parse(JSON.stringify(subcategoriesWithPath));

    const serializedProducts = products.map((prod: any) => 
      JSON.parse(JSON.stringify({
        _id: prod._id.toString(),
        name: prod.name,
        slug: prod.slug,
        price: prod.price,
        images: prod.images || [],
        image: prod.image || (prod.images && prod.images[0]) || '',
        categoryId: prod.categoryId ? prod.categoryId.toString() : null,
        rating: prod.rating || 0,
        reviewCount: prod.reviewCount || 0
      }))
    );

    // JSON-LD Schema
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "خانه",
          "item": baseUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "دسته‌بندی‌ها",
          "item": `${baseUrl}/categories`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": categoryData.name,
          "item": `${baseUrl}/category/${slug}`
        }
      ]
    };

    return (
      <>
        {/* JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema)
          }}
        />

        {/* محتوای صفحه */}
        <CategoryClient 
          category={serializedCategory} 
          products={serializedProducts}
          subcategories={serializedSubcategories}
          slug={slug}
        />
      </>
    );
  } catch (error) {
    console.error('خطا در دریافت اطلاعات:', error);
    notFound();
  }
}
