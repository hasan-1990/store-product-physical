'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useProducts, useDeleteProduct, useCategories } from '@/hooks/useApi';

interface Product {
  _id: string;
  sequentialId?: number;
  name: string;
  slug?: string;
  categoryPath?: Array<{ slug: string; name?: string }>;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  imageUrl: string;
  gallery?: string[];
  rating?: number;
  ratingCount?: number;
  active: boolean;
  featured: boolean;
  category?: {
    _id?: string;
    name: string;
    slug?: string;
  } | null;
}

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    productId: '',
    productName: ''
  });

  // React Query hooks
  const { data: productsData, isLoading: loading, error, refetch } = useProducts(100, searchTerm, selectedCategory);
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const deleteProductMutation = useDeleteProduct();

  // Extract products from query data
  const products: Product[] = productsData?.success ? productsData.products || [] : [];
  
  // Extract categories from query data
  const categories = categoriesData?.success ? categoriesData.data || [] : [];

  // Helper function to ensure gallery is an array
  const getGalleryArray = (gallery: any): string[] => {
    if (!gallery) return [];
    if (Array.isArray(gallery)) return gallery;
    if (typeof gallery === 'string') {
      try {
        return JSON.parse(gallery);
      } catch {
        return [];
      }
    }
    return [];
  };

  const handleSearch = () => {
    refetch();
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    setDeleteModal({
      show: true,
      productId,
      productName
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteProductMutation.mutateAsync(deleteModal.productId);
      setDeleteModal({ show: false, productId: '', productName: '' });
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">خطا در دریافت محصولات</h3>
          <p className="text-red-600 text-sm mt-1">{error.message || 'خطای نامشخص'}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" dir="rtl">
      <div className="container mx-auto px-4 py-8 text-right">
        {/* Header */}
        <div className="flex flex-col md:flex-row-reverse justify-between items-center mb-8">
          <div className="md:text-right">
            <h1 className="text-3xl font-bold text-white mb-2">مدیریت محصولات</h1>
            <p className="text-purple-200">مدیریت و ویرایش محصولات فروشگاه</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0 md:flex-row-reverse">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-800/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="نمایش شبکه‌ای"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="نمایش لیستی"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <Link
              href="/admin/products/add"
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg shadow-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
            >
              + افزودن محصول جدید
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
            <div>
              <label className="block text-white text-sm font-medium mb-2">جستجو</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="نام محصول را جستجو کنید..."
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">دسته‌بندی</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                disabled={categoriesLoading}
              >
                <option value="all" className="bg-gray-800">همه دسته‌ها</option>
                {categories
                  .filter((cat: any) => cat.active)
                  .map((category: any) => (
                    <option 
                      key={category._id} 
                      value={category._id} 
                      className="bg-gray-800"
                    >
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
              >
                اعمال فیلتر
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" dir="rtl">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-right">
            <div className="flex items-center justify-between flex-row-reverse gap-4">
              <div className="text-right">
                <p className="text-purple-200 text-sm">کل محصولات</p>
                <p className="text-white text-2xl font-bold">{products.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-right">
            <div className="flex items-center justify-between flex-row-reverse gap-4">
              <div className="text-right">
                <p className="text-purple-200 text-sm">محصولات فعال</p>
                <p className="text-white text-2xl font-bold">{products.filter(p => p.active).length}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-right">
            <div className="flex items-center justify-between flex-row-reverse gap-4">
              <div className="text-right">
                <p className="text-purple-200 text-sm">محصولات ویژه</p>
                <p className="text-white text-2xl font-bold">{products.filter(p => p.featured).length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-right">
            <div className="flex items-center justify-between flex-row-reverse gap-4">
              <div className="text-right">
                <p className="text-purple-200 text-sm">کم موجود</p>
                <p className="text-white text-2xl font-bold">{products.filter(p => p.stock < 10).length}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'}>
          {products.map(product => {
            const galleryArray = getGalleryArray(product.gallery);
            const publicUrl = (() => {
              if (product.slug && product.sequentialId && product.categoryPath && product.categoryPath.length) {
                const catSegments = product.categoryPath.map(c => c.slug).join('/');
                return `/products/${catSegments}/${product.slug}-${product.sequentialId}`;
              }
              if (product.slug && product.sequentialId) {
                return `/products/${product.slug}-${product.sequentialId}`;
              }
              return '';
            })();
            return (
              <div
                key={product._id}
                className={viewMode === 'grid'
                  ? 'bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105'
                  : 'bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 p-6 flex items-center gap-6'}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="relative h-64 overflow-hidden">
                      <Image src={product.imageUrl || '/placeholder.jpg'} alt={product.name} fill className="object-cover transition-transform duration-300 hover:scale-110" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" />
                      <div className="absolute top-3 right-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{product.active ? 'فعال' : 'غیرفعال'}</span>
                      </div>
                      {product.featured && (
                        <div className="absolute top-3 left-3">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500 text-white">ویژه</span>
                        </div>
                      )}
                      {product.stock < 10 && (
                        <div className="absolute bottom-3 right-3">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500 text-white">کم موجود</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold mb-1 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[10px] font-mono text-purple-300 bg-white/5 px-2 py-1 rounded border border-white/10" title={product.sequentialId ? `sequentialId ${product.sequentialId}` : product._id}>ID: {product.sequentialId ? product.sequentialId : product._id}</div>
                        <button type="button" onClick={() => navigator.clipboard.writeText(String(product.sequentialId ?? product._id))} className="text-[10px] text-purple-200 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 px-2 py-1 rounded transition-colors" title="کپی شناسه">کپی</button>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-purple-200 text-lg font-bold">{formatPrice(product.price)} تومان</span>
                          {product.originalPrice && product.originalPrice > product.price && (<span className="text-gray-400 text-sm line-through mr-2">{formatPrice(product.originalPrice)}</span>)}
                        </div>
                        <div className="text-purple-200 text-sm">موجودی: {product.stock}</div>
                      </div>
                      {product.category && (<div className="mb-3"><span className="text-xs text-purple-300 bg-white/10 px-2 py-1 rounded-full">{typeof product.category === 'string' ? product.category : product.category.name}</span></div>)}
                      {galleryArray.length > 0 && (
                        <div className="mb-3">
                          <div className="flex -space-x-2">
                            {galleryArray.slice(0, 4).map((img, idx) => (
                              <div key={idx} className="w-8 h-8 rounded-lg border-2 border-white/20 overflow-hidden bg-white/10">
                                <Image src={img} alt={`Gallery ${idx + 1}`} width={32} height={32} className="w-full h-full object-contain" />
                              </div>
                            ))}
                            {galleryArray.length > 4 && (
                              <div className="w-8 h-8 flex-shrink-0 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center">
                                <span className="text-purple-200 text-xs">+{galleryArray.length - 4}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Link href={`/admin/products/${product._id}`} className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors duration-200 text-center text-sm">ویرایش</Link>
                        {publicUrl && (
                          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors duration-200 text-sm flex items-center gap-1" title="مشاهده محصول در سایت">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </a>
                        )}
                        <button onClick={() => handleDeleteProduct(product._id, product.name)} disabled={deleteProductMutation.isPending} className="flex-1 px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors duration-200 text-sm disabled:opacity-50">{deleteProductMutation.isPending ? 'حذف...' : 'حذف'}</button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden relative">
                      <Image src={product.imageUrl || '/placeholder.jpg'} alt={product.name} width={96} height={96} sizes="96px" className="w-full h-full object-contain" />
                      {product.featured && (<span className="absolute top-2 left-2 px-2 py-1 text-[10px] font-bold rounded-full bg-yellow-500 text-white">ویژه</span>)}
                      {product.stock < 10 && (<span className="absolute bottom-2 right-2 px-2 py-1 text-[10px] font-bold rounded-full bg-red-500 text-white">کم موجود</span>)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex flex-col items-start gap-1">
                          <h3 className="text-xl font-bold text-white line-clamp-1">{product.name}</h3>
                          <div className="flex items-center gap-2" title={product.sequentialId ? `sequentialId ${product.sequentialId}` : product._id}>
                            <span className="text-[10px] font-mono text-purple-300 bg-white/5 px-2 py-1 rounded border border-white/10">ID: {product.sequentialId ? product.sequentialId : product._id}</span>
                            <button type="button" onClick={() => navigator.clipboard.writeText(String(product.sequentialId ?? product._id))} className="text-[10px] text-purple-200 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 px-2 py-1 rounded transition-colors" title="کپی شناسه">کپی</button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.active ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-red-500/20 text-red-300 border border-red-400/30'}`}>{product.active ? 'فعال' : 'غیرفعال'}</span>
                          {product.featured && (<span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-400/30">ویژه</span>)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-purple-200 text-lg font-bold">{formatPrice(product.price)} تومان</span>
                            {product.originalPrice && product.originalPrice > product.price && (<span className="text-gray-400 text-sm line-through mr-2">{formatPrice(product.originalPrice)}</span>)}
                          </div>
                          <div className="text-purple-200 text-sm">موجودی: {product.stock}</div>
                          {product.category && (<span className="text-xs text-purple-300 bg-white/10 px-2 py-1 rounded-full">{typeof product.category === 'string' ? product.category : product.category.name}</span>)}
                        </div>
                        <div className="flex items-center gap-2">
                          {product.stock < 10 && (<span className="text-xs text-red-300 bg-red-500/20 px-2 py-1 rounded-full border border-red-400/30">کم موجود</span>)}
                          <div className="flex gap-1">
                            <Link href={`/admin/products/${product._id}`} className="p-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors" title="ویرایش">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </Link>
                            {publicUrl && (
                              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-purple-500/20 border border-purple-400/30 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors" title="مشاهده محصول در سایت">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </a>
                            )}
                            <button onClick={() => handleDeleteProduct(product._id, product.name)} disabled={deleteProductMutation.isPending} className="p-2 bg-red-500/20 border border-red-400/30 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50" title="حذف">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      {galleryArray.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-purple-300">گالری:</span>
                          <div className="flex -space-x-1">
                            {galleryArray.slice(0, 3).map((img, idx) => (
                              <div key={idx} className="w-6 h-6 rounded border border-white/20 overflow-hidden bg-white/10">
                                <Image src={img} alt={`Gallery ${idx + 1}`} width={24} height={24} className="w-full h-full object-contain" />
                              </div>
                            ))}
                            {galleryArray.length > 3 && (
                              <div className="w-6 h-6 flex-shrink-0 bg-white/10 rounded border border-white/20 flex items-center justify-center">
                                <span className="text-purple-200 text-xs">+{galleryArray.length - 3}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-purple-200 text-xl mb-4">محصولی یافت نشد</div>
            <Link
              href="/admin/products/add"
              className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
            >
              + افزودن اولین محصول
            </Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">تایید حذف محصول</h3>
              <p className="text-gray-600 mb-4">
                آیا مطمئن هستید که می‌خواهید محصول "{deleteModal.productName}" را حذف کنید؟
                این عمل غیرقابل بازگشت است.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={deleteProductMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteProductMutation.isPending ? 'در حال حذف...' : 'حذف محصول'}
                </button>
                <button
                  onClick={() => setDeleteModal({ show: false, productId: '', productName: '' })}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
