'use client';
import { useState, useEffect } from 'react';
import { slugify } from '@/utils/helpers';
import { useRouter } from 'next/navigation';
import { useAddProduct } from '@/hooks/useApi';
import TiptapRichEditor from '@/components/TiptapRichEditor';
import { deleteImage } from '@/utils/image-helper';
import FileManagerModal from '@/components/FileManagerModal';
import InlineLicenseInjector from '@/components/admin/InlineLicenseInjector';
import SharedImageGallery from '@/components/SharedImageGallery';

interface Category {
  _id: string;
  name: string;
  slug: string;
  level?: number;
  parentId?: string | null;
}

export default function AddProductPage() {
  const router = useRouter();
  const addProductMutation = useAddProduct();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Array<{_id: string; name: string; logo: string}>>([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    slug: '',
    category: '',
    brandId: '',
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
    previewType: 'template' as 'template' | 'plugin' | 'theme' | 'app', // نوع پیش‌نمایش
    provisioningType: 'download' as 'download' | 'managed-site',
    templateId: '',
    templateSlug: '',
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
  // حذف منطق تولید خودکار؛ slug فقط دستی وارد می‌شود
  const [imageFile, setImageFile] = useState<File | null>(null); // فایل عکس اصلی
  const [digitalFile, setDigitalFile] = useState<File | null>(null); // فایل محصول دیجیتال
  
  // توابع helper برای فرمت کردن قیمت
  const formatNumber = (value: string | number): string => {
    if (!value && value !== 0) return '';
    const numStr = value.toString().replace(/[^0-9]/g, '');
    if (!numStr) return '';
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const parseNumber = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
  };
  
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
  
  // State موقت برای انتخاب‌های گالری (قبل از تایید نهایی)
  const [tempSelectedMainImage, setTempSelectedMainImage] = useState<string>('');
  const [tempSelectedGalleryImages, setTempSelectedGalleryImages] = useState<string[]>([]);

  // برای فایل منیجر
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  
  // برای فایل انتخاب شده از فایل منیجر برای پردازش لایسنس
  const [selectedFileForLicense, setSelectedFileForLicense] = useState<{url: string; name: string} | null>(null);
  const [siteTemplates, setSiteTemplates] = useState<Array<{ _id: string; slug: string; name: string; shortDescription?: string; description?: string; seo?: { title?: string; description?: string } }>>([]);

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

  // Fetch categories and brands from API
  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchExistingImages();
    fetch('/api/admin/site-templates?active=true')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSiteTemplates(d.templates);
      });
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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setNewProduct(prev => ({ ...prev, name }));
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

  const handleAddProduct = async () => {
    // بررسی فیلدهای اجباری با پیام‌های مشخص
    const requiredFields = [];
    
    console.log('🔍 Validating product fields:', {
      name: newProduct.name,
      category: newProduct.category,
      price: newProduct.price,
      stock: newProduct.stock,
      slug: newProduct.slug
    });
    
    if (!newProduct.name.trim()) {
      requiredFields.push('نام محصول');
    }
    
    if (!newProduct.category || newProduct.category.trim() === '' || newProduct.category === 'undefined') {
      requiredFields.push('دسته‌بندی');
      console.error('❌ Category validation failed:', newProduct.category);
    }
    
    if (!newProduct.price || parseFloat(newProduct.price) <= 0) {
      requiredFields.push('قیمت');
    }
    
    if (newProduct.productType === 'PHYSICAL' && (!newProduct.stock || parseInt(newProduct.stock) < 0)) {
      requiredFields.push('موجودی');
    }
    
    const cleanedSlug = slugify(newProduct.slug).trim();
    if (!cleanedSlug) {
      requiredFields.push('Slug');
    }

    if (requiredFields.length > 0) {
      showMessage('error', 'خطای اعتبارسنجی', `لطفاً فیلدهای زیر را پر کنید:\n• ${requiredFields.join('\n• ')}`);
      return;
    }

    if (
      newProduct.productType === 'DIGITAL' &&
      newProduct.provisioningType === 'download' &&
      !digitalFile &&
      !newProduct.downloadUrl
    ) {
      showMessage('error', 'خطای اعتبارسنجی', 'لطفاً فایل محصول دیجیتال را آپلود کنید یا قالب managed-site انتخاب کنید');
      return;
    }

    if (
      newProduct.productType === 'DIGITAL' &&
      newProduct.provisioningType === 'managed-site' &&
      !newProduct.templateSlug
    ) {
      showMessage('error', 'خطای اعتبارسنجی', 'لطفاً قالب فروشگاه را از لیست انتخاب کنید');
      return;
    }

    try {
      
      // آپلود تصاویر اول
      let imageUrl = '';
      let galleryUrls: string[] = [];
      let digitalFileUrl = '';

      // آپلود عکس اصلی
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

      // آپلود فایل دیجیتال
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

      // گالری تصاویر که قبلاً انتخاب شده‌اند از URL های موجود
      galleryUrls = newProduct.gallery;

      // ایجاد محصول
      const productData = {
        slug: cleanedSlug,
        name: newProduct.name.trim(),
        description: newProduct.description.trim() || '',
        price: parseFloat(newProduct.price),
        originalPrice: newProduct.originalPrice ? parseFloat(newProduct.originalPrice) : undefined,
        stock: newProduct.productType === 'DIGITAL' ? 999999 : (parseInt(newProduct.stock) || 0), // محصولات دیجیتال موجودی نامحدود
        weight: newProduct.productType === 'DIGITAL' ? 0 : (parseFloat(newProduct.weight) || 0),
        imageUrl: imageUrl || newProduct.image || '/images/products/placeholder.svg',
        gallery: galleryUrls,
        categoryId: newProduct.category,
        brandId: newProduct.brandId || undefined,
        active: newProduct.status === 'active',
        featured: false,
        productType: newProduct.productType,
        // فیلدهای جدید برای جزئیات محصول
        keyFeatures: newProduct.keyFeatures.filter(f => f.trim()),
        whatIncluded: newProduct.whatIncluded.filter(f => f.trim()),
        technicalSpecs: {
          weight: newProduct.technicalSpecs.weight.trim() || '',
          dimensions: newProduct.technicalSpecs.dimensions.trim() || '',
          material: newProduct.technicalSpecs.material.trim() || '',
          brand: newProduct.technicalSpecs.brand.trim() || '',
          warranty: newProduct.technicalSpecs.warranty.trim() || '',
          origin: newProduct.technicalSpecs.origin.trim() || ''
        },
        productBenefits: newProduct.productBenefits.filter(f => f && f.trim()),
        shippingInfo: newProduct.shippingInfo.trim() || '',
        // رنگ‌ها و سایزها
        colors: colors.length > 0 ? colors : undefined,
        sizes: sizes.length > 0 ? sizes : undefined,
        // فیلدهای محصولات دیجیتال
        ...(newProduct.productType === 'DIGITAL' && {
          provisioningType: newProduct.provisioningType || 'download',
          templateId: newProduct.templateId || undefined,
          templateSlug: newProduct.templateSlug || undefined,
          downloadUrl: newProduct.provisioningType === 'managed-site' ? undefined : digitalFileUrl,
          ...(newProduct.fileSize && parseFloat(newProduct.fileSize) > 0 && { fileSize: parseFloat(newProduct.fileSize) }),
          fileFormat: newProduct.fileFormat || '',
          downloadLimit: newProduct.downloadLimit ? parseInt(newProduct.downloadLimit) : null,
          previewUrl: newProduct.previewUrl || '',
          previewType: newProduct.previewType || 'template',
          isDigital: true
        })
      };

      const result = await addProductMutation.mutateAsync(productData);

      if (result.success) {
        // به‌روزرسانی لیست تصاویر برای آپلودهای جدید
        await refreshImagesList();

        showMessage('success', 'موفقیت', 'محصول با موفقیت اضافه شد!');
        setTimeout(() => {
          router.push('/admin/products');
        }, 2000);
      } else {
        showMessage('error', 'خطا', `خطا: ${result.error}`);
        console.error('Detailed error:', result);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      showMessage('error', 'خطا', 'خطا در افزودن محصول');
    } finally {
      // Loading state is handled by mutation
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !newProduct.tags.includes(currentTag.trim())) {
      setNewProduct({
        ...newProduct,
        tags: [...newProduct.tags, currentTag.trim()]
      });
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewProduct({
      ...newProduct,
      tags: newProduct.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Helper functions for Key Features
  const addKeyFeature = () => {
    if (currentKeyFeature.trim() && !newProduct.keyFeatures.includes(currentKeyFeature.trim())) {
      setNewProduct({
        ...newProduct,
        keyFeatures: [...newProduct.keyFeatures, currentKeyFeature.trim()]
      });
      setCurrentKeyFeature('');
    }
  };

  const removeKeyFeature = (featureToRemove: string) => {
    setNewProduct({
      ...newProduct,
      keyFeatures: newProduct.keyFeatures.filter(feature => feature !== featureToRemove)
    });
  };

  // Helper functions for What's Included
  const addIncludedItem = () => {
    if (currentIncludedItem.trim() && !newProduct.whatIncluded.includes(currentIncludedItem.trim())) {
      setNewProduct({
        ...newProduct,
        whatIncluded: [...newProduct.whatIncluded, currentIncludedItem.trim()]
      });
      setCurrentIncludedItem('');
    }
  };

  const removeIncludedItem = (itemToRemove: string) => {
    setNewProduct({
      ...newProduct,
      whatIncluded: newProduct.whatIncluded.filter(item => item !== itemToRemove)
    });
  };

  // Helper functions for Product Benefits
  const addBenefit = () => {
    if (currentBenefit.trim() && !newProduct.productBenefits.includes(currentBenefit.trim())) {
      setNewProduct({
        ...newProduct,
        productBenefits: [...newProduct.productBenefits, currentBenefit.trim()]
      });
      setCurrentBenefit('');
    }
  };

  const removeBenefit = (benefitToRemove: string) => {
    setNewProduct({
      ...newProduct,
      productBenefits: newProduct.productBenefits.filter(benefit => benefit !== benefitToRemove)
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
    setColors(colors.filter(color => color.id !== colorId));
  };

  const toggleColorAvailability = (colorId: string) => {
    setColors(colors.map(color => 
      color.id === colorId ? { ...color, available: !color.available } : color
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
        price: currentSize.price ? parseFloat(currentSize.price) : undefined
      };
      setSizes([...sizes, newSize]);
      setCurrentSize({ name: '', value: '', price: '' });
    }
  };

  const removeSize = (sizeId: string) => {
    setSizes(sizes.filter(size => size.id !== sizeId));
  };

  const toggleSizeAvailability = (sizeId: string) => {
    setSizes(sizes.map(size => 
      size.id === sizeId ? { ...size, available: !size.available } : size
    ));
  };

  // انتخاب تصویر از گالری موجود (بدون بستن modal)
  const selectImageFromGallery = (imageUrl: string) => {
    console.log('🖼️ Image clicked:', imageUrl);
    console.log('   isMainImageSelection:', isMainImageSelection);
    
    if (isMainImageSelection) {
      // انتخاب عکس اصلی در state موقت
      console.log('   📸 Selecting as main image');
      setTempSelectedMainImage(imageUrl);
      // Modal باز می‌ماند تا کاربر "تایید انتخاب" بزند
    } else {
      // انتخاب برای گالری در state موقت
      if (tempSelectedGalleryImages.includes(imageUrl)) {
        // حذف تصویر اگر قبلاً انتخاب شده
        console.log('   ➖ Removing from gallery');
        setTempSelectedGalleryImages(tempSelectedGalleryImages.filter(img => img !== imageUrl));
      } else {
        // اضافه کردن تصویر به گالری
        console.log('   ➕ Adding to gallery');
        setTempSelectedGalleryImages([...tempSelectedGalleryImages, imageUrl]);
      }
    }
  };

  // انتخاب تصویر اصلی از گالری موجود
  const selectMainImageFromGallery = (imageUrl: string) => {
    setNewProduct({
      ...newProduct,
      image: imageUrl
    });
  };

  // Helper functions for Product Benefits
  const addProductBenefit = () => {
    setNewProduct({
      ...newProduct,
      productBenefits: [...newProduct.productBenefits, '']
    });
  };

  const updateProductBenefit = (index: number, value: string) => {
    const updatedBenefits = [...newProduct.productBenefits];
    updatedBenefits[index] = value;
    setNewProduct({
      ...newProduct,
      productBenefits: updatedBenefits
    });
  };

  const removeProductBenefit = (index: number) => {
    setNewProduct({
      ...newProduct,
      productBenefits: newProduct.productBenefits.filter((_, i) => i !== index)
    });
  };

  // تابع برای باز کردن گالری
  const openGalleryModal = () => {
    // Initialize temp states with current values
    setTempSelectedMainImage(newProduct.image);
    setTempSelectedGalleryImages([...newProduct.gallery]);
    setIsGalleryModalOpen(true);
  };

  const closeGalleryModal = () => {
    setIsGalleryModalOpen(false);
    setIsMainImageSelection(false);
    // Reset temp states
    setTempSelectedMainImage('');
    setTempSelectedGalleryImages([]);
  };
  
  const confirmGallerySelection = () => {
    // اعمال انتخاب‌های موقت به state اصلی
    console.log('🔵 Confirming gallery selection...');
    console.log('   isMainImageSelection:', isMainImageSelection);
    console.log('   tempSelectedMainImage:', tempSelectedMainImage);
    console.log('   tempSelectedGalleryImages:', tempSelectedGalleryImages);
    
    if (isMainImageSelection) {
      console.log('   ✅ Setting main image:', tempSelectedMainImage);
      setNewProduct({
        ...newProduct,
        image: tempSelectedMainImage
      });
    } else {
      console.log('   ✅ Setting gallery images:', tempSelectedGalleryImages);
      setNewProduct({
        ...newProduct,
        gallery: tempSelectedGalleryImages
      });
    }
    closeGalleryModal();
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
      
      // استفاده از helper جدید - فقط فایل حذف می‌شود چون محصول هنوز ذخیره نشده
      const result = await deleteImage({
        imageUrl
        // documentId نمی‌فرستیم چون محصول هنوز ایجاد نشده
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
        setNewProduct(prev => ({
          ...prev,
          image: prev.image === imageUrl ? '' : prev.image,
          gallery: prev.gallery.filter(img => img !== imageUrl)
        }));
        
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
            <h1 className="text-3xl font-bold text-white">افزودن محصول جدید</h1>
          </div>
          <p className="text-purple-200">اطلاعات محصول جدید را وارد کنید</p>
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
                value={newProduct.name}
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
                value={newProduct.slug}
                onChange={(e) => {
                  // فقط lowercase و حذف کاراکترهای غیرمجاز، بدون پردازش خط فاصله
                  const cleanValue = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9\-]/g, '');
                  setNewProduct(prev => ({ ...prev, slug: cleanValue }));
                }}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent font-mono"
                placeholder="example-product-slug"
              />
              <p className="text-xs text-purple-300 mt-1">پر کردن این فیلد الزامی است؛ می‌توانید از خط فاصله (-) استفاده کنید.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                دسته‌بندی <span className="text-red-400">*</span>
              </label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
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
                value={newProduct.brandId}
                onChange={(e) => setNewProduct({...newProduct, brandId: e.target.value})}
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
                value={newProduct.productType}
                onChange={(e) => setNewProduct({...newProduct, productType: e.target.value})}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              >
                <option value="PHYSICAL" className="bg-purple-800">محصول فیزیکی</option>
                <option value="DIGITAL" className="bg-purple-800">محصول دیجیتال</option>
              </select>
              <p className="text-xs text-purple-300 mt-1">
                {newProduct.productType === 'DIGITAL'
                  ? newProduct.provisioningType === 'managed-site'
                    ? 'قالب فروشگاه — سایت روی دامنه مشتری ساخته می‌شود'
                    : 'فایل قابل دانلود (PDF, ZIP, ...)'
                  : 'محصول فیزیکی که باید ارسال شود'}
              </p>
            </div>

            {newProduct.productType === 'DIGITAL' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    نوع تحویل دیجیتال
                  </label>
                  <select
                    value={newProduct.provisioningType}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        provisioningType: e.target.value as 'download' | 'managed-site',
                      })
                    }
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white"
                  >
                    <option value="download" className="bg-purple-800">دانلود فایل (ZIP)</option>
                    <option value="managed-site" className="bg-purple-800">سایت آماده (Managed Site)</option>
                  </select>
                </div>

                {newProduct.provisioningType === 'managed-site' && (
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      انتخاب قالب <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={newProduct.templateSlug}
                      onChange={(e) => {
                        const tpl = siteTemplates.find((t) => t.slug === e.target.value);
                        setNewProduct({
                          ...newProduct,
                          templateSlug: e.target.value,
                          templateId: tpl?._id || '',
                          description: tpl?.description || newProduct.description,
                        });
                      }}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white"
                    >
                      <option value="" className="bg-purple-800">— انتخاب قالب —</option>
                      {siteTemplates.map((t) => (
                        <option key={t.slug} value={t.slug} className="bg-purple-800">
                          {t.name}
                        </option>
                      ))}
                    </select>
                    {siteTemplates.length === 0 && (
                      <p className="text-xs text-amber-300 mt-1">
                        ابتدا در{' '}
                        <a href="/admin/site-templates/add" className="underline">
                          قالب‌های فروشگاه
                        </a>{' '}
                        یک قالب ثبت کنید.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                قیمت (تومان) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formatNumber(newProduct.price)}
                onChange={(e) => {
                  const rawValue = parseNumber(e.target.value);
                  setNewProduct({...newProduct, price: rawValue});
                }}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-right"
                placeholder="مثال: 50,000"
                dir="ltr"
              />
              {newProduct.price && (
                <p className="text-xs text-purple-300 mt-1 text-right">
                  {formatNumber(newProduct.price)} تومان
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                قیمت اصلی (تومان)
              </label>
              <input
                type="text"
                value={formatNumber(newProduct.originalPrice)}
                onChange={(e) => {
                  const rawValue = parseNumber(e.target.value);
                  setNewProduct({...newProduct, originalPrice: rawValue});
                }}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-right"
                placeholder="مثال: 100,000"
                dir="ltr"
              />
              {newProduct.originalPrice && (
                <p className="text-xs text-purple-300 mt-1 text-right">
                  {formatNumber(newProduct.originalPrice)} تومان
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                موجودی {newProduct.productType === 'PHYSICAL' && <span className="text-red-400">*</span>}
              </label>
              <input
                type="number"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                disabled={newProduct.productType === 'DIGITAL'}
                className={`w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                  newProduct.productType === 'DIGITAL' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                placeholder={newProduct.productType === 'DIGITAL' ? 'نامحدود' : 'تعداد موجودی'}
              />
              {newProduct.productType === 'DIGITAL' && (
                <p className="text-xs text-purple-300 mt-1">محصولات دیجیتال موجودی نامحدود دارند</p>
              )}
            </div>

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
              <label className="block text-sm font-medium text-purple-200 mb-2">وضعیت</label>
              <select
                value={newProduct.status}
                onChange={(e) => setNewProduct({...newProduct, status: e.target.value})}
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
              value={newProduct.description}
              onChange={(value) => setNewProduct({...newProduct, description: value})}
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
            {newProduct.image ? (
              <div className="mb-4">
                <div className="relative inline-block">
                  <img
                    src={newProduct.image}
                    alt="پیش‌نمایش عکس اصلی"
                    className="w-32 h-32 object-cover rounded-lg border border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => setNewProduct({...newProduct, image: ''})}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200"
                  >
                    ×
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsMainImageSelection(true);
                  openGalleryModal();
                }}
                className="w-full border-2 border-dashed border-purple-400/50 rounded-lg p-8 text-center mb-4 cursor-pointer hover:border-purple-400 hover:bg-white/5 transition-colors"
                title="انتخاب عکس اصلی"
              >
                <svg className="w-12 h-12 mx-auto text-purple-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-purple-300 text-sm">کلیک کنید تا عکس را از گالری انتخاب یا آپلود کنید</p>
              </button>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
              </svg>
              انتخاب عکس اصلی از گالری
            </button>
          </div>

          {/* Digital Product File Section */}
          {newProduct.productType === 'DIGITAL' && (
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
                {newProduct.downloadUrl ? (
                  <div className="flex items-center justify-center space-x-3 space-x-reverse">
                    <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-right">
                      <div className="text-green-300 font-medium">فایل از فایل منیجر انتخاب شد</div>
                      <div className="text-purple-200 text-sm truncate max-w-xs">{newProduct.downloadUrl}</div>
                      {newProduct.downloadUrl.toLowerCase().endsWith('.zip') && (
                        <div className="text-yellow-300 text-xs mt-1">🔐 قابل پردازش برای تزریق لایسنس</div>
                      )}
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
                    <span className="text-purple-200 text-sm block mt-2">از دکمه بالا برای انتخاب فایل استفاده کنید</span>
                    <span className="text-purple-200 text-sm">فرمت‌های پشتیبانی: PDF, ZIP, RAR, EXE, APK, Office</span>
                  </>
                )}
              </div>

              {/* Auto License Injection for ZIP files */}
              {(digitalFile || selectedFileForLicense) && newProduct.name.trim() && (
                <InlineLicenseInjector
                  selectedFile={digitalFile}
                  selectedFileUrl={selectedFileForLicense}
                  productId={slugify(newProduct.name).slice(0, 20) || 'PRODUCT_' + Date.now()}
                  onProcessComplete={(result) => {
                    // استفاده از فایل پردازش شده به جای فایل اصلی
                    setNewProduct(prev => ({
                      ...prev,
                      downloadUrl: result.url,
                      fileSize: digitalFile ? Math.round((digitalFile?.size || 0) / 1024 / 1024).toString() : prev.fileSize,
                      fileFormat: result.fileName.split('.').pop() || ''
                    }));
                    showMessage('success', 'موفقیت', 'لایسنس با موفقیت به فایل تزریق شد!');
                    // بعد از پردازش موفق، فایل اصلی را null کنیم تا از فایل پردازش شده استفاده شود
                    setDigitalFile(null);
                    setSelectedFileForLicense(null);
                  }}
                  onError={(error) => {
                    showMessage('error', 'خطای لایسنس', error);
                  }}
                />
              )}

              {/* یا آپلود مستقیم فایل از کامپیوتر */}
              {!newProduct.downloadUrl && (
                <div className="mt-4">
                  <input
                    type="file"
                    onChange={handleDigitalFileChange}
                    accept=".zip,.rar,.pdf,.exe,.apk,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    className="hidden"
                    id="digital-file-input"
                  />
                  <label
                    htmlFor="digital-file-input"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    آپلود فایل از کامپیوتر
                  </label>
                  <p className="text-xs text-purple-300 mt-2">
                    فرمت‌های مجاز: ZIP, RAR, PDF, EXE, APK, Office Files
                  </p>
                </div>
              )}
              
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

              {/* لینک پیش‌نمایش زنده - فقط برای قالب‌ها و محصولات دیجیتال */}
              <div className="mt-6 p-6 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-2 border-purple-400/40 rounded-xl backdrop-blur-sm">
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
                      value={newProduct.previewType || 'template'}
                      onChange={(e) => setNewProduct({...newProduct, previewType: e.target.value as 'template' | 'plugin' | 'theme' | 'app'})}
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
                      value={newProduct.previewUrl || ''}
                      onChange={(e) => setNewProduct({...newProduct, previewUrl: e.target.value})}
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
                  {newProduct.previewUrl && (
                    <div className="border-t border-purple-400/30 pt-4">
                      <p className="text-sm text-purple-200 mb-3">پیش‌نمایش دکمه در صفحه محصول:</p>
                      <div className="bg-purple-900/40 rounded-lg p-6 border border-purple-500/30">
                        <a
                          href={newProduct.previewUrl}
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
                            {newProduct.previewType === 'template' && '🚀 پیش‌نمایش زنده قالب'}
                            {newProduct.previewType === 'plugin' && '🔌 پیش‌نمایش زنده افزونه'}
                            {newProduct.previewType === 'theme' && '🎨 پیش‌نمایش زنده تم'}
                            {newProduct.previewType === 'app' && '📱 پیش‌نمایش زنده اپلیکیشن'}
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
                  {newProduct.gallery.length > 0 && ` | ${newProduct.gallery.length} انتخاب شده`})
                </span>
              </button>
              
              {newProduct.gallery.length === 0 && (
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
              {newProduct.gallery.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-purple-200">تصاویر انتخاب شده ({newProduct.gallery.length})</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNewProduct(prev => ({ ...prev, gallery: [] }));
                          showMessage('info', 'پاک شد', 'تمام تصاویر گالری پاک شدند');
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
                      >
                        پاک کردن همه
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          showMessage('success', 'تأیید شد', `${newProduct.gallery.length} تصویر برای گالری محصول انتخاب شد`);
                        }}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                      >
                        ✓ تأیید انتخاب
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-3">
                    {newProduct.gallery.map((image, index) => (
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
                            const updatedGallery = newProduct.gallery.filter((_, i) => i !== index);
                            setNewProduct({
                              ...newProduct,
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
            {newProduct.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newProduct.tags.map((tag, index) => (
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
            {newProduct.keyFeatures.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newProduct.keyFeatures.map((feature, index) => (
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
            {newProduct.whatIncluded.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newProduct.whatIncluded.map((item, index) => (
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
                  value={newProduct.technicalSpecs.weight}
                  onChange={(e) => setNewProduct({
                    ...newProduct,
                    technicalSpecs: { ...newProduct.technicalSpecs, weight: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="مثال: 1.2 kg"
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
                  placeholder="مثال: 25 x 15 x 8 cm"
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
                  placeholder="مثال: فلز، پلاستیک، چوب"
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
                  placeholder="نام برند محصول"
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
                  placeholder="مثال: 2 سال، 18 ماه"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">مبدا</label>
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

          {/* Colors Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-purple-200 mb-2">رنگ‌های موجود</label>
            <div className="flex space-x-2 space-x-reverse mb-4">
              <input
                type="text"
                value={currentColor.name}
                onChange={(e) => setCurrentColor({ ...currentColor, name: e.target.value })}
                className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="نام رنگ (مثال: مشکی، سفید)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
              />
              <input
                type="color"
                value={currentColor.value}
                onChange={(e) => setCurrentColor({ ...currentColor, value: e.target.value })}
                className="w-20 h-12 bg-white/20 border border-white/30 rounded-lg cursor-pointer"
                title="انتخاب رنگ"
              />
              <button
                type="button"
                onClick={addColor}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
              >
                افزودن رنگ
              </button>
            </div>
            {colors.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {colors.map((color) => (
                  <div
                    key={color.id}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border-2 ${
                      color.available 
                        ? 'bg-blue-500/20 text-blue-300 border-blue-400/50' 
                        : 'bg-gray-500/20 text-gray-400 border-gray-400/50'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white/50 ml-2"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="ml-2">{color.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleColorAvailability(color.id)}
                      className="mr-2 text-xs px-2 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors"
                      title={color.available ? 'غیرفعال کردن' : 'فعال کردن'}
                    >
                      {color.available ? '✓' : '✗'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeColor(color.id)}
                      className="mr-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sizes Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-purple-200 mb-2">سایزهای موجود</label>
            <div className="flex space-x-2 space-x-reverse mb-4">
              <input
                type="text"
                value={currentSize.name}
                onChange={(e) => setCurrentSize({ ...currentSize, name: e.target.value })}
                className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="نام سایز (مثال: Large, XL)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
              />
              <input
                type="text"
                value={currentSize.value}
                onChange={(e) => setCurrentSize({ ...currentSize, value: e.target.value })}
                className="w-24 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="مقدار"
              />
              <input
                type="number"
                value={currentSize.price}
                onChange={(e) => setCurrentSize({ ...currentSize, price: e.target.value })}
                className="w-32 px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                placeholder="قیمت اضافه"
              />
              <button
                type="button"
                onClick={addSize}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
              >
                افزودن سایز
              </button>
            </div>
            {sizes.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {sizes.map((size) => (
                  <div
                    key={size.id}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border-2 ${
                      size.available 
                        ? 'bg-green-500/20 text-green-300 border-green-400/50' 
                        : 'bg-gray-500/20 text-gray-400 border-gray-400/50'
                    }`}
                  >
                    <span className="font-semibold">{size.name}</span>
                    {size.price && (
                      <span className="mr-2 text-xs opacity-75">+{size.price.toLocaleString('fa-IR')} تومان</span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleSizeAvailability(size.id)}
                      className="mr-2 text-xs px-2 py-1 bg-white/20 hover:bg-white/30 rounded transition-colors"
                      title={size.available ? 'غیرفعال کردن' : 'فعال کردن'}
                    >
                      {size.available ? '✓' : '✗'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSize(size.id)}
                      className="mr-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors duration-200"
                    >
                      ×
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
              {newProduct.productBenefits.map((benefit, index) => (
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
              value={newProduct.shippingInfo}
              onChange={(e) => setNewProduct({...newProduct, shippingInfo: e.target.value})}
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
              onClick={handleAddProduct}
              disabled={addProductMutation.isPending}
              className={`px-6 py-3 rounded-lg transition-colors duration-200 shadow-lg ${
                addProductMutation.isPending
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {addProductMutation.isPending ? 'در حال افزودن...' : 'افزودن محصول'}
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">راهنمای افزودن محصول</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-purple-200 text-sm">
            <div>
              <h4 className="font-medium text-white mb-2">فیلدهای اجباری:</h4>
              <ul className="space-y-1">
                <li>• نام محصول</li>
                <li>• دسته‌بندی</li>
                <li>• قیمت</li>
                <li>• موجودی (فقط محصولات فیزیکی)</li>
                <li>• فایل محصول (فقط محصولات دیجیتال)</li>
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
                <li>• فایل محصول اجباری است</li>
                <li>• موجودی خودکار نامحدود می‌شود</li>
                <li>• قابلیت محدودیت دانلود</li>
                <li>• فرمت‌های پشتیبانی شده</li>
                <li>• 🔐 تزریق خودکار لایسنس برای فایل‌های ZIP</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">🔐 سیستم لایسنس:</h4>
              <ul className="space-y-1">
                <li>• فقط فایل‌های ZIP قابل پردازش</li>
                <li>• تزریق خودکار کدهای لایسنس</li>
                <li>• مناسب قالب و افزونه وردپرس</li>
                <li>• کد فعال‌سازی برای کاربر نهایی</li>
                <li>• سیستم احراز هویت سرور</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      <SharedImageGallery
        isOpen={isGalleryModalOpen}
        onClose={closeGalleryModal}
        title={isMainImageSelection ? 'انتخاب عکس اصلی' : 'گالری تصاویر'}
        source="admin"
        allowMultiple={!isMainImageSelection}
        selectedImage={isMainImageSelection ? tempSelectedMainImage : undefined}
        selectedImages={!isMainImageSelection ? tempSelectedGalleryImages : undefined}
        onSelectImage={(url) => setTempSelectedMainImage(url)}
        onSelectImages={(urls) => setTempSelectedGalleryImages(urls)}
        onConfirm={() => confirmGallerySelection()}
      />

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
          setNewProduct(prev => ({
            ...prev,
            downloadUrl: file.url || '',
            fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            fileFormat: file.extension || ''
          }));
          
          // اگر فایل ZIP است، برای تزریق لایسنس آماده کن
          if (file.name && file.name.toLowerCase().endsWith('.zip')) {
            setSelectedFileForLicense({
              url: file.url || '',
              name: file.name
            });
          }
          
          setIsFileManagerOpen(false);
        }}
        allowedExtensions={['.zip', '.rar', '.7z', '.pdf', '.exe', '.apk', '.ipa']}
      />
    </div>
  );
}
