'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { generateProductUrl, generateProductUrlAsync } from '@/lib/url-client';

interface Product {
  id: string;
  name: string;
  slug?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface UrlSettings {
  urlStructure: string;
  includeId: boolean;
  separatorType: string;
  maxSlugLength: number;
}

export default function URLTestPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [urlSettings, setUrlSettings] = useState<UrlSettings | null>(null);
  const [productUrls, setProductUrls] = useState<Record<string, { sync: string; async: string }>>({});

  useEffect(() => {
    // دریافت محصولات
    fetch('/api/products?limit=5')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProducts(data.products);
        }
      });

    // دریافت تنظیمات URL
    fetch('/api/admin/seo/url-settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUrlSettings(data.data);
        }
      });
  }, []);

  useEffect(() => {
    // تولید URL های async برای هر محصول
    const generateUrls = async () => {
      const urls: Record<string, { sync: string; async: string }> = {};
      for (const product of products) {
        urls[product.id] = {
          sync: generateProductUrl(product),
          async: await generateProductUrlAsync(product)
        };
      }
      setProductUrls(urls);
    };

    if (products.length > 0) {
      generateUrls();
    }
  }, [products]);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">تست URL ساختار</h1>

        {/* نمایش تنظیمات فعلی */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">تنظیمات URL فعلی</h2>
          {urlSettings ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>ساختار URL:</strong> {urlSettings.urlStructure}
              </div>
              <div>
                <strong>شامل ID:</strong> {urlSettings.includeId ? 'بله' : 'خیر'}
              </div>
              <div>
                <strong>جداکننده:</strong> {urlSettings.separatorType}
              </div>
              <div>
                <strong>حداکثر طول:</strong> {urlSettings.maxSlugLength}
              </div>
            </div>
          ) : (
            <p>در حال بارگذاری...</p>
          )}
        </div>

        {/* نمایش محصولات و URL هایشان */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">محصولات و URL هایشان</h2>
          <div className="space-y-4">
            {products.map(product => (
              <div key={product.id} className="border-b pb-4">
                <h3 className="font-medium text-gray-800">{product.name}</h3>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">URL ساده (sync): </span>
                    <Link 
                      href={productUrls[product.id]?.sync || '#'}
                      className="text-blue-600 hover:underline"
                    >
                      {productUrls[product.id]?.sync}
                    </Link>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">URL کامل (async): </span>
                    <Link 
                      href={productUrls[product.id]?.async || '#'}
                      className="text-blue-600 hover:underline"
                    >
                      {productUrls[product.id]?.async}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* دکمه‌های تست تنظیمات مختلف */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">تست تنظیمات مختلف</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                fetch('/api/admin/seo/url-settings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ urlStructure: 'id-only', includeId: true })
                }).then(() => window.location.reload());
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              ID فقط
            </button>
            <button
              onClick={() => {
                fetch('/api/admin/seo/url-settings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ urlStructure: 'product-only', includeId: false })
                }).then(() => window.location.reload());
              }}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              محصول فقط
            </button>
            <button
              onClick={() => {
                fetch('/api/admin/seo/url-settings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ urlStructure: 'category-product', includeId: true })
                }).then(() => window.location.reload());
              }}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              دسته + محصول
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}