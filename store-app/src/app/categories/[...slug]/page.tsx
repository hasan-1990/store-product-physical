import { Metadata } from 'next';
import { connectDB } from '@/lib/mongodb';
import CategoriesClient from '@/components/CategoriesClient';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CategoryWithStats {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  active: boolean;
  featured?: boolean;
  order?: number;
  productCount: number;
  subcategoryCount: number;
  subcategories: { name: string; slug: string }[];
}

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const categorySlug = slug[slug.length - 1];
  
  return {
    title: `${categorySlug} | دسته‌بندی محصولات`,
    description: `مشاهده زیردسته‌های ${categorySlug}`,
  };
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const db = await connectDB();
  
  try {
    // آخرین slug در مسیر، دسته فعلی است
    const currentSlug = slug[slug.length - 1];
    
    // پیدا کردن دسته فعلی
    const currentCategory = await db.categories.findOne({ 
      slug: currentSlug, 
      active: true 
    });

    if (!currentCategory) {
      notFound();
    }

    // پیدا کردن زیردسته‌های این دسته
    const categories = await db.categories.aggregate<CategoryWithStats>([
      {
        $match: {
          active: true,
          $or: [
            { parent: currentCategory._id },
            { parentId: currentCategory._id },
            { parentId: currentCategory._id.toString() },
          ]
        }
      },
      {
        $lookup: {
          from: 'categories',
          let: {
            categoryId: '$_id',
            categoryIdStr: { $toString: '$_id' }
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$active', true] },
                    {
                      $or: [
                        { $eq: ['$parent', '$$categoryId'] },
                        { $eq: ['$parentId', '$$categoryId'] },
                        { $eq: [{ $toString: '$parent' }, '$$categoryIdStr'] },
                        { $eq: [{ $toString: '$parentId' }, '$$categoryIdStr'] },
                      ]
                    }
                  ]
                }
              }
            },
            { $project: { name: 1, slug: 1 } },
            { $sort: { order: 1, name: 1 } }
          ],
          as: 'subcategories'
        }
      },
      {
        $addFields: {
          subcategoryCount: { $size: '$subcategories' },
          subcategories: {
            $map: {
              input: { $slice: ['$subcategories', 5] },
              as: 'sub',
              in: {
                name: '$$sub.name',
                slug: '$$sub.slug'
              }
            }
          }
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
                    { $eq: ['$active', true] },
                    {
                      $or: [
                        { $eq: ['$category', '$$categoryId'] },
                        { $eq: ['$categoryId', '$$categoryId'] },
                        { $in: ['$$categoryId', { $ifNull: ['$categories', []] }] }
                      ]
                    }
                  ]
                }
              }
            }
          ],
          as: 'products'
        }
      },
      {
        $addFields: {
          productCount: { $size: '$products' }
        }
      },
      {
        $project: {
          products: 0
        }
      },
      { $sort: { order: 1, name: 1 } }
    ]).toArray();

    if (categories.length === 0) {
      redirect(`/products/${slug.join('/')}`);
    }

    // تبدیل به plain objects
    const categoriesForClient = categories.map(cat => ({
      _id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || '',
      icon: cat.icon || '',
      active: cat.active,
      featured: cat.featured || false,
      order: cat.order || 0,
      productCount: cat.productCount || 0,
      subcategoryCount: cat.subcategoryCount || 0,
      subcategories: (cat.subcategories || []).map((sub: any) => ({
        name: sub.name,
        slug: sub.slug
      }))
    }));

    return (
      <CategoriesClient 
        initialCategories={categoriesForClient}
        parentCategory={{
          name: currentCategory.name,
          slug: currentCategory.slug
        }}
        currentPath={slug.join('/')}
      />
    );
  } catch (error) {
    console.error('Failed to load category:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">خطا</h1>
        <p className="text-gray-600">خطا در بارگذاری دسته‌بندی. لطفاً دوباره تلاش کنید.</p>
      </div>
    );
  }
}
