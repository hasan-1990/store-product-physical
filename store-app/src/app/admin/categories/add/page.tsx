'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface FormData {
  name: string
  slug: string
  description: string
  imageUrl: string
  imageAlt: string
  active: boolean
  order: number
  parentId: string | null
}

interface ImageFile {
  name: string
  path: string
  url: string
}

function AddCategoryPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    imageAlt: '',
    active: true,
    order: 0,
    parentId: null
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [showImageGallery, setShowImageGallery] = useState(false)
  const [existingImages, setExistingImages] = useState<ImageFile[]>([])
  const [loadingImages, setLoadingImages] = useState(false)
  const [showImageUrl, setShowImageUrl] = useState(false)
  const [showCopyToast, setShowCopyToast] = useState(false)
  const [categories, setCategories] = useState<Array<{ _id: string; name: string; level: number; parentId: string | null }>>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  // Load existing images from uploads folder
  const loadExistingImages = async () => {
    try {
      setLoadingImages(true)
      const images: ImageFile[] = [
        { name: '19c9795b-4b67-4feb-90e4-7f931ed8c42e.png', path: '/uploads/products/19c9795b-4b67-4feb-90e4-7f931ed8c42e.png', url: '/uploads/products/19c9795b-4b67-4feb-90e4-7f931ed8c42e.png' },
        { name: '1c24175d-465a-40ea-9f6d-02bbb65faa6f.png', path: '/uploads/products/1c24175d-465a-40ea-9f6d-02bbb65faa6f.png', url: '/uploads/products/1c24175d-465a-40ea-9f6d-02bbb65faa6f.png' },
        { name: '3eed1a1e-1c92-499e-828b-aa01150b4757.png', path: '/uploads/products/3eed1a1e-1c92-499e-828b-aa01150b4757.png', url: '/uploads/products/3eed1a1e-1c92-499e-828b-aa01150b4757.png' },
        { name: '45012ff5-51af-4a95-a2b8-549f43297667.png', path: '/uploads/products/45012ff5-51af-4a95-a2b8-549f43297667.png', url: '/uploads/products/45012ff5-51af-4a95-a2b8-549f43297667.png' },
        { name: '4963ca8c-dfe2-4924-a19c-3477f6a6525c.png', path: '/uploads/products/4963ca8c-dfe2-4924-a19c-3477f6a6525c.png', url: '/uploads/products/4963ca8c-dfe2-4924-a19c-3477f6a6525c.png' },
        { name: '56731492-2326-4ddf-b318-abe9e85e92d3.png', path: '/uploads/products/56731492-2326-4ddf-b318-abe9e85e92d3.png', url: '/uploads/products/56731492-2326-4ddf-b318-abe9e85e92d3.png' },
        { name: 'c221f578-0c51-4b94-8a49-9f261e11ac1d.png', path: '/uploads/products/c221f578-0c51-4b94-8a49-9f261e11ac1d.png', url: '/uploads/products/c221f578-0c51-4b94-8a49-9f261e11ac1d.png' },
        { name: 'cc73fcce-9df5-47fa-83e7-d0818d359968.png', path: '/uploads/products/cc73fcce-9df5-47fa-83e7-d0818d359968.png', url: '/uploads/products/cc73fcce-9df5-47fa-83e7-d0818d359968.png' },
        { name: 'cd2a0e13-b96c-47a9-bbd9-b6a2cdbc15ab.png', path: '/uploads/products/cd2a0e13-b96c-47a9-bbd9-b6a2cdbc15ab.png', url: '/uploads/products/cd2a0e13-b96c-47a9-bbd9-b6a2cdbc15ab.png' },
        { name: 'd0e36e0d-4896-46bf-b411-91199e88cb92.png', path: '/uploads/products/d0e36e0d-4896-46bf-b411-91199e88cb92.png', url: '/uploads/products/d0e36e0d-4896-46bf-b411-91199e88cb92.png' },
        { name: 'd20f41da-adeb-4594-b7c7-bec0d88941b8.png', path: '/uploads/products/d20f41da-adeb-4594-b7c7-bec0d88941b8.png', url: '/uploads/products/d20f41da-adeb-4594-b7c7-bec0d88941b8.png' },
        { name: 'd6d77473-d54d-4015-8f1b-3f083340c2d4.png', path: '/uploads/products/d6d77473-d54d-4015-8f1b-3f083340c2d4.png', url: '/uploads/products/d6d77473-d54d-4015-8f1b-3f083340c2d4.png' },
        { name: 'd6eb4781-47c8-4e1e-b7f5-6631e5c6ac0d.png', path: '/uploads/products/d6eb4781-47c8-4e1e-b7f5-6631e5c6ac0d.png', url: '/uploads/products/d6eb4781-47c8-4e1e-b7f5-6631e5c6ac0d.png' },
        { name: 'fac5e660-1dd7-4a00-88ba-896e24e629a0.png', path: '/uploads/products/fac5e660-1dd7-4a00-88ba-896e24e629a0.png', url: '/uploads/products/fac5e660-1dd7-4a00-88ba-896e24e629a0.png' }
      ]
      setExistingImages(images)
    } catch (error) {
      console.error('خطا در بارگذاری تصاویر:', error)
    } finally {
      setLoadingImages(false)
    }
  }

  useEffect(() => {
    loadExistingImages()
    loadCategories() // Load categories on mount
  }, [])

  // Reload categories when component becomes visible (for fresh data)
  useEffect(() => {
    const handleFocus = () => {
      loadCategories(true) // Bypass cache on focus
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Load categories for parent selection
  const loadCategories = async (bypassCache = false) => {
    try {
      setLoadingCategories(true)
      const url = bypassCache 
        ? `/api/categories?limit=1000&active=true&t=${Date.now()}` 
        : '/api/categories?limit=1000&active=true';
      const res = await fetch(url, {
        cache: 'no-store'
      })
      const json = await res.json()
      if (json?.success && Array.isArray(json.data)) {
        // Expecting items with _id, name, level, parentId - only active categories
        const items = json.data
          .filter((c: any) => c.active === true) // Only show active categories
          .map((c: any) => ({
            _id: c._id,
            name: c.name,
            level: typeof c.level === 'number' ? c.level : 0,
            parentId: c.parentId ?? null,
          }))
        // Sort by level then name
        items.sort((a: any, b: any) => (a.level - b.level) || a.name.localeCompare(b.name))
        setCategories(items)
        console.log('Loaded categories for parent selection:', items.length, 'active categories')
      }
    } catch (e) {
      console.error('خطا در دریافت دسته‌ها:', e)
    } finally {
      setLoadingCategories(false)
    }
  }

  // Initialize parentId from URL if provided
  useEffect(() => {
    const pid = searchParams?.get('parentId') || ''
    if (pid) {
      setFormData(prev => ({ ...prev, parentId: pid }))
    }
  }, [searchParams])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[\s]+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
      imageAlt: prev.imageAlt || name
    }))
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }))
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setShowCopyToast(true)
      setTimeout(() => setShowCopyToast(false), 2000)
    }).catch(err => {
      console.error('خطا در کپی کردن:', err)
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'لطفاً فقط فایل تصویری انتخاب کنید' }))
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'حجم فایل نباید بیشتر از 5 مگابایت باشد' }))
        return
      }

      setImageFile(file)
      setErrors(prev => ({ ...prev, image: '' }))

      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleExistingImageSelect = (imageUrl: string) => {
    setFormData(prev => ({ 
      ...prev, 
      imageUrl,
      imageAlt: prev.imageAlt || prev.name
    }))
    setImagePreview(imageUrl)
    setImageFile(null)
    setShowImageGallery(false)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData(prev => ({ ...prev, imageUrl: '', imageAlt: prev.name }))
    setErrors(prev => ({ ...prev, image: '' }))
    
    const fileInput = document.getElementById('imageFile') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        const result = await response.json()
        return result.url
      } else {
        throw new Error('خطا در آپلود فایل')
      }
    } catch (error) {
      console.error('خطا در آپلود:', error)
      throw error
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = 'نام دسته‌بندی الزامی است'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'شناسه یکتا الزامی است'
    }

    // Prevent selecting a level-2 parent (would make level 3+ invalid on backend)
    if (formData.parentId) {
      const parent = categories.find(c => c._id === formData.parentId)
      if (parent && parent.level >= 2) {
        newErrors.parentId = 'نمی‌توان زیرِ دسته‌ی سطح 3 ایجاد کرد (حداکثر 3 سطح مجاز است)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)

      let finalImageUrl = formData.imageUrl
      
      if (imageFile) {
        try {
          finalImageUrl = await handleImageUpload(imageFile)
        } catch {
          setErrors({ image: 'خطا در آپلود تصویر' })
          setIsSubmitting(false)
          return
        }
      }

      const submitData = {
        ...formData,
        imageUrl: finalImageUrl,
        parentId: formData.parentId && formData.parentId !== '' ? formData.parentId : null
      }

      console.log('Submitting data:', submitData);

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()
      console.log('API Response:', result);

      if (result.success) {
        router.push('/admin/categories?success=added')
      } else {
        if (result.details && Array.isArray(result.details)) {
          const newErrors: { [key: string]: string } = {}
          result.details.forEach((error: any) => {
            if (error.path && error.path[0]) {
              newErrors[error.path[0]] = error.message
            }
          })
          setErrors(newErrors)
        } else {
          setErrors({ general: result.error || 'خطا در ایجاد دسته‌بندی' })
        }
      }
    } catch (error) {
      console.error('Submit error:', error)
      setErrors({ general: 'خطا در ارتباط با سرور' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">افزودن دسته‌بندی جدید</h1>
            <p className="text-gray-300 mt-2">اطلاعات دسته‌بندی جدید را وارد کنید</p>
          </div>
          <Link
            href="/admin/categories"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            بازگشت به لیست
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-purple-500/30">
            {errors.general && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400">{errors.general}</p>
              </div>
            )}

            {/* Parent Category */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <label className="block text-gray-300 mb-2 font-medium">دسته والد</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">حداکثر 3 سطح دسته‌بندی پشتیبانی می‌شود</span>
                  <button
                    type="button"
                    onClick={() => loadCategories(true)}
                    disabled={loadingCategories}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                    title="تازه‌سازی لیست دسته‌بندی‌ها"
                  >
                    {loadingCategories ? '...' : '↻'}
                  </button>
                </div>
              </div>
              <select
                value={formData.parentId || ''}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value === '' ? null : e.target.value })}
                className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white focus:outline-none transition-colors ${
                  errors.parentId
                    ? 'border-red-500/50 focus:border-red-400'
                    : 'border-purple-500/30 focus:border-purple-400'
                }`}
              >
                <option value="" className="bg-gray-900">بدون والد (دسته اصلی)</option>
                {categories.map(cat => (
                  <option
                    key={cat._id}
                    value={cat._id}
                    className="bg-gray-900"
                    disabled={cat.level >= 2}
                  >
                    {`${'— '.repeat(cat.level)}${cat.name}`}
                  </option>
                ))}
              </select>
              {formData.parentId && (
                <p className="mt-2 text-gray-300 text-sm">
                  والد انتخاب شده: <span className="font-medium">{categories.find(c => c._id === formData.parentId)?.name || '—'}</span>
                </p>
              )}
              {loadingCategories && <p className="mt-2 text-gray-400 text-sm">در حال بارگذاری دسته‌ها...</p>}
              {errors.parentId && <p className="mt-2 text-red-400 text-sm">{errors.parentId}</p>}
            </div>

            {/* Name Field */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-medium">
                نام دسته‌بندی <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white focus:outline-none transition-colors ${
                  errors.name 
                    ? 'border-red-500/50 focus:border-red-400' 
                    : 'border-purple-500/30 focus:border-purple-400'
                }`}
                placeholder="نام دسته‌بندی را وارد کنید"
              />
              {errors.name && <p className="mt-2 text-red-400 text-sm">{errors.name}</p>}
            </div>

            {/* Slug Field */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-medium">
                شناسه یکتا (Slug) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white focus:outline-none transition-colors ${
                  errors.slug 
                    ? 'border-red-500/50 focus:border-red-400' 
                    : 'border-purple-500/30 focus:border-purple-400'
                }`}
                placeholder="category-slug"
              />
              <p className="mt-1 text-gray-400 text-xs">شناسه یکتا به طور خودکار از نام تولید می‌شود</p>
              {errors.slug && <p className="mt-2 text-red-400 text-sm">{errors.slug}</p>}
            </div>

            {/* Description Field */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-medium">توضیحات</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 transition-colors resize-none"
                placeholder="توضیحات دسته‌بندی را وارد کنید"
              />
            </div>

            {/* Image Section */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-medium">تصویر دسته‌بندی</label>
              
              {imagePreview && (
                <div className="mb-4">
                  <div className="relative inline-block">
                    <Image
                      src={imagePreview}
                      alt={formData.imageAlt || "پیش‌نمایش"}
                      width={120}
                      height={120}
                      className="rounded-lg object-cover border border-purple-500/30"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      title="حذف تصویر"
                    >
                      ×
                    </button>
                  </div>
                  
                  {/* Image URL Display */}
                  <div className="mt-3 p-3 bg-gray-800/30 rounded-lg border border-gray-600/30">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">لینک تصویر:</span>
                      <button
                        type="button"
                        onClick={() => setShowImageUrl(!showImageUrl)}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                      >
                        {showImageUrl ? 'مخفی' : 'نمایش'}
                      </button>
                    </div>
                    {showImageUrl && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={formData.imageUrl || imagePreview}
                          readOnly
                          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-gray-300 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(formData.imageUrl || imagePreview)}
                          className="mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                        >
                          کپی لینک
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label htmlFor="imageFile" className="cursor-pointer">
                    <div className="flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      انتخاب فایل جدید
                    </div>
                  </label>
                  <input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowImageGallery(true)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  انتخاب از تصاویر موجود
                </button>
              </div>

              {errors.image && <p className="mt-2 text-red-400 text-sm">{errors.image}</p>}
            </div>

            {/* Image Alt Text */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-medium">متن جایگزین تصویر (Alt)</label>
              <input
                type="text"
                value={formData.imageAlt}
                onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 transition-colors"
                placeholder="توضیح کوتاه از تصویر برای بهبود SEO و دسترسی"
              />
              <p className="mt-1 text-gray-400 text-xs">این متن برای بهبود SEO و کمک به افراد نابینا استفاده می‌شود</p>
            </div>

            {/* Order Field */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-medium">ترتیب نمایش</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 transition-colors"
                placeholder="0"
                min="0"
              />
              <p className="mt-1 text-gray-400 text-xs">عدد کمتر = نمایش بالاتر</p>
            </div>

            {/* Active Checkbox */}
            <div className="mb-8">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-5 h-5 text-purple-500 bg-gray-800 border-purple-500 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="active" className="mr-2 text-gray-300 font-medium">
                  فعال
                </label>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 space-x-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? 'در حال ایجاد...' : 'ایجاد دسته‌بندی'}
              </button>
              <Link
                href="/admin/categories"
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center font-medium"
              >
                لغو
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {showImageGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">انتخاب تصویر</h3>
              <button
                onClick={() => setShowImageGallery(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {loadingImages ? (
              <div className="flex justify-center items-center h-48">
                <div className="text-white">در حال بارگذاری...</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
                {existingImages.map((image, index) => (
                  <div
                    key={index}
                    className="cursor-pointer group relative aspect-square"
                  >
                    <Image
                      src={image.url}
                      alt={image.name}
                      fill
                      className="object-cover rounded-lg border border-gray-700 group-hover:border-purple-500 transition-colors"
                    />
                    
                    <div 
                      onClick={() => handleExistingImageSelect(image.url)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                    >
                      <span className="text-white text-sm bg-purple-600 px-3 py-1 rounded">انتخاب</span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs truncate">{image.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(`${window.location.origin}${image.url}`)
                          }}
                          className="text-blue-300 hover:text-blue-200 text-xs flex items-center"
                          title="کپی لینک"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          کپی
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Copy Toast Notification */}
      {showCopyToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            لینک کپی شد!
          </div>
        </div>
      )}
    </div>
  )
}

function AddCategoryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">در حال بارگذاری...</p>
        </div>
      </div>
    }>
      <AddCategoryPageContent />
    </Suspense>
  );
}

export default AddCategoryPage
