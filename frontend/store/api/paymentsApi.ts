import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const paymentsApi = createApi({
  reducerPath: 'paymentsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = Cookies.get('accessToken') || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Payment'],
  endpoints: (builder) => ({
    getTransactionHistory: builder.query<any, any>({
      query: (params) => ({ url: '/payments/history', params }),
      providesTags: ['Payment'],
    }),
    getWallet: builder.query<any, void>({
      query: () => '/payments/wallet',
      providesTags: ['Payment'],
    }),
    deposit: builder.mutation<any, { amount: number }>({
      query: (body) => ({ url: '/payments/deposit', method: 'POST', body }),
      invalidatesTags: ['Payment'],
    }),
    withdraw: builder.mutation<any, { amount: number; method?: string }>({
      query: (body) => ({ url: '/payments/withdraw', method: 'POST', body }),
      invalidatesTags: ['Payment'],
    }),
    getAllTransactions: builder.query<any, any>({
      query: (params) => ({ url: '/payments/admin', params }),
      providesTags: ['Payment'],
    }),
  }),
});

export const {
  useGetTransactionHistoryQuery,
  useGetWalletQuery,
  useDepositMutation,
  useWithdrawMutation,
  useGetAllTransactionsQuery,
} = paymentsApi;
