/**
 * کامپوننت برای نمایش محصول دیجیتال در صفحه checkout
 * Digital Product Display Component for Checkout Page
 */

'use client';

import React from 'react';
import Image from 'next/image';

interface DigitalProductBadgeProps {
  productType?: 'PHYSICAL' | 'DIGITAL' | 'physical' | 'digital';
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export const DigitalProductBadge: React.FC<DigitalProductBadgeProps> = ({
  productType,
  size = 'small',
  showIcon = true
}) => {
  const isDigital = productType === 'DIGITAL' || productType === 'digital';
  
  if (!isDigital) return null;

  const sizeClasses = {
    small: 'text-xs px-1.5 py-0.5',
    medium: 'text-sm px-2 py-1',
    large: 'text-base px-3 py-1.5'
  };

  return (
    <span className={`inline-flex items-center gap-1 bg-blue-500 text-white rounded ${sizeClasses[size]} font-medium`}>
      {showIcon && (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      دیجیتال
    </span>
  );
};

interface DigitalProductInfoProps {
  hasOnlyDigitalProducts: boolean;
  hasPhysicalProducts: boolean;
  className?: string;
}

export const DigitalProductInfo: React.FC<DigitalProductInfoProps> = ({
  hasOnlyDigitalProducts,
  hasPhysicalProducts,
  className = ''
}) => {
  if (!hasOnlyDigitalProducts && !hasPhysicalProducts) return null;

  return (
    <div className={`rounded-lg p-4 border ${className}`}>
      {hasOnlyDigitalProducts ? (
        // فقط محصولات دیجیتال
        <div className="bg-green-500/10 border-green-500/30">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-green-300 font-semibold mb-1">
                📥 دانلود فوری محصولات دیجیتال
              </h3>
              <ul className="text-green-200 text-sm space-y-1">
                <li>✓ بدون نیاز به آدرس ارسال</li>
                <li>✓ دانلود فوری پس از پرداخت</li>
                <li>✓ دسترسی دائمی به فایل‌ها</li>
                <li>✓ بدون هزینه ارسال</li>
              </ul>
            </div>
          </div>
        </div>
      ) : hasPhysicalProducts ? (
        // ترکیبی از محصولات فیزیکی و دیجیتال
        <div className="bg-blue-500/10 border-blue-500/30">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-blue-300 font-semibold mb-1">
                📦 سفارش ترکیبی
              </h3>
              <p className="text-blue-200 text-sm">
                سفارش شما شامل محصولات فیزیکی و دیجیتال است:
              </p>
              <ul className="text-blue-200 text-sm space-y-1 mt-2">
                <li>• محصولات دیجیتال: دانلود فوری پس از پرداخت</li>
                <li>• محصولات فیزیکی: ارسال به آدرس شما</li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

interface DigitalProductFeatureListProps {
  className?: string;
}

export const DigitalProductFeatureList: React.FC<DigitalProductFeatureListProps> = ({
  className = ''
}) => {
  const features = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'دانلود فوری',
      description: 'بلافاصله پس از پرداخت'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'امن و محرمانه',
      description: 'دانلود از سرورهای امن'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      title: 'دسترسی دائمی',
      description: 'دانلود مجدد در هر زمان'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      title: 'بدون هزینه اضافی',
      description: 'بدون هزینه ارسال'
    }
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      {features.map((feature, index) => (
        <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-purple-500/20">
          <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400">
            {feature.icon}
          </div>
          <div className="flex-1">
            <h4 className="text-white font-medium text-sm">{feature.title}</h4>
            <p className="text-gray-400 text-xs mt-0.5">{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const DigitalProductComponents = {
  Badge: DigitalProductBadge,
  Info: DigitalProductInfo,
  FeatureList: DigitalProductFeatureList
};

export default DigitalProductComponents;