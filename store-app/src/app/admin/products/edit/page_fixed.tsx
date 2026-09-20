'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface ProductForm {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  type: 'physical' | 'digital';
  stockQuantity: number;
  images: string[];
  isOnSale: boolean;
  tags: string[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  digitalFileUrl?: string;
  downloadLimit?: number;
}

const EditProductContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');
  
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    description: '',
    price: 0,
    category: '',
    type: 'physical',
    stockQuantity: 0,
    images: [],
    isOnSale: false,
    tags: [],
  });

  const categories = [
    'لپ‌تاپ و کامپیوتر',
    'موبایل و تبلت',
    'هدفون و اسپیکر',
    'ساعت هوشمند',
    'لوازم جانبی',
    'گیمینگ',
    'خانه هوشمند',
    'دوربین',
  ];

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        router.push('/admin/products');
        return;
      }

      try {
        // در اینجا باید محصول از API بارگذاری شود
        // برای تست، یک محصول نمونه استفاده می‌کنیم
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const sampleProduct = {
          name: 'محصول نمونه',
          description: 'این یک محصول نمونه است',
          price: 1000000,
          originalPrice: 1200000,
          category: 'لپ‌تاپ و کامپیوتر',
          type: 'physical' as const,
          stockQuantity: 10,
          images: ['/placeholder.jpg'],
          isOnSale: true,
          tags: ['نمونه', 'تست'],
          weight: 500,
          dimensions: {
            length: 30,
            width: 20,
            height: 2
          }
        };

        setFormData(sampleProduct);
        if (sampleProduct.images.length > 0) {
          setImagePreview(sampleProduct.images[0]);
          if (sampleProduct.images.length > 1) {
            setGalleryImages(sampleProduct.images.slice(1));
          }
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoadingProduct(false);
      }
    };

    loadProduct();
  }, [productId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        setImagePreview(imageUrl);
        setFormData(prev => ({
          ...prev,
          images: [imageUrl, ...galleryImages]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        setGalleryImages(prev => [...prev, imageUrl]);
        setFormData(prev => ({
          ...prev,
          images: [imagePreview, ...prev.images.slice(1), imageUrl].filter(Boolean)
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: [imagePreview, ...prev.images.slice(1).filter((_, i) => i !== index)].filter(Boolean)
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  const handleDimensionChange = (dimension: keyof NonNullable<ProductForm['dimensions']>, value: string) => {
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        length: prev.dimensions?.length || 0,
        width: prev.dimensions?.width || 0,
        height: prev.dimensions?.height || 0,
        [dimension]: parseFloat(value) || 0
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // در اینجا باید داده‌ها به API ارسال شوند
      // برای تست، فقط یک تاخیر شبیه‌سازی می‌کنیم
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Updated product data:', formData);
      
      // بازگشت به صفحه لیست محصولات
      router.push('/admin/products');
    } catch (error) {
      console.error('Error updating product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">ویرایش محصول</h1>
          <p className="text-gray-300 mt-1">ویرایش اطلاعات محصول</p>
        </div>
        <Link
          href="/admin/products"
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          بازگشت به لیست
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* اطلاعات اصلی */}
          <div className="lg:col-span-2 space-y-6">
            {/* اطلاعات پایه */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
              <h2 className="text-xl font-bold text-white mb-4">اطلاعات پایه</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">نام محصول *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    placeholder="نام محصول را وارد کنید"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">توضیحات *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    placeholder="توضیحات محصول را وارد کنید"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">دسته‌بندی *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="">انتخاب دسته‌بندی</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">نوع محصول *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="physical">فیزیکی</option>
                      <option value="digital">دیجیتال</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">برچسب‌ها</label>
                  <input
                    type="text"
                    value={formData.tags.join(', ')}
                    onChange={handleTagsChange}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    placeholder="برچسب‌ها را با کاما جدا کنید (مثل: گیمینگ, کیبورد, مکانیکی)"
                  />
                </div>
              </div>
            </div>

            {/* قیمت و موجودی */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
              <h2 className="text-xl font-bold text-white mb-4">قیمت و موجودی</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">قیمت (تومان) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">قیمت اصلی (قبل از تخفیف)</label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice || ''}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">تعداد موجودی *</label>
                    <input
                      type="number"
                      name="stockQuantity"
                      value={formData.stockQuantity}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <input
                      type="checkbox"
                      name="isOnSale"
                      checked={formData.isOnSale}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-purple-600 bg-gray-800 border-purple-500 rounded focus:ring-purple-500"
                    />
                    <label className="text-gray-300">محصول در حراج است</label>
                  </div>
                </div>
              </div>
            </div>

            {/* مشخصات فیزیکی (فقط برای محصولات فیزیکی) */}
            {formData.type === 'physical' && (
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
                <h2 className="text-xl font-bold text-white mb-4">مشخصات فیزیکی</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2">وزن (گرم)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight || ''}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">ابعاد (سانتی‌متر)</label>
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="number"
                        value={formData.dimensions?.length || ''}
                        onChange={(e) => handleDimensionChange('length', e.target.value)}
                        min="0"
                        className="px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                        placeholder="طول"
                      />
                      <input
                        type="number"
                        value={formData.dimensions?.width || ''}
                        onChange={(e) => handleDimensionChange('width', e.target.value)}
                        min="0"
                        className="px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                        placeholder="عرض"
                      />
                      <input
                        type="number"
                        value={formData.dimensions?.height || ''}
                        onChange={(e) => handleDimensionChange('height', e.target.value)}
                        min="0"
                        className="px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                        placeholder="ارتفاع"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* مشخصات دیجیتال (فقط برای محصولات دیجیتال) */}
            {formData.type === 'digital' && (
              <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
                <h2 className="text-xl font-bold text-white mb-4">مشخصات دیجیتال</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2">لینک فایل دانلود</label>
                    <input
                      type="url"
                      name="digitalFileUrl"
                      value={formData.digitalFileUrl || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                      placeholder="https://example.com/file.zip"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">حداکثر تعداد دانلود</label>
                    <input
                      type="number"
                      name="downloadLimit"
                      value={formData.downloadLimit || ''}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* تصاویر */}
          <div className="space-y-6">
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
              <h2 className="text-xl font-bold text-white mb-4">تصاویر محصول</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">تصویر اصلی *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                  />
                </div>
                {imagePreview && (
                  <div className="relative w-full h-48">
                    <Image
                      src={imagePreview}
                      alt="پیش‌نمایش"
                      fill
                      className="rounded-lg object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* گالری تصاویر */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
              <h2 className="text-xl font-bold text-white mb-4">گالری تصاویر</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">تصاویر اضافی</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                  />
                  <p className="text-gray-400 text-sm mt-1">می‌توانید چندین تصویر انتخاب کنید</p>
                </div>
                
                {galleryImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {galleryImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full h-24">
                          <Image
                            src={image}
                            alt={`گالری ${index + 1}`}
                            fill
                            className="rounded-lg object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {galleryImages.length === 0 && (
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                    <div className="text-gray-400">
                      <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                      </svg>
                      <p>هنوز تصویری اضافه نشده است</p>
                      <p className="text-sm">تصاویر گالری را اضافه کنید</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* پیش‌نمایش محصول */}
            <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
              <h2 className="text-xl font-bold text-white mb-4">پیش‌نمایش</h2>
              <div className="space-y-2">
                <div className="text-gray-300">
                  <span className="font-medium">نام:</span> {formData.name || 'نام محصول'}
                </div>
                <div className="text-gray-300">
                  <span className="font-medium">دسته‌بندی:</span> {formData.category || 'نامشخص'}
                </div>
                <div className="text-gray-300">
                  <span className="font-medium">نوع:</span> {formData.type === 'digital' ? 'دیجیتال' : 'فیزیکی'}
                </div>
                <div className="text-gray-300">
                  <span className="font-medium">قیمت:</span> {formData.price.toLocaleString()} تومان
                </div>
                <div className="text-gray-300">
                  <span className="font-medium">موجودی:</span> {formData.stockQuantity}
                </div>
                <div className="text-gray-300">
                  <span className="font-medium">تصاویر:</span> {galleryImages.length + (imagePreview ? 1 : 0)} تصویر
                </div>
                {formData.tags.length > 0 && (
                  <div className="text-gray-300">
                    <span className="font-medium">برچسب‌ها:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* دکمه‌های عمل */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/admin/products"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            لغو
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'در حال بروزرسانی...' : 'بروزرسانی محصول'}
          </button>
        </div>
      </form>
    </div>
  );
};

const EditProduct = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">در حال بارگذاری...</p>
        </div>
      </div>
    }>
      <EditProductContent />
    </Suspense>
  );
};

export default EditProduct;
