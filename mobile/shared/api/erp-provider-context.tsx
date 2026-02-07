import React, { createContext, useContext, useMemo } from 'react';
import type { ErpProvider } from './erp-provider-types';
import { mockErpProvider } from './mock-erp-provider';

const ErpProviderContext = createContext<ErpProvider | null>(null);

export function ErpProviderContextProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => mockErpProvider, []);
  return <ErpProviderContext.Provider value={value}>{children}</ErpProviderContext.Provider>;
}

export function useErpProvider(): ErpProvider {
  const ctx = useContext(ErpProviderContext);
  if (!ctx) throw new Error('useErpProvider must be used within ErpProviderContextProvider');
  return ctx;
}
