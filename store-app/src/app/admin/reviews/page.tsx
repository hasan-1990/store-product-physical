'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  verified: boolean;
  helpful: number;
  likes?: number;
  dislikes?: number;
  replies?: ReviewReply[];
}

interface ReviewReply {
  id: string;
  author: string;
  message: string;
  date: string;
}

const ReviewsAdmin = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Export functions
  const exportToCSV = () => {
    const headers = ['نام مشتری', 'ایمیل', 'محصول', 'امتیاز', 'عنوان', 'نظر', 'وضعیت', 'تایید خرید', 'تاریخ', 'مفید'];
    
    const csvData = filteredReviews.map(review => [
      review.customerName,
      review.customerEmail,
      review.productName,
      review.rating,
      review.title,
      review.comment.replace(/,/g, ';'),
      review.status === 'approved' ? 'تایید شده' : review.status === 'rejected' ? 'رد شده' : 'در انتظار',
      review.verified ? 'تایید شده' : 'تایید نشده',
      new Date(review.date).toLocaleDateString('fa-IR'),
      review.helpful
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reviews_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDetailedReport = () => {
    const reportData = [
      ['گزارش تفصیلی نظرات'],
      ['تاریخ تولید:', new Date().toLocaleDateString('fa-IR')],
      [''],
      ['خلاصه آمار:'],
      ['کل نظرات:', reviews.length],
      ['تایید شده:', reviews.filter(r => r.status === 'approved').length],
      ['رد شده:', reviews.filter(r => r.status === 'rejected').length],
      ['در انتظار:', reviews.filter(r => r.status === 'pending').length],
      ['میانگین امتیاز:', reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0'],
      [''],
      ['جزئیات نظرات:'],
      ['نام مشتری', 'ایمیل', 'محصول', 'امتیاز', 'عنوان', 'نظر', 'وضعیت', 'تاریخ'],
      ...filteredReviews.map(review => [
        review.customerName,
        review.customerEmail,
        review.productName,
        review.rating,
        review.title,
        review.comment.replace(/,/g, ';'),
        review.status === 'approved' ? 'تایید شده' : review.status === 'rejected' ? 'رد شده' : 'در انتظار',
        new Date(review.date).toLocaleDateString('fa-IR')
      ])
    ];

    const csvContent = reportData
      .map(row => Array.isArray(row) ? row.map(field => `"${field}"`).join(',') : `"${row}"`)
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reviews_detailed_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    // Load reviews from API
    const loadReviews = async () => {
      try {
        const response = await fetch('/api/reviews?limit=100');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Transform API data to match our interface
            const transformedReviews = data.data.map((review: any) => ({
              id: review._id || review.id,
              productId: review.productId,
              productName: review.product?.name || 'محصول ناشناخته',
              productImage: review.product?.imageUrl || '/images/products/placeholder.svg',
              customerName: review.user?.name || 'کاربر ناشناخته',
              customerEmail: review.user?.email || '',
              customerAvatar: review.user?.avatar || '/images/products/placeholder.svg',
              rating: review.rating,
              title: review.title || 'بدون عنوان',
              comment: review.comment,
              date: review.createdAt,
              status: review.approved ? 'approved' : 'pending',
              verified: true, // Users who can review have purchased
              helpful: review.helpful || 0,
              likes: review.likes || 0,
              dislikes: review.dislikes || 0,
              replies: review.replies || []
            }));
            
            setReviews(transformedReviews);
            setFilteredReviews(transformedReviews);
          }
        } else {
          console.error('Failed to load reviews');
          setReviews([]);
          setFilteredReviews([]);
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
        setReviews([]);
        setFilteredReviews([]);
      }
    };

    loadReviews();
  }, []);

  // Filter and sort reviews
  useEffect(() => {
    let filtered = [...reviews];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.comment.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(review => review.status === selectedStatus);
    }

    // Filter by rating
    if (selectedRating !== 'all') {
      const rating = parseInt(selectedRating);
      filtered = filtered.filter(review => review.rating === rating);
    }

    // Sort reviews
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'rating':
          return b.rating - a.rating;
        case 'helpful':
          return b.helpful - a.helpful;
        case 'customer':
          return a.customerName.localeCompare(b.customerName);
        case 'product':
          return a.productName.localeCompare(b.productName);
        default:
          return 0;
      }
    });

    setFilteredReviews(filtered);
  }, [reviews, searchTerm, selectedStatus, selectedRating, sortBy]);

  const updateReviewStatus = async (reviewId: string, newStatus: Review['status']) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved: newStatus === 'approved',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Review updated:', result);
        setReviews(prev =>
          prev.map(review =>
            review.id === reviewId ? { ...review, status: newStatus } : review
          )
        );
        toast.success('وضعیت نظر با موفقیت به‌روزرسانی شد');
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to update review status:', errorData);
        toast.error('خطا در به‌روزرسانی وضعیت نظر: ' + (errorData.error || 'خطای ناشناخته'));
      }
    } catch (error) {
      console.error('❌ Error updating review status:', error);
      toast.error('خطا در به‌روزرسانی وضعیت نظر');
    }
  };

  const deleteReview = async (reviewId: string) => {
    const confirmDelete = window.confirm('آیا از حذف این نظر مطمئن هستید؟');
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🗑️ Review deleted:', result);
        setReviews(prev => prev.filter(review => review.id !== reviewId));
        toast.success('نظر با موفقیت حذف شد');
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to delete review:', errorData);
        toast.error('خطا در حذف نظر: ' + (errorData.error || 'خطای ناشناخته'));
      }
    } catch (error) {
      console.error('❌ Error deleting review:', error);
      toast.error('خطا در حذف نظر');
    }
  };

  const getStatusIcon = (status: Review['status']) => {
    switch (status) {
      case 'approved':
        return <span className="text-green-400">✓</span>;
      case 'rejected':
        return <span className="text-red-400">✗</span>;
      case 'pending':
        return <span className="text-yellow-400">⏳</span>;
      default:
        return null;
    }
  };

  const getStatusText = (status: Review['status']) => {
    switch (status) {
      case 'approved':
        return 'تایید شده';
      case 'rejected':
        return 'رد شده';
      case 'pending':
        return 'در انتظار';
      default:
        return '';
    }
  };

  const getStatusColor = (status: Review['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-900/20 text-green-400 border border-green-500/30';
      case 'rejected':
        return 'bg-red-900/20 text-red-400 border border-red-500/30';
      case 'pending':
        return 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30';
      default:
        return 'bg-gray-900/20 text-gray-400 border border-gray-500/30';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`}>
        ★
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">مدیریت نظرات</h1>
            <p className="text-gray-300">
              مشاهده و مدیریت نظرات مشتریان
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors border border-green-500/30"
            >
              📥 دریافت CSV
            </button>
            <button
              onClick={exportDetailedReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors border border-blue-500/30"
            >
              📊 گزارش تفصیلی
            </button>
          </div>
        </div>

        {/* آمار کلی */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
            <div className="text-3xl font-bold text-white">{reviews.length}</div>
            <div className="text-gray-300">کل نظرات</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20">
            <div className="text-3xl font-bold text-green-400">
              {reviews.filter(r => r.status === 'approved').length}
            </div>
            <div className="text-gray-300">تایید شده</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/20">
            <div className="text-3xl font-bold text-yellow-400">
              {reviews.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-gray-300">در انتظار</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20">
            <div className="text-3xl font-bold text-blue-400">
              {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0'}
            </div>
            <div className="text-gray-300">میانگین امتیاز</div>
          </div>
        </div>

        {/* فیلترها */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-purple-500/20">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">جستجو</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="جستجو در نظرات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">وضعیت</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار</option>
                <option value="approved">تایید شده</option>
                <option value="rejected">رد شده</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">امتیاز</label>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
              >
                <option value="all">همه امتیازها</option>
                <option value="5">5 ستاره</option>
                <option value="4">4 ستاره</option>
                <option value="3">3 ستاره</option>
                <option value="2">2 ستاره</option>
                <option value="1">1 ستاره</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">مرتب‌سازی</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
              >
                <option value="date">تاریخ</option>
                <option value="rating">امتیاز</option>
                <option value="helpful">مفیدی</option>
                <option value="customer">نام مشتری</option>
                <option value="product">نام محصول</option>
              </select>
            </div>

            <div className="flex items-end">
              <span className="text-gray-300">
                {filteredReviews.length} از {reviews.length} نظر
              </span>
            </div>
          </div>
        </div>

        {/* لیست نظرات */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20">
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-2 text-4xl">📝</div>
              <p className="text-gray-300">هیچ نظری یافت نشد</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {filteredReviews.map((review) => (
                <div key={review.id} className="p-6 hover:bg-gray-700/20 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={review.customerAvatar || '/images/products/placeholder.svg'}
                        alt={review.customerName}
                        className="w-12 h-12 rounded-full object-cover border border-purple-500/30"
                    />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-white">{review.customerName}</h3>
                          {review.verified && (
                            <span className="text-green-400" title="خرید تایید شده">✓</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{review.customerEmail}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.date).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(review.status)}`}>
                        {getStatusText(review.status)}
                      </span>
                      {getStatusIcon(review.status)}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={review.productImage}
                        alt={review.productName}
                        className="w-8 h-8 rounded object-cover border border-purple-500/30"
                      />
                      <span className="text-sm text-gray-400">برای: {review.productName}</span>
                    </div>
                    
                    <h4 className="font-medium text-white mb-2">{review.title}</h4>
                    <p className="text-gray-300 leading-relaxed">{review.comment}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400">
                        👍 {review.helpful} نفر این نظر را مفید دانستند
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {review.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateReviewStatus(review.id, 'approved')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors border border-green-500/30"
                          >
                            تایید
                          </button>
                          <button
                            onClick={() => updateReviewStatus(review.id, 'rejected')}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors border border-red-500/30"
                          >
                            رد
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteReview(review.id)}
                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors border border-purple-500/30"
                        title="حذف نظر"
                      >
                        حذف
                      </button>
                    </div>
                  </div>

                  {review.replies && review.replies.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                      <div className="space-y-3">
                        {review.replies.map((reply) => (
                          <div key={reply.id} className="bg-gray-900/50 p-3 rounded-lg border border-purple-500/20">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm text-white">{reply.author}</span>
                              <span className="text-xs text-gray-400">
                                {new Date(reply.date).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300">{reply.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default ReviewsAdmin;
