'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCartContext } from '@/contexts/CartContext';
import { PaymentGateway } from '@/types/payment-gateway';
import {
  validateEmail,
  validateFirstName,
  validateLastName,
  validateAddress,
  validateIranianPostalCode,
  formatPostalCodeInput
} from '@/utils';

// داده‌های استان‌ها و شهرها
interface City {
  id: string;
  name: string;
  slug?: string;
}

interface Province {
  id: string;
  name: string;
  slug?: string;
  cities?: string[];
}

// API Response interfaces
interface ApiProvince {
  _id: string;
  province: string;
  cities: string[];
  enabled: boolean;
}

interface CheckoutFormData {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  address2?: string;
  provinceId: string;
  cityId: string;
  zipCode: string;
  phone: string;
  shippingMethod: string;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  color?: string;
  size?: string;
  productType?: 'PHYSICAL' | 'DIGITAL' | 'physical' | 'digital';
  type?: 'PHYSICAL' | 'DIGITAL' | 'physical' | 'digital';
  downloadUrl?: string;
  fileSize?: number;
  fileFormat?: string;
  provisioningType?: 'download' | 'managed-site';
  templateSlug?: string;
  templateId?: string;
}

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

const initialFormData: CheckoutFormData = {
  email: '',
  firstName: '',
  lastName: '',
  address: '',
  address2: '',
  provinceId: '',
  cityId: '',
  zipCode: '',
  phone: '',
  shippingMethod: 'standard',
};

// Removed mock cart items - will use real cart from CartContext

// Shipping methods are now calculated dynamically based on weight and zone
// const shippingMethods: ShippingMethod[] = [];

const CheckoutPage = () => {
  const { cartItems: cart } = useCartContext();
  const [formData, setFormData] = useState<CheckoutFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [loadingGateways, setLoadingGateways] = useState(true);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [taxRate, setTaxRate] = useState<number>(0.08); // نرخ مالیات پیش‌فرض 8%
  
  // Shipping Calculation State
  const [calculatedShippingCost, setCalculatedShippingCost] = useState(0);
  const [shippingZoneName, setShippingZoneName] = useState('');
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [siteDomain, setSiteDomain] = useState('');

  // Analytics hook
  const { trackPurchase, trackCustomEvent } = useAnalytics();

  // دریافت تنظیمات از سرور
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/public-settings');
        const result = await response.json();
        if (result.success && result.data?.taxRate !== undefined) {
          // استفاده از تبدیل صحیح و پشتیبانی از 0
          setTaxRate(Number(result.data.taxRate) / 100);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // دریافت لیست درگاه‌های پرداخت
  useEffect(() => {
    const fetchPaymentGateways = async () => {
      try {
        const response = await fetch('/api/admin/payment-gateways');
        const data = await response.json();
        
        console.log('📦 Payment gateways response:', data);
        
        if (data.success && data.gateways) {
          // فیلتر فقط درگاه‌های فعال (active = true)
          const activeGateways = data.gateways.filter((g: PaymentGateway) => g.active === true);
          console.log('✅ Active gateways:', activeGateways);
          console.log('📊 Total active gateways:', activeGateways.length);
          setPaymentGateways(activeGateways);
          
          // کاربر باید خودش درگاه را انتخاب کند - انتخاب خودکار نداریم
        }
      } catch (error) {
        console.error('❌ خطا در دریافت درگاه‌های پرداخت:', error);
      } finally {
        setLoadingGateways(false);
      }
    };

    fetchPaymentGateways();
  }, []);

  // Helper function to get userId from JWT token
  const getUserId = (): string | null => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return decoded.userId || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Load cart items from CartContext
  useEffect(() => {
    if (cart && cart.length > 0) {
      // Debug: چاپ داده‌های خام از cart
      console.log('\n🛒=== RAW CART DATA ===');
      cart.forEach((item: any, index: number) => {
        console.log(`${index + 1}. "${item.name}":`, {
          productType: item.productType,
          type: item.type,
          downloadUrl: item.downloadUrl,
          fileSize: item.fileSize,
          fileFormat: item.fileFormat
        });
      });
      console.log('=====================\n');

      const transformedItems: CartItem[] = cart.map((item: any) => {
        // تشخیص دقیق نوع محصول با اولویت‌بندی
        let productType: 'PHYSICAL' | 'DIGITAL' | 'physical' | 'digital' = 'PHYSICAL';
        
        // اولویت 1: productType مستقیم
        if (item.productType) {
          productType = item.productType.toUpperCase() === 'DIGITAL' ? 'DIGITAL' : 
                       item.productType.toLowerCase() === 'digital' ? 'DIGITAL' : 'PHYSICAL';
        } 
        // اولویت 2: فیلد type
        else if (item.type) {
          productType = item.type.toUpperCase() === 'DIGITAL' ? 'DIGITAL' : 
                       item.type.toLowerCase() === 'digital' ? 'DIGITAL' : 'PHYSICAL';
        } 
        // اولویت 3: بررسی فیلدهای مرتبط با دانلود
        else if (item.downloadUrl || item.fileSize || item.fileFormat) {
          productType = 'DIGITAL';
        }
        
        console.log(`✅ Transformed "${item.name}": ${item.productType || item.type || 'NONE'} => ${productType}`);
        
        return {
          id: item.id || item._id,
          productId: item.productId || item.id || item._id,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          quantity: item.quantity,
          image: item.imageUrl || item.image || '/placeholder.jpg',
          productType: productType,
          type: item.type,
          downloadUrl: item.downloadUrl,
          fileSize: item.fileSize,
          fileFormat: item.fileFormat
        };
      });

      setCartItems(transformedItems);
    }
  }, [cart]);

  // Load user info if logged in
  useEffect(() => {
    const loadUserInfo = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          console.log('👤 Loading user info for checkout...');
          
          // بارگذاری اطلاعات کامل کاربر از API
          const response = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            console.warn('⚠️ Failed to fetch user profile');
            return;
          }
          
          const data = await response.json();
          console.log('📦 User profile data:', data);

          if (data.success && data.user) {
            const userInfo = data.user;
            
            // تقسیم name به firstName و lastName
            const nameParts = (userInfo.name || '').split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            console.log('✅ Auto-filling form with user data:', {
              firstName,
              lastName,
              email: userInfo.email,
              phone: userInfo.phone
            });
            
            setFormData(prev => ({
              ...prev,
              email: userInfo.email || '',
              firstName: firstName,
              lastName: lastName,
              phone: userInfo.phone || userInfo.mobile || '',
              // فقط اگر address در پروفایل وجود داشت پر می‌شود
              address: userInfo.address?.address || userInfo.address?.street || '',
              provinceId: userInfo.address?.provinceId || '',
              cityId: userInfo.address?.cityId || '',
              zipCode: userInfo.address?.zipCode || userInfo.address?.postalCode || ''
            }));
          }
        } catch (error) {
          console.error('❌ Error loading user info:', error);
        }
      } else {
        console.log('ℹ️ No token found, user must fill form manually');
      }
    };

    loadUserInfo();
  }, []);

  // Load provinces on component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch('/api/provinces');
        const data = await response.json();
        
        if (data.success && data.provinces) {
          // Transform API data to expected format
          const transformedProvinces: Province[] = data.provinces.map((apiProvince: ApiProvince) => ({
            id: apiProvince._id,
            name: apiProvince.province,
            slug: apiProvince.province.toLowerCase().replace(/\s+/g, '-'),
            cities: apiProvince.cities
          }));
          
          setProvinces(transformedProvinces);
        }
      } catch (error) {
        console.error('Error fetching provinces:', error);
      } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  // Load cities when province changes
  useEffect(() => {
    const fetchCities = async () => {
      if (!formData.provinceId) {
        setCities([]);
        return;
      }

      setLoadingCities(true);
      try {
        // Find the selected province and get its cities
        const selectedProvince = provinces.find(p => p.id === formData.provinceId);
        if (selectedProvince && selectedProvince.cities) {
          const transformedCities: City[] = selectedProvince.cities.map((cityName, index) => ({
            id: `${formData.provinceId}-${index}`,
            name: cityName,
            slug: cityName.toLowerCase().replace(/\s+/g, '-')
          }));
          setCities(transformedCities);
        } else {
          setCities([]);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
  }, [formData.provinceId, provinces]);

  // بررسی وجود محصولات فیزیکی در سبد خرید
  const hasPhysicalProducts = cartItems.some(item => {
    const isPhysical = item.productType !== 'DIGITAL' && item.productType !== 'digital';
    return isPhysical;
  });
  
  const hasOnlyDigitalProducts = cartItems.length > 0 && cartItems.every(item => {
    const isDigital = item.productType === 'DIGITAL' || item.productType === 'digital';
    return isDigital;
  });

  const hasManagedSiteProducts = cartItems.some(
    (item) => item.provisioningType === 'managed-site'
  );

  const mapOrderItems = () =>
    cartItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      productType: item.productType || item.type,
      downloadUrl: item.downloadUrl,
      fileSize: item.fileSize,
      fileFormat: item.fileFormat,
      provisioningType: item.provisioningType || 'download',
      templateSlug: item.templateSlug,
      templateId: item.templateId,
      siteDomain: item.provisioningType === 'managed-site' ? siteDomain.trim() : undefined,
    }));

  // Debug: چاپ دقیق نوع محصولات
  console.log('\n🔍=== PRODUCT TYPE CHECK ===');
  console.log('📦 Has Physical Products:', hasPhysicalProducts);
  console.log('📥 Has Only Digital Products:', hasOnlyDigitalProducts);
  console.log('📊 Current Step:', currentStep);
  console.log('📝 Items Detail:');
  cartItems.forEach((item, index) => {
    const isDigital = item.productType === 'DIGITAL' || item.productType === 'digital';
    console.log(`  ${index + 1}. "${item.name}" => Type: "${item.productType}" => Is Digital: ${isDigital}`);
  });
  console.log('========================\n');

  // Auto-redirect: اگر در Step 2 هستیم و فقط محصولات دیجیتال داریم، به Step 3 برو
  useEffect(() => {
    if (currentStep === 2 && hasOnlyDigitalProducts && cartItems.length > 0) {
      console.log('⚠️ Redirecting from Step 2 to Step 3 (digital products only)');
      setCurrentStep(3);
    }
  }, [currentStep, hasOnlyDigitalProducts, cartItems.length]);

  const subtotal = cartItems.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
  // const selectedShippingMethod = shippingMethods.find(method => method.id === formData.shippingMethod);
  const shippingCost = hasPhysicalProducts ? calculatedShippingCost : 0; // هزینه ارسال محاسبه شده
  const tax = subtotal * taxRate; // محاسبه مالیات بر اساس نرخ از تنظیمات
  const totalBeforeDiscount = subtotal + tax + shippingCost; // مجموع قبل از تخفیف
  const total = Math.round(totalBeforeDiscount - discountAmount); // گرد کردن به عدد صحیح

  // Apply discount code
  const applyDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError('لطفاً کد تخفیف را وارد کنید');
      return;
    }

    setApplyingDiscount(true);
    setDiscountError('');

    try {
      // محاسبه مجموع کل شامل مالیات و هزینه ارسال
      const tempShippingCost = hasPhysicalProducts ? calculatedShippingCost : 0;
      const tempTax = subtotal * taxRate; // استفاده از نرخ مالیات از تنظیمات
      const tempTotal = subtotal + tempTax + tempShippingCost;

      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: discountCode,
          cartTotal: tempTotal, // ارسال کل مبلغ شامل مالیات و ارسال
          cartItems: cartItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price
          }))
        }),
      });

      const data = await response.json();

      if (data.success && data.discount) {
        setDiscountAmount(data.discount.discountAmount || 0);
        setDiscountError('');
      } else {
        setDiscountError(data.error || 'کد تخفیف نامعتبر است');
        setDiscountAmount(0);
      }
    } catch (error) {
      console.error('Error applying discount:', error);
      setDiscountError('خطا در اعمال کد تخفیف');
      setDiscountAmount(0);
    } finally {
      setApplyingDiscount(false);
    }
  };

  // تابع اعتبارسنجی فیلدها
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email': {
        const result = validateEmail(value, { allowTempEmails: false });
        return result.isValid ? '' : result.error || 'ایمیل نامعتبر است';
      }
      case 'firstName': {
        const result = validateFirstName(value);
        return result.isValid ? '' : result.error || 'نام نامعتبر است';
      }
      case 'lastName': {
        const result = validateLastName(value);
        return result.isValid ? '' : result.error || 'نام خانوادگی نامعتبر است';
      }
      case 'zipCode': {
        const result = validateIranianPostalCode(value);
        return result.isValid ? '' : result.error || 'کد پستی نامعتبر است';
      }
      case 'address': {
        const result = validateAddress(value, { minLength: 15 });
        return result.isValid ? '' : result.error || 'آدرس نامعتبر است';
      }
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // فرمت خودکار کد پستی
    let newValue = value;
    if (name === 'zipCode') {
      newValue = formatPostalCodeInput(value);
    }
    
    setFormData(prev => {
      const newData = { ...prev, [name]: newValue };
      
      // اگر استان تغییر کرد، شهر را ریست کن
      if (name === 'provinceId') {
        newData.cityId = '';
      }
      
      return newData;
    });
    
    // پاک کردن خطای فیلد در حین تایپ
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // اعتبارسنجی هنگام blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setValidationErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasManagedSiteProducts) {
      const domain = siteDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
      if (!domain || !domain.includes('.')) {
        alert('لطفاً دامنه معتبر برای سایت خود وارد کنید (مثال: shop.ir)');
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      // محاسبه مبلغ نهایی
      const finalAmount = total;
      
      console.log('💰 مبلغ نهایی:', finalAmount);
      
      // اگر مبلغ نهایی صفر است (تخفیف 100%)
      if (finalAmount <= 0) {
        console.log('✅ تخفیف 100% - پرداخت مستقیم بدون درگاه بانک');
        
        const userId = getUserId();
        console.log('👤 User ID from token:', userId);
        console.log('📦 Cart items:', cartItems.length);
        
        // ایجاد سفارش در دیتابیس
        console.log('� Calling /api/orders/create...');
        const orderResponse = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            items: mapOrderItems(),
            siteDomain: hasManagedSiteProducts ? siteDomain.trim() : undefined,
            contactInfo: {
              email: formData.email,
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone
            },
            shippingAddress: hasPhysicalProducts ? {
              address: formData.address,
              provinceId: formData.provinceId,
              cityId: formData.cityId,
              zipCode: formData.zipCode
            } : null,
            shippingMethod: hasPhysicalProducts ? (shippingZoneName || 'Weight Based') : null,
            paymentMethod: 'free',
            paymentStatus: 'completed',
            totalAmount: 0,
            discountAmount: discountAmount,
            discountCode: discountCode
          })
        });
        
        console.log('📡 API Response status:', orderResponse.status);
        const orderData = await orderResponse.json();
        console.log('📊 Order response data:', orderData);
        
        if (orderData.success) {
          console.log('✅ Order created successfully!', orderData.orderNumber);
          // Track purchase
          trackPurchase({
            transaction_id: orderData.orderId,
            total_amount: 0,
            items: cartItems.map(item => ({
              product_id: item.id,
              product_name: item.name,
              category: 'product',
              price: 0,
              quantity: item.quantity
            }))
          });
          
          trackCustomEvent('checkout_complete', 'purchase', 'Order completed with 100% discount');
          
          const successMessage = hasManagedSiteProducts
            ? '🎉 سفارش ثبت شد! از بخش «سایت‌های من» وضعیت DNS و راه‌اندازی را پیگیری کنید.'
            : hasOnlyDigitalProducts
            ? '🎉 سفارش شما ثبت شد! محصولات دیجیتال در پنل کاربری شما آماده دانلود است.'
            : '🎉 سفارش با موفقیت ثبت شد! از خرید شما متشکریم.';
          
          alert(successMessage);
          
          window.location.href = hasManagedSiteProducts ? '/user/my-sites' : '/profile';
        } else {
          throw new Error(orderData.error || 'خطا در ثبت سفارش');
        }
      } else {
        // مبلغ بیشتر از صفر است - هدایت به درگاه بانک
        console.log('💳 هدایت به درگاه بانک...');
        
        setProcessingMessage('در حال ایجاد سفارش...');
        
        const userId = getUserId();
        console.log('👤 User ID from token:', userId);
        console.log('📦 Cart items:', cartItems.length);
        
        // ایجاد سفارش موقت
        console.log('🔄 Calling /api/orders/create (payment mode)...');
        const orderResponse = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            items: mapOrderItems(),
            siteDomain: hasManagedSiteProducts ? siteDomain.trim() : undefined,
            contactInfo: {
              email: formData.email,
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone
            },
            shippingAddress: hasPhysicalProducts ? {
              address: formData.address,
              provinceId: formData.provinceId,
              cityId: formData.cityId,
              zipCode: formData.zipCode
            } : null,
            shippingMethod: hasPhysicalProducts ? (shippingZoneName || 'Weight Based') : null,
            paymentMethod: 'online',
            paymentStatus: 'pending',
            totalAmount: finalAmount,
            discountAmount: discountAmount,
            discountCode: discountCode
          })
        });
        
        console.log('📡 API Response status:', orderResponse.status);
        const orderData = await orderResponse.json();
        console.log('📊 Order response data:', orderData);
        
        if (orderData.success) {
          console.log('✅ Order created successfully!', orderData.orderNumber);
          
          setProcessingMessage('در حال اتصال به درگاه پرداخت...');
          
          // هدایت به درگاه پرداخت
          const paymentResponse = await fetch('/api/payment/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderData.orderId,
              amount: finalAmount,
              email: formData.email,
              phone: formData.phone,
              gatewayId: selectedGateway // ارسال درگاه انتخاب شده
            })
          });
          
          const paymentData = await paymentResponse.json();
          
          if (paymentData.success && paymentData.paymentUrl) {
            setProcessingMessage('در حال هدایت به درگاه بانک...');
            
            // هدایت به صفحه پرداخت بانک
            window.location.href = paymentData.paymentUrl;
          } else {
            throw new Error(paymentData.error || 'خطا در ایجاد درخواست پرداخت');
          }
        } else {
          throw new Error(orderData.error || 'خطا در ثبت سفارش');
        }
      }
    } catch (error: any) {
      console.error('❌ خطا در پردازش سفارش:', error);
      alert('خطا در پردازش سفارش: ' + (error.message || 'لطفاً دوباره تلاش کنید'));
      setIsSubmitting(false);
      setProcessingMessage('');
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        // اطلاعات تماس همیشه اجباری است
        return formData.email && formData.firstName && formData.lastName && formData.phone;
      case 2:
        // اگر فقط محصولات دیجیتال داریم، step 2 اصلاً نمایش داده نمی‌شود
        if (hasOnlyDigitalProducts) {
          return true;
        }
        // برای محصولات فیزیکی آدرس کامل لازم است
        return formData.address && formData.provinceId && formData.cityId && formData.zipCode;
      case 3:
        // اعتبارسنجی پرداخت - بررسی انتخاب درگاه برای پرداخت‌های غیررایگان
        if (total > 0) {
          return selectedGateway !== '';
        }
        return true;
      default:
        return false;
    }
  };

  const steps = hasOnlyDigitalProducts 
    ? [
        { id: 1, name: 'اطلاعات تماس', icon: '👤' },
        { id: 3, name: 'پرداخت', icon: '💳' }
      ]
    : [
        { id: 1, name: 'اطلاعات تماس', icon: '👤' },
        { id: 2, name: 'آدرس ارسال', icon: '📦' },
        { id: 3, name: 'پرداخت', icon: '💳' }
      ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Processing Overlay */}
      {isSubmitting && processingMessage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-8 rounded-2xl shadow-2xl border border-purple-500/30 max-w-md mx-4">
            <div className="flex flex-col items-center space-y-4">
              {/* Animated Spinner */}
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-purple-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              {/* Message */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white">{processingMessage}</h3>
                <p className="text-gray-300 text-sm">لطفاً صبر کنید و این صفحه را نبندید</p>
              </div>
              
              {/* Progress Steps */}
              <div className="w-full bg-purple-800/30 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cart" className="text-purple-400 hover:text-purple-300 inline-flex items-center space-x-2 mb-4 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>بازگشت به سبد خرید</span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">تسویه حساب امن</h1>
          <p className="text-gray-400">سفارش خود را با امنیت کامل تکمیل کنید</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-300 ${
                  currentStep >= step.id 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                    : 'bg-white/10 text-gray-400'
                }`}>
                  {step.icon}
                </div>
                <span className={`ml-3 font-medium transition-colors ${
                  currentStep >= step.id ? 'text-purple-400' : 'text-gray-400'
                }`}>
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-6 rounded transition-colors ${
                    currentStep > step.id ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="xl:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Contact Information */}
              {currentStep === 1 && (
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-500/20 animate-fadeInUp">
                  <h2 className="text-2xl font-bold text-white mb-6">اطلاعات تماس</h2>
                  
                  {/* نمایش پیام برای محصولات دیجیتال */}
                  {hasOnlyDigitalProducts && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-blue-300 text-sm font-medium mb-1">
                            📥 خرید محصولات دیجیتال
                          </p>
                          <p className="text-blue-200 text-xs">
                            سبد خرید شما فقط شامل محصولات دیجیتالی است. نیازی به وارد کردن آدرس ارسال نیست و فایل‌ها بلافاصله پس از پرداخت قابل دانلود خواهند بود.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        آدرس ایمیل *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                          validationErrors.email
                            ? 'border-red-500 focus:border-red-400'
                            : 'border-purple-500/30 focus:border-purple-400'
                        }`}
                        placeholder="ahmad@example.com"
                        required
                      />
                      {validationErrors.email && (
                        <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        نام *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                          validationErrors.firstName
                            ? 'border-red-500 focus:border-red-400'
                            : 'border-purple-500/30 focus:border-purple-400'
                        }`}
                        placeholder="احمد"
                        required
                      />
                      {validationErrors.firstName && (
                        <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        نام خانوادگی *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                          validationErrors.lastName
                            ? 'border-red-500 focus:border-red-400'
                            : 'border-purple-500/30 focus:border-purple-400'
                        }`}
                        placeholder="محمدی"
                        required
                      />
                      {validationErrors.lastName && (
                        <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.lastName}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        شماره تلفن *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
                        placeholder="09123456789"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Shipping Address - فقط برای محصولات فیزیکی */}
              {currentStep === 2 && !hasOnlyDigitalProducts && hasPhysicalProducts && (
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-500/20 animate-fadeInUp">
                  <h2 className="text-2xl font-bold text-white mb-6">آدرس ارسال</h2>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-blue-300 text-sm">
                        {hasOnlyDigitalProducts 
                          ? 'محصولات دیجیتال نیاز به آدرس ارسال ندارند'
                          : 'آدرس ارسال فقط برای محصولات فیزیکی استفاده می‌شود'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        آدرس خیابان *
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                          validationErrors.address
                            ? 'border-red-500 focus:border-red-400'
                            : 'border-purple-500/30 focus:border-purple-400'
                        }`}
                        placeholder="خیابان ولیعصر، پلاک 123"
                        required
                      />
                      {validationErrors.address && (
                        <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.address}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        آپارتمان، واحد و غیره
                      </label>
                      <input
                        type="text"
                        name="address2"
                        value={formData.address2}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
                        placeholder="واحد 25"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        استان *
                      </label>
                      <select
                        name="provinceId"
                        value={formData.provinceId}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 transition-colors"
                        required
                        disabled={loadingProvinces}
                      >
                        <option value="">
                          {loadingProvinces ? 'در حال بارگذاری...' : 'انتخاب استان'}
                        </option>
                        {provinces.map((province: Province) => (
                          <option key={province.id} value={province.id} style={{ color: 'black' }}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        شهر *
                      </label>
                      <select
                        name="cityId"
                        value={formData.cityId}
                        onChange={handleInputChange}
                        disabled={!formData.provinceId || loadingCities}
                        className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      >
                        <option value="">
                          {loadingCities 
                            ? 'در حال بارگذاری...' 
                            : formData.provinceId 
                              ? 'انتخاب شهر' 
                              : 'ابتدا استان را انتخاب کنید'
                          }
                        </option>
                        {cities.map((city: City) => (
                          <option key={city.id} value={city.id} style={{ color: 'black' }}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        کد پستی * <span className="text-gray-400 text-xs">(10 رقم)</span>
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        maxLength={11}
                        className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-400 focus:outline-none transition-colors ${
                          validationErrors.zipCode
                            ? 'border-red-500 focus:border-red-400'
                            : 'border-purple-500/30 focus:border-purple-400'
                        }`}
                        placeholder="12345-67890"
                        dir="ltr"
                        required
                      />
                      {validationErrors.zipCode && (
                        <p className="text-red-400 text-sm mt-1">⚠️ {validationErrors.zipCode}</p>
                      )}
                    </div>
                  </div>

                  {/* Shipping Cost Display */}
                  {hasPhysicalProducts && (
                    <div className="mt-8">
                      <h3 className="text-xl font-bold text-white mb-4">هزینه ارسال</h3>
                      <div className="p-4 bg-white/5 border border-purple-500/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">
                              {shippingZoneName ? `ارسال به ${shippingZoneName}` : 'هزینه ارسال'}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {isCalculatingShipping ? 'در حال محاسبه...' : 'محاسبه شده بر اساس وزن و مقصد'}
                            </p>
                          </div>
                          <span className="text-white font-bold text-lg">
                            {isCalculatingShipping ? (
                              <span className="animate-pulse">...</span>
                            ) : (
                              shippingCost === 0 ? 'رایگان' : `${shippingCost.toLocaleString('fa-IR')} تومان`
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-500/20 animate-fadeInUp">
                  <h2 className="text-2xl font-bold text-white mb-6">اطلاعات پرداخت</h2>
                  
                  {/* Managed site domain */}
                  {hasManagedSiteProducts && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6">
                      <h3 className="text-white font-semibold mb-2">دامنه سایت شما</h3>
                      <p className="text-purple-200 text-sm mb-3">
                        دامنه‌ای که می‌خواهید فروشگاه روی آن بالا بیاید را وارد کنید. بعد از خرید، راهنمای DNS نمایش داده می‌شود.
                      </p>
                      <input
                        type="text"
                        value={siteDomain}
                        onChange={(e) => setSiteDomain(e.target.value)}
                        placeholder="مثال: shop.ir"
                        className="w-full px-4 py-3 rounded-lg bg-white/10 border border-purple-400/30 text-white placeholder-gray-400"
                        dir="ltr"
                        required
                      />
                    </div>
                  )}

                  {/* Digital Products Notice */}
                  {hasOnlyDigitalProducts && !hasManagedSiteProducts && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-green-300 text-sm font-medium">
                          📥 محصولات دیجیتال بلافاصله پس از پرداخت قابل دانلود هستند
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Mixed Products Notice */}
                  {hasPhysicalProducts && !hasOnlyDigitalProducts && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-blue-300 text-sm">
                          سفارش شما شامل محصولات فیزیکی و دیجیتال است. محصولات دیجیتال فوراً قابل دانلود و محصولات فیزیکی ارسال خواهند شد.
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Payment Gateways Selection */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">💳 انتخاب روش پرداخت</h3>
                    
                    {loadingGateways ? (
                      <div className="p-6 bg-white/5 rounded-lg text-center">
                        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-400 text-sm">در حال بارگذاری درگاه‌های پرداخت...</p>
                      </div>
                    ) : paymentGateways.length === 0 ? (
                      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-300 text-sm">❌ هیچ درگاه پرداختی فعال نیست. لطفاً با پشتیبانی تماس بگیرید.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {paymentGateways.map((gateway) => {
                          const gatewayId = gateway._id || gateway.id || '';
                          return (
                          <div
                            key={gatewayId}
                            onClick={() => setSelectedGateway(gatewayId)}
                            className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                              selectedGateway === gatewayId
                                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500 shadow-lg shadow-green-500/20'
                                : 'bg-white/5 border-white/10 hover:border-purple-500/50 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  selectedGateway === gatewayId
                                    ? 'border-green-500 bg-green-500'
                                    : 'border-gray-400'
                                }`}>
                                  {selectedGateway === gatewayId && (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <p className="text-white font-bold text-lg flex items-center gap-2">
                                    <span>💳</span>
                                    <span>{gateway.name}</span>
                                  </p>
                                  <p className="text-gray-400 text-sm">
                                    {gateway.testMode ? '🧪 حالت تست (Sandbox)' : '🔒 درگاه امن'}
                                  </p>
                                </div>
                              </div>
                              {selectedGateway === gatewayId && (
                                <div className="flex items-center gap-2">
                                  <span className="text-green-400 text-sm font-medium">✓ انتخاب شده</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                        })}
                        
                        {total <= 0 ? (
                          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <p className="text-green-300 text-sm flex items-center gap-2">
                              <span>🎉</span>
                              <span>تخفیف 100% اعمال شده! با کلیک روی دکمه زیر، سفارش شما بدون پرداخت ثبت می‌شود.</span>
                            </p>
                          </div>
                        ) : (
                          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <p className="text-blue-300 text-sm flex items-center gap-2">
                              <span>🔒</span>
                              <span>با کلیک روی "تکمیل خرید"، به صورت امن به درگاه {paymentGateways.find(g => g._id === selectedGateway)?.name || 'بانکی'} هدایت خواهید شد.</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const prevStep = hasOnlyDigitalProducts && currentStep === 3 ? 1 : currentStep - 1;
                        setCurrentStep(prevStep);
                      }}
                      className="px-8 py-3 border border-purple-500 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all duration-200 font-medium"
                    >
                      قبلی
                    </button>
                  )}
                </div>
                
                <div>
                  {currentStep < 3 || (hasOnlyDigitalProducts && currentStep === 1) ? (
                    <button
                      type="button"
                      onClick={() => {
                        const nextStep = hasOnlyDigitalProducts && currentStep === 1 ? 3 : currentStep + 1;
                        setCurrentStep(nextStep);
                      }}
                      disabled={!isStepValid(currentStep)}
                      className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ادامه
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!isStepValid(currentStep) || isSubmitting || (total > 0 && !selectedGateway)}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>در حال پردازش...</span>
                        </>
                      ) : (
                        <>
                          {total <= 0 ? (
                            <>
                              <span>🎉 ثبت سفارش رایگان</span>
                            </>
                          ) : (
                            <>
                              <span>💳 پرداخت آنلاین</span>
                              <span>({total.toLocaleString('fa-IR')} تومان)</span>
                            </>
                          )}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="xl:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-500/20 sticky top-4">
              <h2 className="text-xl font-bold text-white mb-6">خلاصه سفارش</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item: CartItem) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                      {/* نشان محصول دیجیتال */}
                      {item.productType === 'DIGITAL' && (
                        <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                          دیجیتال
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{item.name}</p>
                      {item.productType === 'DIGITAL' && (
                        <p className="text-blue-400 text-xs mb-1">📥 قابل دانلود فوری</p>
                      )}
                      {(item.color || item.size) && (
                        <p className="text-gray-400 text-xs">
                          {item.color && `رنگ: ${item.color}`}
                          {item.color && item.size && ' • '}
                          {item.size && `سایز: ${item.size}`}
                        </p>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className="text-purple-400 font-medium text-sm">{item.price.toLocaleString('fa-IR')} تومان</span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="text-gray-500 line-through text-xs">{item.originalPrice.toLocaleString('fa-IR')} تومان</span>
                        )}
                        <span className="text-gray-400 text-xs">× {item.quantity}</span>
                      </div>
                    </div>
                    <span className="text-white font-bold text-sm">
                      {(item.price * item.quantity).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                ))}
              </div>

              {/* Discount Code */}
              <div className="pt-4 border-t border-purple-500/20">
                <label className="block text-white font-medium mb-2">کد تخفیف</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="کد تخفیف خود را وارد کنید"
                    className="flex-1 px-4 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={applyDiscountCode}
                    disabled={applyingDiscount}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {applyingDiscount ? 'در حال بررسی...' : 'اعمال'}
                  </button>
                </div>
                {discountError && (
                  <p className="text-red-400 text-sm mt-2">{discountError}</p>
                )}
                {discountAmount > 0 && (
                  <p className="text-green-400 text-sm mt-2">
                    ✓ کد تخفیف با موفقیت اعمال شد!
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-purple-500/20">
                <div className="flex justify-between text-gray-300">
                  <span>جمع کل</span>
                  <span>{subtotal.toLocaleString('fa-IR')} تومان</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>
                    هزینه ارسال
                    {hasOnlyDigitalProducts && (
                      <span className="text-blue-400 text-xs mr-1">(دیجیتال)</span>
                    )}
                  </span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-400">
                        {hasOnlyDigitalProducts ? 'قابل دانلود فوری' : 'رایگان'}
                      </span>
                    ) : (
                      `${shippingCost.toLocaleString('fa-IR')} تومان`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>مالیات ({(taxRate * 100).toLocaleString('fa-IR')}%)</span>
                  <span>{tax.toLocaleString('fa-IR')} تومان</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>تخفیف</span>
                    <span>-{discountAmount.toLocaleString('fa-IR')} تومان</span>
                  </div>
                )}
                <div className="border-t border-purple-500/20 pt-3">
                  <div className="flex justify-between text-xl font-bold text-white">
                    <span>مجموع کل</span>
                    <span>{total.toLocaleString('fa-IR')} تومان</span>
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div className="mt-6 pt-4 border-t border-purple-500/20 space-y-3">
                {hasOnlyDigitalProducts && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-green-300 text-xs">دانلود فوری پس از پرداخت</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>رمزنگاری SSL 256 بیتی</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>پشتیبانی مشتریان 24/7</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-4 border-t border-purple-500/20">
                <p className="text-sm text-white mb-3">روش‌های پرداخت:</p>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* بانک ملت */}
                  <div className="w-16 h-16 rounded p-1 flex items-center justify-center">
                    <Image 
                      src="/images/banks/Bank_Mellat.png" 
                      alt="بانک ملت" 
                      width={56} 
                      height={56}
                      className="object-contain"
                    />
                  </div>
                  
                  {/* بانک ملی ایران */}
                  <div className="w-16 h-16 rounded p-1 flex items-center justify-center">
                    <Image 
                      src="/images/banks/Bank_Melli.png" 
                      alt="بانک ملی ایران" 
                      width={56} 
                      height={56}
                      className="object-contain"
                    />
                  </div>
                  
                  {/* زرین پال */}
                  <div className="w-20 h-16 rounded flex items-center justify-center">
                    <Image 
                      src="/images/banks/zarinpal.png" 
                      alt="زرین پال" 
                      width={50} 
                      height={75}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
