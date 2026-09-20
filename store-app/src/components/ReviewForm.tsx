'use client';

import { useState, useEffect } from 'react';

interface ReviewFormProps {
  productId: string;
  productSlug?: string;
  onSuccess?: () => void;
}

const ReviewForm = ({ productId, productSlug, onSuccess }: ReviewFormProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    userId: '',
    userName: '',
    userEmail: '',
    rating: 5,
    title: '',
    comment: '',
    pros: [''],
    cons: ['']
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // بررسی لاگین بودن کاربر از localStorage (JWT)
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        console.log('✅ User logged in:', user);
        
        setIsLoggedIn(true);
        setCurrentUser(user);
        setFormData(prev => ({
          ...prev,
          userId: user._id || user.id || '',
          userName: user.name || '',
          userEmail: user.email || ''
        }));
      }
    } catch (error) {
      console.error('Error reading user from localStorage:', error);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const resolvedUserId = formData.userId || currentUser?._id || currentUser?.id || '';
      const { userId: _formUserId, ...formRest } = formData;
      const payload = {
        ...formRest,
        ...(resolvedUserId ? { userId: resolvedUserId } : {}),
        productId,
        productSlug,
        pros: formData.pros.filter(p => p.trim()),
        cons: formData.cons.filter(c => c.trim())
      };

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setFormData({
          userId: isLoggedIn ? (currentUser?._id || currentUser?.id || '') : '',
          userName: isLoggedIn ? (currentUser?.name || '') : '',
          userEmail: isLoggedIn ? (currentUser?.email || '') : '',
          rating: 5,
          title: '',
          comment: '',
          pros: [''],
          cons: ['']
        });
        if (onSuccess) onSuccess();
        
        // پیام موفقیت رو بعد از 5 ثانیه پاک کن
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(data.error || 'خطا در ثبت نظر');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const addPro = () => {
    setFormData(prev => ({
      ...prev,
      pros: [...prev.pros, '']
    }));
  };

  const addCon = () => {
    setFormData(prev => ({
      ...prev,
      cons: [...prev.cons, '']
    }));
  };

  const updatePro = (index: number, value: string) => {
    const newPros = [...formData.pros];
    newPros[index] = value;
    setFormData(prev => ({ ...prev, pros: newPros }));
  };

  const updateCon = (index: number, value: string) => {
    const newCons = [...formData.cons];
    newCons[index] = value;
    setFormData(prev => ({ ...prev, cons: newCons }));
  };

  const removePro = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pros: prev.pros.filter((_, i) => i !== index)
    }));
  };

  const removeCon = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cons: prev.cons.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-purple-500/20 rounded-xl p-4 shadow-lg">
      <h3 className="text-lg font-bold text-white mb-4">ثبت نظر جدید</h3>

      {success && (
        <div className="mb-4 bg-green-500/20 border border-green-500/50 rounded-lg p-3 flex items-start gap-2">
          <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h4 className="font-semibold text-green-300 mb-1 text-sm">نظر شما با موفقیت ثبت شد!</h4>
            <p className="text-xs text-green-400">
              نظر شما پس از بررسی و تایید مدیریت، نمایش داده خواهد شد.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* نام - فقط برای کاربران لاگین نشده */}
        {!isLoggedIn && (
          <div>
            <label className="block text-xs font-semibold text-purple-300 mb-1.5">
              نام <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.userName}
              onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
              placeholder="نام خود را وارد کنید"
              required
              minLength={2}
            />
          </div>
        )}

        {/* ایمیل - فقط برای کاربران لاگین نشده */}
        {!isLoggedIn && (
          <div>
            <label className="block text-xs font-semibold text-purple-300 mb-1.5">
              ایمیل (اختیاری)
            </label>
            <input
              type="email"
              value={formData.userEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, userEmail: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
              placeholder="example@email.com"
            />
            <p className="text-xs text-gray-400 mt-1">
              ایمیل شما نمایش داده نمی‌شود
            </p>
          </div>
        )}

        {/* نمایش اطلاعات کاربر لاگین شده */}
        {isLoggedIn && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-purple-300">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">
                در حال ثبت نظر به عنوان: <span className="font-bold text-white">{formData.userName}</span>
              </span>
            </div>
          </div>
        )}

        {/* امتیاز */}
        <div>
          <label className="block text-xs font-semibold text-purple-300 mb-2">
            امتیاز شما <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                className="transition-transform hover:scale-110"
              >
                <svg
                  className={`w-8 h-8 ${
                    star <= formData.rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
            <span className="mr-2 text-xs text-purple-300">
              ({formData.rating} از 5)
            </span>
          </div>
        </div>

        {/* عنوان */}
        <div>
          <label className="block text-xs font-semibold text-purple-300 mb-1.5">
            عنوان نظر (اختیاری)
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
            placeholder="مثلاً: محصول عالی و با کیفیت"
          />
        </div>

        {/* متن نظر */}
        <div>
          <label className="block text-xs font-semibold text-purple-300 mb-1.5">
            نظر شما <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            className="w-full px-3 py-2 bg-white/10 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-sm"
            rows={3}
            placeholder="نظر خود را در مورد این محصول بنویسید..."
            required
            minLength={10}
          />
          <p className="text-xs text-gray-400 mt-1">
            حداقل 10 کاراکتر
          </p>
        </div>

        {/* نقاط قوت */}
        <div className="bg-green-500/10 rounded-lg p-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-green-400 mb-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            نقاط قوت (اختیاری)
          </label>
          {formData.pros.map((pro, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={pro}
                onChange={(e) => updatePro(index, e.target.value)}
                className="flex-1 px-2 py-1.5 bg-white/10 border border-green-500/30 rounded text-white placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-transparent text-xs"
                placeholder={`نقطه قوت ${index + 1}`}
              />
              {formData.pros.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePro(index)}
                  className="px-2 py-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addPro}
            className="text-xs text-green-400 hover:text-green-300 font-medium flex items-center gap-1 mt-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            افزودن نقطه قوت
          </button>
        </div>

        {/* نقاط ضعف */}
        <div className="bg-red-500/10 rounded-lg p-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-red-400 mb-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            نقاط ضعف (اختیاری)
          </label>
          {formData.cons.map((con, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={con}
                onChange={(e) => updateCon(index, e.target.value)}
                className="flex-1 px-2 py-1.5 bg-white/10 border border-red-500/30 rounded text-white placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-transparent text-xs"
                placeholder={`نقطه ضعف ${index + 1}`}
              />
              {formData.cons.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCon(index)}
                  className="px-2 py-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addCon}
            className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1 mt-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            افزودن نقطه ضعف
          </button>
        </div>

        {/* دکمه ارسال */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              در حال ارسال...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              ارسال نظر
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center">
          نظر شما پس از بررسی و تایید توسط مدیریت سایت، نمایش داده خواهد شد.
        </p>
      </form>
    </div>
  );
};

export default ReviewForm;
