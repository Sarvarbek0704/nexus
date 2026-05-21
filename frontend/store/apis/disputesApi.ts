import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseApi';
import { ApiResponse, PaginatedResponse, Dispute } from '@/types';

export const disputesApi = createApi({
  reducerPath: 'disputesApi',
  baseQuery,
  tagTypes: ['Dispute'],
  endpoints: (builder) => ({
    getDisputes: builder.query<ApiResponse<PaginatedResponse<Dispute>>, Record<string, any>>({
      query: (params) => ({ url: '/disputes', params }),
      providesTags: ['Dispute'],
    }),
    getDisputeById: builder.query<ApiResponse<Dispute>, string>({
      query: (id) => `/disputes/${id}`,
      providesTags: ['Dispute'],
    }),
    createDispute: builder.mutation<ApiResponse<Dispute>, Record<string, any>>({
      query: (body) => ({ url: '/disputes', method: 'POST', body }),
      invalidatesTags: ['Dispute'],
    }),
    addDisputeMessage: builder.mutation<ApiResponse<any>, { disputeId: string; message: string; attachments?: string[] }>({
      query: ({ disputeId, ...body }) => ({ url: `/disputes/${disputeId}/messages`, method: 'POST', body }),
      invalidatesTags: ['Dispute'],
    }),
    resolveDispute: builder.mutation<ApiResponse<any>, { disputeId: string; resolution: string; refundAmount?: number }>({
      query: ({ disputeId, ...body }) => ({ url: `/disputes/${disputeId}/resolve`, method: 'POST', body }),
      invalidatesTags: ['Dispute'],
    }),
  }),
});

export const {
  useGetDisputesQuery,
  useGetDisputeByIdQuery,
  useCreateDisputeMutation,
  useAddDisputeMessageMutation,
  useResolveDisputeMutation,
} = disputesApi;
