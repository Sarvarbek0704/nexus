import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const milestonesApi = createApi({
  reducerPath: 'milestonesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = Cookies.get('accessToken') || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Milestone'],
  endpoints: (builder) => ({
    getMilestones: builder.query<any, string>({
      query: (contractId) => `/milestones/contract/${contractId}`,
      providesTags: ['Milestone'],
    }),
    getMilestone: builder.query<any, string>({
      query: (id) => `/milestones/${id}`,
      providesTags: ['Milestone'],
    }),
    submitMilestone: builder.mutation<any, { milestoneId: string; description: string; attachments?: string[]; deliverableLinks?: string[] }>({
      query: ({ milestoneId, ...body }) => ({
        url: `/milestones/${milestoneId}/submit`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Milestone'],
    }),
    reviewMilestone: builder.mutation<any, { milestoneId: string; action: 'approve' | 'reject' | 'request_revision'; feedback?: string }>({
      query: ({ milestoneId, ...body }) => ({
        url: `/milestones/${milestoneId}/review`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Milestone'],
    }),
    fundMilestoneEscrow: builder.mutation<any, { contractId: string; milestoneId: string }>({
      query: ({ contractId, milestoneId }) => ({
        url: `/contracts/${contractId}/milestones/${milestoneId}/fund-escrow`,
        method: 'POST',
      }),
      invalidatesTags: ['Milestone'],
    }),
  }),
});

export const {
  useGetMilestonesQuery,
  useGetMilestoneQuery,
  useSubmitMilestoneMutation,
  useReviewMilestoneMutation,
  useFundMilestoneEscrowMutation,
} = milestonesApi;
