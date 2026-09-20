import { Metadata } from 'next';
import { connectDB } from '@/lib/mongodb';
import CategoriesClient from '@/components/CategoriesClient';

// این صفحه باید بر اساس searchParams (مثل ?parent=...) رندر شود
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

export const metadata: Metadata = {
  title: 'دسته‌بندی محصولات | فروشگاه',
  description: 'مشاهده تمام دسته‌بندی‌های محصولات و انتخاب دسته مورد نظر شما',
  openGraph: {
    title: 'دسته‌بندی محصولات',
    description: 'مشاهده تمام دسته‌بندی‌های محصولات',
    type: 'website',
  },
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ parent?: string }>;
}) {
  const db = await connectDB();
  const params = await searchParams;
  const parentSlug = params?.parent;

  try {
    let parentCategory = null;
    
    // اگر parentSlug وجود داشت، دسته مادر رو پیدا کن
    if (parentSlug) {
      parentCategory = await db.categories.findOne({ slug: parentSlug, active: true });
    }

    // Get categories with product and subcategory counts
    // نکته مهم: برای «دسته مادر»، باید هم parent و هم parentId خالی باشند.
    // چون بعضی داده‌ها فقط یکی از این دو فیلد را دارند.
    const matchQuery: any = { active: true };

    if (parentSlug && parentCategory) {
      // فقط زیردسته‌های این دسته رو نشون بده (پوشش هر دو فیلد parent / parentId)
      matchQuery.$or = [
        { parent: parentCategory._id },
        { parentId: parentCategory._id },
        // در صورتی که بعضی رکوردها parentId را string ذخیره کرده باشند
        { parentId: parentCategory._id.toString?.() || String(parentCategory._id) },
      ];
    } else {
      // فقط دسته‌های اصلی رو نشون بده
      matchQuery.$and = [
        {
          $or: [
            { parent: { $exists: false } },
            { parent: null },
          ],
        },
        {
          $or: [
            { parentId: { $exists: false } },
            { parentId: null },
          ],
        },
      ];
    }

    const categories = await db.categories.aggregate<CategoryWithStats>([
      {
        $match: matchQuery
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

    // Convert all MongoDB objects to plain JavaScript objects
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
        parentCategory={parentCategory ? {
          name: parentCategory.name,
          slug: parentCategory.slug
        } : null}
        currentPath={parentCategory?.slug ?? ''}
      />
    );
  } catch (error) {
    console.error('Failed to load categories:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">دسته‌بندی محصولات</h1>
        <p className="text-gray-600">خطا در بارگذاری دسته‌بندی‌ها. لطفاً دوباره تلاش کنید.</p>
      </div>
    );
  }
}