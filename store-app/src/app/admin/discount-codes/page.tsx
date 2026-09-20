'use client';

import { useState, useEffect } from 'react';
import { DiscountCode, DiscountFormData, DiscountFilters } from '@/types/discount';
import DiscountCodeForm from '@/components/admin/DiscountCodeForm';
import Link from 'next/link';

const DiscountCodesPage = () => {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DiscountFilters>({
    search: '',
    type: 'all',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);

  // Fetch discount codes
  const fetchDiscountCodes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      const response = await fetch(`/api/admin/discount-codes?${params}`);
      const data = await response.json();

      if (data.success) {
        setDiscountCodes(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching discount codes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscountCodes();
  }, [filters, pagination.page]);

  // Delete selected codes
  const deleteSelectedCodes = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید کدهای تخفیف انتخابی را حذف کنید؟')) {
      return;
    }

    try {
      const params = new URLSearchParams();
      selectedCodes.forEach(id => params.append('id', id));

      const response = await fetch(`/api/admin/discount-codes?${params}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSelectedCodes([]);
        fetchDiscountCodes();
        alert('کدهای تخفیف با موفقیت حذف شدند');
      } else {
        alert('خطا در حذف کدهای تخفیف: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting codes:', error);
      alert('خطا در حذف کدهای تخفیف');
    }
  };

  // Toggle code selection
  const toggleCodeSelection = (codeId: string) => {
    setSelectedCodes(prev => 
      prev.includes(codeId) 
        ? prev.filter(id => id !== codeId)
        : [...prev, codeId]
    );
  };

  // Format discount value
  const formatDiscountValue = (code: DiscountCode) => {
    if (code.type === 'percentage') {
      return `${code.value}%`;
    } else {
      return `${code.value.toLocaleString()} تومان`;
    }
  };

  // Get status color
  const getStatusColor = (code: DiscountCode) => {
    const now = new Date();
    if (!code.isActive) return 'bg-red-500/20 text-red-400';
    if (now > new Date(code.validUntil)) return 'bg-orange-500/20 text-orange-400';
    return 'bg-green-500/20 text-green-400';
  };

  // Get status text
  const getStatusText = (code: DiscountCode) => {
    const now = new Date();
    if (!code.isActive) return 'غیرفعال';
    if (now > new Date(code.validUntil)) return 'منقضی شده';
    return 'فعال';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">مدیریت کدهای تخفیف</h1>
          <p className="text-gray-300">ایجاد، ویرایش و مدیریت کدهای تخفیف فروشگاه</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Link
            href="/admin/discount-codes/analytics"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            آمار و گزارش
          </Link>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            ایجاد کد تخفیف
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-white/5 rounded-xl backdrop-blur-sm">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">جستجو</label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="جستجو در کد یا توضیحات..."
            className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">نوع تخفیف</label>
          <select
            value={filters.type || 'all'}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
            className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">همه</option>
            <option value="percentage">درصدی</option>
            <option value="fixed">مبلغ ثابت</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">وضعیت</label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
            className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">همه</option>
            <option value="active">فعال</option>
            <option value="inactive">غیرفعال</option>
            <option value="expired">منقضی شده</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">مرتب‌سازی</label>
          <select
            value={`${filters.sortBy}_${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('_');
              setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as any }));
            }}
            className="w-full px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="createdAt_desc">جدیدترین</option>
            <option value="createdAt_asc">قدیمی‌ترین</option>
            <option value="code_asc">کد (الف-ی)</option>
            <option value="code_desc">کد (ی-الف)</option>
            <option value="usedCount_desc">بیشترین استفاده</option>
            <option value="validUntil_asc">زودتر منقضی</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      {selectedCodes.length > 0 && (
        <div className="flex items-center gap-4 mb-6 p-4 bg-blue-500/20 rounded-xl border border-blue-500/30">
          <span className="text-blue-300">
            {selectedCodes.length} کد انتخاب شده
          </span>
          
          <button
            onClick={deleteSelectedCodes}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            حذف انتخابی
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/10">
              <tr>
                <th className="p-4 text-right">
                  <input
                    type="checkbox"
                    checked={selectedCodes.length === discountCodes.length && discountCodes.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCodes(discountCodes.map(code => code.id!));
                      } else {
                        setSelectedCodes([]);
                      }
                    }}
                    className="rounded border-gray-600"
                  />
                </th>
                <th className="p-4 text-right text-gray-300 font-medium">کد تخفیف</th>
                <th className="p-4 text-right text-gray-300 font-medium">نوع</th>
                <th className="p-4 text-right text-gray-300 font-medium">مقدار</th>
                <th className="p-4 text-right text-gray-300 font-medium">استفاده شده</th>
                <th className="p-4 text-right text-gray-300 font-medium">وضعیت</th>
                <th className="p-4 text-right text-gray-300 font-medium">تاریخ انقضا</th>
                <th className="p-4 text-right text-gray-300 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    در حال بارگذاری...
                  </td>
                </tr>
              ) : discountCodes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    کد تخفیفی یافت نشد
                  </td>
                </tr>
              ) : (
                discountCodes.map((code) => (
                  <tr key={code.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedCodes.includes(code.id!)}
                        onChange={() => toggleCodeSelection(code.id!)}
                        className="rounded border-gray-600"
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-white bg-gray-700 px-2 py-1 rounded inline-block">
                        {code.code}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        code.type === 'percentage' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {code.type === 'percentage' ? 'درصدی' : 'مبلغ ثابت'}
                      </span>
                    </td>
                    <td className="p-4 text-white font-medium">
                      {formatDiscountValue(code)}
                    </td>
                    <td className="p-4 text-gray-300">
                      {code.usedCount}/{code.usageLimit || '∞'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(code)}`}>
                        {getStatusText(code)}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">
                      {new Date(code.validUntil).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingCode(code);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="ویرایش"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => toggleCodeSelection(code.id!)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-gray-300">
            نمایش {((pagination.page - 1) * pagination.limit) + 1} تا {Math.min(pagination.page * pagination.limit, pagination.total)} از {pagination.total} کد
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
            >
              قبلی
            </button>
            
            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              {pagination.page}
            </span>
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
            >
              بعدی
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <DiscountCodeForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchDiscountCodes}
      />
      
      <DiscountCodeForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCode(null);
        }}
        onSuccess={fetchDiscountCodes}
        editingCode={editingCode}
      />
    </div>
  );
};

export default DiscountCodesPage;