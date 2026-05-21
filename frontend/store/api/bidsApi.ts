import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const bidsApi = createApi({
  reducerPath: 'bidsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = Cookies.get('accessToken') || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Bid'],
  endpoints: (builder) => ({
    getProjectBids: builder.query<any, { projectId: string; params?: any }>({
      query: ({ projectId, params }) => ({ url: `/bids/project/${projectId}`, params }),
      providesTags: ['Bid'],
    }),
    getMyBids: builder.query<any, any>({
      query: (params) => ({ url: '/bids/my', params }),
      providesTags: ['Bid'],
    }),
    getBid: builder.query<any, string>({
      query: (id) => `/bids/${id}`,
      providesTags: ['Bid'],
    }),
    createBid: builder.mutation<any, any>({
      query: (body) => ({ url: '/bids', method: 'POST', body }),
      invalidatesTags: ['Bid'],
    }),
    updateBidStatus: builder.mutation<any, { id: string; status: string; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/bids/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: ['Bid'],
    }),
    withdrawBid: builder.mutation<any, string>({
      query: (id) => ({ url: `/bids/${id}/withdraw`, method: 'POST' }),
      invalidatesTags: ['Bid'],
    }),
    deleteBid: builder.mutation<any, string>({
      query: (id) => ({ url: `/bids/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Bid'],
    }),
  }),
});

export const {
  useGetProjectBidsQuery,
  useGetMyBidsQuery,
  useGetBidQuery,
  useCreateBidMutation,
  useUpdateBidStatusMutation,
  useWithdrawBidMutation,
  useDeleteBidMutation,
} = bidsApi;
