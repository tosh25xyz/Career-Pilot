/**
 * useCVStatus Hook
 * ================
 * যেকোনো component থেকে user এর CV status জানতে use করো।
 *
 * Usage:
 *   const { hasCV, cvInfo, loading, refetch } = useCVStatus();
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { cvApi } from '@/lib/api';

interface CVInfo {
  has_cv: boolean;
  document_id?: string;
  filename?: string;
  uploaded_at?: string;
  total_chunks?: number;
  sections?: Record<string, number>;
  preview?: string;
}

export function useCVStatus() {
  const { getToken } = useAuth();
  const [cvInfo, setCvInfo] = useState<CVInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await cvApi.getInfo(token);
      setCvInfo(res.data);
    } catch {
      setCvInfo({ has_cv: false });
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    hasCV: cvInfo?.has_cv ?? false,
    cvInfo,
    loading,
    refetch,
  };
}
