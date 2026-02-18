"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface BreadcrumbSegment {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbContextValue {
  extraSegments: BreadcrumbSegment[];
  setExtraSegments: (segments: BreadcrumbSegment[]) => void;
  clearExtraSegments: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [extraSegments, setExtraSegmentsState] = useState<BreadcrumbSegment[]>([]);

  const setExtraSegments = useCallback((segments: BreadcrumbSegment[]) => {
    setExtraSegmentsState(segments);
  }, []);

  const clearExtraSegments = useCallback(() => {
    setExtraSegmentsState([]);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ extraSegments, setExtraSegments, clearExtraSegments }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) {
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider");
  }
  return ctx;
}
