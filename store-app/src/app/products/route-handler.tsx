'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { ProductCard } from '@/components';
import ProductFilter from '@/components/ProductFilter';
import Head from 'next/head';
import HiddenSEOContent, { HiddenStructuredContent, HiddenKeywords, HiddenDescription } from '@/components/SEO/HiddenSEOContent';
import { CategoryHiddenSEOGenerator } from '@/lib/hidden-seo-generator';
import { ProductListSchema, CategorySchema, BreadcrumbSchema } from '@/components/SEO/ProductSchema';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  categorySlug: string;
  rating: number;
  reviewsCount: number;
  stock: number;
  featured: boolean;
  _id?: string;
  sequentialId?: number;
  slug?: string;
  imageUrl?: string;
  categoryPath?: any[];
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  parentId?: string;
  level: number;
}

export interface ProductsClientProps {
  initialCategory?: string;
  isFromSlug?: boolean;
}

export default function ProductsClient({ initialCategory = 'همه', isFromSlug = false }: ProductsClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 20000000 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Update selectedCategory when URL changes
  useEffect(() => {
    if (isFromSlug) {
      // اگر از route slug آمده، مستقیماً از initialCategory استفاده کن
      if (categories.length > 0) {
        const categoryObj = categories.find(cat => cat.slug === initialCategory);
        setSelectedCategory(categoryObj ? categoryObj.name : initialCategory);
      } else {
        setSelectedCategory(initialCategory);
      }
    } else {
      // اگر از query parameter آمده
      const categoryFromUrl = searchParams.get('category') || 'همه';
      
      if (categoryFromUrl !== 'همه' && categories.length > 0) {
        const categoryObj = categories.find(cat => cat.slug === categoryFromUrl || cat.name === categoryFromUrl);
        setSelectedCategory(categoryObj ? categoryObj.name : categoryFromUrl);
      } else {
        setSelectedCategory(categoryFromUrl);
      }
    }
  }, [searchParams, categories, initialCategory, isFromSlug]);

  // Load products and categories from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const productsResponse = await fetch('/api/products?limit=100');
        const categoriesResponse = await fetch('/api/categories?limit=100');
        
        if (productsResponse.ok && categoriesResponse.ok) {
          const productsData = await productsResponse.json();
          const categoriesData = await categoriesResponse.json();
          
          if (productsData.success && productsData.products && Array.isArray(productsData.products)) {
            const transformedProducts = productsData.products.map((product: any) => {
              let cSlug = '';
              let cName = 'بدون دسته';
              
              if (product.category?.slug) {
                cSlug = product.category.slug;
                cName = product.category.name;
              } else if (Array.isArray(product.categoryPath) && product.categoryPath.length > 0) {
                const lastCat = product.categoryPath[product.categoryPath.length - 1];
                cSlug = lastCat?.slug || '';
                cName = lastCat?.name || 'بدون دسته';
              } else if (product.categorySlug) {
                cSlug = product.categorySlug;
              }

              return {
                id: product._id || product.id,
                _id: product._id,
                sequentialId: product.sequentialId,
                slug: product.slug,
                name: product.name,
                description: product.description || '',
                price: Number(product.price),
                originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
                image: product.imageUrl || product.image || '/placeholder-image.jpg',
                imageUrl: product.imageUrl || product.image,
                category: cName,
                categorySlug: cSlug,
                categoryPath: product.categoryPath,
                rating: product.rating || 4.5,
                reviewsCount: product.ratingCount || product.reviewsCount || 0,
                stock: product.stock || 0,
                featured: product.featured || false
              };
            });
            setProducts(transformedProducts);
            setFilteredProducts(transformedProducts);
            
            if (categoriesData.success && categoriesData.data && Array.isArray(categoriesData.data)) {
              const categoriesWithDetails: Category[] = categoriesData.data.map((cat: any) => ({
                _id: cat._id,
                name: cat.name,
                slug: cat.slug,
                parentId: cat.parentId || undefined,
                level: cat.level || 0
              }));
              
              setCategories(categoriesWithDetails);
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];

    console.log('🔍 Debug Filter Info:', {
      selectedCategory,
      totalProducts: products.length,
      sampleProduct: products[0] ? {
        category: products[0].category,
        categorySlug: products[0].categorySlug,
        name: products[0].name
      } : null
    });

    if (selectedCategory !== 'همه' && selectedCategory.trim() !== '') {
      console.log('🔍 Filtering by category:', selectedCategory);
      filtered = filtered.filter(product => {
        // بررسی هم با نام دسته‌بندی و هم با slug
        const match = product.category === selectedCategory || 
                     product.categorySlug === selectedCategory ||
                     // همچنین category object ممکن است نام داشته باشد
                     (typeof product.category === 'object' && 
                      (product.category as any)?.name === selectedCategory) ||
                     (typeof product.category === 'object' && 
                      (product.category as any)?.slug === selectedCategory);
        
        if (!match) {
          console.log('❌ Product not matched:', {
            productName: product.name,
            productCategory: product.category,
            productCategorySlug: product.categorySlug,
            searchingFor: selectedCategory
          });
        }
        return match;
      });
      console.log('🔍 Filtered products count:', filtered.length);
    }

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered = filtered.filter(product =>
      product.price >= priceRange.min && product.price <= priceRange.max
    );

    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => {
          if (typeof a.id === 'string' && typeof b.id === 'string') {
            return b.id.localeCompare(a.id);
          }
          return String(b.id).localeCompare(String(a.id));
        });
        break;
      case 'featured':
      default:
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, sortBy, priceRange, searchQuery]);

  const addToCart = async (productId: string) => {
    setAddingToCart(productId);

    try {
      const sessionId = localStorage.getItem('cart_session_id') || 
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (!localStorage.getItem('cart_session_id')) {
        localStorage.setItem('cart_session_id', sessionId);
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        alert('محصول با موفقیت به سبد خرید اضافه شد!');
      } else {
        throw new Error(result.error || 'خطا در افزودن به سبد خرید');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('خطا در افزودن محصول به سبد خرید. لطفا دوباره تلاش کنید.');
    } finally {
      setAddingToCart(null);
    }
  };

  const buildCategoryPath = (categoryId: string, categoriesList: Category[]): string[] => {
    const category = categoriesList.find(cat => cat._id === categoryId);
    if (!category) return [];
    
    if (category.parentId) {
      const parentPath = buildCategoryPath(category.parentId, categoriesList);
      return [...parentPath, category.slug];
    }
    
    return [category.slug];
  };

  const handleCategoryChange = (category: string) => {
    console.log('📁 Category changed to:', category);
    
    // ✅ شروع animation
    setIsTransitioning(true);
    
    // ✅ استفاده از startTransition برای smooth transition بدون flash
    startTransition(() => {
      setSelectedCategory(category);
      // پایان animation بعد از اتمام transition
      setTimeout(() => setIsTransitioning(false), 500);
    });
    
    // ✅ تغییر URL بدون re-render با استفاده از History API
    const categoryObj = categories.find(cat => cat.name === category || cat.slug === category);
    const categorySlug = categoryObj?.slug || category;
    
    let newUrl = '/products';
    
    if (category !== 'همه') {
      // ✅ ساخت مسیر کامل دسته‌بندی (با parent categories)
      let fullPath = categorySlug;
      
      if (categoryObj && categoryObj.parentId) {
        const pathSegments = buildCategoryPath(categoryObj._id, categories);
        fullPath = pathSegments.join('/');
        console.log('📁 Full category path:', fullPath);
      }
      
      newUrl = `/products/${fullPath}`;
    }
    
    // ✅ استفاده از History API بجای router.replace - بدون re-render!
    window.history.replaceState(null, '', newUrl);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">در حال بارگذاری محصولات...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50" dir="rtl">
      <ProductListSchema 
        products={filteredProducts} 
        category={selectedCategory !== 'همه' ? selectedCategory : undefined}
      />
      {selectedCategory !== 'همه' && (
        <CategorySchema 
          categoryName={selectedCategory}
          productCount={filteredProducts.length}
        />
      )}
      <BreadcrumbSchema 
        items={[
          { name: 'خانه', url: '/' },
          { name: 'محصولات', url: '/products' },
          ...(selectedCategory !== 'همه' ? [{ name: selectedCategory, url: `/products/${selectedCategory}` }] : [])
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <ProductFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              sortBy={sortBy}
              onSortChange={setSortBy}
              totalProducts={filteredProducts.length}
            />
          </div>

          <div className="lg:w-3/4">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 mb-6 border border-purple-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {selectedCategory === 'همه' ? '🛍️ همه محصولات' : `📦 ${selectedCategory}`}
                  </h2>
                  <p className="text-purple-100">
                    ✨ {filteredProducts.length} محصول موجود است
                  </p>
                </div>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-purple-100">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">😔 هیچ محصولی یافت نشد</h3>
                  <p className="text-gray-600 mb-6">متأسفانه محصولی با فیلترهای انتخابی شما پیدا نشد.</p>
                  <button
                    onClick={() => {
                      setSelectedCategory('همه');
                      setPriceRange({ min: 0, max: 20000000 });
                      setSortBy('featured');
                      setSearchQuery('');
                    }}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    پاک کردن فیلترها
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                style={{ 
                  opacity: isTransitioning ? 0 : 1,
                  transition: 'opacity 0.1s ease-in-out'
                }}
              >
                {filteredProducts.map((product, index) => (
                  <div
                    key={`${product.id}-${selectedCategory}`}
                    className="transition-all duration-300"
                    style={{
                      opacity: isTransitioning ? 0 : 1,
                      transform: isTransitioning ? 'translateY(10px)' : 'translateY(0)',
                      transition: `opacity 0.4s ease-out ${index * 0.03}s, transform 0.4s ease-out ${index * 0.03}s`
                    }}
                  >
                    <ProductCard product={product} onAddToCart={addToCart} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
