'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'customer' | 'moderator';
  status: 'active' | 'inactive' | 'banned';
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
  lastActivity: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

const UsersAdmin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('joinDate');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Multi-select functionality
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Load users from API
  const loadUsers = async (clearCache = false) => {
    try {
      setIsLoading(true);
      console.log('Loading users...');
      
      // Clear cache if requested
      if (clearCache) {
        try {
          await fetch('/api/admin/cache/clear', { method: 'POST' });
          console.log('Cache cleared');
        } catch (error) {
          console.warn('Failed to clear cache:', error);
        }
      }
      
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer admin-token` // توکن ثابت برای تست
        }
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users API response:', data); // اضافه کردن لاگ برای دیباگ
        if (data.success && data.users) {
          setUsers(data.users);
          setFilteredUsers(data.users);
          console.log('Users loaded:', data.users.length);
        } else {
          console.error('API response format error:', data);
        }
      } else {
        console.error('Failed to load users, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => {
      const matchesSearch = 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sort users
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.firstName.localeCompare(b.firstName);
        case 'email':
          return a.email.localeCompare(b.email);
        case 'joinDate':
          return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
        case 'totalSpent':
          return b.totalSpent - a.totalSpent;
        case 'totalOrders':
          return b.totalOrders - a.totalOrders;
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
    
    // Reset selection when filter changes
    setSelectedUsers([]);
    setSelectAll(false);
  }, [users, searchTerm, selectedRole, selectedStatus, sortBy]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-900/20 text-red-400';
      case 'moderator':
        return 'bg-blue-900/20 text-blue-400';
      case 'customer':
        return 'bg-green-900/20 text-green-400';
      default:
        return 'bg-gray-900/20 text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/20 text-green-400';
      case 'inactive':
        return 'bg-yellow-900/20 text-yellow-400';
      case 'banned':
        return 'bg-red-900/20 text-red-400';
      default:
        return 'bg-gray-900/20 text-gray-400';
    }
  };

  const updateUserStatus = async (userId: string, newStatus: User['status']) => {
    try {
      console.log('🔄 تغییر وضعیت کاربر:', userId, 'به:', newStatus);
      const token = 'admin-token'; // توکن ثابت

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          updates: { status: newStatus }
        })
      });

      if (response.ok) {
        console.log('✅ وضعیت کاربر تغییر کرد');
        setUsers(users.map(user =>
          user.id === userId ? { ...user, status: newStatus } : user
        ));
      } else {
        const errorText = await response.text();
        console.error('❌ خطا در تغییر وضعیت:', errorText);
      }
    } catch (error) {
      console.error('💥 خطا در تغییر وضعیت کاربر:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: User['role']) => {
    try {
      console.log('🔄 تغییر نقش کاربر:', userId, 'به:', newRole);
      const token = 'admin-token'; // توکن ثابت

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          updates: { role: newRole }
        })
      });

      if (response.ok) {
        console.log('✅ نقش کاربر تغییر کرد');
        setUsers(users.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        ));
      } else {
        const errorText = await response.text();
        console.error('❌ خطا در تغییر نقش:', errorText);
      }
    } catch (error) {
      console.error('💥 خطا در تغییر نقش کاربر:', error);
    }
  };

  const viewUserDetails = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const editUser = (user: User) => {
    setEditingUser({ ...user });
    setNewPassword('');
    setConfirmPassword('');
    setShowEditModal(true);
  };

  const saveUserChanges = async () => {
    if (!editingUser) return;

    // Check password confirmation if password is being changed
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('تأیید رمز عبور با رمز عبور وارد شده مطابقت ندارد');
      return;
    }

    try {
      console.log('🚀 شروع ذخیره تغییرات کاربر...');
      
      // بجای localStorage از توکن ثابت استفاده کنیم
      const token = 'admin-token'; // توکن موقت برای تست
      
      const updates: any = {
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        phone: editingUser.phone,
        role: editingUser.role,
        status: editingUser.status,
        address: editingUser.address
      };

      // Add password to updates if provided
      if (newPassword) {
        updates.password = newPassword;
      }

      console.log('📤 ارسال داده‌ها:', {
        userId: editingUser.id,
        updates
      });

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: editingUser.id,
          updates
        })
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ موفقیت:', result);
        
        setUsers(users.map(user =>
          user.id === editingUser.id ? editingUser : user
        ));
        setShowEditModal(false);
        setEditingUser(null);
        setNewPassword('');
        setConfirmPassword('');
        
        // بروزرسانی مجدد از سرور
        await loadUsers(true);
        
        toast.success('اطلاعات کاربر با موفقیت بروزرسانی شد');
      } else {
        const errorText = await response.text();
        console.error('❌ خطای سرور:', errorText);
        let errorMessage = 'خطای ناشناخته';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || 'خطای ناشناخته';
        } catch {
          errorMessage = errorText || 'خطای ناشناخته';
        }
        
        toast.error('خطا در بروزرسانی کاربر: ' + errorMessage);
      }
    } catch (error) {
      console.error('💥 خطای JavaScript:', error);
      toast.error('خطا در بروزرسانی کاربر: ' + (error instanceof Error ? error.message : 'خطای ناشناخته'));
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('آیا از حذف این کاربر مطمئن هستید؟')) return;

    try {
      console.log('🗑️ حذف کاربر:', userId);
      const token = 'admin-token'; // توکن ثابت

      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        console.log('✅ کاربر حذف شد');
        setUsers(users.filter(user => user.id !== userId));
        setSelectedUsers(selectedUsers.filter(id => id !== userId));
        toast.success('کاربر با موفقیت حذف شد');
      } else {
        const errorText = await response.text();
        console.error('❌ خطا در حذف کاربر:', errorText);
        toast.error('خطا در حذف کاربر');
      }
    } catch (error) {
      console.error('💥 خطا در حذف کاربر:', error);
      toast.error('خطا در حذف کاربر');
    }
  };

  // Multi-select functions
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
      setSelectAll(false);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
      setSelectAll(true);
    }
  };

  const deleteSelectedUsers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('لطفاً ابتدا کاربرانی را انتخاب کنید');
      return;
    }

    if (!confirm(`آیا از حذف ${selectedUsers.length} کاربر انتخاب شده مطمئن هستید؟`)) {
      return;
    }

    try {
      console.log('🗑️ حذف کاربران انتخاب شده:', selectedUsers);
      const token = 'admin-token';

      // Use bulk delete API
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userIds: selectedUsers })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ نتیجه حذف:', result);
        
        // Update UI
        setUsers(users.filter(user => !selectedUsers.includes(user.id)));
        setSelectedUsers([]);
        setSelectAll(false);
        
        toast.success(`${result.deletedCount || selectedUsers.length} کاربر با موفقیت حذف شدند`);
      } else {
        const errorText = await response.text();
        console.error('❌ خطا در حذف کاربران:', errorText);
        toast.error('خطا در حذف کاربران انتخاب شده');
      }
    } catch (error) {
      console.error('💥 خطا در حذف کاربران:', error);
      toast.error('خطا در حذف کاربران انتخاب شده');
    }
  };

  const exportUsers = () => {
    // تبدیل داده‌های کاربران به فرمت CSV
    const csvHeaders = [
      'نام',
      'نام خانوادگی', 
      'ایمیل',
      'تلفن',
      'نقش',
      'وضعیت',
      'تعداد سفارشات',
      'کل خرید',
      'تاریخ عضویت',
      'آخرین فعالیت'
    ];

    const csvData = filteredUsers.map(user => [
      user.firstName,
      user.lastName,
      user.email,
      user.phone || 'ندارد',
      user.role === 'admin' ? 'مدیر' : user.role === 'moderator' ? 'ناظر' : 'مشتری',
      user.status === 'active' ? 'فعال' : user.status === 'inactive' ? 'غیرفعال' : 'مسدود',
      user.totalOrders.toString(),
      `${user.totalSpent.toLocaleString('fa-IR')} تومان`,
      new Date(user.joinDate).toLocaleDateString('fa-IR'),
      new Date(user.lastActivity).toLocaleDateString('fa-IR')
    ]);

    // ایجاد محتوای CSV
    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // ایجاد و دانلود فایل
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-xl">در حال بارگذاری کاربران...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">مدیریت کاربران</h1>
          <p className="text-gray-300 mt-1">مدیریت حساب‌های کاربری و مجوزها</p>
        </div>
        <div className="flex gap-3">
          {selectedUsers.length > 0 && (
            <button 
              onClick={deleteSelectedUsers}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              حذف انتخاب شده ({selectedUsers.length})
            </button>
          )}
          <button 
            onClick={() => loadUsers(true)}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            {isLoading ? '...' : '🔄 بروزرسانی'}
          </button>
          <button 
            onClick={exportUsers}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            خروجی کاربران
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="backdrop-blur-lg bg-white/10 rounded-xl p-4 border border-purple-500/30">
          <div className="text-2xl font-bold text-white">{users.length}</div>
          <div className="text-gray-300 text-sm">کل کاربران</div>
        </div>
        <div className="backdrop-blur-lg bg-white/10 rounded-xl p-4 border border-purple-500/30">
          <div className="text-2xl font-bold text-green-400">{users.filter(u => u.status === 'active').length}</div>
          <div className="text-gray-300 text-sm">کاربران فعال</div>
        </div>
        <div className="backdrop-blur-lg bg-white/10 rounded-xl p-4 border border-purple-500/30">
          <div className="text-2xl font-bold text-blue-400">{users.filter(u => u.role === 'customer').length}</div>
          <div className="text-gray-300 text-sm">مشتریان</div>
        </div>
        <div className="backdrop-blur-lg bg-white/10 rounded-xl p-4 border border-purple-500/30">
          <div className="text-2xl font-bold text-purple-400">
            {users.reduce((sum, user) => sum + user.totalSpent, 0).toLocaleString('fa-IR')} تومان
          </div>
          <div className="text-gray-300 text-sm">کل درآمد</div>
        </div>
      </div>

      {/* Filters */}
      <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-300 mb-2">جستجو کاربران</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو بر اساس نام یا ایمیل..."
              className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">نقش</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">همه نقش‌ها</option>
              <option value="admin">مدیر</option>
              <option value="moderator">ناظر</option>
              <option value="customer">مشتری</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-300 mb-2">وضعیت</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
              <option value="banned">مسدود</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-300 mb-2">مرتب‌سازی بر اساس</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
            >
              <option value="joinDate">تاریخ عضویت</option>
              <option value="name">نام</option>
              <option value="email">ایمیل</option>
              <option value="totalSpent">کل خرید</option>
              <option value="totalOrders">تعداد سفارشات</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-purple-500/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  کاربر
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  نقش
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  وضعیت
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  سفارشات
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  کل خرید
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  تاریخ عضویت
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-10 h-10">
                        <Image
                          src={user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                          alt={`${user.firstName} ${user.lastName}`}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-gray-400 text-sm">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {user.role === 'admin' ? 'مدیر' : user.role === 'moderator' ? 'ناظر' : 'مشتری'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.status}
                      onChange={(e) => updateUserStatus(user.id, e.target.value as User['status'])}
                      className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${getStatusColor(user.status)} bg-transparent`}
                    >
                      <option value="active">فعال</option>
                      <option value="inactive">غیرفعال</option>
                      <option value="banned">مسدود</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-white">{user.totalOrders}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-green-400 font-medium">{user.totalSpent.toLocaleString('fa-IR')} تومان</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-300">{new Date(user.joinDate).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => viewUserDetails(user)}
                        className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                        title="مشاهده جزئیات"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => editUser(user)}
                        className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"
                        title="ویرایش کاربر"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        title="حذف کاربر"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          window.location.href = `mailto:${user.email}`;
                        }}
                        className="p-2 text-green-400 hover:text-green-300 transition-colors"
                        title="ارسال پیام"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">جزئیات کاربر</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16">
                  <Image
                    src={selectedUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                    alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">{selectedUser.firstName} {selectedUser.lastName}</h4>
                  <p className="text-gray-300">{selectedUser.email}</p>
                  <p className="text-gray-400">{selectedUser.phone}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">{selectedUser.totalOrders}</div>
                  <div className="text-gray-300 text-sm">کل سفارشات</div>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-400">{selectedUser.totalSpent.toLocaleString('fa-IR')} تومان</div>
                  <div className="text-gray-300 text-sm">کل خرید</div>
                </div>
              </div>

              {/* Address */}
              {selectedUser.address && (
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-2">آدرس</h5>
                  <p className="text-gray-300">
                    {selectedUser.address.street}<br />
                    {selectedUser.address.city}, {selectedUser.address.state} {selectedUser.address.zipCode}<br />
                    {selectedUser.address.country}
                  </p>
                </div>
              )}

              {/* Account Info */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h5 className="text-white font-medium mb-2">اطلاعات حساب</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">نقش:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role === 'admin' ? 'مدیر' : 
                       selectedUser.role === 'moderator' ? 'ناظر' : 'مشتری'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">وضعیت:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status === 'active' ? 'فعال' : 
                       selectedUser.status === 'inactive' ? 'غیرفعال' : 'مسدود'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">تاریخ عضویت:</span>
                    <span className="text-white">{new Date(selectedUser.joinDate).toLocaleDateString('fa-IR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">آخرین فعالیت:</span>
                    <span className="text-white">{new Date(selectedUser.lastActivity).toLocaleDateString('fa-IR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-purple-500/30 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">ویرایش کاربر</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* User Avatar */}
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16">
                  <Image
                    src={editingUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                    alt={`${editingUser.firstName} ${editingUser.lastName}`}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">{editingUser.firstName} {editingUser.lastName}</h4>
                  <p className="text-gray-300">{editingUser.email}</p>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">نام</label>
                  <input
                    type="text"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">نام خانوادگی</label>
                  <input
                    type="text"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">ایمیل</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">تلفن</label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Role and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">نقش</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value as User['role']})}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="customer">مشتری</option>
                    <option value="moderator">ناظر</option>
                    <option value="admin">مدیر</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">وضعیت</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({...editingUser, status: e.target.value as User['status']})}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="active">فعال</option>
                    <option value="inactive">غیرفعال</option>
                    <option value="banned">مسدود</option>
                  </select>
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-4">
                <h5 className="text-white font-medium">تغییر رمز عبور</h5>
                <p className="text-gray-400 text-sm">اگر می‌خواهید رمز عبور کاربر را تغییر دهید، فیلدهای زیر را پر کنید</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">رمز عبور جدید</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="رمز عبور جدید..."
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">تأیید رمز عبور</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="تأیید رمز عبور..."
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-400 text-sm">تأیید رمز عبور با رمز عبور وارد شده مطابقت ندارد</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h5 className="text-white font-medium">آدرس</h5>
                <div>
                  <label className="block text-gray-300 mb-2">خیابان</label>
                  <input
                    type="text"
                    value={editingUser.address?.street || ''}
                    onChange={(e) => setEditingUser({
                      ...editingUser, 
                      address: {...(editingUser.address || {}), street: e.target.value}
                    })}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">شهر</label>
                    <input
                      type="text"
                      value={editingUser.address?.city || ''}
                      onChange={(e) => setEditingUser({
                        ...editingUser, 
                        address: {...(editingUser.address || {}), city: e.target.value}
                      })}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">استان</label>
                    <input
                      type="text"
                      value={editingUser.address?.state || ''}
                      onChange={(e) => setEditingUser({
                        ...editingUser, 
                        address: {...(editingUser.address || {}), state: e.target.value}
                      })}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">کد پستی</label>
                    <input
                      type="text"
                      value={editingUser.address?.zipCode || ''}
                      onChange={(e) => setEditingUser({
                        ...editingUser, 
                        address: {...(editingUser.address || {}), zipCode: e.target.value}
                      })}
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">کشور</label>
                  <input
                    type="text"
                    value={editingUser.address?.country || ''}
                    onChange={(e) => setEditingUser({
                      ...editingUser, 
                      address: {...(editingUser.address || {}), country: e.target.value}
                    })}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={saveUserChanges}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAdmin;
