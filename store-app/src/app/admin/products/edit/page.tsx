'use client';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { slugify } from '@/utils/helpers';
import FileManagerModal from '@/components/FileManagerModal';

interface Category {
  _id: string;
  name: string;
  slug: string;
  level?: number;
  parentId?: string | null;
  active?: boolean;
  order?: number;
}

function EditProductPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [newProduct, setNewProduct] = useState({
    name: '',
    slug: '',
    category: '',
    price: '',
    originalPrice: '',
    stock: '',
    weight: '',
    description: '',
    status: 'active',
    productType: 'PHYSICAL', // PHYSICAL یا DIGITAL
    image: '', // عکس اصلی محصول
    gallery: [] as string[],
    tags: [] as string[],
    // فیلدهای محصولات دیجیتال
    downloadUrl: '',
    fileSize: '',
    fileFormat: '',
    downloadLimit: '',
    previewUrl: '', // لینک پیش‌نمایش زنده برای قالب‌ها و محصولات دیجیتال
    // فیلدهای جدید برای جزئیات محصول
    keyFeatures: [] as string[],
    whatIncluded: [] as string[],
    technicalSpecs: {
      weight: '',
      dimensions: '',
      material: '',
      brand: '',
      warranty: '',
      origin: ''
    },
    // اطلاعات اضافی محصول
    productBenefits: [] as string[],
    shippingInfo: ''
  });

  const [currentTag, setCurrentTag] = useState('');
  // Track if user manually edited slug so we stop auto-regeneration
  const [slugEdited, setSlugEdited] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null); // فایل عکس اصلی
  const [digitalFile, setDigitalFile] = useState<File | null>(null); // فایل محصول دیجیتال
  
  // State های جدید برای فیلدهای جزئیات محصول
  const [currentKeyFeature, setCurrentKeyFeature] = useState('');
  const [currentIncludedItem, setCurrentIncludedItem] = useState('');
  const [currentBenefit, setCurrentBenefit] = useState('');
  
  // برای فایل منیجر
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  
  // برای گالری تصاویر از سرور
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isMainImageSelection, setIsMainImageSelection] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>([]);

  // برای مودال پیام‌ها
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

  // توابع مودال پیام
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

  // Fetch categories and existing images from API
  useEffect(() => {
    fetchCategories();
    fetchExistingImages();
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    if (!productId) {
      router.push('/admin/products');
      return;
    }

    try {
      setLoadingProduct(true);
      const response = await fetch(`/api/products/${productId}`);
      const result = await response.json();
      
      if (result.success) {
        const product = result.data;
        
        console.log('📦 Product loaded:', {
          productType: product.productType,
          downloadUrl: product.downloadUrl
        });
        
        // Map API data to form state
        setNewProduct({
          name: product.name || '',
          slug: product.slug || '',
          category: product.categoryId || '',
          price: product.price?.toString() || '',
          originalPrice: product.originalPrice?.toString() || '',
          stock: product.stock?.toString() || '',
          weight: product.weight?.toString() || '',
          description: product.description || '',
          status: product.active ? 'active' : 'inactive',
          productType: product.productType || 'PHYSICAL',
          image: product.imageUrl || '',
          gallery: product.gallery || [],
          tags: product.tags || [],
          downloadUrl: product.downloadUrl || '',
          fileSize: product.fileSize?.toString() || '',
          fileFormat: product.fileFormat || '',
          downloadLimit: product.downloadLimit?.toString() || '',
          previewUrl: product.previewUrl || '', // لینک پیش‌نمایش زنده
          keyFeatures: product.keyFeatures || [],
          whatIncluded: product.whatIncluded || [],
          technicalSpecs: product.technicalSpecs || {
            weight: '',
            dimensions: '',
            material: '',
            brand: '',
            warranty: '',
            origin: ''
          },
          productBenefits: product.productBenefits || [],
          shippingInfo: product.shippingInfo || ''
        });
      } else {
        showMessage('error', 'خطا', 'محصول یافت نشد');
        router.push('/admin/products');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      showMessage('error', 'خطا', 'خطا در بارگذاری محصول');
    } finally {
      setLoadingProduct(false);
    }
  };

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

  const fetchCategories = async () => {
    try {
      console.log('🔄 Fetching categories...');
      const response = await fetch('/api/categories?active=true&limit=100');
      const result = await response.json();
      console.log('📊 Categories API Response:', result);
      
      if (result.success) {
        console.log('✅ Found', result.data?.length || 0, 'categories');
        setCategories(result.data || []);
      } else {
        console.error('❌ Categories API Error:', result.error);
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
    }
  };

  // Create hierarchical category structure for display
  const buildCategoryHierarchy = () => {
    console.log('🏗️ Building category hierarchy with categories:', categories);
    
    if (!categories || categories.length === 0) {
      return [];
    }
    
    const rootCategories = categories.filter(cat => (cat.level === 0 || !cat.level) && (!cat.parentId || cat.parentId === null));
    const result: any[] = [];

    const processCategory = (category: any, level: number = 0) => {
      const prefix = '─'.repeat(level * 2);
      result.push({
        ...category,
        displayName: level === 0 ? category.name : `${prefix} ${category.name}`,
        indent: level
      });

      // Find children
      const children = categories.filter(cat => cat.parentId === category._id);
      children.forEach(child => {
        processCategory(child, level + 1);
      });
    };

    rootCategories.forEach(cat => processCategory(cat));
    console.log('📋 Hierarchical categories result:', result);
    return result;
  };

  const hierarchicalCategories = buildCategoryHierarchy();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setNewProduct(prev => ({
      ...prev,
      name,
      // دیگر تولید خودکار slug نداریم؛ فقط نام را ذخیره می‌کنیم
      slug: prev.slug
    }));
  };

  // Handle digital file upload
  const handleDigitalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDigitalFile(file);
      setNewProduct(prev => ({
        ...prev,
        fileSize: Math.round(file.size / 1024 / 1024).toString(), // MB
        fileFormat: file.name.split('.').pop() || ''
      }));
    }
  };

  // Handle main image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewProduct(prev => ({
          ...prev,
          image: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle removing gallery image
  const removeGalleryImage = (imageUrl: string) => {
    showConfirm(
      'حذف تصویر',
      'آیا از حذف این تصویر اطمینان دارید؟',
      () => {
        setNewProduct(prev => ({
          ...prev,
          gallery: prev.gallery.filter(img => img !== imageUrl)
        }));
      }
    );
  };

  // Open gallery modal
  const openGalleryModal = (isMainImage = false) => {
    setIsMainImageSelection(isMainImage);
    setSelectedGalleryImages([]);
    setIsGalleryModalOpen(true);
  };

  // Toggle image selection for gallery
  const toggleImageSelection = (imageUrl: string) => {
    if (isMainImageSelection) {
      // For main image, select immediately and close modal
      setNewProduct(prev => ({ ...prev, image: imageUrl }));
      setIsGalleryModalOpen(false);
    } else {
      // For gallery, add to selection
      setSelectedGalleryImages(prev => {
        if (prev.includes(imageUrl)) {
          return prev.filter(img => img !== imageUrl);
        } else {
          return [...prev, imageUrl];
        }
      });
    }
  };

  // Confirm gallery selection
  const confirmGallerySelection = () => {
    const newImages = selectedGalleryImages.filter(img => !newProduct.gallery.includes(img));
    setNewProduct(prev => ({
      ...prev,
      gallery: [...prev.gallery, ...newImages]
    }));
    setSelectedGalleryImages([]);
    setIsGalleryModalOpen(false);
  };

  // Select image from gallery (old function - keeping for compatibility)
  const selectImageFromGallery = (imageUrl: string) => {
    if (isMainImageSelection) {
      setNewProduct(prev => ({ ...prev, image: imageUrl }));
    } else {
      if (!newProduct.gallery.includes(imageUrl)) {
        setNewProduct(prev => ({
          ...prev,
          gallery: [...prev.gallery, imageUrl]
        }));
      }
    }
    setIsGalleryModalOpen(false);
  };

  // تابع مرتب‌سازی تصاویر
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

  // Tag handling functions
  const addTag = () => {
    if (currentTag.trim() && !newProduct.tags.includes(currentTag.trim())) {
      setNewProduct(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewProduct(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Key features handling
  const addKeyFeature = () => {
    if (currentKeyFeature.trim() && !newProduct.keyFeatures.includes(currentKeyFeature.trim())) {
      setNewProduct(prev => ({
        ...prev,
        keyFeatures: [...prev.keyFeatures, currentKeyFeature.trim()]
      }));
      setCurrentKeyFeature('');
    }
  };

  const removeKeyFeature = (featureToRemove: string) => {
    setNewProduct(prev => ({
      ...prev,
      keyFeatures: prev.keyFeatures.filter(feature => feature !== featureToRemove)
    }));
  };

  // What's included handling
  const addIncludedItem = () => {
    if (currentIncludedItem.trim() && !newProduct.whatIncluded.includes(currentIncludedItem.trim())) {
      setNewProduct(prev => ({
        ...prev,
        whatIncluded: [...prev.whatIncluded, currentIncludedItem.trim()]
      }));
      setCurrentIncludedItem('');
    }
  };

  const removeIncludedItem = (itemToRemove: string) => {
    setNewProduct(prev => ({
      ...prev,
      whatIncluded: prev.whatIncluded.filter(item => item !== itemToRemove)
    }));
  };

  // Product benefits handling
  const addBenefit = () => {
    if (currentBenefit.trim() && !newProduct.productBenefits.includes(currentBenefit.trim())) {
      setNewProduct(prev => ({
        ...prev,
        productBenefits: [...prev.productBenefits, currentBenefit.trim()]
      }));
      setCurrentBenefit('');
    }
  };

  const removeBenefit = (benefitToRemove: string) => {
    setNewProduct(prev => ({
      ...prev,
      productBenefits: prev.productBenefits.filter(benefit => benefit !== benefitToRemove)
    }));
  };

  const handleUpdateProduct = async () => {
    if (!newProduct.name) {
      showMessage('error', 'خطای اعتبارسنجی', 'لطفاً نام محصول را وارد کنید');
      return;
    }

    try {
      setLoading(true);
      
      // آپلود تصاویر اول در صورت تغییر
      let imageUrl = newProduct.image;
      let galleryUrls: string[] = newProduct.gallery;
      let digitalFileUrl = newProduct.downloadUrl;

      // آپلود عکس اصلی در صورت تغییر
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', imageFile);
        imageFormData.append('type', 'image');

        const imageResponse = await fetch('/api/upload', {
          method: 'POST',
          body: imageFormData,
        });

        if (imageResponse.ok) {
          const imageResult = await imageResponse.json();
          imageUrl = imageResult.url;
        }
      }

      // آپلود فایل دیجیتال در صورت تغییر
      if (digitalFile && newProduct.productType === 'DIGITAL') {
        const digitalFormData = new FormData();
        digitalFormData.append('file', digitalFile);

        const digitalResponse = await fetch('/api/upload/product-file', {
          method: 'POST',
          body: digitalFormData,
        });

        if (digitalResponse.ok) {
          const digitalResult = await digitalResponse.json();
          digitalFileUrl = digitalResult.fileUrl;
          setNewProduct(prev => ({
            ...prev,
            downloadUrl: digitalResult.fileUrl,
            fileSize: Math.round(digitalResult.fileSize / 1024 / 1024).toString(),
            fileFormat: digitalResult.fileFormat
          }));
        } else {
          const errorResult = await digitalResponse.json();
          showMessage('error', 'خطای آپلود', `خطا در آپلود فایل: ${errorResult.error}`);
          return;
        }
      }

      // بروزرسانی محصول
      if (!newProduct.slug || !newProduct.slug.trim()) {
        showMessage('error','خطای اعتبارسنجی','وارد کردن slug الزامی است');
        setLoading(false);
        return;
      }

      const productData = {
        name: newProduct.name,
        slug: slugify(newProduct.slug),
        description: newProduct.description || '',
        price: newProduct.price ? parseFloat(newProduct.price) : 0,
        originalPrice: newProduct.originalPrice ? parseFloat(newProduct.originalPrice) : undefined,
        stock: newProduct.productType === 'DIGITAL' ? 999999 : (parseInt(newProduct.stock) || 0),
        weight: newProduct.productType === 'DIGITAL' ? 0 : (parseFloat(newProduct.weight) || 0),
        imageUrl: imageUrl || '',
        gallery: galleryUrls,
        categoryId: newProduct.category || null,
        active: newProduct.status === 'active',
        featured: false,
        productType: newProduct.productType || 'PHYSICAL',
        tags: newProduct.tags,
        // فیلدهای جدید برای جزئیات محصول
        keyFeatures: newProduct.keyFeatures,
        whatIncluded: newProduct.whatIncluded,
        technicalSpecs: newProduct.technicalSpecs,
        productBenefits: newProduct.productBenefits,
        shippingInfo: newProduct.shippingInfo,
        // فیلدهای محصولات دیجیتال
        ...(newProduct.productType === 'DIGITAL' && {
          downloadUrl: digitalFileUrl,
          fileSize: parseFloat(newProduct.fileSize),
          fileFormat: newProduct.fileFormat,
          downloadLimit: newProduct.downloadLimit ? parseInt(newProduct.downloadLimit) : null,
          previewUrl: newProduct.previewUrl || '', // لینک پیش‌نمایش زنده
          isDigital: true // علامت‌گذاری محصول به عنوان دیجیتال
        })
      };

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();
      
      if (result.success) {
        showMessage('success', 'موفقیت', 'محصول با موفقیت بروزرسانی شد!');
        setTimeout(() => {
          router.push('/admin/products');
        }, 2000);
      } else {
        showMessage('error', 'خطا', `خطا: ${result.error}`);
        console.error('Detailed error:', result);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      showMessage('error', 'خطا', 'خطا در بروزرسانی محصول');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">در حال بارگذاری محصول...</div>
      </div>
    );
  }

  if (!productId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">محصول یافت نشد</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.back()}
              className="ml-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-white">ویرایش محصول</h1>
          </div>
          <p className="text-purple-200">اطلاعات محصول را ویرایش کنید</p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          {/* اطلاعات اصلی محصول */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                نام محصول <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newProduct.name}
                onChange={handleNameChange}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="نام محصول را وارد کنید"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Slug
              </label>
              <div className="flex gap-2 items-start">
                <input
                  type="text"
                  value={newProduct.slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setNewProduct(prev => ({ ...prev, slug: slugify(e.target.value) }));
                  }}
                  className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent font-mono"
                  placeholder="product-slug"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSlugEdited(false);
                    setNewProduct(prev => ({ ...prev, slug: slugify(prev.name) }));
                  }}
                  className="px-3 py-2 text-xs rounded-md bg-purple-500/30 hover:bg-purple-500/50 text-white border border-purple-400/40"
                >تولید خودکار</button>
              </div>
              <p className="text-xs text-purple-300 mt-1">
                {slugEdited ? 'ویرایش دستی فعال است – برای بازگردانی تولید خودکار دکمه را بزنید' : 'به صورت خودکار از نام ساخته می‌شود؛ می‌توانید تغییر دهید'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                دسته‌بندی
              </label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              >
                <option value="" className="text-gray-900">انتخاب دسته‌بندی</option>
                {hierarchicalCategories.map((category) => (
                  <option key={category._id} value={category._id} className="text-gray-900">
                    {category.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                نوع محصول
              </label>
              <select
                value={newProduct.productType}
                onChange={(e) => setNewProduct({...newProduct, productType: e.target.value})}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              >
                <option value="PHYSICAL" className="text-gray-900">کالای فیزیکی</option>
                <option value="DIGITAL" className="text-gray-900">کالای دیجیتال</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                قیمت
              </label>
              <input
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="قیمت به تومان"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                قیمت اصلی (اختیاری)
              </label>
              <input
                type="number"
                value={newProduct.originalPrice}
                onChange={(e) => setNewProduct({...newProduct, originalPrice: e.target.value})}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="قیمت اصلی"
              />
            </div>

            {newProduct.productType === 'PHYSICAL' && (
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  موجودی
                </label>
                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="تعداد موجودی"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                وزن (کیلوگرم)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={newProduct.weight}
                onChange={(e) => setNewProduct({...newProduct, weight: e.target.value})}
                disabled={newProduct.productType === 'DIGITAL'}
                className={`w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                  newProduct.productType === 'DIGITAL' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                placeholder="مثال: 0.5"
              />
              <p className="text-xs text-purple-300 mt-1">برای محاسبه هزینه پستی (فقط محصولات فیزیکی)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                وضعیت
              </label>
              <select
                value={newProduct.status}
                onChange={(e) => setNewProduct({...newProduct, status: e.target.value})}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              >
                <option value="active" className="text-gray-900">فعال</option>
                <option value="inactive" className="text-gray-900">غیرفعال</option>
              </select>
            </div>
          </div>

          {/* توضیحات محصول */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-purple-200 mb-2">
              توضیحات محصول
            </label>
            <textarea
              value={newProduct.description}
              onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
              placeholder="توضیحات کامل محصول را وارد کنید..."
            />
          </div>

          {/* تصاویر محصول */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-6">تصاویر محصول</h3>
            
            {/* عکس اصلی */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-purple-200 mb-3">
                عکس اصلی محصول
              </label>
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => openGalleryModal(true)}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  انتخاب از گالری
                </button>
                {newProduct.image && (
                  <div className="relative inline-block">
                    <img
                      src={newProduct.image}
                      alt="عکس اصلی"
                      className="w-40 h-40 object-cover rounded-lg border border-white/30"
                    />
                    <button
                      onClick={() => setNewProduct(prev => ({ ...prev, image: '' }))}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* گالری تصاویر */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-3">
                گالری تصاویر
              </label>
              <button
                type="button"
                onClick={() => openGalleryModal(false)}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors mb-4"
              >
                اضافه کردن تصویر از گالری
              </button>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {newProduct.gallery.map((imageUrl, index) => (
                  <div key={index} className="relative">
                    <img
                      src={imageUrl}
                      alt={`گالری ${index + 1}`}
                      className="w-full h-20 object-cover rounded border border-white/30"
                    />
                    <button
                      onClick={() => removeGalleryImage(imageUrl)}
                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* برچسب‌ها */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-purple-200 mb-2">
              برچسب‌ها
            </label>
            <div className="flex space-x-3 space-x-reverse mb-3">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="برچسب جدید..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                افزودن
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {newProduct.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-purple-600/50 text-purple-100 rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="mr-2 text-purple-200 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Digital Product File Section */}
          {(() => {
            console.log('🔍🔍🔍 productType در edit:', newProduct.productType, 'آیا DIGITAL است?', newProduct.productType === 'DIGITAL');
            return newProduct.productType === 'DIGITAL';
          })() && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-purple-200 mb-2">
                فایل محصول دیجیتال <span className="text-red-400">*</span>
              </label>

              {/* Input مخفی */}
              <input
                type="file"
                accept=".pdf,.zip,.rar,.exe,.apk,.ipa,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                onChange={handleDigitalFileChange}
                className="hidden"
                id="digitalFileEdit"
              />

              {/* دکمه‌های انتخاب فایل */}
              <div className="flex gap-3 mb-4" style={{backgroundColor: 'red', padding: '10px'}}>
                <label
                  htmlFor="digitalFileEdit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  آپلود از کامپیوتر
                </label>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🗂️ باز کردن فایل منیجر...');
                    setIsFileManagerOpen(true);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  انتخاب از فایل منیجر
                </button>
              </div>

              <div className="border-2 border-dashed border-blue-400 rounded-lg p-6 text-center">
                {digitalFile ? (
                  <div className="flex items-center justify-center space-x-3 space-x-reverse">
                    <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-right">
                      <div className="text-blue-300 font-medium">{digitalFile.name}</div>
                      <div className="text-purple-200 text-sm">{Math.round(digitalFile.size / 1024 / 1024)} مگابایت</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setDigitalFile(null);
                        setNewProduct(prev => ({ ...prev, fileSize: '', fileFormat: '', downloadUrl: '' }));
                      }}
                      className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : newProduct.downloadUrl ? (
                  <div className="flex items-center justify-center space-x-3 space-x-reverse">
                    <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-right">
                      <div className="text-green-300 font-medium">فایل از فایل منیجر انتخاب شد</div>
                      <div className="text-purple-200 text-sm truncate max-w-xs">{newProduct.downloadUrl}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setNewProduct(prev => ({ ...prev, fileSize: '', fileFormat: '', downloadUrl: '' }));
                      }}
                      className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-blue-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="block text-blue-300 mt-4">فایل محصول دیجیتال انتخاب نشده</span>
                    <span className="text-purple-200 text-sm block mt-2">از دکمه‌های بالا برای انتخاب فایل استفاده کنید</span>
                    <span className="text-purple-200 text-sm">فرمت‌های پشتیبانی: PDF, ZIP, RAR, EXE, APK, Office</span>
                  </>
                )}
              </div>
              
              {/* Digital Product Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    محدودیت دانلود
                  </label>
                  <input
                    type="number"
                    value={newProduct.downloadLimit}
                    onChange={(e) => setNewProduct({...newProduct, downloadLimit: e.target.value})}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder="تعداد دانلود مجاز (خالی = نامحدود)"
                  />
                  <p className="text-xs text-purple-300 mt-1">حداکثر تعداد دانلود برای هر کاربر</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    اطلاعات فایل
                  </label>
                  <div className="space-y-2">
                    {newProduct.fileSize && (
                      <div className="text-sm text-purple-200">
                        <span className="font-medium">حجم:</span> {newProduct.fileSize} مگابایت
                      </div>
                    )}
                    {newProduct.fileFormat && (
                      <div className="text-sm text-purple-200">
                        <span className="font-medium">فرمت:</span> {newProduct.fileFormat.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* لینک پیش‌نمایش زنده - فقط برای قالب‌ها و محصولات دیجیتال */}
          {newProduct.productType === 'DIGITAL' && (
            <div className="mb-8 p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-xl border-2 border-purple-400/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/30 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">لینک پیش‌نمایش زنده</h3>
                  <p className="text-sm text-purple-200">برای قالب‌ها و محصولات دیجیتال (اختیاری)</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  URL پیش‌نمایش
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={newProduct.previewUrl || ''}
                    onChange={(e) => setNewProduct({...newProduct, previewUrl: e.target.value})}
                    className="w-full px-4 py-3 pl-12 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder="https://demo.example.com"
                    dir="ltr"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-purple-300 mt-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  این لینک برای دکمه "پیش‌نمایش قالب" در صفحه محصول استفاده می‌شود
                </p>
                
                {/* نمایش پیش‌نمایش لینک */}
                {newProduct.previewUrl && (
                  <div className="mt-3 p-3 bg-white/10 rounded-lg border border-purple-400/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-green-300 font-medium">لینک تنظیم شد</span>
                      </div>
                      <a
                        href={newProduct.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        تست لینک
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ویژگی‌های کلیدی */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-purple-200 mb-2">
              ویژگی‌های کلیدی
            </label>
            <div className="flex space-x-3 space-x-reverse mb-3">
              <input
                type="text"
                value={currentKeyFeature}
                onChange={(e) => setCurrentKeyFeature(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyFeature())}
                className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="ویژگی کلیدی جدید..."
              />
              <button
                type="button"
                onClick={addKeyFeature}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                افزودن
              </button>
            </div>
            <div className="space-y-2">
              {newProduct.keyFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20"
                >
                  <span className="text-white">{feature}</span>
                  <button
                    onClick={() => removeKeyFeature(feature)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* موارد موجود در بسته */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-purple-200 mb-2">
              موارد موجود در بسته
            </label>
            <div className="flex space-x-3 space-x-reverse mb-3">
              <input
                type="text"
                value={currentIncludedItem}
                onChange={(e) => setCurrentIncludedItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIncludedItem())}
                className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="مورد جدید در بسته..."
              />
              <button
                type="button"
                onClick={addIncludedItem}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                افزودن
              </button>
            </div>
            <div className="space-y-2">
              {newProduct.whatIncluded.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20"
                >
                  <span className="text-white">{item}</span>
                  <button
                    onClick={() => removeIncludedItem(item)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* مشخصات فنی */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">مشخصات فنی</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">وزن</label>
                <input
                  type="text"
                  value={newProduct.technicalSpecs.weight}
                  onChange={(e) => setNewProduct({
                    ...newProduct,
                    technicalSpecs: { ...newProduct.technicalSpecs, weight: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="وزن محصول"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">ابعاد</label>
                <input
                  type="text"
                  value={newProduct.technicalSpecs.dimensions}
                  onChange={(e) => setNewProduct({
                    ...newProduct,
                    technicalSpecs: { ...newProduct.technicalSpecs, dimensions: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="ابعاد محصول"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">جنس</label>
                <input
                  type="text"
                  value={newProduct.technicalSpecs.material}
                  onChange={(e) => setNewProduct({
                    ...newProduct,
                    technicalSpecs: { ...newProduct.technicalSpecs, material: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="جنس محصول"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">برند</label>
                <input
                  type="text"
                  value={newProduct.technicalSpecs.brand}
                  onChange={(e) => setNewProduct({
                    ...newProduct,
                    technicalSpecs: { ...newProduct.technicalSpecs, brand: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="برند محصول"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">گارانتی</label>
                <input
                  type="text"
                  value={newProduct.technicalSpecs.warranty}
                  onChange={(e) => setNewProduct({
                    ...newProduct,
                    technicalSpecs: { ...newProduct.technicalSpecs, warranty: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="مدت گارانتی"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">کشور سازنده</label>
                <input
                  type="text"
                  value={newProduct.technicalSpecs.origin}
                  onChange={(e) => setNewProduct({
                    ...newProduct,
                    technicalSpecs: { ...newProduct.technicalSpecs, origin: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="کشور سازنده"
                />
              </div>
            </div>
          </div>

          {/* مزایای محصول */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-purple-200 mb-2">
              مزایای محصول
            </label>
            <div className="flex space-x-3 space-x-reverse mb-3">
              <input
                type="text"
                value={currentBenefit}
                onChange={(e) => setCurrentBenefit(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="مزیت جدید محصول..."
              />
              <button
                type="button"
                onClick={addBenefit}
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
              >
                افزودن
              </button>
            </div>
            <div className="space-y-2">
              {newProduct.productBenefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20"
                >
                  <span className="text-white">{benefit}</span>
                  <button
                    onClick={() => removeBenefit(benefit)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* اطلاعات ارسال */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-purple-200 mb-2">
              اطلاعات ارسال
            </label>
            <textarea
              value={newProduct.shippingInfo}
              onChange={(e) => setNewProduct({...newProduct, shippingInfo: e.target.value})}
              rows={3}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
              placeholder="اطلاعات مربوط به ارسال محصول..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 space-x-reverse mt-8">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg transition-colors duration-200"
            >
              انصراف
            </button>
            <button
              onClick={handleUpdateProduct}
              disabled={loading}
              className={`px-6 py-3 rounded-lg transition-colors duration-200 shadow-lg ${
                loading 
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {loading ? 'در حال بروزرسانی...' : 'بروزرسانی محصول'}
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {isMainImageSelection ? 'انتخاب عکس اصلی' : 'انتخاب تصاویر برای گالری'}
                  </h3>
                  {!isMainImageSelection && selectedGalleryImages.length > 0 && (
                    <p className="text-purple-200 text-sm mt-1">
                      {selectedGalleryImages.length} تصویر انتخاب شده
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsGalleryModalOpen(false)}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {existingImages.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 text-lg">هیچ تصویری در گالری موجود نیست</p>
                  <p className="text-gray-400 text-sm mt-2">ابتدا تصاویر را به سرور آپلود کنید</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {existingImages.map((imageUrl, index) => {
                    const isSelected = isMainImageSelection 
                      ? newProduct.image === imageUrl 
                      : selectedGalleryImages.includes(imageUrl);
                    const isAlreadyInGallery = newProduct.gallery.includes(imageUrl);
                    
                    return (
                      <div
                        key={index}
                        className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all duration-200 transform hover:scale-105 ${
                          isSelected 
                            ? 'border-green-500 ring-2 ring-green-200' 
                            : isAlreadyInGallery && !isMainImageSelection
                            ? 'border-yellow-400'
                            : 'border-transparent hover:border-purple-400'
                        }`}
                        onClick={() => toggleImageSelection(imageUrl)}
                      >
                        <img
                          src={imageUrl}
                          alt={`گالری ${index + 1}`}
                          className="w-full h-24 object-cover"
                          onError={(e) => {
                            console.error('Error loading image:', imageUrl);
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            ✓
                          </div>
                        )}
                        
                        {/* Already in gallery indicator */}
                        {isAlreadyInGallery && !isMainImageSelection && !isSelected && (
                          <div className="absolute top-1 right-1 bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            ●
                          </div>
                        )}
                        
                        {/* Main image indicator */}
                        {newProduct.image === imageUrl && !isMainImageSelection && (
                          <div className="absolute bottom-1 right-1 bg-blue-500 text-white rounded px-1 text-xs">
                            اصلی
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {!isMainImageSelection && (
                  <>
                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    انتخاب شده
                    <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-4 ml-2"></span>
                    در گالری موجود
                    <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-4 ml-2"></span>
                    عکس اصلی
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsGalleryModalOpen(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  انصراف
                </button>
                {!isMainImageSelection && selectedGalleryImages.length > 0 && (
                  <button
                    onClick={confirmGallerySelection}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    تایید انتخاب ({selectedGalleryImages.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className={`p-6 border-b ${
              messageModal.type === 'success' ? 'bg-green-50 border-green-200' :
              messageModal.type === 'error' ? 'bg-red-50 border-red-200' :
              messageModal.type === 'confirm' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  messageModal.type === 'success' ? 'bg-green-100' :
                  messageModal.type === 'error' ? 'bg-red-100' :
                  messageModal.type === 'confirm' ? 'bg-yellow-100' :
                  'bg-blue-100'
                }`}>
                  {messageModal.type === 'success' && (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {messageModal.type === 'error' && (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {messageModal.type === 'confirm' && (
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.336 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                  {messageModal.type === 'info' && (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <h3 className={`text-lg font-bold ${
                  messageModal.type === 'success' ? 'text-green-800' :
                  messageModal.type === 'error' ? 'text-red-800' :
                  messageModal.type === 'confirm' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {messageModal.title}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {messageModal.message}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              {messageModal.type === 'confirm' ? (
                <>
                  <button
                    onClick={messageModal.onCancel}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={() => {
                      messageModal.onConfirm?.();
                      closeMessageModal();
                    }}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    تایید
                  </button>
                </>
              ) : (
                <button
                  onClick={closeMessageModal}
                  className={`px-6 py-2 text-white rounded-lg transition-colors ${
                    messageModal.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                    messageModal.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  تایید
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* فایل منیجر */}
      <FileManagerModal
        isOpen={isFileManagerOpen}
        onClose={() => setIsFileManagerOpen(false)}
        onSelect={(file) => {
          setNewProduct(prev => ({
            ...prev,
            downloadUrl: file.url || '',
            fileSize: String(file.size || ''),
            fileFormat: file.extension || ''
          }));
          setIsFileManagerOpen(false);
        }}
        allowedExtensions={['.zip', '.rar', '.7z', '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx']}
      />
    </div>
  );
}

export default function EditProductPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">در حال بارگذاری...</p>
        </div>
      </div>
    }>
      <EditProductPageContent />
    </Suspense>
  );
}
