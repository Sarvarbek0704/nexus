import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const statsApi = createApi({
  reducerPath: 'statsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = Cookies.get('accessToken') || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getMyStats: builder.query<any, void>({
      query: () => '/stats/me',
    }),
    getPlatformStats: builder.query<any, void>({
      query: () => '/stats/platform',
    }),
    getAdminStats: builder.query<any, void>({
      query: () => '/stats/admin',
    }),
  }),
});

export const {
  useGetMyStatsQuery,
  useGetPlatformStatsQuery,
  useGetAdminStatsQuery,
} = statsApi;
