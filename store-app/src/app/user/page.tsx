'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import iranCities from '@/../../data/iran-cities.json';
import { useWishlist } from '@/contexts/WishlistContext';
import { useURLSettings } from '@/contexts/URLSettingsContext';
import { validatePassword as validatePasswordUtil, validateAddress, validateIranianPostalCode } from '@/utils';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  avatar?: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Order {
  id: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  shippingAddress: string;
  trackingNumber?: string;
}

interface Download {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  downloadUrl: string;
  category: 'invoice' | 'manual' | 'license' | 'receipt';
}

interface Address {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

const UserPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const { wishlist: wishlistData, removeFromWishlist } = useWishlist();
  const { generateProductUrl } = useURLSettings();
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    avatar: '/placeholder.jpg',
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<Omit<Address, 'id'>>({
    title: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false
  });
  const [alertModal, setAlertModal] = useState<{show: boolean; message: string; type: 'success' | 'error' | 'warning'}>({
    show: false,
    message: '',
    type: 'success'
  });
  const [confirmModal, setConfirmModal] = useState<{show: boolean; message: string; onConfirm: () => void}>({
    show: false,
    message: '',
    onConfirm: () => {}
  });

  // Get cities based on selected province
  const availableCities = useMemo(() => {
    if (!addressForm.state) return [];
    const province = iranCities.find(p => p.province === addressForm.state);
    return province?.cities || [];
  }, [addressForm.state]);

  // Helper function to show alert modal
  const showAlert = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setAlertModal({ show: true, message, type });
  };

  const tabs = [
    { id: 'profile', name: 'پروفایل', icon: '👤', count: null },
    { id: 'wishlist', name: 'علاقه‌مندی‌ها', icon: '❤️', count: wishlistData?.length || 0 },
    { id: 'orders', name: 'سفارش‌های من', icon: '📦', count: orders?.length || 0 },
    { id: 'invoices', name: 'فاکتورها', icon: '📄', count: orders?.filter(o => o.status !== 'cancelled' && o.status !== 'pending').length || 0 },
    { id: 'addresses', name: 'آدرس‌ها', icon: '📍', count: addresses?.length || 0 },
    { id: 'downloads', name: 'دانلودها', icon: '⬇️', count: downloads?.length || 0 },
  ];

  // Load user data from API
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Decode token to get userId
      const decoded: any = JSON.parse(atob(token.split('.')[1]));
      const userId = decoded.userId;
      
      console.log('👤 User ID from token:', userId);

      // بارگذاری پروفایل کاربر
      const profileResponse = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData.profile);
        setAddresses(profileData.addresses || []);
        
        // بارگذاری سفارشات از API جدید
        console.log('📦 Fetching orders for userId:', userId);
        const ordersResponse = await fetch(`/api/orders/create?userId=${userId}`);
        
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          console.log('📦 Orders response:', ordersData);
          
          if (ordersData.success && ordersData.orders && ordersData.orders.length > 0) {
            // تبدیل سفارشات به فرمت مورد نیاز UI
            const formattedOrders = ordersData.orders.map((order: any) => ({
              id: order.orderNumber,
              date: new Date(order.createdAt).toLocaleDateString('fa-IR'),
              status: order.status === 'completed' ? 'delivered' : order.status === 'pending' ? 'pending' : 'processing',
              total: order.totalAmount || 0,
              items: order.items.map((item: any) => ({
                id: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                image: '/placeholder.jpg'
              })),
              shippingAddress: order.shippingAddress 
                ? `${order.shippingAddress.address}, ${order.shippingAddress.cityId}` 
                : 'محصول دیجیتال - نیازی به ارسال نیست',
              trackingNumber: order.orderNumber
            }));
            
            console.log('✅ Formatted orders:', formattedOrders.length);
            setOrders(formattedOrders);
            
            // استخراج محصولات دیجیتال برای دانلود
            const digitalDownloads: Download[] = [];
            console.log('🔍 Processing orders for downloads:', ordersData.orders.length);
            ordersData.orders.forEach((order: any) => {
              console.log('📦 Order status:', order.status, 'Order ID:', order._id);
              if (order.status === 'completed') {
                order.items.forEach((item: any) => {
                  console.log('  📦 Item:', item.name, 'Type:', item.productType, 'DownloadUrl:', item.downloadUrl);
                  if ((item.productType === 'DIGITAL' || item.productType === 'digital') && item.downloadUrl) {
                    const downloadItem: Download = {
                      id: `${order._id}-${item.productId}`,
                      name: item.name,
                      type: item.fileFormat || 'file',
                      date: new Date(order.createdAt).toLocaleDateString('fa-IR'),
                      size: item.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A',
                      downloadUrl: item.downloadUrl,
                      category: 'manual' as const
                    };
                    console.log('  ✅ Adding download:', downloadItem);
                    digitalDownloads.push(downloadItem);
                  }
                });
              }
            });
            
            console.log('📥 Digital downloads:', digitalDownloads.length, digitalDownloads);
            setDownloads(digitalDownloads);
          } else {
            console.log('📦 No orders found');
            setOrders([]);
            setDownloads([]);
          }
        } else {
          console.error('❌ Failed to fetch orders:', ordersResponse.status);
        }
      } else {
        console.error('Failed to load user data');
        if (profileResponse.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear any stored tokens
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');

      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    setPasswordErrors([]);
  };

  const validatePassword = () => {
    const errors: string[] = [];

    if (!passwordForm.currentPassword) {
      errors.push('رمز عبور فعلی الزامی است');
    }

    // ✅ Password Validation پیشرفته
    if (!passwordForm.newPassword) {
      errors.push('رمز عبور جدید الزامی است');
    } else {
      const passResult = validatePasswordUtil(passwordForm.newPassword);
      if (!passResult.isValid) {
        errors.push(passResult.error || 'رمز عبور نامعتبر است');
      } else if (passResult.strength && passResult.strength.percentage < 60) {
        errors.push('⚠️ رمز عبور ضعیف است. از ترکیب حروف بزرگ، کوچک، اعداد و نمادها استفاده کنید');
      }
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.push('رمزهای عبور مطابقت ندارند');
    }

    return errors;
  };

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        setIsEditing(false);
        alert('پروفایل با موفقیت به‌روزرسانی شد!');
      } else {
        const error = await response.json();
        alert(error.error || 'خطا در به‌روزرسانی پروفایل');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('خطا در به‌روزرسانی پروفایل');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    const errors = validatePassword();

    if (errors.length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setSaveLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (response.ok) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
        setPasswordErrors([]);
        alert('رمز عبور با موفقیت به‌روزرسانی شد!');
      } else {
        const error = await response.json();
        setPasswordErrors([error.error || 'خطا در تغییر رمز عبور']);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordErrors(['خطا در تغییر رمز عبور']);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isCheckbox = e.target instanceof HTMLInputElement && e.target.type === 'checkbox';

    setAddressForm(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
      // Reset city when province changes
      ...(name === 'state' ? { city: '' } : {})
    }));
  };

  const handleOpenAddressModal = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        title: address.title,
        address: address.address,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        isDefault: address.isDefault
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        title: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        isDefault: false
      });
    }
    setShowAddressModal(true);
  };

  const handleSaveAddress = async () => {
    // Validation
    if (!addressForm.title?.trim()) {
      showAlert('لطفا عنوان آدرس را وارد کنید', 'warning');
      return;
    }
    if (!addressForm.state?.trim()) {
      showAlert('لطفا استان را انتخاب کنید', 'warning');
      return;
    }
    if (!addressForm.city?.trim()) {
      showAlert('لطفا شهر را انتخاب کنید', 'warning');
      return;
    }
    if (!addressForm.address?.trim()) {
      showAlert('لطفا آدرس کامل را وارد کنید', 'warning');
      return;
    }
    if (!addressForm.zipCode?.trim()) {
      showAlert('لطفا کد پستی را وارد کنید', 'warning');
      return;
    }

    setSaveLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const url = editingAddress ? '/api/user/addresses' : '/api/user/addresses';
      const method = editingAddress ? 'PUT' : 'POST';

      const payload = editingAddress
        ? { ...addressForm, id: editingAddress.id }
        : addressForm;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();

        // Reload addresses from API
        await loadUserData();

        setShowAddressModal(false);
        setEditingAddress(null);
        setAddressForm({
          title: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          isDefault: false
        });
        showAlert(result.message || (editingAddress ? 'آدرس با موفقیت به‌روزرسانی شد!' : 'آدرس با موفقیت اضافه شد!'), 'success');
      } else {
        const error = await response.json();
        showAlert(error.error || 'خطا در ذخیره آدرس', 'error');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      showAlert('خطا در ذخیره آدرس', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    setConfirmModal({
      show: true,
      message: 'آیا از حذف این آدرس اطمینان دارید؟',
      onConfirm: async () => {
        setConfirmModal({ show: false, message: '', onConfirm: () => {} });
        await deleteAddressConfirmed(addressId);
      }
    });
  };

  const deleteAddressConfirmed = async (addressId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/user/addresses?id=${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setAddresses(prev => prev.filter(a => a.id !== addressId));
        showAlert('آدرس با موفقیت حذف شد!', 'success');
      } else {
        const error = await response.json();
        showAlert(error.error || 'خطا در حذف آدرس', 'error');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      showAlert('خطا در حذف آدرس', 'error');
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/user/addresses/set-default', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: addressId })
      });

      if (response.ok) {
        setAddresses(prev => prev.map(a => ({
          ...a,
          isDefault: a.id === addressId
        })));
        showAlert('آدرس پیش‌فرض تغییر کرد!', 'success');
      } else {
        const error = await response.json();
        showAlert(error.error || 'خطا در تنظیم آدرس پیش‌فرض', 'error');
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      showAlert('خطا در تنظیم آدرس پیش‌فرض', 'error');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'processing':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'pending':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getDownloadIcon = (category: Download['category']) => {
    switch (category) {
      case 'invoice':
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'manual':
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        );
      case 'license':
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        );
    }
  };

  const renderProfile = () => (
    <div dir="rtl" className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 h-32 relative">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        {/* Profile Content */}
        <div className="relative px-8 pb-8">
          {/* Avatar */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 -mt-16">
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-yellow-400 p-1 shadow-2xl ring-4 ring-white">
                <Image
                  src={profile?.avatar || '/placeholder.jpg'}
                  alt={`${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'User'}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover rounded-xl bg-white"
                />
              </div>
              <button className="absolute bottom-2 left-2 w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <div className="flex-1 text-center sm:text-right sm:mr-6 sm:mb-4">
              <h2 className="text-3xl font-bold text-gray-900">
                {profile?.firstName || 'کاربر'} {profile?.lastName || ''}
              </h2>
              <p className="text-gray-600 mt-1">{profile?.email || 'ایمیل ثبت نشده'}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 sm:mb-4">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {isEditing ? 'لغو ویرایش' : 'ویرایش پروفایل'}
              </button>

              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="inline-flex items-center px-5 py-2.5 bg-gray-100 text-gray-800 text-sm font-bold rounded-xl hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                تغییر رمز عبور
              </button>

              <button
                onClick={handleLogout}
                className="inline-flex items-center px-5 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                خروج
              </button>
            </div>
          </div>

          {/* Profile Information Form */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                نام
              </label>
              <input
                type="text"
                name="firstName"
                value={profile?.firstName || ''}
                onChange={handleProfileChange}
                disabled={!isEditing}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                نام خانوادگی
              </label>
              <input
                type="text"
                name="lastName"
                value={profile?.lastName || ''}
                onChange={handleProfileChange}
                disabled={!isEditing}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-800 mb-2">
                آدرس ایمیل
              </label>
              <input
                type="email"
                name="email"
                value={profile?.email || ''}
                onChange={handleProfileChange}
                disabled={!isEditing}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                شماره تلفن
              </label>
              <input
                type="tel"
                name="phone"
                value={profile?.phone || ''}
                onChange={handleProfileChange}
                disabled={!isEditing}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                شهر
              </label>
              <input
                type="text"
                name="city"
                value={profile?.city || ''}
                onChange={handleProfileChange}
                disabled={!isEditing}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                استان
              </label>
              <input
                type="text"
                name="state"
                value={profile?.state || ''}
                onChange={handleProfileChange}
                disabled={!isEditing}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                کد پستی
              </label>
              <input
                type="text"
                name="zipCode"
                value={profile?.zipCode || ''}
                onChange={handleProfileChange}
                disabled={!isEditing}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-800 mb-2">
                آدرس
              </label>
              <input
                type="text"
                name="address"
                value={profile?.address || ''}
                onChange={handleProfileChange}
                disabled={!isEditing}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 font-medium"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex space-x-reverse space-x-4 mt-8">
              <button
                onClick={handleSaveProfile}
                disabled={saveLoading}
                className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saveLoading && (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                ذخیره تغییرات
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={saveLoading}
                className="px-8 py-3.5 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition-all duration-300 disabled:opacity-50"
              >
                لغو
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Form */}
      {showPasswordForm && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">تغییر رمز عبور</h3>

          {passwordErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="flex">
                <svg className="w-6 h-6 text-red-500 ml-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-bold text-red-800 mb-2">لطفاً خطاهای زیر را برطرف کنید:</h4>
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    {passwordErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                رمز عبور فعلی
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 font-medium"
                placeholder="رمز عبور فعلی خود را وارد کنید"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                رمز عبور جدید
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 font-medium"
                placeholder="رمز عبور جدید خود را وارد کنید"
              />
              <p className="mt-2 text-sm text-gray-600 font-medium">رمز عبور باید حداقل ۸ کاراکتر باشد</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                تأیید رمز عبور جدید
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 font-medium"
                placeholder="رمز عبور جدید خود را تأیید کنید"
              />
            </div>

            <div className="flex space-x-reverse space-x-4 pt-4">
              <button
                onClick={handleUpdatePassword}
                disabled={saveLoading}
                className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saveLoading && (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                به‌روزرسانی رمز عبور
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordErrors([]);
                }}
                disabled={saveLoading}
                className="px-8 py-3.5 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition-all duration-300 disabled:opacity-50"
              >
                لغو
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderInvoices = () => {
    const paidOrders = orders?.filter(order =>
      order.status !== 'cancelled' && order.status !== 'pending'
    ) || [];

    return (
      <div dir="rtl" className="space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">فاکتورهای من</h2>
            <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl">
              {paidOrders.length} فاکتور
            </div>
          </div>

          {paidOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-gray-500 text-lg">هنوز فاکتوری ثبت نشده است</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paidOrders.map((order) => (
                <div
                  key={order.id}
                  className="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <div className="mb-4 sm:mb-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        فاکتور #{order.id.slice(-8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        تاریخ: {order.date}
                      </p>
                      <p className="text-sm text-gray-600">
                        وضعیت: <span className="font-semibold text-green-600">
                          {order.status === 'delivered' ? 'تحویل شده' :
                           order.status === 'shipped' ? 'ارسال شده' :
                           order.status === 'processing' ? 'در حال پردازش' : 'پرداخت شده'}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end space-y-3">
                      <p className="text-2xl font-bold text-gray-900">
                        {order.total.toLocaleString('fa-IR')} تومان
                      </p>
                      <Link
                        href={`/invoice/${order.id}`}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                      >
                        <span>مشاهده فاکتور</span>
                        <span>📄</span>
                      </Link>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      {order.items.length} محصول - {order.items.reduce((sum, item) => sum + item.quantity, 0)} عدد
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOrders = () => (
    <div dir="rtl" className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">سفارش‌های من</h2>
          <div className="px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-xl">
            {orders?.length || 0} سفارش
          </div>
        </div>

        <div className="space-y-6">
          {orders?.map((order) => (
            <div key={order.id} className="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-2xl hover:border-orange-300 transition-all duration-300">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6">
                <div className="mb-4 sm:mb-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">سفارش {order.id}</h3>
                  <p className="text-sm text-gray-600 mb-1 font-medium">
                    تاریخ ثبت: {order.date}
                  </p>
                  {order.trackingNumber && (
                    <p className="text-sm text-gray-600 font-medium">
                      کد رهگیری: <span className="font-mono text-orange-600 font-bold">{order.trackingNumber}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:items-end space-y-3">
                  <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-xl border-2 ${getStatusColor(order.status)}`}>
                    {order.status === 'delivered' ? 'تحویل شده' :
                     order.status === 'shipped' ? 'ارسال شده' :
                     order.status === 'processing' ? 'در حال پردازش' :
                     order.status === 'pending' ? 'در انتظار' : 'لغو شده'}
                  </span>
                  <p className="text-2xl font-bold text-gray-900">${order.total.toFixed(2)}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-reverse space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white shadow-md">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-gray-900 truncate">{item.name}</h4>
                      <p className="text-sm text-gray-600 font-medium">تعداد: {item.quantity}</p>
                    </div>

                    <div className="text-left">
                      <p className="text-base font-bold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">
                        ${item.price.toFixed(2)} هر عدد
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-5 mb-6">
                <h4 className="text-sm font-bold text-orange-900 mb-2">آدرس ارسال</h4>
                <p className="text-sm text-orange-800 font-medium">{order.shippingAddress}</p>
              </div>

              {/* Order Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 pt-6 border-t-2 border-gray-200">
                <div className="flex flex-wrap gap-3">
                  <button className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    مشاهده جزئیات
                  </button>

                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <button className="inline-flex items-center px-5 py-2.5 bg-gray-100 text-gray-800 text-sm font-bold rounded-xl hover:bg-gray-200 transition-all duration-300 transform hover:scale-105">
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      پیگیری سفارش
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  {order.status === 'delivered' && (
                    <button className="inline-flex items-center px-5 py-2.5 bg-green-500 text-white text-sm font-bold rounded-xl hover:bg-green-600 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      سفارش مجدد
                    </button>
                  )}

                  <button className="inline-flex items-center px-5 py-2.5 bg-gray-100 text-gray-800 text-sm font-bold rounded-xl hover:bg-gray-200 transition-all duration-300 transform hover:scale-105">
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    پشتیبانی
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(orders?.length === 0 || !orders) && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">هنوز سفارشی ندارید</h3>
            <p className="text-gray-600 mb-8 font-medium">شما هنوز هیچ سفارشی ثبت نکرده‌اید. برای مشاهده سفارش‌هایتان شروع به خرید کنید.</p>
            <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              شروع خرید
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderWishlist = () => (
    <div dir="rtl" className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">علاقه‌مندی‌های من</h2>
          <div className="px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-xl">
            {wishlistData?.length || 0} محصول
          </div>
        </div>

        {wishlistData && wishlistData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {wishlistData.map((item) => (
              <div key={item._id} className="border-2 border-gray-200 rounded-2xl p-5 hover:shadow-2xl hover:border-orange-300 transition-all duration-300 group">
                {item.product ? (
                  <div
                    className="flex gap-5 cursor-pointer"
                    onClick={() => {
                      if (!item.product) return;
                      const productUrl = generateProductUrl(item.product);
                      router.push(productUrl);
                    }}
                  >
                    {/* Product Image */}
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-white shadow-md flex-shrink-0">
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        width={90}
                        height={90}
                        className="w-full h-full object-cover"
                      />
                      {item.product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">ناموجود</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                          {item.product.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl font-bold text-gray-900">
                            {item.product.price.toLocaleString('fa-IR')}
                          </span>
                          <span className="text-sm text-gray-600">تومان</span>
                          {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                            <span className="text-sm text-gray-400 line-through">
                              {item.product.originalPrice.toLocaleString('fa-IR')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          افزوده شده در: {new Date(item.addedAt).toLocaleDateString('fa-IR')}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!item.product) return;
                            const productUrl = generateProductUrl(item.product);
                            router.push(productUrl);
                          }}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                        >
                          مشاهده محصول
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWishlist(item.productId);
                          }}
                          className="px-4 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    محصول یافت نشد
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">لیست علاقه‌مندی خالی است</h3>
            <p className="text-gray-600 mb-8 font-medium">محصولات مورد علاقه خود را به لیست اضافه کنید</p>
            <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              مشاهده محصولات
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderAddresses = () => (
    <div dir="rtl" className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">آدرس‌های من</h2>
          <button
            onClick={() => handleOpenAddressModal()}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            افزودن آدرس جدید
          </button>
        </div>

        {addresses && addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl ${
                  address.isDefault
                    ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-yellow-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{address.title}</h3>
                    {address.isDefault && (
                      <span className="inline-flex px-3 py-1 text-xs font-bold bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-full">
                        آدرس پیش‌فرض
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenAddressModal(address)}
                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="flex items-start gap-2 text-gray-700">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-medium">{address.address}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {address.city}, {address.state} - کدپستی: {address.zipCode}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t-2 border-gray-200">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefaultAddress(address.id)}
                      className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-800 text-sm font-bold rounded-xl hover:bg-gray-200 transition-all duration-300"
                    >
                      انتخاب به عنوان پیش‌فرض
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
                    className="px-4 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 hover:shadow-lg transition-all duration-300"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">هنوز آدرسی ثبت نشده</h3>
            <p className="text-gray-600 mb-8 font-medium">برای سفارش‌های خود آدرس ثبت کنید</p>
            <button
              onClick={() => handleOpenAddressModal()}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              افزودن آدرس جدید
            </button>
          </div>
        )}
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAddressModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-yellow-500 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">
                  {editingAddress ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}
                </h3>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-xl transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">عنوان آدرس</label>
                <input
                  type="text"
                  name="title"
                  value={addressForm.title}
                  onChange={handleAddressFormChange}
                  placeholder="مثال: خانه، محل کار"
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">استان</label>
                  <select
                    name="state"
                    value={addressForm.state}
                    onChange={handleAddressFormChange}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 font-medium bg-white"
                  >
                    <option value="">انتخاب استان</option>
                    {iranCities.map((province) => (
                      <option key={province.province} value={province.province}>
                        {province.province}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">شهر</label>
                  <select
                    name="city"
                    value={addressForm.city}
                    onChange={handleAddressFormChange}
                    disabled={!addressForm.state}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 font-medium bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">انتخاب شهر</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">آدرس کامل</label>
                <input
                  type="text"
                  name="address"
                  value={addressForm.address}
                  onChange={handleAddressFormChange}
                  placeholder="آدرس دقیق شامل خیابان، کوچه، پلاک"
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">کد پستی</label>
                <input
                  type="text"
                  name="zipCode"
                  value={addressForm.zipCode}
                  onChange={handleAddressFormChange}
                  placeholder="کد پستی 10 رقمی بدون خط تیره"
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 font-medium"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  checked={addressForm.isDefault}
                  onChange={handleAddressFormChange}
                  className="w-5 h-5 text-orange-500 border-2 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="isDefault" className="text-sm font-bold text-gray-800 cursor-pointer">
                  انتخاب به عنوان آدرس پیش‌فرض
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSaveAddress}
                  disabled={saveLoading}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveLoading ? 'در حال ذخیره...' : editingAddress ? 'به‌روزرسانی آدرس' : 'افزودن آدرس'}
                </button>
                <button
                  onClick={() => setShowAddressModal(false)}
                  disabled={saveLoading}
                  className="px-6 py-3.5 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition-all duration-300 disabled:opacity-50"
                >
                  لغو
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDownloads = () => (
    <div dir="rtl" className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">دانلودهای من</h2>
        <div className="px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-xl">
          {downloads?.length || 0} فایل
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { key: 'all', label: 'همه', color: 'from-gray-600 to-gray-700' },
          { key: 'invoice', label: 'فاکتور', color: 'from-blue-500 to-blue-600' },
          { key: 'manual', label: 'راهنما', color: 'from-green-500 to-green-600' },
          { key: 'license', label: 'گارانتی', color: 'from-purple-500 to-purple-600' },
          { key: 'receipt', label: 'رسید', color: 'from-orange-500 to-orange-600' }
        ].map((filter) => (
          <button
            key={filter.key}
            className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 transform hover:scale-105 bg-gray-100 text-gray-800 hover:bg-gradient-to-r hover:from-orange-500 hover:to-yellow-500 hover:text-white shadow-md hover:shadow-lg"
          >
            {filter.label}
            {filter.key === 'all' && ` (${downloads?.length || 0})`}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {downloads?.map((download) => (
          <div key={download.id} className="flex items-center justify-between p-6 border-2 border-gray-200 rounded-2xl hover:shadow-xl hover:border-orange-300 transition-all duration-300 group">
            <div className="flex items-center space-x-reverse space-x-5">
              {getDownloadIcon(download.category)}

              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                  {download.name}
                </h3>
                <div className="flex items-center space-x-reverse space-x-4 mt-2">
                  <span className="inline-flex items-center px-3 py-1 text-xs font-bold bg-gray-100 text-gray-800 rounded-full">
                    {download.type}
                  </span>
                  <span className="text-sm text-gray-600 font-medium">{download.size}</span>
                  <span className="text-sm text-gray-600 font-medium">
                    {download.date}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-reverse space-x-3">
              <button className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                دانلود
              </button>

              <button className="p-3 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {(downloads?.length === 0 || !downloads) && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">دانلودی در دسترس نیست</h3>
          <p className="text-gray-600 font-medium">محصولات دیجیتال خریداری شده و فاکتورهای شما اینجا نمایش داده می‌شوند.</p>
        </div>
      )}

      {/* Download Statistics */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white/80">فاکتورها</p>
              <p className="text-3xl font-bold text-white">
                {downloads?.filter(d => d.category === 'invoice').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white/80">راهنماها</p>
              <p className="text-3xl font-bold text-white">
                {downloads?.filter(d => d.category === 'manual').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white/80">گارانتی</p>
              <p className="text-3xl font-bold text-white">
                {downloads?.filter(d => d.category === 'license').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-yellow-500 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white/80">رسیدها</p>
              <p className="text-3xl font-bold text-white">
                {downloads?.filter(d => d.category === 'receipt').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-yellow-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-3">حساب کاربری من</h1>
          <p className="text-xl text-gray-700 font-medium">مدیریت پروفایل، سفارش‌ها و دانلودهای شما</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full w-20 h-20 flex items-center justify-center">
                  <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
              <p className="text-gray-700 text-lg font-bold">در حال بارگذاری اطلاعات...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
                <div className="space-y-3">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-5 py-4 text-right rounded-xl transition-all duration-300 transform ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-xl scale-105'
                          : 'text-gray-800 hover:bg-gradient-to-r hover:from-orange-100 hover:to-yellow-100 hover:scale-102'
                      }`}
                    >
                      <div className="flex items-center space-x-reverse space-x-3">
                        <span className="text-2xl">{tab.icon}</span>
                        <span className="font-bold">{tab.name}</span>
                      </div>
                      {tab.count !== null && tab.count !== undefined && (
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                          activeTab === tab.id
                            ? 'bg-white/30 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Quick Stats */}
                <div className="mt-8 pt-6 border-t-2 border-gray-200">
                  <h3 className="text-base font-bold text-gray-900 mb-5">آمار سریع</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl">
                      <span className="text-sm text-red-700 font-bold">علاقه‌مندی‌ها</span>
                      <span className="text-lg font-bold text-red-700 bg-white px-3 py-1 rounded-lg">{wishlistData?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-700 font-bold">کل سفارش‌ها</span>
                      <span className="text-lg font-bold text-gray-900 bg-white px-3 py-1 rounded-lg">{orders?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <span className="text-sm text-blue-700 font-bold">آدرس‌ها</span>
                      <span className="text-lg font-bold text-blue-700 bg-white px-3 py-1 rounded-lg">{addresses?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <span className="text-sm text-green-700 font-bold">کل خرید</span>
                      <span className="text-lg font-bold text-green-700 bg-white px-3 py-1 rounded-lg">
                        ${orders?.reduce((sum, order) => sum + order.total, 0).toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="transition-all duration-300">
                {activeTab === 'profile' && renderProfile()}
                {activeTab === 'wishlist' && renderWishlist()}
                {activeTab === 'orders' && renderOrders()}
                {activeTab === 'invoices' && renderInvoices()}
                {activeTab === 'addresses' && renderAddresses()}
                {activeTab === 'downloads' && renderDownloads()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alert Modal */}
      {alertModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 animate-fadeIn">
            <div className={`p-6 rounded-t-2xl ${
              alertModal.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
              alertModal.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
              'bg-gradient-to-r from-yellow-500 to-orange-500'
            }`}>
              <div className="flex items-center justify-center">
                {alertModal.type === 'success' && (
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {alertModal.type === 'error' && (
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {alertModal.type === 'warning' && (
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
            </div>
            <div className="p-6 text-center">
              <p className="text-lg font-bold text-gray-800 mb-6">{alertModal.message}</p>
              <button
                onClick={() => setAlertModal({ show: false, message: '', type: 'success' })}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 animate-fadeIn">
            <div className="p-6 rounded-t-2xl bg-gradient-to-r from-orange-500 to-red-500">
              <div className="flex items-center justify-center">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="p-6 text-center">
              <p className="text-lg font-bold text-gray-800 mb-6">{confirmModal.message}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmModal({ show: false, message: '', onConfirm: () => {} })}
                  className="px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  تایید حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPage;
