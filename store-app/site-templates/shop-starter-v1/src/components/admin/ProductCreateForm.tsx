'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bold,
  Calendar,
  CloudUpload,
  Eye,
  ImagePlus,
  Info,
  Italic,
  Link2,
  List,
  Minus,
  Package,
  Plus,
  Tag,
  Upload,
  X,
} from 'lucide-react';
import type { ComponentType } from 'react';

const categoryOptions = [
  { value: 'skincare', label: 'مراقبت از پوست' },
  { value: 'face-makeup', label: 'آرایشی' },
  { value: 'fragrance', label: 'عطر و ادکلن' },
  { value: 'hair', label: 'مراقبت از مو' },
];

const brandOptions = ['MUSE Original', "L'Artiste", 'Éclat', 'Velvet Glow', 'Organic Essence'];

export function ProductCreateForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('MUSE-SKU-001');
  const [stock, setStock] = useState(0);
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [category, setCategory] = useState('skincare');
  const [brand, setBrand] = useState('MUSE Original');
  const [published, setPublished] = useState(true);
  const [hasGalleryImage, setHasGalleryImage] = useState(true);

  async function handleSave() {
    if (!name.trim()) {
      alert('لطفاً نام محصول را وارد کنید.');
      return;
    }

    const res = await fetch('/api/products', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        price: Number(price.replace(/,/g, '')) || 0,
        stock,
        category,
        brand,
        active: published,
      }),
    });

    const json = await res.json();
    if (json.success) {
      router.push('/admin/products');
      router.refresh();
    } else {
      alert(json.error || 'خطا در ذخیره محصول');
    }
  }

  return (
    <>
      <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="page-title mb-2">افزودن محصول جدید</h1>
          <p className="text-sm text-on-surface-variant">ایجاد یک اثر هنری جدید در مجموعه لوکس MUSE</p>
        </div>
        <div className="flex gap-4">
          <Link href="/admin/products" className="btn-outline px-8 py-3">
            انصراف
          </Link>
          <button type="button" onClick={handleSave} className="btn-primary px-10 py-3 shadow-lg active:scale-95">
            ذخیره محصول
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-8">
          <FormSection icon={Info} title="اطلاعات پایه">
            <label className="flex flex-col gap-2">
              <span className="px-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">نام محصول</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً: سرم جوانساز خاویار طلایی"
                className="w-full rounded-lg border border-outline/50 bg-surface px-4 py-3 text-base transition focus:border-secondary focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="px-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">توضیحات محصول</span>
              <div className="overflow-hidden rounded-lg border border-outline/50">
                <div className="flex gap-4 border-b border-outline/30 bg-surface-container-low p-2">
                  <button type="button" aria-label="Bold" className="text-on-surface-variant hover:text-primary">
                    <Bold className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                  <button type="button" aria-label="Italic" className="text-on-surface-variant hover:text-primary">
                    <Italic className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                  <button type="button" aria-label="List" className="text-on-surface-variant hover:text-primary">
                    <List className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                  <button type="button" aria-label="Link" className="text-on-surface-variant hover:text-primary">
                    <Link2 className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="داستان این محصول را بنویسید..."
                  className="w-full resize-none border-none bg-white px-4 py-3 text-sm focus:outline-none focus:ring-0"
                />
              </div>
            </label>
          </FormSection>

          <FormSection icon={Upload} title="تصاویر و رسانه">
            <div className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline/50 bg-surface-container-low/30 p-12 transition hover:bg-surface-container-low">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container transition-transform group-hover:scale-110">
                <CloudUpload className="h-8 w-8 text-primary" strokeWidth={1.5} />
              </div>
              <p className="mb-2 text-lg font-semibold text-on-surface">تصاویر را اینجا رها کنید</p>
              <p className="text-sm text-on-surface-variant">یا برای انتخاب فایل کلیک کنید (حداکثر ۵ تصویر)</p>
            </div>

            <label className="mt-6 block">
              <span className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                تصویر شاخص (تصویر اصلی در لیست محصولات)
              </span>
              <div className="relative flex aspect-square w-full max-w-xs cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-primary/30 bg-surface-container-low text-on-surface-variant transition hover:bg-surface-container">
                <ImagePlus className="h-10 w-10 text-primary" strokeWidth={1.25} />
                <span className="text-sm">انتخاب تصویر شاخص</span>
              </div>
            </label>

            <div className="my-6 border-b border-outline/20" />

            <span className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              گالری تصاویر محصول
            </span>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {hasGalleryImage && (
                <div className="group relative aspect-square overflow-hidden rounded-lg border border-outline/30 bg-surface-container">
                  <div className="absolute left-2 top-2 z-10 rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    شاخص
                  </div>
                  <Image
                    src="/images/admin/product-sample.jpg"
                    alt="نمونه محصول"
                    fill
                    className="object-cover opacity-90"
                    sizes="150px"
                  />
                  <button
                    type="button"
                    onClick={() => setHasGalleryImage(false)}
                    aria-label="حذف تصویر"
                    className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <button
                type="button"
                className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-outline/50 bg-surface-container-low text-outline transition hover:text-primary"
              >
                <Plus className="h-8 w-8" strokeWidth={1.25} />
              </button>
            </div>
          </FormSection>

          <FormSection icon={Package} title="موجودی و انبار">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="px-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">شناسه محصول (SKU)</span>
                <input
                  type="text"
                  dir="ltr"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="MUSE-SKU-001"
                  className="w-full rounded-lg border border-outline/50 bg-surface px-4 py-3 text-left text-base focus:border-secondary focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="px-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">تعداد موجود در انبار</span>
                <div className="flex items-center overflow-hidden rounded-lg border border-outline/50 bg-surface">
                  <button
                    type="button"
                    onClick={() => setStock((v) => v + 1)}
                    className="px-4 py-3 text-primary transition hover:bg-surface-container"
                    aria-label="افزایش"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value) || 0)}
                    className="w-full border-none bg-transparent text-center text-lg font-semibold focus:outline-none focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setStock((v) => Math.max(0, v - 1))}
                    className="px-4 py-3 text-primary transition hover:bg-surface-container"
                    aria-label="کاهش"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                </div>
              </label>
            </div>
          </FormSection>
        </div>

        <div className="flex flex-col gap-8 lg:col-span-4">
          <section className="glass-card p-8 shadow-soft">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-on-surface">وضعیت انتشار</h2>
              <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                پیش‌نویس
              </span>
            </div>
            <label className="flex cursor-pointer items-center justify-between rounded-lg bg-surface-container-low p-4">
              <span className="text-sm text-on-surface">نمایش در فروشگاه</span>
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-5 w-5 rounded border-outline text-primary focus:ring-primary"
              />
            </label>
            <div className="mt-4 space-y-4 text-on-surface-variant">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-5 w-5" strokeWidth={1.5} />
                <span>زمان‌بندی: بلافاصله</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Eye className="h-5 w-5" strokeWidth={1.5} />
                <span>قابلیت مشاهده: عمومی</span>
              </div>
            </div>
          </section>

          <FormSection icon={Tag} title="قیمت‌گذاری">
            <label className="flex flex-col gap-2">
              <span className="px-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">قیمت اصلی (تومان)</span>
              <input
                type="text"
                dir="ltr"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="۰"
                className="w-full rounded-lg border border-outline/50 bg-surface px-4 py-3 text-left text-lg font-semibold focus:border-secondary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="px-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">قیمت با تخفیف (تومان)</span>
              <input
                type="text"
                dir="ltr"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="۰"
                className="w-full rounded-lg border border-outline/50 bg-surface px-4 py-3 text-left text-lg font-semibold focus:border-secondary focus:outline-none"
              />
            </label>
            {!salePrice && (
              <div className="rounded-lg border border-secondary/20 bg-secondary-container/10 p-4">
                <p className="text-sm text-secondary">در حال حاضر هیچ تخفیفی اعمال نشده است.</p>
              </div>
            )}
          </FormSection>

          <FormSection icon={Package} title="دسته‌بندی و برند">
            <label className="flex flex-col gap-2">
              <span className="px-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">دسته‌بندی</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none rounded-lg border border-outline/50 bg-surface px-4 py-3 text-base focus:border-secondary focus:outline-none"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="px-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">برند</span>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full appearance-none rounded-lg border border-outline/50 bg-surface px-4 py-3 text-base focus:border-secondary focus:outline-none"
              >
                {brandOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold uppercase tracking-wider text-primary transition hover:bg-primary-container"
            >
              <Plus className="h-4 w-4" />
              افزودن دسته‌بندی جدید
            </button>
          </FormSection>
        </div>
      </div>
    </>
  );
}

type FormSectionProps = {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  children: React.ReactNode;
};

function FormSection({ icon: Icon, title, children }: FormSectionProps) {
  return (
    <section className="glass-card space-y-6 p-8 shadow-soft">
      <div className="flex items-center gap-2 border-b border-outline/20 pb-4">
        <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
        <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}
