'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TiptapRichEditor from '@/components/TiptapRichEditor';
import FileManagerModal from '@/components/FileManagerModal';
import { deleteImage } from '@/utils/image-helper';

interface Product {
  _id: string;
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  imageUrl: string;
  gallery?: string[];
  rating: number;
  reviewsCount?: number;
  active: boolean;
  featured: boolean;
  categoryId?: string;
  category?: string | {
    _id?: string;
    name: string;
    slug?: string;
  };
  tags?: string[];
  productType?: string;
  // فیلدهای محصولات دیجیتال
  downloadUrl?: string;
  fileSize?: string;
  fileFormat?: string;
  downloadLimit?: string;
  // فیلدهای جدید برای جزئیات محصول
  keyFeatures?: string[];
  whatIncluded?: string[];
  technicalSpecs?: {
    weight: string;
    dimensions: string;
    material: string;
    brand: string;
    warranty: string;
    origin: string;
  };
  // اطلاعات اضافی محصول
  productBenefits?: string[];
  shippingInfo?: string;
  _count?: {
    reviews: number;
    orderItems: number;
  };
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  level?: number;
  parentId?: string | null;
}

const EditProduct = () => {
  const router = useRouter();
  const params = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Array<{_id: string; name: string; logo: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // تابع برای فرمت کردن عدد با جداکننده هزارگان
  const formatNumber = (value: string | number): string => {
    if (!value) return '';
    const numStr = value.toString().replace(/[^0-9]/g, '');
    if (!numStr) return '';
    return Number(numStr).toLocaleString('en-US');
  };

  // تابع برای حذف فرمت و برگرداندن عدد خالص
  const parseNumber = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
  };
  const [product, setProduct] = useState({
    name: '',
    slug: '',
    category: '',
    brandId: '',
    price: '',
    originalPrice: '',
    stock: '',
    description: '',
    status: 'active',
    productType: 'PHYSICAL',
    image: '',
    gallery: [] as string[],
    tags: [] as string[],
    // فیلدهای محصولات دیجیتال
    downloadUrl: '',
    fileSize: '',
    fileFormat: '',
    downloadLimit: '',
    previewUrl: '', // لینک پیش‌نمایش زنده برای قالب‌ها و محصولات دیجیتال
    previewType: 'template' as 'template' | 'plugin' | 'theme' | 'app', // نوع پیش‌نمایش
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  
  // State های جدید برای فیلدهای جزئیات محصول
  const [currentKeyFeature, setCurrentKeyFeature] = useState('');
  const [currentIncludedItem, setCurrentIncludedItem] = useState('');
  const [currentBenefit, setCurrentBenefit] = useState('');
  
  // State های رنگ و سایز
  const [colors, setColors] = useState<Array<{id: string; name: string; value: string; available: boolean}>>([]);
  const [sizes, setSizes] = useState<Array<{id: string; name: string; value: string; available: boolean; price?: number}>>([]);
  const [currentColor, setCurrentColor] = useState({ name: '', value: '#000000' });
  const [currentSize, setCurrentSize] = useState({ name: '', value: '', price: '' });
  
  // برای گالری تصاویر از سرور
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isMainImageSelection, setIsMainImageSelection] = useState(false);
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [error, setError] = useState('');

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

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?active=true&limit=100');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands?active=true&limit=100');
      const result = await response.json();
      if (result.success) {
        setBrands(result.data);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  // Fetch categories, brands and existing images
  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchExistingImages();
  }, []);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.id) return;
      
      try {
        setFetchLoading(true);
        const response = await fetch(`/api/products/${params.id}`);
        const result = await response.json();
        
        if (result.success) {
          const productData = result.data;
          // Map API data to form state
          setProduct({
            name: productData.name || '',
            slug: productData.slug || '',
            category: productData.categoryId || '',
            brandId: productData.brandId || '',
            price: productData.price?.toString() || '',
            originalPrice: productData.originalPrice?.toString() || '',
            stock: productData.stock?.toString() || '',
            description: productData.description || '',
            status: productData.active ? 'active' : 'inactive',
            productType: productData.productType || 'PHYSICAL',
            image: productData.imageUrl || '',
            gallery: productData.gallery || [],
            tags: productData.tags || [],
            downloadUrl: productData.downloadUrl || '',
            fileSize: productData.fileSize?.toString() || '',
            fileFormat: productData.fileFormat || '',
            downloadLimit: productData.downloadLimit?.toString() || '',
            previewUrl: productData.previewUrl || '', // لینک پیش‌نمایش زنده
            previewType: (productData.previewType || 'template') as 'template' | 'plugin' | 'theme' | 'app', // نوع پیش‌نمایش
            keyFeatures: productData.keyFeatures || [],
            whatIncluded: productData.whatIncluded || [],
            technicalSpecs: productData.technicalSpecs || {
              weight: '',
              dimensions: '',
              material: '',
              brand: '',
              warranty: '',
              origin: ''
            },
            productBenefits: productData.productBenefits || [],
            shippingInfo: productData.shippingInfo || ''
          });
          
          // تنظیم رنگ‌ها و سایزها
          if (productData.colors && Array.isArray(productData.colors)) {
            setColors(productData.colors);
          }
          if (productData.sizes && Array.isArray(productData.sizes)) {
            setSizes(productData.sizes);
          }
        } else {
          setError(result.error || 'محصول یافت نشد');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('خطا در دریافت اطلاعات محصول');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

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

  // Create hierarchical category structure for display
  const buildCategoryHierarchy = () => {
    const rootCategories = categories.filter(cat => cat.level === 0);
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
    return result;
  };

  const hierarchicalCategories = buildCategoryHierarchy();

  // تولید خودکار slug از نام محصول (فقط در صورتی که کاربر slug را خالی گذاشته باشد)
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[\u0600-\u06FF]/g, '') // حذف کاراکترهای فارسی
      .replace(/[^a-z0-9]/g, '-') // تبدیل کاراکترهای غیرمجاز به خط تیره
      .replace(/-+/g, '-') // حذف خط تیره‌های تکراری
      .replace(/^-|-$/g, ''); // حذف خط تیره از ابتدا و انتها
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    // فقط نام را تغییر بده، slug را دست نزن
    setProduct({
      ...product, 
      name
      // slug را دیگر خودکار تولید نمی‌کنیم
    });
  };

  // اضافه کردن handler برای تغییر دستی slug - هر چیزی که کاربر بنویسد ذخیره می‌شود
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProduct({
      ...product,
      slug: e.target.value // دقیقاً همان‌طور که کاربر می‌نویسد، ذخیره می‌شود
    });
  };

  // Handle digital file upload
  const handleDigitalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDigitalFile(file);
      setProduct(prev => ({
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
        setProduct(prev => ({
          ...prev,
          image: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProduct = async () => {
    // بررسی فیلدهای اجباری با پیام‌های مشخص
    const requiredFields = [];
    
    if (!product.name.trim()) {
      requiredFields.push('نام محصول');
    }
    
    if (!product.category) {
      requiredFields.push('دسته‌بندی');
    }
    
    if (!product.price || parseFloat(product.price) <= 0) {
      requiredFields.push('قیمت');
    }
    
    if (product.productType === 'PHYSICAL' && (!product.stock || parseInt(product.stock) < 0)) {
      requiredFields.push('موجودی');
    }
    
    if (requiredFields.length > 0) {
      showMessage('error', 'خطای اعتبارسنجی', `لطفاً فیلدهای زیر را پر کنید:\n• ${requiredFields.join('\n• ')}`);
      return;
    }

    try {
      setLoading(true);
      
      // آپلود تصاویر اول
      let imageUrl = product.image;
      let galleryUrls: string[] = product.gallery;
      let digitalFileUrl = product.downloadUrl;

      // آپلود عکس اصلی اگر فایل جدیدی انتخاب شده
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

      // آپلود فایل دیجیتال اگر فایل جدیدی انتخاب شده
      if (digitalFile && product.productType === 'DIGITAL') {
        const digitalFormData = new FormData();
        digitalFormData.append('file', digitalFile);

        const digitalResponse = await fetch('/api/upload/product-file', {
          method: 'POST',
          body: digitalFormData,
        });

        if (digitalResponse.ok) {
          const digitalResult = await digitalResponse.json();
          digitalFileUrl = digitalResult.fileUrl;
          setProduct(prev => ({
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

      // گالری تصاویر که قبلاً انتخاب شده‌اند از URL های موجود
      galleryUrls = product.gallery;

      // بروزرسانی محصول
      const productData = {
        name: product.name?.trim() || '',
        slug: product.slug?.trim() || '', // اضافه کردن slug به داده‌های ارسالی
        description: product.description?.trim() || '',
        price: parseFloat(product.price) || 0,
        originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : undefined,
        stock: product.productType === 'DIGITAL' ? 999999 : (parseInt(product.stock) || 0),
        imageUrl: imageUrl || '/images/products/placeholder.svg',
        gallery: galleryUrls,
        categoryId: product.category,
        brandId: product.brandId || undefined,
        active: product.status === 'active',
        featured: false,
        productType: product.productType,
        // فیلدهای جدید برای جزئیات محصول
        keyFeatures: product.keyFeatures?.filter(f => f && f.trim()) || [],
        whatIncluded: product.whatIncluded?.filter(f => f && f.trim()) || [],
        technicalSpecs: {
          weight: product.technicalSpecs?.weight?.trim() || '',
          dimensions: product.technicalSpecs?.dimensions?.trim() || '',
          material: product.technicalSpecs?.material?.trim() || '',
          brand: product.technicalSpecs?.brand?.trim() || '',
          warranty: product.technicalSpecs?.warranty?.trim() || '',
          origin: product.technicalSpecs?.origin?.trim() || ''
        },
        productBenefits: product.productBenefits?.filter(f => f && f.trim()) || [],
        shippingInfo: product.shippingInfo?.trim() || '',
        // رنگ‌ها و سایزها
        colors: colors.length > 0 ? colors : undefined,
        sizes: sizes.length > 0 ? sizes : undefined,
        // فیلدهای محصولات دیجیتال
        ...(product.productType === 'DIGITAL' && {
          downloadUrl: digitalFileUrl,
          fileSize: parseFloat(product.fileSize || '0') || 0,
          fileFormat: product.fileFormat || '',
          downloadLimit: product.downloadLimit ? parseInt(product.downloadLimit) : null,
          previewUrl: product.previewUrl?.trim() || '', // لینک پیش‌نمایش زنده
          previewType: product.previewType || 'template', // نوع پیش‌نمایش
          isDigital: true // فلگ برای تشخیص محصول دیجیتال
        })
      };

      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('API Error Response:', result);
        console.error('Product Data Sent:', productData);
      }

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

  const addTag = () => {
    if (currentTag.trim() && !product.tags.includes(currentTag.trim())) {
      setProduct({
        ...product,
        tags: [...product.tags, currentTag.trim()]
      });
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setProduct({
      ...product,
      tags: product.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Helper functions for Key Features
  const addKeyFeature = () => {
    if (currentKeyFeature.trim() && !product.keyFeatures.includes(currentKeyFeature.trim())) {
      setProduct({
        ...product,
        keyFeatures: [...product.keyFeatures, currentKeyFeature.trim()]
      });
      setCurrentKeyFeature('');
    }
  };

  const removeKeyFeature = (featureToRemove: string) => {
    setProduct({
      ...product,
      keyFeatures: product.keyFeatures.filter(feature => feature !== featureToRemove)
    });
  };

  // Helper functions for What's Included
  const addIncludedItem = () => {
    if (currentIncludedItem.trim() && !product.whatIncluded.includes(currentIncludedItem.trim())) {
      setProduct({
        ...product,
        whatIncluded: [...product.whatIncluded, currentIncludedItem.trim()]
      });
      setCurrentIncludedItem('');
    }
  };

  const removeIncludedItem = (itemToRemove: string) => {
    setProduct({
      ...product,
      whatIncluded: product.whatIncluded.filter(item => item !== itemToRemove)
    });
  };

  // Helper functions for Colors
  const addColor = () => {
    if (currentColor.name.trim() && currentColor.value) {
      const newColor = {
        id: Date.now().toString(),
        name: currentColor.name.trim(),
        value: currentColor.value,
        available: true
      };
      setColors([...colors, newColor]);
      setCurrentColor({ name: '', value: '#000000' });
    }
  };

  const removeColor = (colorId: string) => {
    setColors(colors.filter(c => c.id !== colorId));
  };

  const toggleColorAvailability = (colorId: string) => {
    setColors(colors.map(c => 
      c.id === colorId ? { ...c, available: !c.available } : c
    ));
  };

  // Helper functions for Sizes
  const addSize = () => {
    if (currentSize.name.trim() && currentSize.value.trim()) {
      const newSize = {
        id: Date.now().toString(),
        name: currentSize.name.trim(),
        value: currentSize.value.trim(),
        available: true,
        ...(currentSize.price && { price: Number(currentSize.price) })
      };
      setSizes([...sizes, newSize]);
      setCurrentSize({ name: '', value: '', price: '' });
    }
  };

  const removeSize = (sizeId: string) => {
    setSizes(sizes.filter(s => s.id !== sizeId));
  };

  const toggleSizeAvailability = (sizeId: string) => {
    setSizes(sizes.map(s => 
      s.id === sizeId ? { ...s, available: !s.available } : s
    ));
  };

  // Helper functions for Product Benefits
  const addBenefit = () => {
    if (currentBenefit.trim() && !product.productBenefits.includes(currentBenefit.trim())) {
      setProduct({
        ...product,
        productBenefits: [...product.productBenefits, currentBenefit.trim()]
      });
      setCurrentBenefit('');
    }
  };

  const removeBenefit = (benefitToRemove: string) => {
    setProduct({
      ...product,
      productBenefits: product.productBenefits.filter(benefit => benefit !== benefitToRemove)
    });
  };

  // انتخاب تصویر از گالری موجود (بدون بستن modal)
  const selectImageFromGallery = (imageUrl: string) => {
    if (isMainImageSelection) {
      // انتخاب عکس اصلی
      setProduct({
        ...product,
        image: imageUrl
      });
      // Modal باز می‌ماند تا کاربر "تایید انتخاب" بزند
    } else {
      // انتخاب برای گالری
      if (product.gallery.includes(imageUrl)) {
        // حذف تصویر اگر قبلاً انتخاب شده
        setProduct({
          ...product,
          gallery: product.gallery.filter(img => img !== imageUrl)
        });
      } else {
        // اضافه کردن تصویر به گالری
        setProduct({
          ...product,
          gallery: [...product.gallery, imageUrl]
        });
      }
    }
  };

  // Helper functions for Product Benefits
  const addProductBenefit = () => {
    setProduct({
      ...product,
      productBenefits: [...product.productBenefits, '']
    });
  };

  const updateProductBenefit = (index: number, value: string) => {
    const updatedBenefits = [...product.productBenefits];
    updatedBenefits[index] = value;
    setProduct({
      ...product,
      productBenefits: updatedBenefits
    });
  };

  const removeProductBenefit = (index: number) => {
    setProduct({
      ...product,
      productBenefits: product.productBenefits.filter((_, i) => i !== index)
    });
  };

  // تابع برای باز کردن گالری
  const openGalleryModal = () => {
    setIsGalleryModalOpen(true);
  };

  const closeGalleryModal = () => {
    setIsGalleryModalOpen(false);
    setIsMainImageSelection(false);
  };

  // تابع برای به‌روزرسانی لیست تصاویر بعد از آپلود
  const refreshImagesList = async () => {
    await fetchExistingImages();
  };

  // تابع مرتب‌سازی تصاویر در client-side نیز
  const sortImagesByDate = (images: string[]) => {
    return [...images].sort((a, b) => {
      // استخراج نام فایل برای مقایسه تاریخ
      const filenameA = a.split('/').pop() || '';
      const filenameB = b.split('/').pop() || '';
      
      // اگر فایل UUID دارد، بر اساس آن مرتب کن
      if (filenameA.includes('-') && filenameB.includes('-')) {
        return filenameB.localeCompare(filenameA); // جدیدترین ابتدا
      }
      
      return filenameB.localeCompare(filenameA);
    });
  };

  // تابع آپلود خودکار فایل‌های انتخاب شده
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
        
        // مستقیماً تصاویر جدید را به ابتدای لیست موجود اضافه کن (جدیدترین اول)
        setExistingImages(prev => {
          const newImages = [...result.urls, ...prev];
          console.log('تصاویر جدید در ابتدا اضافه شدند:', newImages);
          return newImages;
        });
        
        // نمایش پیام موفقیت
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

  // تابع حذف تصویر از سرور
  const deleteImageFromServer = async (imageUrl: string) => {
    try {
      console.log('🗑️ شروع حذف تصویر:', imageUrl);
      
      // استفاده از helper جدید که هم فایل و هم دیتابیس را حذف می‌کند
      const result = await deleteImage({
        imageUrl,
        type: 'product',
        documentId: params.id as string
      });

      if (result.success) {
        console.log('✅ نتیجه حذف:', result);
        
        // حذف فوری از state محلی
        setExistingImages(prev => {
          const filtered = prev.filter(img => img !== imageUrl);
          console.log(`🔄 تصاویر باقی‌مانده: ${filtered.length} از ${prev.length}`);
          return filtered;
        });
        
        // حذف تصویر از محصول
        setProduct(prev => ({
          ...prev,
          image: prev.image === imageUrl ? '' : prev.image,
          gallery: prev.gallery.filter(img => img !== imageUrl)
        }));
        
        console.log('🎉 تصویر با موفقیت حذف شد');
        showMessage('success', 'حذف موفق', 'تصویر و رکورد دیتابیس با موفقیت حذف شد!');
      } else {
        console.error('❌ خطا در حذف:', result.error);
        showMessage('error', 'خطای حذف', result.error || 'خطا در حذف تصویر');
      }
    } catch (error) {
      console.error('💥 خطای شبکه در حذف تصویر:', error);
      showMessage('error', 'خطای شبکه', 'خطای شبکه در حذف تصویر');
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">در حال بارگذاری...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-300 text-xl mb-4">{error}</div>
          <button
            onClick={() => router.push('/admin/products')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
          >
            بازگشت به لیست محصولات
          </button>
        </div>
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
          <p className="text-purple-200">ویرایش اطلاعات محصول "{product.name}"</p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                نام محصول <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={product.name}
                onChange={handleNameChange}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="نام محصول را وارد کنید"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Slug <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={product.slug}
                onChange={handleSlugChange}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent font-mono"
                placeholder="agyn-the-plus-addons-elementor-afzynh-adan-plas"
                dir="ltr"
              />
              <p className="text-xs text-purple-300 mt-1">URL دوستانه برای محصول - می‌توانید خودتان تعیین کنید</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                دسته‌بندی <span className="text-red-400">*</span>
              </label>
              <select
                value={product.category}
                onChange={(e) => setProduct({...product, category: e.target.value})}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              >
                <option value="" className="bg-purple-800">انتخاب دسته‌بندی</option>
                {hierarchicalCategories.map((category) => (
                  <option key={category._id} value={category._id} className="bg-purple-800">
                    {category.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                برند
              </label>
              <select
                value={product.brandId}
                onChange={(e) => setProduct({...product, brandId: e.target.value})}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              >
                <option value="" className="bg-purple-800">بدون برند</option>
                {brands.map((brand) => (
                  <option key={brand._id} value={brand._id} className="bg-purple-800">
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                نوع محصول <span className="text-red-400">*</span>
              </label>
              <select
                value={product.productType}
                onChange={(e) => setProduct({...product, productType: e.target.value})}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              >
                <option value="PHYSICAL" className="bg-purple-800">محصول فیزیکی</option>
                <option value="DIGITAL" className="bg-purple-800">محصول دیجیتال</option>
              </select>
              <p className="text-xs text-purple-300 mt-1">
                {product.productType === 'DIGITAL' 
                  ? 'فایل قابل دانلود (PDF, ZIP, EXE، و...)'
                  : 'محصول فیزیکی که باید ارسال شود'
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                قیمت (تومان) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formatNumber(product.price)}
                onChange={(e) => {
                  const rawValue = parseNumber(e.target.value);
                  setProduct({...product, price: rawValue});
                }}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-right"
                placeholder="مثال: 1,000,000"
                dir="ltr"
              />
              {product.price && (
                <p className="text-xs text-purple-300 mt-1 text-right">
                  {formatNumber(product.price)} تومان
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                قیمت اصلی (تومان)
              </label>
              <input
                type="text"
                value={formatNumber(product.originalPrice)}
                onChange={(e) => {
                  const rawValue = parseNumber(e.target.value);
                  setProduct({...product, originalPrice: rawValue});
                }}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-right"
                placeholder="مثال: 2,000,000"
                dir="ltr"
              />
              {product.originalPrice && (
                <p className="text-xs text-purple-300 mt-1 text-right">
                  {formatNumber(product.originalPrice)} تومان
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                موجودی {product.productType === 'PHYSICAL' && <span className="text-red-400">*</span>}
              </label>
              <input
                type="number"
                value={product.stock}
                onChange={(e) => setProduct({...product, stock: e.target.value})}
                disabled={product.productType === 'DIGITAL'}
                className={`w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                  product.productType === 'DIGITAL' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                placeholder={product.productType === 'DIGITAL' ? 'نامحدود' : 'تعداد موجودی'}
              />
              {product.productType === 'DIGITAL' && (
                <p className="text-xs text-purple-300 mt-1">محصولات دیجیتال موجودی نامحدود دارند</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">وضعیت</label>
              <select
                value={product.status}
                onChange={(e) => setProduct({...product, status: e.target.value})}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              >
                <option value="active" className="bg-purple-800">فعال</option>
                <option value="inactive" className="bg-purple-800">غیرفعال</option>
              </select>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-purple-200 mb-2">توضیحات</label>
            <TiptapRichEditor
              value={product.description}
              onChange={(value) => setProduct({...product, description: value})}
              placeholder="توضیحات محصول را وارد کنید..."
              className="min-h-[250px]"
            />
          </div>

          {/* Product Image Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-purple-200 mb-2">
              عکس اصلی محصول
            </label>
            
            {/* Current Image Preview */}
            {product.image ? (
              <div className="mb-4">
                <div className="relative inline-block">
                  <img
                    src={product.image}
                    alt="پیش‌نمایش عکس اصلی"
                    className="w-32 h-32 object-cover rounded-lg border border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => setProduct({...product, image: ''})}
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
                <p className="text-purple-300 text-sm">کلیک کنید تا عکس جدید آپلود کنید</p>
              </div>
            )}

            {/* Button to Open Gallery for Main Image */}
            <button
              type="button"
              onClick={() => {
                setIsMainImageSelection(true);
                openGalleryModal();
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-3 border border-purple-500/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              انتخاب عکس اصلی از گالری
            </button>
          </div>

          {/* Digital Product File Section */}
          {product.productType === 'DIGITAL' && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-purple-200 mb-2">
                فایل محصول دیجیتال <span className="text-red-400">*</span>
              </label>

              {/* دکمه انتخاب فایل */}
              <div className="mb-4">
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
                {product.downloadUrl ? (
                  <div className="flex items-center justify-center space-x-3 space-x-reverse">
                    <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-right">
                      <div className="text-green-300 font-medium">فایل از فایل منیجر انتخاب شد</div>
                      <div className="text-purple-200 text-sm truncate max-w-xs">{product.downloadUrl}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setProduct(prev => ({ ...prev, fileSize: '', fileFormat: '', downloadUrl: '' }));
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
                    <span className="text-purple-200 text-sm block mt-2">از دکمه بالا برای انتخاب فایل استفاده کنید</span>
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
                    value={product.downloadLimit}
                    onChange={(e) => setProduct({...product, downloadLimit: e.target.value})}
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
                    {product.fileSize && (
                      <div className="text-sm text-purple-200">
                        <span className="font-medium">حجم:</span> {product.fileSize} مگابایت
                      </div>
                    )}
                    {product.fileFormat && (
                      <div className="text-sm text-purple-200">
                        <span className="font-medium">فرمت:</span> {product.fileFormat.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live Preview URL Section - Only for Digital Products */}
          {product.productType === 'DIGITAL' && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-2 border-purple-400/40 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">پیش‌نمایش زنده محصول</h3>
                    <p className="text-purple-200 text-sm">لینک دمو یا نسخه آزمایشی محصول دیجیتال</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* نوع پیش‌نمایش */}
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      نوع پیش‌نمایش
                    </label>
                    <select
                      value={product.previewType || 'template'}
                      onChange={(e) => setProduct({...product, previewType: e.target.value as 'template' | 'plugin' | 'theme' | 'app'})}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    >
                      <option value="template" className="bg-purple-800">قالب (Template)</option>
                      <option value="plugin" className="bg-purple-800">افزونه (Plugin)</option>
                      <option value="theme" className="bg-purple-800">تم (Theme)</option>
                      <option value="app" className="bg-purple-800">اپلیکیشن (App)</option>
                    </select>
                    <p className="text-xs text-purple-300 mt-1">نوع محصول را برای نمایش متن مناسب در دکمه انتخاب کنید</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      لینک پیش‌نمایش (اختیاری)
                    </label>
                    <input
                      type="url"
                      value={product.previewUrl}
                      onChange={(e) => setProduct({...product, previewUrl: e.target.value})}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      placeholder="https://demo.yoursite.com/product-preview"
                      dir="ltr"
                    />
                    <p className="text-xs text-purple-300 mt-2 flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        اگر محصول شما دمو آنلاین دارد (مثل قالب وردپرس، افزونه، یا اپلیکیشن وب)، 
                        لینک آن را وارد کنید تا کاربران قبل از خرید محصول را ببینند.
                      </span>
                    </p>
                  </div>

                  {/* Preview of Preview Button */}
                  {product.previewUrl && (
                    <div className="border-t border-purple-400/30 pt-4">
                      <p className="text-sm text-purple-200 mb-3">پیش‌نمایش دکمه در صفحه محصول:</p>
                      <div className="bg-purple-900/40 rounded-lg p-6 border border-purple-500/30">
                        <a
                          href={product.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
                          style={{
                            backgroundSize: '200% 100%',
                            animation: 'gradient-shift 3s ease infinite'
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-xl"></div>
                          <svg className="relative w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="relative text-lg">
                            {product.previewType === 'template' && '🚀 پیش‌نمایش زنده قالب'}
                            {product.previewType === 'plugin' && '🔌 پیش‌نمایش زنده افزونه'}
                            {product.previewType === 'theme' && '🎨 پیش‌نمایش زنده تم'}
                            {product.previewType === 'app' && '📱 پیش‌نمایش زنده اپلیکیشن'}
                          </span>
                          <svg className="relative w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Gallery Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-purple-200 mb-2">
              گالری تصاویر محصول
            </label>
            
            {/* Button to Open Gallery */}
            <div className="space-y-4">
              <button
                type="button"
                onClick={openGalleryModal}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-3 border border-purple-500/50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                انتخاب و آپلود تصاویر از گالری
                <span className="text-purple-200 text-sm">
                  ({existingImages.length} تصویر موجود
                  {product.gallery.length > 0 && ` | ${product.gallery.length} انتخاب شده`})
                </span>
              </button>
              
              {product.gallery.length === 0 && (
                <div className="text-center py-4 text-purple-300 text-sm bg-purple-900/30 rounded-lg border border-purple-700/50">
                  <svg className="w-8 h-8 mx-auto mb-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  هیچ تصویری برای گالری انتخاب نشده است
                  <br />
                  <span className="text-xs text-purple-400">برای انتخاب تصاویر، دکمه بالا را کلیک کنید</span>
                </div>
              )}
              
              {/* Preview Selected Images */}
              {product.gallery.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-purple-200">تصاویر انتخاب شده ({product.gallery.length})</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProduct(prev => ({ ...prev, gallery: [] }));
                          showMessage('info', 'پاک شد', 'تمام تصاویر گالری پاک شدند');
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
                      >
                        پاک کردن همه
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          showMessage('success', 'تأیید شد', `${product.gallery.length} تصویر برای گالری محصول انتخاب شد`);
                        }}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                      >
                        ✓ تأیید انتخاب
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-3">
                    {product.gallery.map((image, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={image} 
                          alt={`تصویر ${index + 1}`}
                          className="w-full h-16 object-cover rounded-lg border border-white/20"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            // از گالری موجود حذف کن
                            const updatedGallery = product.gallery.filter((_, i) => i !== index);
                            setProduct({
                              ...product,
                              gallery: updatedGallery
                            });
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200 opacity-0 group-hover:opacity-100"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-purple-200 mb-2">برچسب‌ها</label>
            <div className="flex space-x-2 space-x-reverse mb-4">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="برچسب جدید را وارد کنید"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
              >
                افزودن
              </button>
            </div>
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="mr-2 w-4 h-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Key Features Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-purple-200 mb-2">ویژگی‌های کلیدی</label>
            <div className="flex space-x-2 space-x-reverse mb-4">
              <input
                type="text"
                value={currentKeyFeature}
                onChange={(e) => setCurrentKeyFeature(e.target.value)}
                className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="ویژگی جدید را وارد کنید"
                onKeyPress={(e) => e.key === 'Enter' && addKeyFeature()}
              />
              <button
                type="button"
                onClick={addKeyFeature}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
              >
                افزودن
              </button>
            </div>
            {product.keyFeatures.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.keyFeatures.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-400/30"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeKeyFeature(feature)}
                      className="mr-2 w-4 h-4 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* What's Included Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-purple-200 mb-2">محتویات جعبه</label>
            <div className="flex space-x-2 space-x-reverse mb-4">
              <input
                type="text"
                value={currentIncludedItem}
                onChange={(e) => setCurrentIncludedItem(e.target.value)}
                className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="آیتم محتوای جعبه را وارد کنید"
                onKeyPress={(e) => e.key === 'Enter' && addIncludedItem()}
              />
              <button
                type="button"
                onClick={addIncludedItem}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
              >
                افزودن
              </button>
            </div>
            {product.whatIncluded.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.whatIncluded.map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-300 border border-orange-400/30"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeIncludedItem(item)}
                      className="mr-2 w-4 h-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Technical Specifications Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-purple-200 mb-4">مشخصات فنی</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">وزن</label>
                <input
                  type="text"
                  value={product.technicalSpecs.weight}
                  onChange={(e) => setProduct({
                    ...product,
                    technicalSpecs: { ...product.technicalSpecs, weight: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="مثال: 1.2 kg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">ابعاد</label>
                <input
                  type="text"
                  value={product.technicalSpecs.dimensions}
                  onChange={(e) => setProduct({
                    ...product,
                    technicalSpecs: { ...product.technicalSpecs, dimensions: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="مثال: 25 x 15 x 8 cm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">جنس</label>
                <input
                  type="text"
                  value={product.technicalSpecs.material}
                  onChange={(e) => setProduct({
                    ...product,
                    technicalSpecs: { ...product.technicalSpecs, material: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="مثال: فلز، پلاستیک، چوب"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">برند</label>
                <input
                  type="text"
                  value={product.technicalSpecs.brand}
                  onChange={(e) => setProduct({
                    ...product,
                    technicalSpecs: { ...product.technicalSpecs, brand: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="نام برند محصول"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">گارانتی</label>
                <input
                  type="text"
                  value={product.technicalSpecs.warranty}
                  onChange={(e) => setProduct({
                    ...product,
                    technicalSpecs: { ...product.technicalSpecs, warranty: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="مثال: 2 سال، 18 ماه"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">مبدا</label>
                <input
                  type="text"
                  value={product.technicalSpecs.origin}
                  onChange={(e) => setProduct({
                    ...product,
                    technicalSpecs: { ...product.technicalSpecs, origin: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="کشور سازنده"
                />
              </div>
            </div>
          </div>

          {/* Colors Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-purple-200 mb-4">رنگ‌های موجود</label>
            <div className="mb-4 flex gap-3">
              <input
                type="text"
                value={currentColor.name}
                onChange={(e) => setCurrentColor({ ...currentColor, name: e.target.value })}
                placeholder="نام رنگ (مثال: قرمز)"
                className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
              <input
                type="color"
                value={currentColor.value}
                onChange={(e) => setCurrentColor({ ...currentColor, value: e.target.value })}
                className="w-20 h-[50px] px-2 py-1 bg-white/20 border border-white/30 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={addColor}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
              >
                افزودن رنگ
              </button>
            </div>
            {colors.length > 0 && (
              <div className="space-y-2">
                {colors.map((color) => (
                  <div
                    key={color.id}
                    className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20"
                  >
                    <div
                      className="w-10 h-10 rounded-full border-2 border-white/30"
                      style={{ backgroundColor: color.value }}
                    ></div>
                    <span className="flex-1 text-white">{color.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleColorAvailability(color.id)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${
                        color.available
                          ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                          : 'bg-gray-500/20 text-gray-300 border border-gray-400/30'
                      }`}
                    >
                      {color.available ? 'موجود' : 'ناموجود'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeColor(color.id)}
                      className="px-3 py-1 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sizes Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-purple-200 mb-4">سایزهای موجود</label>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                value={currentSize.name}
                onChange={(e) => setCurrentSize({ ...currentSize, name: e.target.value })}
                placeholder="نام سایز (مثال: بزرگ)"
                className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
              <input
                type="text"
                value={currentSize.value}
                onChange={(e) => setCurrentSize({ ...currentSize, value: e.target.value })}
                placeholder="مقدار (مثال: L)"
                className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
              <input
                type="number"
                value={currentSize.price}
                onChange={(e) => setCurrentSize({ ...currentSize, price: e.target.value })}
                placeholder="قیمت اضافی (اختیاری)"
                className="px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addSize}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
              >
                افزودن سایز
              </button>
            </div>
            {sizes.length > 0 && (
              <div className="space-y-2">
                {sizes.map((size) => (
                  <div
                    key={size.id}
                    className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20"
                  >
                    <span className="flex-1 text-white">
                      {size.name} ({size.value})
                      {size.price && <span className="text-purple-300 mr-2">+{size.price.toLocaleString('fa-IR')} تومان</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSizeAvailability(size.id)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors duration-200 ${
                        size.available
                          ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                          : 'bg-gray-500/20 text-gray-300 border border-gray-400/30'
                      }`}
                    >
                      {size.available ? 'موجود' : 'ناموجود'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSize(size.id)}
                      className="px-3 py-1 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Benefits Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-purple-200 mb-2">
              فواید محصول
            </label>
            <div className="space-y-3">
              {product.productBenefits.map((benefit, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={benefit}
                    onChange={(e) => updateProductBenefit(index, e.target.value)}
                    placeholder="مثال: تحویل رایگان"
                    className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                  />
                  <button
                    type="button"
                    onClick={() => removeProductBenefit(index)}
                    className="px-3 py-3 bg-red-500/80 hover:bg-red-600 rounded-lg text-white transition-colors duration-200"
                  >
                    حذف
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addProductBenefit}
                className="w-full px-4 py-2 border-2 border-dashed border-purple-400/50 hover:border-purple-400 rounded-lg text-purple-200 hover:text-purple-100 transition-colors duration-200"
              >
                + افزودن فایده
              </button>
            </div>
          </div>

          {/* Shipping Info Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-purple-200 mb-2">
              اطلاعات ارسال
            </label>
            <textarea
              value={product.shippingInfo}
              onChange={(e) => setProduct({...product, shippingInfo: e.target.value})}
              placeholder="اطلاعات ارسال، زمان تحویل، هزینه ارسال و..."
              rows={4}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 space-x-reverse">
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

        {/* Help Section */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">راهنمای ویرایش محصول</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-purple-200 text-sm">
            <div>
              <h4 className="font-medium text-white mb-2">فیلدهای اجباری:</h4>
              <ul className="space-y-1">
                <li>• نام محصول</li>
                <li>• دسته‌بندی</li>
                <li>• قیمت</li>
                <li>• موجودی (فقط محصولات فیزیکی)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">نکات مهم:</h4>
              <ul className="space-y-1">
                <li>• فرمت‌های مجاز: JPG, PNG, GIF</li>
                <li>• حداکثر سایز فایل: 5MB</li>
                <li>• گالری: انتخاب چندگانه</li>
                <li>• برچسب‌ها برای جستجو مفید</li>
                <li>• Slug باید منحصر به فرد باشد</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">ویژگی‌های جدید:</h4>
              <ul className="space-y-1">
                <li>• ویژگی‌های کلیدی: مزایای محصول</li>
                <li>• محتویات جعبه: آنچه در بسته‌بندی است</li>
                <li>• مشخصات فنی: جزئیات فنی محصول</li>
                <li>• همه فیلدها اختیاری هستند</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">محصولات دیجیتال:</h4>
              <ul className="space-y-1">
                <li>• فایل محصول اگر تغییر کند</li>
                <li>• موجودی خودکار نامحدود می‌شود</li>
                <li>• قابلیت محدودیت دانلود</li>
                <li>• فرمت‌های پشتیبانی شده</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-6xl h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">
                  {isMainImageSelection ? 'انتخاب عکس اصلی' : 'گالری تصاویر'}
                </h3>
                <span className="text-gray-400">({existingImages.length} تصویر)</span>
              </div>
              <button
                onClick={closeGalleryModal}
                className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      e.target.value = ''; // Reset input
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
            <div className="p-6 overflow-y-auto flex-1">
              {existingImages.length > 0 ? (
                <div className="grid grid-cols-6 gap-3">
                  {existingImages.map((imageUrl, index) => {
                    const fileName = imageUrl.split('/').pop()?.split('.')[0] || '';
                    const fileExtension = imageUrl.split('.').pop()?.toUpperCase() || '';
                    
                    return (
                      <div
                        key={index}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all aspect-square ${
                          isMainImageSelection 
                            ? (product.image === imageUrl ? 'border-green-400 ring-2 ring-green-400/30' : 'border-gray-600 hover:border-purple-400')
                            : (product.gallery.includes(imageUrl) ? 'border-green-400 ring-2 ring-green-400/30' : 'border-gray-600 hover:border-purple-400')
                        }`}
                        onClick={() => selectImageFromGallery(imageUrl)}
                      >
                        <img
                          src={imageUrl}
                          alt={`تصویر ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* نشانگر انتخاب */}
                        {((isMainImageSelection && product.image === imageUrl) || 
                          (!isMainImageSelection && product.gallery.includes(imageUrl))) && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* دکمه حذف */}
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            console.log('🖱️ کلیک روی دکمه حذف برای:', imageUrl);
                            
                            showConfirm(
                              'تأیید حذف', 
                              `آیا مطمئن هستید که می‌خواهید این تصویر را حذف کنید؟\n\n${imageUrl.split('/').pop()}`,
                              async () => {
                                console.log('✔️ کاربر حذف را تأیید کرد');
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
                        
                        {/* اطلاعات فایل */}
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
                <div className="text-center py-12 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg">هیچ تصویری در گالری موجود نیست</p>
                  <p className="text-sm mt-1">ابتدا تصاویری آپلود کنید</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-700 bg-gray-800/50 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  {isMainImageSelection 
                    ? (product.image ? '1 تصویر انتخاب شده' : 'هیچ تصویری انتخاب نشده')
                    : `${product.gallery.length} تصویر انتخاب شده`
                  }
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={closeGalleryModal}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    بستن
                  </button>
                  <button
                    onClick={closeGalleryModal}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all"
                  >
                    تایید انتخاب
                  </button>
                </div>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                    onClick={() => {
                      messageModal.onCancel?.();
                      closeMessageModal();
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    لغو
                  </button>
                  <button
                    onClick={() => {
                      messageModal.onConfirm?.();
                      closeMessageModal();
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    تأیید حذف
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

      {/* File Manager Modal */}
      <FileManagerModal
        isOpen={isFileManagerOpen}
        onClose={() => setIsFileManagerOpen(false)}
        onSelect={(file) => {
          // تنظیم فایل انتخاب شده از فایل منیجر
          setProduct(prev => ({
            ...prev,
            downloadUrl: file.url || '',
            fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            fileFormat: file.extension || ''
          }));
          setIsFileManagerOpen(false);
        }}
        allowedExtensions={['.zip', '.rar', '.7z', '.pdf', '.exe', '.apk', '.ipa']}
      />
    </div>
  );
};

export default EditProduct;
