import React, { createContext, useContext, useMemo } from 'react';
import type { ErpProvider } from './erp-provider-types';
import { mockErpProvider } from './mock-erp-provider';
import { cplugErpProvider } from './cplug-erp-provider';

/** Phase 2: select provider by env. EXPO_PUBLIC_ERP_PROVIDER=mock|cplug (default mock). */
export function getErpProvider(): ErpProvider {
  const env = process.env.EXPO_PUBLIC_ERP_PROVIDER ?? 'mock';
  return env === 'cplug' ? cplugErpProvider : mockErpProvider;
}

const ErpProviderContext = createContext<ErpProvider | null>(null);

export function ErpProviderContextProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => getErpProvider(), []);
  return <ErpProviderContext.Provider value={value}>{children}</ErpProviderContext.Provider>;
}

export function useErpProvider(): ErpProvider {
  const ctx = useContext(ErpProviderContext);
  if (!ctx) throw new Error('useErpProvider must be used within ErpProviderContextProvider');
  return ctx;
}
