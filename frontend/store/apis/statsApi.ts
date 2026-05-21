import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseApi';
import { ApiResponse } from '@/types';

export const statsApi = createApi({
  reducerPath: 'statsApi',
  baseQuery,
  tagTypes: ['Stats'],
  endpoints: (builder) => ({
    getPlatformStats: builder.query<ApiResponse<any>, Record<string, any>>({
      query: (params) => ({ url: '/stats/platform', params }),
      providesTags: ['Stats'],
    }),
    getUserStats: builder.query<ApiResponse<any>, Record<string, any>>({
      query: (params) => ({ url: '/stats/me', params }),
      providesTags: ['Stats'],
    }),
  }),
});

export const {
  useGetPlatformStatsQuery,
  useGetUserStatsQuery,
} = statsApi;
