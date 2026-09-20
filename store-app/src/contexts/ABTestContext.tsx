'use client';
import React, { createContext, useContext, ReactNode } from 'react';
import { useABTest, UseABTestReturn } from '@/hooks/useABTest';

const ABTestContext = createContext<UseABTestReturn | undefined>(undefined);

interface ABTestProviderProps {
  children: ReactNode;
}

export function ABTestProvider({ children }: ABTestProviderProps) {
  const abTestData = useABTest();

  return (
    <ABTestContext.Provider value={abTestData}>
      {children}
    </ABTestContext.Provider>
  );
}

export function useABTestContext() {
  const context = useContext(ABTestContext);
  if (context === undefined) {
    throw new Error('useABTestContext must be used within an ABTestProvider');
  }
  return context;
}