# راهنمای استفاده از قابلیت Alt Text در SharedImageGallery

## معرفی

کامپوننت `SharedImageGallery` حالا قابلیت ویرایش Alt Text برای تصاویر انتخاب شده را دارد. این قابلیت به شما امکان می‌دهد برای هر تصویری که انتخاب می‌کنید، یک متن جایگزین (Alt Text) تعریف کنید که برای سئو و دسترسی‌پذیری بسیار مفید است.

## ویژگی‌های جدید

### 1. آیکون ویرایش Alt Text
- وقتی یک تصویر را انتخاب می‌کنید، یک آیکون آبی رنگ با شکل مداد در گوشه پایین راست تصویر نمایش داده می‌شود
- این آیکون فقط برای تصاویر انتخاب شده نمایش داده می‌شود
- با کلیک روی این آیکون، مدال ویرایش Alt Text باز می‌شود

### 2. مدال ویرایش Alt Text
- یک پنجره مدال زیبا و کاربرپسند
- شامل یک textarea برای نوشتن Alt Text
- دکمه‌های ذخیره و لغو
- راهنمایی درباره اهمیت Alt Text

### 3. نمایش Alt Text
- Alt Text ذخیره شده برای هر تصویر در state نگهداری می‌شود
- می‌توانید از این متن در تگ `<img>` استفاده کنید

## نحوه استفاده

### مثال ساده (تک انتخابی)

```tsx
'use client';

import React, { useState } from 'react';
import { SharedImageGallery } from '@/components';

export default function MyComponent() {
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [imageAlts, setImageAlts] = useState<Record<string, string>>({});

  const handleSelectImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowGallery(false);
  };

  const handleUpdateAlt = (imageUrl: string, altText: string) => {
    setImageAlts(prev => ({
      ...prev,
      [imageUrl]: altText
    }));
  };

  return (
    <div>
      <button onClick={() => setShowGallery(true)}>
        انتخاب تصویر
      </button>
      
      {selectedImage && (
        <img 
          src={selectedImage} 
          alt={imageAlts[selectedImage] || 'تصویر'} 
        />
      )}

      <SharedImageGallery
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        onSelectImage={handleSelectImage}
        imageAlts={imageAlts}
        onUpdateAlt={handleUpdateAlt}
      />
    </div>
  );
}
```

### مثال پیشرفته (چند انتخابی)

```tsx
'use client';

import React, { useState } from 'react';
import { SharedImageGallery } from '@/components';

export default function MultiSelectComponent() {
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [imageAlts, setImageAlts] = useState<Record<string, string>>({});

  const handleSelectImages = (urls: string[]) => {
    setSelectedImages(urls);
  };

  const handleUpdateAlt = (imageUrl: string, altText: string) => {
    setImageAlts(prev => ({
      ...prev,
      [imageUrl]: altText
    }));
  };

  const handleConfirm = () => {
    console.log('Selected images:', selectedImages);
    console.log('Image alts:', imageAlts);
    setShowGallery(false);
  };

  return (
    <div>
      <button onClick={() => setShowGallery(true)}>
        انتخاب چند تصویر
      </button>
      
      <div className="grid grid-cols-4 gap-4">
        {selectedImages.map(imageUrl => (
          <div key={imageUrl}>
            <img 
              src={imageUrl} 
              alt={imageAlts[imageUrl] || 'تصویر'} 
            />
            {imageAlts[imageUrl] && (
              <p className="text-sm">{imageAlts[imageUrl]}</p>
            )}
          </div>
        ))}
      </div>

      <SharedImageGallery
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        onSelectImage={() => {}} // برای allowMultiple نیازی نیست
        allowMultiple={true}
        selectedImages={selectedImages}
        onSelectImages={handleSelectImages}
        onConfirm={handleConfirm}
        imageAlts={imageAlts}
        onUpdateAlt={handleUpdateAlt}
      />
    </div>
  );
}
```

### ذخیره در دیتابیس

برای ذخیره Alt Text در دیتابیس:

```tsx
const handleUpdateAlt = async (imageUrl: string, altText: string) => {
  // ذخیره در state محلی
  setImageAlts(prev => ({
    ...prev,
    [imageUrl]: altText
  }));

  // ذخیره در دیتابیس
  try {
    await fetch('/api/images/update-alt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, altText })
    });
  } catch (error) {
    console.error('خطا در ذخیره alt text:', error);
  }
};
```

## Props جدید

### `imageAlts?: Record<string, string>`
- یک object که کلید آن URL تصویر و مقدار آن Alt Text است
- مثال: `{ 'https://example.com/image.jpg': 'توضیح تصویر' }`

### `onUpdateAlt?: (imageUrl: string, altText: string) => void`
- تابعی که وقتی Alt Text ذخیره می‌شود صدا زده می‌شود
- پارامترها:
  - `imageUrl`: آدرس تصویر
  - `altText`: متن Alt جدید

## نکات مهم

1. **سازگاری کامل**: این قابلیت با تمام حالت‌های موجود (تک انتخابی، چند انتخابی) کار می‌کند
2. **اختیاری بودن**: اگر `onUpdateAlt` را پاس ندهید، آیکون ویرایش نمایش داده نمی‌شود
3. **فقط برای تصاویر انتخاب شده**: دکمه ویرایش Alt فقط برای تصاویری که انتخاب شده‌اند نمایش داده می‌شود
4. **UI زیبا**: مدال ویرایش با طراحی مدرن و RTL support
5. **دسترسی‌پذیری**: بهبود SEO و دسترسی‌پذیری تصاویر

## استفاده در مکان‌های مختلف

این قابلیت در تمام مکان‌هایی که `SharedImageGallery` استفاده می‌شود، قابل استفاده است:

- ✅ صفحه افزودن/ویرایش محصول
- ✅ صفحه افزودن/ویرایش اسلایدر
- ✅ ادیتورهای متنی (TiptapRichEditor، SlateRichEditor)
- ✅ مدیریت تصاویر بلاگ
- ✅ هر کامپوننت دیگری که از SharedImageGallery استفاده می‌کند

## بهترین شیوه‌های استفاده

1. **توضیحات واضح**: Alt Text باید توضیح واضح و مختصری از تصویر باشد
2. **کلمات کلیدی**: در صورت امکان، کلمات کلیدی مرتبط را در Alt Text بگنجانید
3. **طول مناسب**: Alt Text نباید خیلی طولانی باشد (حداکثر 125 کاراکتر)
4. **ذخیره‌سازی**: Alt Text را در دیتابیس ذخیره کنید تا در بارگیری بعدی حفظ شود

## مثال کامل با ذخیره‌سازی

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { SharedImageGallery } from '@/components';

export default function ProductForm() {
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [imageAlts, setImageAlts] = useState<Record<string, string>>({});

  // بارگیری Alt Text از دیتابیس
  useEffect(() => {
    async function loadImageAlts() {
      const response = await fetch('/api/images/alts');
      const data = await response.json();
      setImageAlts(data);
    }
    loadImageAlts();
  }, []);

  const handleSelectImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowGallery(false);
  };

  const handleUpdateAlt = async (imageUrl: string, altText: string) => {
    // ذخیره در state
    setImageAlts(prev => ({
      ...prev,
      [imageUrl]: altText
    }));

    // ذخیره در دیتابیس
    await fetch('/api/images/update-alt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, altText })
    });
  };

  return (
    <div>
      <SharedImageGallery
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        onSelectImage={handleSelectImage}
        imageAlts={imageAlts}
        onUpdateAlt={handleUpdateAlt}
      />
    </div>
  );
}
```

---

**نکته**: برای مشاهده مثال عملی، فایل `src/components/ExampleGalleryUsage.tsx` را بررسی کنید.
