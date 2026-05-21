import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseApi';
import { ApiResponse, PaginatedResponse, Payment } from '@/types';

export const paymentsApi = createApi({
  reducerPath: 'paymentsApi',
  baseQuery,
  tagTypes: ['Payment'],
  endpoints: (builder) => ({
    getPayments: builder.query<ApiResponse<PaginatedResponse<Payment>>, { page?: number; limit?: number; type?: string }>({
      query: (params) => ({ url: '/payments', params }),
      providesTags: ['Payment'],
    }),
    depositWallet: builder.mutation<ApiResponse<any>, { amount: number }>({
      query: (body) => ({ url: '/payments/deposit', method: 'POST', body }),
      invalidatesTags: ['Payment'],
    }),
    withdrawWallet: builder.mutation<ApiResponse<any>, { amount: number }>({
      query: (body) => ({ url: '/payments/withdraw', method: 'POST', body }),
      invalidatesTags: ['Payment'],
    }),
    getPaymentById: builder.query<ApiResponse<Payment>, string>({
      query: (id) => `/payments/${id}`,
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useDepositWalletMutation,
  useWithdrawWalletMutation,
  useGetPaymentByIdQuery,
} = paymentsApi;
