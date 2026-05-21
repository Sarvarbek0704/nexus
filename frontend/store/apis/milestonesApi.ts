import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseApi';
import { ApiResponse } from '@/types';

export const milestonesApi = createApi({
  reducerPath: 'milestonesApi',
  baseQuery,
  tagTypes: ['Milestone'],
  endpoints: (builder) => ({
    getMilestones: builder.query<ApiResponse<any[]>, string>({
      query: (contractId) => `/milestones/contract/${contractId}`,
      providesTags: ['Milestone'],
    }),
    getMilestoneById: builder.query<ApiResponse<any>, string>({
      query: (id) => `/milestones/${id}`,
      providesTags: ['Milestone'],
    }),
    submitMilestone: builder.mutation<ApiResponse<any>, { milestoneId: string; submissionNote: string }>({
      query: ({ milestoneId, ...body }) => ({
        url: `/milestones/${milestoneId}/submit`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Milestone'],
    }),
    reviewMilestone: builder.mutation<ApiResponse<any>, { milestoneId: string; action: string; feedback?: string }>({
      query: ({ milestoneId, ...body }) => ({
        url: `/milestones/${milestoneId}/review`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Milestone'],
    }),
    fundMilestoneEscrow: builder.mutation<ApiResponse<any>, { milestoneId: string; amount: number }>({
      query: ({ milestoneId, ...body }) => ({
        url: `/milestones/${milestoneId}/fund-escrow`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Milestone'],
    }),
  }),
});

export const {
  useGetMilestonesQuery,
  useGetMilestoneByIdQuery,
  useSubmitMilestoneMutation,
  useReviewMilestoneMutation,
  useFundMilestoneEscrowMutation,
} = milestonesApi;
