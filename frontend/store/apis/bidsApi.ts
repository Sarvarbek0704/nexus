import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseApi';
import { ApiResponse, PaginatedResponse, Bid } from '@/types';

export const bidsApi = createApi({
  reducerPath: 'bidsApi',
  baseQuery,
  tagTypes: ['Bid'],
  endpoints: (builder) => ({
    getBids: builder.query<ApiResponse<PaginatedResponse<Bid>>, Record<string, any>>({
      query: (params) => ({ url: '/bids', params }),
      providesTags: ['Bid'],
    }),
    getBidById: builder.query<ApiResponse<Bid>, string>({
      query: (id) => `/bids/${id}`,
      providesTags: ['Bid'],
    }),
    createBid: builder.mutation<ApiResponse<Bid>, Record<string, any>>({
      query: (body) => ({ url: '/bids', method: 'POST', body }),
      invalidatesTags: ['Bid'],
    }),
    updateBidStatus: builder.mutation<ApiResponse<Bid>, { bidId: string; status: string }>({
      query: ({ bidId, ...body }) => ({ url: `/bids/${bidId}/status`, method: 'PATCH', body }),
      invalidatesTags: ['Bid'],
    }),
    withdrawBid: builder.mutation<ApiResponse<any>, string>({
      query: (bidId) => ({ url: `/bids/${bidId}/withdraw`, method: 'POST' }),
      invalidatesTags: ['Bid'],
    }),
    updateBid: builder.mutation<ApiResponse<Bid>, { bidId: string; data: Partial<Bid> }>({
      query: ({ bidId, data }) => ({ url: `/bids/${bidId}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Bid'],
    }),
  }),
});

export const {
  useGetBidsQuery,
  useGetBidByIdQuery,
  useCreateBidMutation,
  useUpdateBidStatusMutation,
  useWithdrawBidMutation,
  useUpdateBidMutation,
} = bidsApi;
