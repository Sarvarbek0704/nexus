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
    submitMilestone: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({ url: `/milestones/${id}/submit`, method: 'POST', body }),
      invalidatesTags: ['Milestone'],
    }),
    reviewMilestone: builder.mutation<any, { id: string; action: string; feedback?: string }>({
      query: ({ id, ...body }) => ({ url: `/milestones/${id}/review`, method: 'POST', body }),
      invalidatesTags: ['Milestone'],
    }),
    fundMilestoneEscrow: builder.mutation<any, string>({
      query: (id) => ({ url: `/milestones/${id}/fund-escrow`, method: 'POST' }),
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
