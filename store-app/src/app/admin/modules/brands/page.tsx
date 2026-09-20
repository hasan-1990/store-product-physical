'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useBrands, useAddBrand, useUpdateBrand, useDeleteBrand } from '@/hooks/useApi';
import { Brand } from '@/types';
import { deleteImage } from '@/utils/image-helper';

export default function BrandsManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    logo: '',
    color: '#8B5CF6',
    active: true,
    order: 0,
  });
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    brandId: '',
    brandName: ''
  });

  // Gallery modal states
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Message modal states
  const [messageModal, setMessageModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm' | 'info';
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const { data: brandsData, isLoading } = useBrands();
  const addBrandMutation = useAddBrand();
  const updateBrandMutation = useUpdateBrand();
  const deleteBrandMutation = useDeleteBrand();

  const brands: Brand[] = brandsData?.success ? brandsData.data || [] : [];

  // Fetch existing images on mount
  useEffect(() => {
    fetchExistingImages();
  }, []);

  const fetchExistingImages = async () => {
    try {
      console.log('دریافت لیست تصاویر موجود...');
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/uploads/images?_t=${timestamp}`);
      console.log('پاسخ API:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('نتیجه API:', result);
        
        if (result.success) {
          console.log('تصاویر موجود:', result.data);
          const sortedImages = sortImagesByDate(result.data || []);
          console.log('تصاویر مرتب شده:', sortedImages);
          setExistingImages(sortedImages);
        } else {
          console.log('خطا در نتیجه API:', result.message);
        }
      } else {
        console.error('خطا در پاسخ سرور:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching existing images:', error);
    }
  };

  const sortImagesByDate = (images: string[]) => {
    return [...images].sort((a, b) => {
      const filenameA = a.split('/').pop() || '';
      const filenameB = b.split('/').pop() || '';
      
      if (filenameA.includes('-') && filenameB.includes('-')) {
        return filenameB.localeCompare(filenameA);
      }
      
      return filenameB.localeCompare(filenameA);
    });
  };

  const showMessage = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setMessageModal({
      isOpen: true,
      type,
      title,
      message
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setMessageModal({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm,
      onCancel: () => setMessageModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const closeMessageModal = () => {
    setMessageModal(prev => ({ ...prev, isOpen: false }));
  };

  const openGalleryModal = () => {
    setIsGalleryModalOpen(true);
  };

  const closeGalleryModal = () => {
    setIsGalleryModalOpen(false);
  };

  const selectImageFromGallery = (imageUrl: string) => {
    setImagePreview(imageUrl);
    setFormData(prev => ({
      ...prev,
      logo: imageUrl
    }));
    closeGalleryModal();
  };

  const uploadFilesAutomatically = async (files: FileList) => {
    if (files.length === 0) return;

    console.log('شروع آپلود فایل‌ها:', files.length);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
        console.log('اضافه شدن فایل:', file.name);
      });
      formData.append('type', 'gallery');

      console.log('ارسال درخواست آپلود...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('پاسخ سرور:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('نتیجه آپلود:', result);
        
        setExistingImages(prev => {
          const newImages = [...result.urls, ...prev];
          console.log('تصاویر جدید در ابتدا اضافه شدند:', newImages);
          return newImages;
        });
        
        showMessage('success', 'آپلود موفق', `${result.urls.length} تصویر با موفقیت آپلود شد!`);
      } else {
        const errorText = await response.text();
        console.error('خطا در آپلود فایل‌ها:', errorText);
        showMessage('error', 'خطای آپلود', 'خطا در آپلود فایل‌ها');
      }
    } catch (error) {
      console.error('خطا در آپلود:', error);
      showMessage('error', 'خطای شبکه', 'خطا در آپلود فایل‌ها');
    }
  };

  const deleteImageFromServer = async (imageUrl: string) => {
    try {
      console.log('🗑️ شروع حذف تصویر:', imageUrl);
      
      // استفاده از helper جدید
      const result = await deleteImage({
        imageUrl,
        type: 'brand',
        // documentId: editingBrand?._id // اگر در حال ویرایش هستیم
      });

      if (result.success) {
        console.log('✅ نتیجه حذف:', result);
        
        setExistingImages(prev => {
          const filtered = prev.filter(img => img !== imageUrl);
          console.log(`🔄 تصاویر باقی‌مانده: ${filtered.length} از ${prev.length}`);
          return filtered;
        });
        
        if (imagePreview === imageUrl) {
          setImagePreview('');
          setFormData(prev => ({ ...prev, logo: '' }));
        }
        
        console.log('🎉 تصویر با موفقیت حذف شد');
        showMessage('success', 'حذف موفق', 'تصویر با موفقیت حذف شد!');
      } else {
        console.error('❌ خطا در حذف:', result.error);
        showMessage('error', 'خطای حذف', result.error || 'خطا در حذف تصویر');
      }
    } catch (error) {
      console.error('💥 خطای شبکه در حذف تصویر:', error);
      showMessage('error', 'خطای شبکه', 'خطای شبکه در حذف تصویر');
    }
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name,
        slug: brand.slug,
        description: brand.description || '',
        logo: brand.logo,
        color: brand.color || '#8B5CF6',
        active: brand.active,
        order: brand.order,
      });
      setImagePreview(brand.logo);
    } else {
      setEditingBrand(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        logo: '',
        color: '#8B5CF6',
        active: true,
        order: 0,
      });
      setImagePreview('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBrand) {
        await updateBrandMutation.mutateAsync({
          id: editingBrand._id!,
          data: formData
        });
      } else {
        await addBrandMutation.mutateAsync(formData);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving brand:', error);
    }
  };

  const handleDelete = (brandId: string, brandName: string) => {
    setDeleteModal({
      show: true,
      brandId,
      brandName
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteBrandMutation.mutateAsync(deleteModal.brandId);
      setDeleteModal({ show: false, brandId: '', brandName: '' });
    } catch (error) {
      console.error('Error deleting brand:', error);
    }
  };

  const clearImage = () => {
    setImagePreview('');
    setFormData(prev => ({
      ...prev,
      logo: ''
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-آ-ی]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-48"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">مدیریت برندها</h1>
          <p className="text-purple-200">مدیریت و ویرایش برندهای فروشگاه</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="w-full md:w-96">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجوی برند..."
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg"
            >
              + افزودن برند جدید
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" dir="rtl">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <p className="text-purple-200 text-sm">کل برندها</p>
                <p className="text-white text-2xl font-bold">{brands.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <p className="text-purple-200 text-sm">برندهای فعال</p>
                <p className="text-white text-2xl font-bold">{brands.filter(b => b.active).length}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between flex-row-reverse">
              <div className="text-right">
                <p className="text-purple-200 text-sm">محصولات با برند</p>
                <p className="text-white text-2xl font-bold">
                  {brands.reduce((sum, b) => sum + (b.productCount || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBrands.map(brand => (
            <div
              key={brand._id}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-purple-400 transition-all duration-300 group"
            >
              <div className="flex flex-col items-center text-center">
                {/* Logo */}
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-4 overflow-hidden border-2 border-white/30 group-hover:border-purple-400 transition-all">
                  {brand.logo ? (
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-white font-bold text-lg mb-2">{brand.name}</h3>

                {/* Description */}
                {brand.description && (
                  <p className="text-purple-200 text-sm mb-3 line-clamp-2">{brand.description}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <span className={`px-2 py-1 rounded ${brand.active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                    {brand.active ? 'فعال' : 'غیرفعال'}
                  </span>
                  <span className="text-purple-200">
                    {brand.productCount || 0} محصول
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => handleOpenModal(brand)}
                    className="flex-1 px-3 py-2 bg-blue-500/80 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => handleDelete(brand._id!, brand.name)}
                    className="flex-1 px-3 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBrands.length === 0 && (
          <div className="text-center py-12">
            <p className="text-purple-200 text-lg">هیچ برندی یافت نشد</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-purple-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingBrand ? 'ویرایش برند' : 'افزودن برند جدید'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">نام برند *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (!editingBrand) {
                      setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                    }
                  }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:ring-2 focus:ring-purple-400"
                  placeholder="مثال: سامسونگ"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">شناسه یکتا (Slug) *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:ring-2 focus:ring-purple-400"
                  placeholder="samsung"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">توضیحات</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:ring-2 focus:ring-purple-400"
                  rows={3}
                  placeholder="توضیحات کوتاه درباره برند..."
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">لوگو برند *</label>
                
                {/* Current Image Preview */}
                {imagePreview ? (
                  <div className="mb-4">
                    <div className="relative inline-block">
                      <Image
                        src={imagePreview}
                        alt="پیش‌نمایش لوگو"
                        width={128}
                        height={128}
                        className="w-32 h-32 object-cover rounded-full border-2 border-purple-400"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-purple-400/50 rounded-lg p-8 text-center mb-4">
                    <svg className="w-12 h-12 mx-auto text-purple-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-purple-300 text-sm">کلیک کنید تا لوگو انتخاب کنید</p>
                  </div>
                )}

                {/* Button to Open Gallery */}
                <button
                  type="button"
                  onClick={openGalleryModal}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-3 border border-purple-500/50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  انتخاب لوگو از گالری
                </button>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">رنگ برند</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-12 rounded-lg cursor-pointer border-2 border-white/30"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-purple-400"
                    placeholder="#8B5CF6"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">ترتیب نمایش</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">وضعیت</label>
                  <select
                    value={formData.active ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="true">فعال</option>
                    <option value="false">غیرفعال</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={addBrandMutation.isPending || updateBrandMutation.isPending}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                >
                  {addBrandMutation.isPending || updateBrandMutation.isPending
                    ? 'در حال ذخیره...'
                    : editingBrand
                    ? 'بروزرسانی برند'
                    : 'افزودن برند'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-purple-900 rounded-2xl p-8 max-w-md w-full border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">تأیید حذف</h3>
            <p className="text-purple-200 mb-6">
              آیا از حذف برند &quot;{deleteModal.brandName}&quot; اطمینان دارید؟
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmDelete}
                disabled={deleteBrandMutation.isPending}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteBrandMutation.isPending ? 'در حال حذف...' : 'بله، حذف شود'}
              </button>
              <button
                onClick={() => setDeleteModal({ show: false, brandId: '', brandName: '' })}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">انتخاب لوگو برند</h3>
                <span className="text-gray-400">({existingImages.length} تصویر)</span>
              </div>
              <button
                onClick={closeGalleryModal}
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Upload Section */}
            <div className="p-6 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => document.getElementById('gallery-upload-input')?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  آپلود جدید
                </button>
                <input
                  id="gallery-upload-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      uploadFilesAutomatically(e.target.files);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />
                <input
                  type="text"
                  placeholder="جستجو در تصاویر..."
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                فایل‌های انتخاب شده خودکار آپلود خواهند شد
              </p>
            </div>

            {/* Images Grid */}
            <div className="p-4 overflow-y-auto flex-1">
              {existingImages.length > 0 ? (
                <div className="grid grid-cols-9 gap-3">
                  {existingImages.map((imageUrl, index) => {
                    const fileName = imageUrl.split('/').pop()?.split('.')[0] || '';
                    const fileExtension = imageUrl.split('.').pop()?.toUpperCase() || '';
                    
                    return (
                      <div
                        key={index}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all aspect-square ${
                          imagePreview === imageUrl ? 'border-green-400 ring-2 ring-green-400/30' : 'border-gray-600 hover:border-purple-400'
                        }`}
                        onClick={() => selectImageFromGallery(imageUrl)}
                      >
                        <img
                          src={imageUrl}
                          alt={`تصویر ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Selected indicator */}
                        {imagePreview === imageUrl && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            showConfirm(
                              'تأیید حذف', 
                              `آیا مطمئن هستید که می‌خواهید این تصویر را حذف کنید؟\n\n${imageUrl.split('/').pop()}`,
                              async () => {
                                await deleteImageFromServer(imageUrl);
                              }
                            );
                          }}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 text-white shadow-lg z-10"
                          title="حذف تصویر"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        
                        {/* File info */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="text-xs truncate" title={fileName}>
                            {fileName.length > 12 ? fileName.substring(0, 12) + '...' : fileName}
                          </div>
                          <div className="text-xs text-gray-300">
                            {fileExtension}
                          </div>
                        </div>

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg">هیچ تصویری یافت نشد</p>
                  <p className="text-sm mt-2">برای شروع، تصویر جدیدی آپلود کنید</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={closeGalleryModal}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-gradient-to-br from-slate-800 to-purple-900 rounded-2xl p-8 max-w-md w-full border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">{messageModal.title}</h3>
            <p className="text-purple-200 mb-6 whitespace-pre-line">{messageModal.message}</p>
            <div className="flex gap-4">
              {messageModal.type === 'confirm' ? (
                <>
                  <button
                    onClick={() => {
                      messageModal.onConfirm?.();
                      closeMessageModal();
                    }}
                    className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    بله
                  </button>
                  <button
                    onClick={() => {
                      messageModal.onCancel?.();
                      closeMessageModal();
                    }}
                    className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    خیر
                  </button>
                </>
              ) : (
                <button
                  onClick={closeMessageModal}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  بستن
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
