import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../config/api';
import {
  ApiResponse,
  CreatorAnalyticsData,
  CreatorDashboardData,
  AnalyticsTimeframe,
} from '../../shared/types';

export function useCreatorDashboard() {
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('all');
  const [dashboardData, setDashboardData] = useState<CreatorDashboardData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<CreatorAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dashRes, analyticsRes] = await Promise.all([
        apiClient.get<ApiResponse<CreatorDashboardData>>(`/creator/dashboard?timeframe=${timeframe}`),
        apiClient.get<ApiResponse<CreatorAnalyticsData>>(`/creator/analytics?period=${timeframe}`),
      ]);

      if (dashRes.data && dashRes.data.data) {
        setDashboardData(dashRes.data.data);
      }
      if (analyticsRes.data && analyticsRes.data.data) {
        setAnalyticsData(analyticsRes.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching creator dashboard analytics:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load creator earnings dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    dashboardData,
    analyticsData,
    timeframe,
    setTimeframe,
    isLoading,
    error,
    refetch: fetchData,
  };
}
