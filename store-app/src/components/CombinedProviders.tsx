'use client';

import React from 'react';
import QueryProvider from '@/components/QueryProvider';
import AuthProvider from '@/components/AuthProvider';
import MaintenanceGuard from '@/components/MaintenanceGuard';
import { CartProviderWithAuth } from '@/contexts/CartContext';
import { ABTestProvider } from '@/contexts/ABTestContext';
import { URLSettingsProvider } from '@/contexts/URLSettingsContext';
import { DynamicContentProvider } from '@/contexts/DynamicContentContext';
import { ImageGalleryProvider } from '@/contexts/ImageGalleryContext';
import { WishlistProvider } from '@/contexts/WishlistContext';

// Combined Provider برای کاهش nested components
export default function CombinedProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <MaintenanceGuard>
          <ABTestProvider>
            <CartProviderWithAuth>
              <URLSettingsProvider>
                <DynamicContentProvider>
                  <WishlistProvider>
                    <ImageGalleryProvider>
                      {children}
                    </ImageGalleryProvider>
                  </WishlistProvider>
                </DynamicContentProvider>
              </URLSettingsProvider>
            </CartProviderWithAuth>
          </ABTestProvider>
        </MaintenanceGuard>
      </AuthProvider>
    </QueryProvider>
  );
}
