'use client';

import { useState, useEffect } from 'react';
import { Review } from '@/types';

interface ReviewsListProps {
  productId: string;
  productSlug?: string;
}

const ReviewsList = ({ productId, productSlug }: ReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchReviews();
  }, [productId, productSlug, page, sortBy]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        productId,
        ...(productSlug && { productSlug }),
        page: page.toString(),
        limit: '10',
        approved: 'true',
        sortBy
      });

      const response = await fetch(`/api/reviews?${params}`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.data);
        setStats(data.stats);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (reviewId: string, voteType: 'helpful' | 'not-helpful') => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: voteType })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review._id === reviewId
              ? {
                  ...review,
                  helpfulCount: data.data.helpfulCount,
                  notHelpfulCount: data.data.notHelpfulCount
                }
              : review
          )
        );
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const renderStatsBar = () => {
    if (!stats) return null;

    const ratingPercentages = {
      5: stats.totalReviews > 0 ? (stats.rating5 / stats.totalReviews) * 100 : 0,
      4: stats.totalReviews > 0 ? (stats.rating4 / stats.totalReviews) * 100 : 0,
      3: stats.totalReviews > 0 ? (stats.rating3 / stats.totalReviews) * 100 : 0,
      2: stats.totalReviews > 0 ? (stats.rating2 / stats.totalReviews) * 100 : 0,
      1: stats.totalReviews > 0 ? (stats.rating1 / stats.totalReviews) * 100 : 0,
    };

    return (
      <div className="bg-white/5 backdrop-blur-md border border-purple-500/20 rounded-xl p-4 mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
          <div className="text-center md:text-right">
            <div className="text-4xl font-bold text-purple-400 mb-2">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-2">
              {renderStars(Math.round(stats.averageRating))}
            </div>
            <div className="text-xs text-purple-300">
              از {stats.totalReviews.toLocaleString('fa-IR')} نظر
            </div>
          </div>

          <div className="flex-1 w-full max-w-md md:mr-8">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-purple-300 w-12">{rating} ستاره</span>
                <div className="flex-1 h-1.5 bg-purple-900/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${ratingPercentages[rating as keyof typeof ratingPercentages]}%` }}
                  />
                </div>
                <span className="text-xs text-purple-400 w-12 text-left">
                  {stats[`rating${rating}`]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* آمار نظرات */}
      {renderStatsBar()}

      {/* مرتب‌سازی */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-bold text-white">
          نظرات کاربران ({stats?.totalReviews.toLocaleString('fa-IR') || 0})
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-1.5 bg-white/10 border border-purple-500/30 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        >
          <option value="recent">جدیدترین</option>
          <option value="helpful">مفیدترین</option>
          <option value="rating">بالاترین امتیاز</option>
        </select>
      </div>

      {/* لیست نظرات */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8 bg-white/5 backdrop-blur-md rounded-xl border border-purple-500/20">
            <svg
              className="w-12 h-12 text-purple-400 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-purple-300 text-base">هنوز نظری ثبت نشده است</p>
            <p className="text-purple-400 text-xs mt-2">اولین نفری باشید که نظر می‌دهد!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white/5 backdrop-blur-md border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/40 transition-all duration-300"
            >
              {/* هدر نظر */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {/* آواتار */}
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-base">
                    {review.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{review.userName}</h4>
                      {review.isVerifiedPurchase && (
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          خرید تایید شده
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-purple-400">
                      {new Date(review.createdAt).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>

              {/* عنوان نظر */}
              {review.title && (
                <h5 className="font-semibold text-base text-white mb-2">
                  {review.title}
                </h5>
              )}

              {/* متن نظر */}
              <p className="text-purple-200 leading-relaxed mb-3 text-sm">{review.comment}</p>

              {/* نقاط قوت و ضعف */}
              {(review.pros && review.pros.length > 0) || (review.cons && review.cons.length > 0) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  {review.pros && review.pros.length > 0 && (
                    <div className="bg-green-500/10 rounded-lg p-3">
                      <h6 className="font-semibold text-green-400 mb-2 flex items-center gap-2 text-xs">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        نقاط قوت
                      </h6>
                      <ul className="space-y-1">
                        {review.pros.map((pro, idx) => (
                          <li key={idx} className="text-xs text-green-300">• {pro}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {review.cons && review.cons.length > 0 && (
                    <div className="bg-red-500/10 rounded-lg p-3">
                      <h6 className="font-semibold text-red-400 mb-2 flex items-center gap-2 text-xs">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        نقاط ضعف
                      </h6>
                      <ul className="space-y-1">
                        {review.cons.map((con, idx) => (
                          <li key={idx} className="text-xs text-red-300">• {con}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}

              {/* پاسخ ادمین */}
              {review.adminReply && (
                <div className="bg-purple-500/10 border-r-2 border-purple-500 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                    <span className="font-semibold text-purple-300 text-xs">پاسخ فروشگاه:</span>
                  </div>
                  <p className="text-purple-200 text-sm">{review.adminReply.text}</p>
                </div>
              )}

              {/* دکمه‌های مفید بود / مفید نبود */}
              <div className="flex items-center gap-3 pt-3 border-t border-purple-500/20">
                <span className="text-xs text-purple-300">آیا این نظر مفید بود؟</span>
                <button
                  onClick={() => handleVote(review._id!, 'helpful')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors duration-200 text-xs"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                  بله ({review.helpfulCount || 0})
                </button>
                <button
                  onClick={() => handleVote(review._id!, 'not-helpful')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors duration-200 text-xs"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                    />
                  </svg>
                  خیر ({review.notHelpfulCount || 0})
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-purple-500/30 bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-purple-300 text-sm"
          >
            قبلی
          </button>
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPage(idx + 1)}
                className={`w-8 h-8 rounded-lg text-sm ${
                  page === idx + 1
                    ? 'bg-purple-600 text-white'
                    : 'border border-purple-500/30 bg-white/5 hover:bg-white/10 text-purple-300'
                }`}
              >
                {(idx + 1).toLocaleString('fa-IR')}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-purple-500/30 bg-white/5 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-purple-300 text-sm"
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
